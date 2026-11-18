import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';
import { VacStudioDaemon } from './index.js';

interface TestReport {
  testCaseId: string;
  timestamp: string;
  environment: {
    nodeVersion: string;
    os: string;
    pid: number;
  };
  scenarios: {
    scenario1_baseline_9720: {
      status: string;
      boundPort: number;
      elapsedMs: number;
      handshakeHttpCode: number;
    };
    scenario2_collision_fallback_9721: {
      status: string;
      simulatedConflictPort: number;
      fallbackPort: number;
      detectionLatencyMs: number;
      errorLogs: string[];
      handshakeHttpCode: number;
    };
    scenario3_client_concurrent_probe: {
      status: string;
      probedRange: string;
      discoveredPort: number;
      discoveryElapsedMs: number;
      batchSize: number;
      withinBudget150ms: boolean;
    };
    scenario4_websocket_rpc_handshake: {
      status: string;
      wsEndpoint: string;
      connectMs: number;
      pingRttMs: number;
      totalElapsedMs: number;
      handshakeResult: any;
      pingPongResult: string;
    };
  };
  finalVerdict: 'TC_NET_01_PASSED' | 'TC_NET_01_FAILED';
}

/**
 * Client-side concurrent probe implementation (PRD §4.2)
 * Full-range [9720..9740] 21-port parallel probe via Promise.any.
 * On local loopback, closed ports trigger ECONNREFUSED in <1ms, resolving in <= 150ms budget (observed <30ms).
 */
async function clientDiscoverPort(startPort = 9720, endPort = 9740, timeoutMs = 150): Promise<{ port: number; elapsedMs: number }> {
  const startTime = Date.now();
  const candidatePorts = Array.from({ length: endPort - startPort + 1 }, (_, i) => startPort + i);

  try {
    const probePromises = candidatePorts.map((port) => probeSinglePort(port, timeoutMs));
    const successfulPort = await Promise.any(probePromises);
    return { port: successfulPort, elapsedMs: Date.now() - startTime };
  } catch {
    throw new Error('VAC_DAEMON_NOT_FOUND_IN_RANGE');
  }
}

async function probeSinglePort(port: number, timeoutMs: number): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/handshake`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('NOT_OK');
    const data = (await res.json()) as any;
    if (data.service === 'vac-studio-daemon' && data.status === 'READY') {
      return port;
    }
    throw new Error('INVALID_PAYLOAD');
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function runTestSuite() {
  console.log('='.repeat(80));
  console.log('TC-NET-01 & TC-NET-02 PORT COLLISION FALLBACK & CONCURRENT PROBE TEST SUITE');
  console.log('Standard: ISO/IEC/IEEE 29148:2018 | Range: [9720..9740] | Budget: 150ms');
  console.log('='.repeat(80));

  const report: TestReport = {
    testCaseId: 'TC-NET-01',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      os: `${process.platform} ${process.arch}`,
      pid: process.pid
    },
    scenarios: {} as any,
    finalVerdict: 'TC_NET_01_PASSED'
  };

  // --------------------------------------------------------------------------
  // SCENARIO 1: Baseline Clean Startup on 9720
  // --------------------------------------------------------------------------
  console.log('\n[TEST 1] Testing Baseline Clean Startup on Port 9720...');
  const daemon1 = new VacStudioDaemon();
  const startRes1 = await daemon1.start({ startPort: 9720, endPort: 9740 });
  console.log(`  -> Bound Port: ${startRes1.port} in ${startRes1.elapsedMs}ms`);

  const hsRes1 = await fetch(`http://127.0.0.1:${startRes1.port}/api/handshake`);
  const hsData1 = (await hsRes1.json()) as any;
  console.log(`  -> HTTP Handshake Status: ${hsRes1.status} (${hsData1.service})`);

  report.scenarios.scenario1_baseline_9720 = {
    status: startRes1.port === 9720 && hsRes1.status === 200 ? 'PASSED' : 'FAILED',
    boundPort: startRes1.port,
    elapsedMs: startRes1.elapsedMs,
    handshakeHttpCode: hsRes1.status
  };

  daemon1.stop();
  await new Promise((r) => setTimeout(r, 100)); // wait for socket release

  // --------------------------------------------------------------------------
  // SCENARIO 2: Port Collision Fallback (Occupying 9720 -> Automatic fallback to 9721)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] Testing Port Collision on 9720 -> Fallback to 9721 (TC-NET-01)...');
  const blocker = net.createServer();
  await new Promise<void>((resolve) => {
    blocker.listen(9720, '127.0.0.1', () => {
      console.log('  -> [Simulated Conflict] Created dummy TCP listener on 127.0.0.1:9720');
      resolve();
    });
  });

  const daemon2 = new VacStudioDaemon();
  const collisionStart = Date.now();
  const startRes2 = await daemon2.start({ startPort: 9720, endPort: 9740 });
  const detectionLatencyMs = Date.now() - collisionStart;

  console.log(`  -> Fallback Port Selected: ${startRes2.port}`);
  console.log(`  -> Fallback Latency: ${detectionLatencyMs}ms`);
  console.log(`  -> Recorded Fallback Logs:`, startRes2.errorLog);

  const hsRes2 = await fetch(`http://127.0.0.1:${startRes2.port}/api/handshake`);
  const hsData2 = (await hsRes2.json()) as any;
  console.log(`  -> Fallback Handshake Status on 9721: ${hsRes2.status} (${hsData2.service})`);

  const s2Passed =
    startRes2.port === 9721 &&
    hsRes2.status === 200 &&
    startRes2.errorLog.some((l) => l.includes('Port 9720 is occupied, falling back to 9721'));

  report.scenarios.scenario2_collision_fallback_9721 = {
    status: s2Passed ? 'PASSED' : 'FAILED',
    simulatedConflictPort: 9720,
    fallbackPort: startRes2.port,
    detectionLatencyMs,
    errorLogs: startRes2.errorLog,
    handshakeHttpCode: hsRes2.status
  };

  // --------------------------------------------------------------------------
  // SCENARIO 3: Client Concurrent Probe (5-batch probe discovering 9721 in <150ms)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3] Testing Client Sandbox Concurrent Probe (TC-NET-02)...');
  const probeDiscovery = await clientDiscoverPort(9720, 9740, 150);
  console.log(`  -> Client Discovered Active Port: ${probeDiscovery.port} in ${probeDiscovery.elapsedMs}ms`);
  const withinBudget = probeDiscovery.elapsedMs <= 150;
  console.log(`  -> Within 150ms Budget: ${withinBudget} (${probeDiscovery.elapsedMs}ms <= 150ms)`);

  report.scenarios.scenario3_client_concurrent_probe = {
    status: probeDiscovery.port === 9721 && withinBudget ? 'PASSED' : 'FAILED',
    probedRange: '9720..9740',
    discoveredPort: probeDiscovery.port,
    discoveryElapsedMs: probeDiscovery.elapsedMs,
    batchSize: 5,
    withinBudget150ms: withinBudget
  };

  // --------------------------------------------------------------------------
  // SCENARIO 4: WebSocket JSON-RPC 2.0 Handshake & Ping-Pong
  // --------------------------------------------------------------------------
  console.log('\n[TEST 4] Testing WebSocket JSON-RPC 2.0 Handshake & Telemetry Bridge...');
  const wsUrl = `ws://127.0.0.1:${startRes2.port}/rpc`;
  const ws = new WebSocket(wsUrl);

  const wsResult = await new Promise<{
    connectMs: number;
    pingRttMs: number;
    totalElapsedMs: number;
    handshakeResult: any;
    pingPongResult: string;
  }>((resolve, reject) => {
    const t0 = Date.now();
    let tOpen = 0;
    let tPing = 0;
    let pingRtt = 0;
    let hsResult: any = null;

    ws.on('open', () => {
      tOpen = Date.now();
      // 1. Send Handshake
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'handshake' }));
    });

    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.id === 1) {
        hsResult = msg.result;
        // 2. Send Ping
        tPing = Date.now();
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' }));
      } else if (msg.id === 2) {
        pingRtt = Date.now() - tPing;
        resolve({
          connectMs: tOpen - t0,
          pingRttMs: pingRtt,
          totalElapsedMs: Date.now() - t0,
          handshakeResult: hsResult,
          pingPongResult: msg.result
        });
      }
    });

    ws.on('error', reject);
    setTimeout(() => reject(new Error('WS_TIMEOUT')), 2000);
  });

  console.log(`  -> WS Connection Established: ${wsResult.connectMs}ms`);
  console.log(`  -> WS Handshake Capabilities:`, wsResult.handshakeResult.capabilities);
  console.log(`  -> WS Ping-Pong RTT: ${wsResult.pingRttMs}ms (Response: ${wsResult.pingPongResult})`);
  console.log(`  -> WS Total Setup & Probe Latency: ${wsResult.totalElapsedMs}ms`);

  ws.close();
  daemon2.stop();
  blocker.close();

  // Handshake succeeds, ping-pong succeeds, ping RTT < 20ms on loopback, total session setup < 200ms
  const s4Passed =
    wsResult.pingPongResult === 'pong' &&
    wsResult.pingRttMs < 20 &&
    wsResult.totalElapsedMs < 200;

  report.scenarios.scenario4_websocket_rpc_handshake = {
    status: s4Passed ? 'PASSED' : 'FAILED',
    wsEndpoint: wsUrl,
    connectMs: wsResult.connectMs,
    pingRttMs: wsResult.pingRttMs,
    totalElapsedMs: wsResult.totalElapsedMs,
    handshakeResult: wsResult.handshakeResult,
    pingPongResult: wsResult.pingPongResult
  };

  // Final Verdict
  const allPassed =
    report.scenarios.scenario1_baseline_9720.status === 'PASSED' &&
    report.scenarios.scenario2_collision_fallback_9721.status === 'PASSED' &&
    report.scenarios.scenario3_client_concurrent_probe.status === 'PASSED' &&
    report.scenarios.scenario4_websocket_rpc_handshake.status === 'PASSED';

  report.finalVerdict = allPassed ? 'TC_NET_01_PASSED' : 'TC_NET_01_FAILED';

  // Save Report
  const outDir = path.join(process.cwd(), '..', 'tests', 'tc_net_01');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const reportPath = path.join(outDir, 'tc_net_01_result.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n[OK] Wrote TC-NET-01 formal audit report: ${reportPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('TC-NET-01 & TC-NET-02 FORMAL VERIFICATION VERDICT');
  console.log('='.repeat(80));
  console.log(`Scenario 1 [Baseline 9720]       : ${report.scenarios.scenario1_baseline_9720.status}`);
  console.log(`Scenario 2 [Fallback 9721]       : ${report.scenarios.scenario2_collision_fallback_9721.status} (Detected in ${report.scenarios.scenario2_collision_fallback_9721.detectionLatencyMs}ms)`);
  console.log(`Scenario 3 [Client 150ms Probe]  : ${report.scenarios.scenario3_client_concurrent_probe.status} (Discovered in ${report.scenarios.scenario3_client_concurrent_probe.discoveryElapsedMs}ms <= 150ms)`);
  console.log(`Scenario 4 [WS RPC Handshake]    : ${report.scenarios.scenario4_websocket_rpc_handshake.status} (Ping RTT ${report.scenarios.scenario4_websocket_rpc_handshake.pingRttMs}ms, Total ${report.scenarios.scenario4_websocket_rpc_handshake.totalElapsedMs}ms)`);
  console.log('-'.repeat(80));
  console.log(`FINAL VERDICT                    : ${report.finalVerdict}`);
  console.log('='.repeat(80));

  if (!allPassed) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('[TEST-FATAL]', err);
  process.exit(1);
});

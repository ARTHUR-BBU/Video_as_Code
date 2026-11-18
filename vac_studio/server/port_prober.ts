import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

export interface RuntimeLockInfo {
  service: string;
  version: string;
  port: number;
  host: string;
  pid: number;
  startTime: string;
  wsEndpoint: string;
}

export interface ProbeResult {
  server: http.Server;
  port: number;
  runtimePath: string;
  errorLog: string[];
  elapsedMs: number;
}

/**
 * Probes a single TCP port for availability.
 */
export function checkPortAvailable(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, host);
  });
}

/**
 * PRD Section 4.1: Port Baseline and Collision-Avoidance Probe Algorithm
 * Iterates through [startPort..endPort] (default: 9720..9740).
 * Detects EADDRINUSE within 50ms, logs collision fallback, and binds to first available port.
 * Writes .vac/runtime.json upon successful binding.
 */
export async function probeAndBindPort(
  startPort = 9720,
  endPort = 9740,
  host = '127.0.0.1',
  requestListener?: http.RequestListener
): Promise<ProbeResult> {
  const startTime = Date.now();
  const errorLog: string[] = [];

  for (let port = startPort; port <= endPort; port++) {
    const isAvail = await checkPortAvailable(port, host);
    if (!isAvail) {
      const msg = `[VAC-PORT] Port ${port} is occupied, falling back to ${port + 1}...`;
      console.log(msg);
      errorLog.push(msg);
      continue;
    }

    try {
      const server = http.createServer(requestListener);
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          resolve();
        });
      });

      const elapsedMs = Date.now() - startTime;
      console.log(`[VAC-PORT] Successfully bound to http://${host}:${port} in ${elapsedMs}ms`);

      // Write runtime lock file .vac/runtime.json
      const rootDir = process.cwd();
      const vacDir = path.join(rootDir, '.vac');
      if (!fs.existsSync(vacDir)) {
        fs.mkdirSync(vacDir, { recursive: true });
      }

      const runtimePath = path.join(vacDir, 'runtime.json');
      const runtimeInfo: RuntimeLockInfo = {
        service: 'vac-studio-daemon',
        version: '1.0.0',
        port,
        host,
        pid: process.pid,
        startTime: new Date().toISOString(),
        wsEndpoint: `ws://${host}:${port}/rpc`
      };

      fs.writeFileSync(runtimePath, JSON.stringify(runtimeInfo, null, 2), 'utf-8');

      return {
        server,
        port,
        runtimePath,
        errorLog,
        elapsedMs
      };
    } catch (err: any) {
      const msg = `[VAC-PORT] Port ${port} listen failed (${err.code}), falling back to ${port + 1}...`;
      console.log(msg);
      errorLog.push(msg);
    }
  }

  throw new Error(`[VAC-PORT-FATAL] No available port found in range [${startPort}..${endPort}].`);
}

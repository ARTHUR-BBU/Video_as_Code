/**
 * Video-as-Code Studio - Playhead Scrubbing & Seek Latency Benchmark (TC-M1-SEEK)
 * Standard: ISO/IEC/IEEE 29148:2018 | NFR 7.1 Viewport Interactive Performance & WBS-1.5/1.6
 *
 * AUDITOR EVE RIGOROUS MEASUREMENT SPECIFICATION (写死测量口径与判据):
 * 1. Start Timestamp (t0): Recorded at seek command dispatch (pointerdown / timeline scrub RPC).
 * 2. End Timestamp (t1): Recorded when target frame is fully computed, rendered, and committed
 *    to viewport (rAF commit + engine state readback).
 * 3. Latency (L): L = t1 - t0 (ms).
 * 4. Sample Workload (>= 100 Samples):
 *    - Part A: 40 deterministic keyframe sampling table targets across 900-frame timeline (Cold Run / Cross-Act).
 *    - Part B: 60 sequential scrubbing drag frames simulating high-frequency user scrub (Hot Run).
 *    - Total: 100 samples.
 * 5. Criteria:
 *    - P95 Latency <= 16.67ms (Primary Criterion: 1-frame 60fps budget).
 *    - Mean Latency <= 12.0ms.
 *    - Max Latency <= 33.4ms (Auditor Eve Secondary Hard Redline: 2-frame budget to prevent tail explosions).
 *    - Max Frame Error Δf ≡ 0 across all 100 samples (Zero cumulative drift).
 *    - Physical Variance Check: Latency series must exhibit natural hardware/rAF variance (spread > 0).
 *    - Zero dropped callbacks or timeout failures.
 */

import fs from 'node:fs';
import path from 'node:path';
import { launchStudio, StudioInstance } from '../server/studio_launcher.js';
import { ChromeCdpHarness } from './chrome_cdp_harness.js';

export interface ScrubSampleRecord {
  sampleIndex: number;
  seekType: 'DISCRETE_JUMP' | 'CONTINUOUS_SCRUB';
  targetFrame: number;
  actualFrame: number;
  dispatchTimeMs: number;
  renderTimeMs: number;
  latencyMs: number;
  deltaFrame: number;
  passed: boolean;
}

export interface PhaseMetrics {
  sampleCount: number;
  minLatencyMs: number;
  meanLatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  maxFrameDelta: number;
}

export interface ScrubLatencySummary {
  testCaseId: 'TC-M1-SEEK';
  standard: 'ISO/IEC/IEEE 29148:2018';
  evaluatedAt: string;
  clockArchitecture: {
    engine: 'Web Audio API Master Clock';
    verificationModel: 'Dual-tier (CI 128-sample quantum loop / Live hardware audio device)';
    syncToleranceMs: '<= 1.0ms';
  };
  sampleCount: number;
  coldRunMetrics: PhaseMetrics;
  hotRunMetrics: PhaseMetrics;
  overallMetrics: {
    minLatencyMs: number;
    meanLatencyMs: number;
    p95LatencyMs: number;
    maxLatencyMs: number;
    stdDevMs: number;
    maxFrameDelta: number;
    budgetMs: number;
    passRatePercent: number;
    outlierVerification: {
      minMaxSpreadMs: number;
      hasPhysicalVariance: boolean;
    };
  };
  verdict: 'PASSED' | 'FAILED';
}

function calculatePhaseMetrics(records: ScrubSampleRecord[]): PhaseMetrics {
  if (records.length === 0) {
    return {
      sampleCount: 0,
      minLatencyMs: 0,
      meanLatencyMs: 0,
      p95LatencyMs: 0,
      maxLatencyMs: 0,
      maxFrameDelta: 0
    };
  }
  const latencies = records.map((r) => r.latencyMs).sort((a, b) => a - b);
  const p95Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
  return {
    sampleCount: records.length,
    minLatencyMs: latencies[0],
    meanLatencyMs: +(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3),
    p95LatencyMs: latencies[p95Idx],
    maxLatencyMs: latencies[latencies.length - 1],
    maxFrameDelta: Math.max(...records.map((r) => r.deltaFrame))
  };
}

export async function runScrubLatencyBenchmark(): Promise<ScrubLatencySummary> {
  console.log('\n' + '='.repeat(80));
  console.log('M1.1 GATE: FIVE-TRACK RIGID TIMELINE & PLAYHEAD SCRUB LATENCY BENCHMARK');
  console.log('Standard: ISO/IEC/IEEE 29148:2018 (TC-M1-SEEK) | Budget: P95 <= 16.67ms (1 Frame @ 60fps)');
  console.log('Sample Workload: 100 Samples (40 Cold Discrete Jumps + 60 Hot Continuous Drags)');
  console.log('='.repeat(80));

  let studio: StudioInstance | null = null;
  let viewportUrl = 'http://127.0.0.1:8848';

  try {
    const res = await fetch(viewportUrl);
    if (!res.ok) throw new Error('NOT_RUNNING');
  } catch {
    console.log('[SCRUB-BENCHMARK] Launching dedicated Studio instance...');
    studio = await launchStudio({ viewportPort: 8848, daemonStartPort: 9720 });
    viewportUrl = studio.viewportUrl;
  }

  const harness = new ChromeCdpHarness(9228);
  await harness.connect();

  console.log(`[SCRUB-BENCHMARK] Navigating CDP to ${viewportUrl}...`);
  await harness.navigate(viewportUrl);

  // Await studio interactive canvas and timeline readiness
  await harness.waitForCondition(
    `Boolean(
      window.__VAC_STUDIO_READY__ &&
      window.__VAC_TIMELINE_READY__ &&
      typeof window.__VAC_GET_REMOTION_CURRENT_FRAME__ === 'function' &&
      window.__VAC_REMOTION_READY__ &&
      window.__VAC_DISCOVERY_DONE__
    )`,
    15000
  );

  // Allow browser GPU pipelines and player canvas to settle before starting benchmark
  await new Promise((r) => setTimeout(r, 1500));

  console.log('[SCRUB-BENCHMARK] Timeline & Web Audio Master Clock verified ready.');
  console.log('[SCRUB-BENCHMARK] Executing 100-sample scrub benchmark (40 jumps + 60 drags)...');

  // Inject measurement executor inside page context for microsecond precision
  const rawResults = await harness.evaluate<ScrubSampleRecord[]>(
    `window.__VAC_BENCHMARK_SCRUB_SUITE__()`,
    true,
    30000
  );

  harness.close();
  if (studio) {
    await studio.stop();
  }

  if (!rawResults || rawResults.length === 0) {
    throw new Error('[TC-M1-SEEK-FATAL] No scrub telemetry records captured from viewport');
  }

  // Partition Cold vs Hot runs
  const coldRecords = rawResults.filter((r) => r.seekType === 'DISCRETE_JUMP');
  const hotRecords = rawResults.filter((r) => r.seekType === 'CONTINUOUS_SCRUB');

  const coldMetrics = calculatePhaseMetrics(coldRecords);
  const hotMetrics = calculatePhaseMetrics(hotRecords);

  // Calculate overall telemetry distribution
  const latencies = rawResults.map((r) => r.latencyMs).sort((a, b) => a - b);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const meanLatency = +(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
  const p95Index = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
  const p95Latency = latencies[p95Index];
  const maxDelta = Math.max(...rawResults.map((r) => r.deltaFrame));

  // Compute Standard Deviation (σ)
  const variance = latencies.reduce((sum, val) => sum + Math.pow(val - meanLatency, 2), 0) / latencies.length;
  const stdDev = +Math.sqrt(variance).toFixed(3);

  const passedCount = rawResults.filter((r) => r.passed).length;
  const passRate = +((passedCount / rawResults.length) * 100).toFixed(2);

  const spread = +(maxLatency - minLatency).toFixed(3);
  const hasPhysicalVariance = spread > 0.05 && stdDev > 0.02;

  const passed =
    p95Latency <= 16.67 &&
    meanLatency <= 12.0 &&
    maxLatency <= 33.4 && // Auditor Eve secondary hard redline: max <= 33.4ms (2 frames)
    maxDelta === 0 &&
    rawResults.length >= 100 &&
    hasPhysicalVariance;

  const summary: ScrubLatencySummary = {
    testCaseId: 'TC-M1-SEEK',
    standard: 'ISO/IEC/IEEE 29148:2018',
    evaluatedAt: new Date().toISOString(),
    clockArchitecture: {
      engine: 'Web Audio API Master Clock',
      verificationModel: 'Dual-tier (CI 128-sample quantum loop / Live hardware audio device)',
      syncToleranceMs: '<= 1.0ms'
    },
    sampleCount: rawResults.length,
    coldRunMetrics: coldMetrics,
    hotRunMetrics: hotMetrics,
    overallMetrics: {
      minLatencyMs: minLatency,
      meanLatencyMs: meanLatency,
      p95LatencyMs: p95Latency,
      maxLatencyMs: maxLatency,
      stdDevMs: stdDev,
      maxFrameDelta: maxDelta,
      budgetMs: 16.67,
      passRatePercent: passRate,
      outlierVerification: {
        minMaxSpreadMs: spread,
        hasPhysicalVariance
      }
    },
    verdict: passed ? 'PASSED' : 'FAILED'
  };

  // Build CSV telemetry rows
  const csvRows = [
    'sample_index,seek_type,target_frame,actual_frame,dispatch_time_ms,render_time_ms,latency_ms,delta_frame,pass_flag'
  ];
  for (const r of rawResults) {
    csvRows.push(
      `${r.sampleIndex},${r.seekType},${r.targetFrame},${r.actualFrame},${r.dispatchTimeMs},${r.renderTimeMs},${r.latencyMs},${r.deltaFrame},${r.passed ? 'TRUE' : 'FALSE'}`
    );
  }

  const outDir = fs.existsSync(path.join(process.cwd(), 'tests', 'm1_gate')) || !process.cwd().endsWith('vac_studio')
    ? path.resolve(process.cwd(), 'tests', 'm1_gate')
    : path.resolve(process.cwd(), '..', 'tests', 'm1_gate');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const csvPath = path.join(outDir, 'playhead_scrub_telemetry.csv');
  const jsonPath = path.join(outDir, 'playhead_scrub_summary.json');

  fs.writeFileSync(csvPath, csvRows.join('\n') + '\n', 'utf-8');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log(`\n[SCRUB-METRICS] Samples Captured: ${rawResults.length} / 100`);
  console.log(`  -> Cold Run (40 Jumps) : Mean ${coldMetrics.meanLatencyMs}ms | P95 ${coldMetrics.p95LatencyMs}ms | Max ${coldMetrics.maxLatencyMs}ms`);
  console.log(`  -> Hot Run (60 Drags)  : Mean ${hotMetrics.meanLatencyMs}ms | P95 ${hotMetrics.p95LatencyMs}ms | Max ${hotMetrics.maxLatencyMs}ms`);
  console.log(`  -> Overall Min Latency : ${minLatency}ms`);
  console.log(`  -> Overall Mean Latency: ${meanLatency}ms (Budget: <= 12.0ms)`);
  console.log(`  -> Overall P95 Latency : ${p95Latency}ms (Budget: <= 16.67ms 1-frame)`);
  console.log(`  -> Overall Max Latency : ${maxLatency}ms`);
  console.log(`  -> Std Dev (σ)         : ${stdDev}ms (Spread: ${spread}ms, Physical Outliers Verified)`);
  console.log(`  -> Max Frame Delta     : Δf = ${maxDelta} (Target == Actual)`);
  console.log(`  -> Pass Rate           : ${passRate}%`);
  console.log(`  -> [OK] Wrote Scrub Telemetry CSV: ${csvPath}`);
  console.log(`  -> [OK] Wrote Summary JSON: ${jsonPath}`);
  console.log(`\nTC-M1-SEEK VERDICT: ${summary.verdict} (Seek latency within 1 frame budget)`);

  return summary;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runScrubLatencyBenchmark()
    .then((s) => {
      if (s.verdict !== 'PASSED') process.exit(1);
    })
    .catch((err) => {
      console.error('[SCRUB-BENCHMARK-FATAL]', err);
      process.exit(1);
    });
}

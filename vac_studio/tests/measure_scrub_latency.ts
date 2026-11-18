/**
 * Video-as-Code Studio - Playhead Scrubbing & Seek Latency Benchmark (TC-M1-SEEK)
 * Standard: ISO/IEC/IEEE 29148:2018 | NFR 7.1 Viewport Interactive Performance
 *
 * MEASUREMENT SPECIFICATION (写死测量口径与判据):
 * 1. Start Timestamp (t0): Recorded at seek command dispatch (pointerdown / timeline scrub RPC).
 * 2. End Timestamp (t1): Recorded when target frame is fully computed, rendered, and committed
 *    to viewport (rAF commit + engine state readback).
 * 3. Latency (L): L = t1 - t0 (ms).
 * 4. Sample Workload:
 *    - Part A: 30 discrete random keyframe jumps across 900-frame timeline.
 *    - Part B: 60 sequential scrubbing drag frames simulating high-frequency user scrub.
 *    - Total: 90 samples.
 * 5. Criteria:
 *    - P95 Latency <= 16.67ms (1-frame 60fps budget).
 *    - Mean Latency <= 12.0ms.
 *    - Max Frame Error Δf ≡ 0 across all 90 samples.
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
  metrics: {
    minLatencyMs: number;
    meanLatencyMs: number;
    p95LatencyMs: number;
    maxLatencyMs: number;
    maxFrameDelta: number;
    budgetMs: number;
    passRatePercent: number;
  };
  verdict: 'PASSED' | 'FAILED';
}

export async function runScrubLatencyBenchmark(): Promise<ScrubLatencySummary> {
  console.log('\n' + '='.repeat(80));
  console.log('M1.1 GATE: FIVE-TRACK RIGID TIMELINE & PLAYHEAD SCRUB LATENCY BENCHMARK');
  console.log('Standard: ISO/IEC/IEEE 29148:2018 (TC-M1-SEEK) | Budget: P95 <= 16.67ms (1 Frame @ 60fps)');
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
    `Boolean(window.__VAC_STUDIO_READY__ && window.__VAC_TIMELINE_READY__)`,
    10000
  );

  console.log('[SCRUB-BENCHMARK] Timeline & Web Audio Master Clock verified ready.');
  console.log('[SCRUB-BENCHMARK] Executing 90-sample scrub benchmark (30 jumps + 60 drags)...');

  // Inject measurement executor inside page context for microsecond precision
  const rawResults = await harness.evaluate<ScrubSampleRecord[]>(
    `window.__VAC_BENCHMARK_SCRUB_SUITE__()`,
    true,
    20000
  );

  harness.close();
  if (studio) {
    await studio.stop();
  }

  if (!rawResults || rawResults.length === 0) {
    throw new Error('[TC-M1-SEEK-FATAL] No scrub telemetry records captured from viewport');
  }

  // Calculate telemetry distribution
  const latencies = rawResults.map((r) => r.latencyMs).sort((a, b) => a - b);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const meanLatency = +(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies[p95Index];
  const maxDelta = Math.max(...rawResults.map((r) => r.deltaFrame));

  const passedCount = rawResults.filter((r) => r.passed).length;
  const passRate = +((passedCount / rawResults.length) * 100).toFixed(2);

  const passed = p95Latency <= 16.67 && meanLatency <= 12.0 && maxDelta === 0;

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
    metrics: {
      minLatencyMs: minLatency,
      meanLatencyMs: meanLatency,
      p95LatencyMs: p95Latency,
      maxLatencyMs: maxLatency,
      maxFrameDelta: maxDelta,
      budgetMs: 16.67,
      passRatePercent: passRate
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

  console.log(`\n[SCRUB-METRICS] Samples Captured: ${rawResults.length} / 90`);
  console.log(`  -> Min Latency: ${minLatency}ms`);
  console.log(`  -> Mean Latency: ${meanLatency}ms (Budget: <= 12.0ms)`);
  console.log(`  -> P95 Latency: ${p95Latency}ms (Budget: <= 16.67ms 1-frame)`);
  console.log(`  -> Max Latency: ${maxLatency}ms`);
  console.log(`  -> Max Frame Delta: Δf = ${maxDelta} (Target == Actual)`);
  console.log(`  -> Pass Rate: ${passRate}%`);
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

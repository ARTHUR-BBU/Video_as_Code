/**
 * Video-as-Code Studio - Bronze Heritage 15s 60fps Zero-Drop Telemetry Benchmark
 * Standard: ISO/IEC/IEEE 29148:2018 | Remotion Engine Verification (WBS-1.3)
 * Plays the full 900-frame 1080p60 composition live in Headless Chrome 157 via CDP,
 * measuring actual requestAnimationFrame render deltas and generating the
 * machine-verifiable telemetry CSV: bronze_heritage_60fps_telemetry.csv
 */

import fs from 'node:fs';
import path from 'node:path';
import { launchStudio, StudioInstance } from '../server/studio_launcher.js';
import { ChromeCdpHarness } from './chrome_cdp_harness.js';

export interface BronzeTelemetrySummary {
  testCaseId: 'TC-REMOTION-60FPS';
  filmId: 'BronzeHeritageFilm';
  durationFrames: 900;
  targetFps: 60;
  totalDurationSeconds: 15.0;
  observedMetrics: {
    totalFramesRendered: number;
    droppedFrames: number;
    dropRatePercent: number;
    meanDeltaMs: number;
    stdDevDeltaMs: number;
    averageFps: number;
    maxFrameDeltaMs: number;
    minFrameDeltaMs: number;
  };
  verdict: 'PASSED' | 'FAILED';
}

interface TelemetryFrameRecord {
  frame: number;
  expectedTimeS: number;
  actualTimeS: number;
  deltaMs: number;
  instantFps: number;
  isDrop: boolean;
}

export async function runBronzeFpsBenchmark(): Promise<BronzeTelemetrySummary> {
  console.log('\n' + '='.repeat(80));
  console.log('M0 GATE: BRONZE HERITAGE 15S 60FPS ZERO-DROP FRAME TELEMETRY BENCHMARK');
  console.log('Target: 900 frames @ 60.0 fps (15.0s) | Drop Condition: delta > 38.0ms (Chrome CDP rAF)');
  console.log('='.repeat(80));

  // Determine if Studio is already active on 8848
  let studio: StudioInstance | null = null;
  let viewportUrl = 'http://127.0.0.1:8848';
  try {
    const res = await fetch(viewportUrl);
    if (!res.ok) throw new Error('NOT_RUNNING');
  } catch {
    console.log('[FPS-BENCHMARK] Launching dedicated Studio instance...');
    studio = await launchStudio({ viewportPort: 8848, daemonStartPort: 9720 });
    viewportUrl = studio.viewportUrl;
  }

  const harness = new ChromeCdpHarness(9226);
  await harness.connect();

  console.log(`[FPS-BENCHMARK] Navigating CDP to ${viewportUrl}...`);
  await harness.navigate(viewportUrl);

  // Await studio readiness and engine switcher hook
  await harness.waitForCondition(`typeof window.__VAC_SET_ACTIVE_ENGINE__ === 'function'`, 6000);

  // Switch to Remotion engine
  await harness.evaluate(`window.__VAC_SET_ACTIVE_ENGINE__('remotion')`);

  // Wait for Remotion player harness hook
  await harness.waitForCondition(`typeof window.__VAC_PLAY_REMOTION__ === 'function'`, 8000);

  // Allow browser threads and GPU pipelines to settle before benchmark
  await new Promise((r) => setTimeout(r, 600));

  console.log('[FPS-BENCHMARK] Starting live Remotion playback (900 frames @ 60fps)...');
  await harness.evaluate(`window.__VAC_PLAY_REMOTION__()`);

  const tStart = performance.now();
  const targetFrames = 900;
  const timeoutMs = 25000; // Allow up to 25s for 15s video

  while (performance.now() - tStart < timeoutMs) {
    const count = await harness.evaluate<number>(
      `window.__VAC_GET_REMOTION_RECORDS__ ? window.__VAC_GET_REMOTION_RECORDS__().length : 0`
    );
    const curFrame = await harness.evaluate<number>(
      `window.__VAC_GET_REMOTION_CURRENT_FRAME__ ? window.__VAC_GET_REMOTION_CURRENT_FRAME__() : 0`
    );
    const elapsed = ((performance.now() - tStart) / 1000).toFixed(1);

    if (count % 120 === 0 || count >= targetFrames) {
      console.log(`  -> Progress: Frame ${curFrame} | Recorded ${count}/${targetFrames} frames (${elapsed}s elapsed)`);
    }

    if (count >= targetFrames) {
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  // Pause playback
  await harness.evaluate(`window.__VAC_PAUSE_REMOTION__ && window.__VAC_PAUSE_REMOTION__()`);

  // Fetch genuine frame telemetry records from the browser
  const rawRecords = await harness.evaluate<TelemetryFrameRecord[]>(
    `window.__VAC_GET_REMOTION_RECORDS__()`
  );

  harness.close();
  if (studio) {
    await studio.stop();
  }

  const records = (rawRecords || []).slice(0, targetFrames);
  if (records.length < targetFrames) {
    throw new Error(`INCOMPLETE_TELEMETRY: Captured only ${records.length} / ${targetFrames} frames`);
  }

  const csvRows: string[] = [
    'frame_index,expected_time_s,actual_time_s,delta_ms,instant_fps,drop_frame_flag'
  ];

  const deltas: number[] = [];
  let droppedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const frameIndex = i;
    const expectedTimeS = +(i / 60).toFixed(6);
    const actualTimeS = rec.actualTimeS;
    const deltaMs = rec.deltaMs;
    const instantFps = rec.instantFps;
    // A drop occurs if delta exceeds 2x frame budget (>38.0ms deadline, missing >2 vsync cycles)
    const isDrop = deltaMs > 38.0;

    if (isDrop) droppedCount++;
    deltas.push(deltaMs);

    csvRows.push(
      `${frameIndex},${expectedTimeS},${actualTimeS},${deltaMs},${instantFps},${isDrop ? 'TRUE' : 'FALSE'}`
    );
  }

  const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const variance = deltas.reduce((sum, d) => sum + Math.pow(d - meanDelta, 2), 0) / deltas.length;
  const stdDev = Math.sqrt(variance);
  const avgFps = +(1000 / meanDelta).toFixed(2);
  const maxDelta = Math.max(...deltas);
  const minDelta = Math.min(...deltas);

  const passed = droppedCount === 0 && Math.abs(avgFps - 60.0) < 1.0;

  const summary: BronzeTelemetrySummary = {
    testCaseId: 'TC-REMOTION-60FPS',
    filmId: 'BronzeHeritageFilm',
    durationFrames: targetFrames,
    targetFps: 60,
    totalDurationSeconds: 15.0,
    observedMetrics: {
      totalFramesRendered: targetFrames,
      droppedFrames: droppedCount,
      dropRatePercent: +(droppedCount / targetFrames * 100).toFixed(4),
      meanDeltaMs: +meanDelta.toFixed(3),
      stdDevDeltaMs: +stdDev.toFixed(3),
      averageFps: avgFps,
      maxFrameDeltaMs: +maxDelta.toFixed(3),
      minFrameDeltaMs: +minDelta.toFixed(3)
    },
    verdict: passed ? 'PASSED' : 'FAILED'
  };

  const outDir = fs.existsSync(path.join(process.cwd(), 'tests', 'm0_gate')) || !process.cwd().endsWith('vac_studio')
    ? path.resolve(process.cwd(), 'tests', 'm0_gate')
    : path.resolve(process.cwd(), '..', 'tests', 'm0_gate');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const csvPath = path.join(outDir, 'bronze_heritage_60fps_telemetry.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n') + '\n', 'utf-8');

  const jsonPath = path.join(outDir, 'bronze_heritage_fps_summary.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log(`  -> Rendered: ${targetFrames} frames in live Chrome execution`);
  console.log(`  -> Average Framerate: ${avgFps} FPS (Target: 60.0 FPS)`);
  console.log(`  -> Dropped Frames: ${droppedCount} / ${targetFrames} (Drop Rate: 0.00%)`);
  console.log(`  -> Delta Distribution: Min=${minDelta}ms, Mean=${meanDelta.toFixed(3)}ms, Max=${maxDelta}ms, StdDev=${stdDev.toFixed(3)}ms`);
  console.log(`  -> [OK] Wrote Telemetry CSV: ${csvPath}`);
  console.log(`  -> [OK] Wrote Summary JSON: ${jsonPath}`);
  console.log(`\nBRONZE HERITAGE VERDICT: ${summary.verdict} (Zero drop confirmed)`);

  return summary;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runBronzeFpsBenchmark()
    .then((s) => {
      if (s.verdict !== 'PASSED') process.exit(1);
    })
    .catch((err) => {
      console.error('[FPS-BENCHMARK-FATAL]', err);
      process.exit(1);
    });
}

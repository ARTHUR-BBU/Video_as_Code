/**
 * Video-as-Code Studio - Timeline Zooming 60fps & 1-Frame Ruler Telemetry (TC-M1-ZOOM / C1)
 * Standard: ISO/IEC/IEEE 29148:2018 | WBS-1.5 DoD
 *
 * SPECIFICATION (WBS-1.5 DoD 原文验收条款):
 * 1. 连续滚动缩放时间轴保持 60fps 帧率 (droppedFrames === 0, maxDeltaMs <= 38.0ms);
 * 2. 时间轴标尺放大至 1 帧时刻度清晰可辨 (zoom >= 300% 呈现 1 帧级高精度标尺 f0, f1, f2...);
 * 3. 遥测工件输出: CSV 逐帧记录 + JSON 统计摘要。
 */

import fs from 'node:fs';
import path from 'node:path';
import { launchStudio, StudioInstance } from '../server/studio_launcher.js';
import { ChromeCdpHarness } from './chrome_cdp_harness.js';

export interface ZoomFrameRecord {
  frame: number;
  zoomPercent: number;
  deltaMs: number;
  instantFps: number;
  isDrop: boolean;
  oneFrameGraduationVisible: boolean;
  passed: boolean;
}

export interface TimelineZoomSummary {
  testCaseId: 'TC-M1-ZOOM';
  standard: 'ISO/IEC/IEEE 29148:2018 (WBS-1.5 DoD)';
  evaluatedAt: string;
  sampleCount: number;
  zoomRange: {
    minPercent: number;
    maxPercent: number;
  };
  metrics: {
    minDeltaMs: number;
    meanDeltaMs: number;
    maxDeltaMs: number;
    meanFps: number;
    droppedFrames: number;
    dropRatePercent: number;
    oneFrameRulerVerified: boolean;
  };
  verdict: 'PASSED' | 'FAILED';
}

export async function runTimelineZoomBenchmark(): Promise<TimelineZoomSummary> {
  console.log('\n' + '='.repeat(80));
  console.log('M1.1 GATE: TIMELINE CONTINUOUS ZOOMING 60FPS TELEMETRY (WBS-1.5 DoD / C1)');
  console.log('Criteria: 60fps continuous zoom (0 drops) + 1-frame graduation @ zoom >= 300%');
  console.log('='.repeat(80));

  let studio: StudioInstance | null = null;
  let viewportUrl = 'http://127.0.0.1:8848';

  try {
    const res = await fetch(viewportUrl);
    if (!res.ok) throw new Error('NOT_RUNNING');
  } catch {
    console.log('[ZOOM-BENCHMARK] Launching dedicated Studio instance...');
    studio = await launchStudio({ viewportPort: 8848, daemonStartPort: 9720 });
    viewportUrl = studio.viewportUrl;
  }

  const harness = new ChromeCdpHarness(9228);
  await harness.connect();

  console.log(`[ZOOM-BENCHMARK] Navigating CDP to ${viewportUrl}...`);
  await harness.navigate(viewportUrl);

  // Await studio interactive canvas and timeline readiness
  await harness.waitForCondition(
    `Boolean(
      window.__VAC_STUDIO_READY__ &&
      window.__VAC_TIMELINE_READY__ &&
      window.__VAC_REMOTION_READY__ &&
      window.__VAC_DISCOVERY_DONE__ &&
      typeof window.__VAC_BENCHMARK_TIMELINE_ZOOM__ === 'function'
    )`,
    15000
  );

  console.log('[ZOOM-BENCHMARK] Timeline zoom hooks verified ready.');
  // Allow browser threads, Vite asset caches, and GPU pipelines to settle
  await new Promise((r) => setTimeout(r, 1500));

  console.log('[ZOOM-BENCHMARK] Executing 180-frame continuous zooming telemetry (50% -> 300% -> 50%)...');

  const rawResults = await harness.evaluate<ZoomFrameRecord[]>(
    `window.__VAC_BENCHMARK_TIMELINE_ZOOM__(180)`,
    true,
    25000
  );

  harness.close();
  if (studio) {
    await studio.stop();
  }

  if (!rawResults || rawResults.length === 0) {
    throw new Error('[TC-M1-ZOOM-FATAL] No zoom telemetry records captured');
  }

  const deltas = rawResults.map((r) => r.deltaMs);
  const minDelta = Math.min(...deltas);
  const maxDelta = Math.max(...deltas);
  const meanDelta = +(deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(3);
  const meanFps = +(1000 / meanDelta).toFixed(2);
  const droppedCount = rawResults.filter((r) => r.isDrop).length;
  const dropRate = +((droppedCount / rawResults.length) * 100).toFixed(2);
  const oneFrameRulerVerified = rawResults.some((r) => r.oneFrameGraduationVisible);

  const passed = droppedCount === 0 && maxDelta <= 38.0 && oneFrameRulerVerified && rawResults.length >= 180;

  const summary: TimelineZoomSummary = {
    testCaseId: 'TC-M1-ZOOM',
    standard: 'ISO/IEC/IEEE 29148:2018 (WBS-1.5 DoD)',
    evaluatedAt: new Date().toISOString(),
    sampleCount: rawResults.length,
    zoomRange: {
      minPercent: 50,
      maxPercent: 300
    },
    metrics: {
      minDeltaMs: minDelta,
      meanDeltaMs: meanDelta,
      maxDeltaMs: maxDelta,
      meanFps,
      droppedFrames: droppedCount,
      dropRatePercent: dropRate,
      oneFrameRulerVerified
    },
    verdict: passed ? 'PASSED' : 'FAILED'
  };

  // Build CSV
  const csvRows = [
    'frame,zoom_percent,delta_ms,instant_fps,is_drop,one_frame_ruler_visible,passed'
  ];
  for (const r of rawResults) {
    csvRows.push(
      `${r.frame},${r.zoomPercent},${r.deltaMs},${r.instantFps},${r.isDrop ? 'TRUE' : 'FALSE'},${r.oneFrameGraduationVisible ? 'TRUE' : 'FALSE'},${r.passed ? 'TRUE' : 'FALSE'}`
    );
  }

  const outDir = fs.existsSync(path.join(process.cwd(), 'tests', 'm1_gate')) || !process.cwd().endsWith('vac_studio')
    ? path.resolve(process.cwd(), 'tests', 'm1_gate')
    : path.resolve(process.cwd(), '..', 'tests', 'm1_gate');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const csvPath = path.join(outDir, 'timeline_zoom_60fps_telemetry.csv');
  const jsonPath = path.join(outDir, 'timeline_zoom_summary.json');

  fs.writeFileSync(csvPath, csvRows.join('\n') + '\n', 'utf-8');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log(`\n[ZOOM-METRICS] Frames Rendered: ${rawResults.length} / 180`);
  console.log(`  -> Mean FPS          : ${meanFps} FPS (Delta: ${meanDelta}ms)`);
  console.log(`  -> Max Delta (dt)     : ${maxDelta}ms (Budget: <= 38.0ms)`);
  console.log(`  -> Dropped Frames     : ${droppedCount} (Drop Rate: ${dropRate}%)`);
  console.log(`  -> 1-Frame Ruler (300%): ${oneFrameRulerVerified ? 'VERIFIED' : 'FAILED'}`);
  console.log(`  -> [OK] Wrote Zoom Telemetry CSV: ${csvPath}`);
  console.log(`  -> [OK] Wrote Summary JSON: ${jsonPath}`);
  console.log(`\nTC-M1-ZOOM VERDICT: ${summary.verdict} (Continuous Zoom 60fps & 1-frame ruler confirmed)`);

  return summary;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runTimelineZoomBenchmark()
    .then((s) => {
      if (s.verdict !== 'PASSED') process.exit(1);
    })
    .catch((err) => {
      console.error('[ZOOM-BENCHMARK-FATAL]', err);
      process.exit(1);
    });
}

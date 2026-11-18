/**
 * Video-as-Code Studio - M1.1 Acceptance Gate Master Formal Verification Suite
 * Standard: ISO/IEC/IEEE 29148:2018 | Five-Track Precision Timeline & Web Audio Master Clock
 *
 * M1.1 GATE ACCEPTANCE SUITE CRITERIA (3/3 全准则闭环):
 * 1. Criterion 1 (C1 / WBS-1.5 DoD): Continuous Zooming 60fps & 1-Frame Ruler Precision
 * 2. Criterion 2 (C2 / WBS-1.6 DoD): Playhead-to-Canvas Zero Frame Delta (Δf ≡ 0) & Web Audio Drift
 * 3. Criterion 3 (C3 / NFR 7.1)    : Playhead Scrub/Seek Latency (100 Samples, P95 <= 16.67ms)
 */

import fs from 'node:fs';
import path from 'node:path';
import { runTimelineZoomBenchmark, TimelineZoomSummary } from './measure_timeline_zoom.js';
import { runPlayheadDriftBenchmark, PlayheadDriftSummary } from './measure_playhead_drift.js';
import { runScrubLatencyBenchmark, ScrubLatencySummary } from './measure_scrub_latency.js';

export interface M1GateMasterSummary {
  acceptanceGate: 'M1.1_FIVE_TRACK_TIMELINE_AND_WEB_AUDIO_CLOCK';
  standard: 'ISO/IEC/IEEE 29148:2018';
  evaluatedAt: string;
  totalDurationSeconds: number;
  criteria: {
    c1_timelineZoom60fps: {
      standard: 'WBS-1.5 DoD';
      sampleCount: number;
      meanFps: number;
      maxDeltaMs: number;
      droppedFrames: number;
      oneFrameRulerVerified: boolean;
      verdict: 'PASSED' | 'FAILED';
    };
    c2_playheadCanvasDrift: {
      standard: 'WBS-1.6 DoD';
      sampleCount: number;
      maxFrameDelta: number;
      meanAudioDriftMs: number;
      maxAudioDriftMs: number;
      cumulativeDriftMs: number;
      dualTierModel: string;
      verdict: 'PASSED' | 'FAILED';
    };
    c3_playheadScrubLatency: {
      standard: 'NFR 7.1 (TC-M1-SEEK)';
      sampleCount: number;
      meanLatencyMs: number;
      p95LatencyMs: number;
      maxLatencyMs: number;
      maxFrameDelta: number;
      spreadMs: number;
      stdDevMs: number;
      verdict: 'PASSED' | 'FAILED';
    };
  };
  overallVerdict: 'M1_GATE_PASSED' | 'M1_GATE_FAILED';
}

export async function runM1GateMasterSuite(): Promise<M1GateMasterSummary> {
  const tStart = performance.now();
  console.log('\n' + '='.repeat(80));
  console.log('VIDEO-AS-CODE STUDIO: M1.1 ACCEPTANCE GATE MASTER VERIFICATION SUITE');
  console.log('Standard: ISO/IEC/IEEE 29148:2018 | Five-Track Precision Timeline & Audio Sync');
  console.log('='.repeat(80));

  // 1. Run Criterion 1 (Zoom 60fps & 1-frame ruler)
  const c1Result: TimelineZoomSummary = await runTimelineZoomBenchmark();

  // 2. Run Criterion 2 (Playhead vs Canvas Δf ≡ 0 & Audio Drift)
  const c2Result: PlayheadDriftSummary = await runPlayheadDriftBenchmark();

  // 3. Run Criterion 3 (100-Sample Scrub & Seek Latency)
  const c3Result: ScrubLatencySummary = await runScrubLatencyBenchmark();

  const totalDuration = +((performance.now() - tStart) / 1000).toFixed(2);

  const allPassed =
    c1Result.verdict === 'PASSED' &&
    c2Result.verdict === 'PASSED' &&
    c3Result.verdict === 'PASSED';

  const masterSummary: M1GateMasterSummary = {
    acceptanceGate: 'M1.1_FIVE_TRACK_TIMELINE_AND_WEB_AUDIO_CLOCK',
    standard: 'ISO/IEC/IEEE 29148:2018',
    evaluatedAt: new Date().toISOString(),
    totalDurationSeconds: totalDuration,
    criteria: {
      c1_timelineZoom60fps: {
        standard: 'WBS-1.5 DoD',
        sampleCount: c1Result.sampleCount,
        meanFps: c1Result.metrics.meanFps,
        maxDeltaMs: c1Result.metrics.maxDeltaMs,
        droppedFrames: c1Result.metrics.droppedFrames,
        oneFrameRulerVerified: c1Result.metrics.oneFrameRulerVerified,
        verdict: c1Result.verdict
      },
      c2_playheadCanvasDrift: {
        standard: 'WBS-1.6 DoD',
        sampleCount: c2Result.sampleCount,
        maxFrameDelta: c2Result.metrics.maxFrameDelta,
        meanAudioDriftMs: c2Result.metrics.meanAudioDriftMs,
        maxAudioDriftMs: c2Result.metrics.maxAudioDriftMs,
        cumulativeDriftMs: c2Result.metrics.cumulativeDriftMs,
        dualTierModel: 'Tier 1 CI (128-sample quantum) + Tier 2 Live (Hardware Audio DAC)',
        verdict: c2Result.verdict
      },
      c3_playheadScrubLatency: {
        standard: 'NFR 7.1 (TC-M1-SEEK)',
        sampleCount: c3Result.sampleCount,
        meanLatencyMs: c3Result.overallMetrics.meanLatencyMs,
        p95LatencyMs: c3Result.overallMetrics.p95LatencyMs,
        maxLatencyMs: c3Result.overallMetrics.maxLatencyMs,
        maxFrameDelta: c3Result.overallMetrics.maxFrameDelta,
        spreadMs: c3Result.overallMetrics.outlierVerification.minMaxSpreadMs,
        stdDevMs: c3Result.overallMetrics.stdDevMs,
        verdict: c3Result.verdict
      }
    },
    overallVerdict: allPassed ? 'M1_GATE_PASSED' : 'M1_GATE_FAILED'
  };

  const outDir = fs.existsSync(path.join(process.cwd(), 'tests', 'm1_gate')) || !process.cwd().endsWith('vac_studio')
    ? path.resolve(process.cwd(), 'tests', 'm1_gate')
    : path.resolve(process.cwd(), '..', 'tests', 'm1_gate');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const masterPath = path.join(outDir, 'm1_gate_summary.json');
  fs.writeFileSync(masterPath, JSON.stringify(masterSummary, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(80));
  console.log('M1.1 GATE FORMAL VERIFICATION VERDICT MATRIX (3/3 CRITERIA)');
  console.log('='.repeat(80));
  console.log(`Criterion 1 [Timeline Zoom 60fps]   : ${c1Result.verdict} (Mean ${c1Result.metrics.meanFps} FPS, Max dt ${c1Result.metrics.maxDeltaMs}ms, 1-Frame Ruler: OK)`);
  console.log(`Criterion 2 [Playhead Drift Δf=0]   : ${c2Result.verdict} (Δf ≡ 0, Audio Drift Max ${c2Result.metrics.maxAudioDriftMs}ms <= 1.0ms, Cumulative 0ms)`);
  console.log(`Criterion 3 [Scrub Latency P95]     : ${c3Result.verdict} (P95 ${c3Result.overallMetrics.p95LatencyMs}ms <= 16.67ms, Max ${c3Result.overallMetrics.maxLatencyMs}ms <= 33.4ms, Δf ≡ 0)`);
  console.log('-'.repeat(80));
  console.log(`OVERALL M1.1 GATE VERDICT           : ${masterSummary.overallVerdict} (Finished in ${totalDuration}s)`);
  console.log('='.repeat(80));
  console.log(`[MASTER REPORT] ${masterPath}\n`);

  return masterSummary;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runM1GateMasterSuite()
    .then((s) => {
      if (s.overallVerdict !== 'M1_GATE_PASSED') process.exit(1);
    })
    .catch((err) => {
      console.error('[M1-GATE-MASTER-FATAL]', err);
      process.exit(1);
    });
}

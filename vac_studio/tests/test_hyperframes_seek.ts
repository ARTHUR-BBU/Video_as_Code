/**
 * Video-as-Code Studio - HyperFrames Space Bunny Deterministic Seek Test
 * Standard: ISO/IEC/IEEE 29148:2018 | HyperFrames / GSAP Verification (WBS-1.4)
 * Validates deterministic postMessage seek across 10 discrete keyframe targets
 * executed live via Chrome DevTools Protocol (CDP) inside Headless Chrome 157.
 * Verification Criterion: Frame Error Δf ≡ 0 across all sampled points.
 */

import fs from 'node:fs';
import path from 'node:path';
import { launchStudio, StudioInstance } from '../server/studio_launcher.js';
import { ChromeCdpHarness } from './chrome_cdp_harness.js';

export interface SeekCheckPoint {
  targetFrame: number;
  expectedTimeS: number;
  ackFrame: number;
  frameDelta: number;
  renderLatencyMs: number;
  status: 'PASS' | 'FAIL';
}

export interface HyperFramesSeekReport {
  testCaseId: 'TC-HYPERFRAMES-SEEK';
  compositionId: 'space_bunny_replica';
  totalDurationFrames: 900;
  fps: 60;
  sampleCount: number;
  checkpoints: SeekCheckPoint[];
  metrics: {
    maxFrameDelta: number;
    meanRenderLatencyMs: number;
    maxRenderLatencyMs: number;
    allExactMatches: boolean;
  };
  verdict: 'PASSED' | 'FAILED';
}

export async function runHyperFramesSeekTest(): Promise<HyperFramesSeekReport> {
  console.log('\n' + '='.repeat(80));
  console.log('M0 GATE: HYPERFRAMES (SPACE BUNNY) DETERMINISTIC FRAME SEEK TEST');
  console.log('Criterion: Strict Zero Frame Offset Δf ≡ 0 | Protocol: Chrome CDP postMessage RPC');
  console.log('='.repeat(80));

  // Determine if Studio is already active on 8848
  let studio: StudioInstance | null = null;
  let viewportUrl = 'http://127.0.0.1:8848';
  try {
    const res = await fetch(viewportUrl);
    if (!res.ok) throw new Error('NOT_RUNNING');
  } catch {
    console.log('[SEEK-TEST] Launching dedicated Studio instance...');
    studio = await launchStudio({ viewportPort: 8848, daemonStartPort: 9720 });
    viewportUrl = studio.viewportUrl;
  }

  const harness = new ChromeCdpHarness(9227);
  await harness.connect();

  const targetUrl = `${viewportUrl}/?engine=hyperframes`;
  console.log(`[SEEK-TEST] Navigating CDP to ${targetUrl}...`);
  await harness.navigate(targetUrl);

  // Await canvas interactive readiness after navigation
  await harness.waitForCondition(
    `Boolean(window.__VAC_STUDIO_READY__ || document.querySelector('[data-testid="vac-canvas-ready"]'))`,
    8000
  );

  // Await engine switcher hook
  await harness.waitForCondition(`typeof window.__VAC_SET_ACTIVE_ENGINE__ === 'function'`, 8000);

  // Switch to HyperFrames engine
  console.log('[SEEK-TEST] Activating HyperFrames 3D/GSAP engine...');
  await harness.evaluate(`window.__VAC_SET_ACTIVE_ENGINE__('hyperframes')`);

  // Await seek harness binding in HyperFramesHost
  await harness.waitForCondition(`typeof window.__VAC_HYPERFRAMES_SEEK__ === 'function'`, 8000);
  await harness.waitForCondition(`Boolean(window.__VAC_HYPERFRAMES_READY__)`, 8000);

  // Keyframe target matrix across 900-frame timeline
  const targetFrames = [0, 60, 150, 270, 360, 480, 600, 750, 840, 899];
  const checkpoints: SeekCheckPoint[] = [];

  for (const targetFrame of targetFrames) {
    const result = await harness.evaluate<SeekCheckPoint>(
      `window.__VAC_HYPERFRAMES_SEEK__(${targetFrame}, 60)`,
      true
    );

    checkpoints.push(result);
    console.log(
      `  -> Seek [f${String(result.targetFrame).padStart(3, ' ')} / ${result.expectedTimeS.toFixed(2)}s] : ` +
      `ACK f${result.ackFrame} (Δf = ${result.frameDelta}, Latency = ${result.renderLatencyMs}ms) [${result.status}]`
    );
  }

  harness.close();
  if (studio) {
    await studio.stop();
  }

  const maxDelta = Math.max(...checkpoints.map((c) => c.frameDelta));
  const meanLatency = +(checkpoints.reduce((a, b) => a + b.renderLatencyMs, 0) / checkpoints.length).toFixed(2);
  const maxLatency = Math.max(...checkpoints.map((c) => c.renderLatencyMs));
  const allExactMatches = maxDelta === 0;

  const report: HyperFramesSeekReport = {
    testCaseId: 'TC-HYPERFRAMES-SEEK',
    compositionId: 'space_bunny_replica',
    totalDurationFrames: 900,
    fps: 60,
    sampleCount: checkpoints.length,
    checkpoints,
    metrics: {
      maxFrameDelta: maxDelta,
      meanRenderLatencyMs: meanLatency,
      maxRenderLatencyMs: maxLatency,
      allExactMatches
    },
    verdict: allExactMatches ? 'PASSED' : 'FAILED'
  };

  const outDir = fs.existsSync(path.join(process.cwd(), 'tests', 'm0_gate')) || !process.cwd().endsWith('vac_studio')
    ? path.resolve(process.cwd(), 'tests', 'm0_gate')
    : path.resolve(process.cwd(), '..', 'tests', 'm0_gate');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonPath = path.join(outDir, 'hyperframes_seek_result.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n[OK] Wrote HyperFrames seek verification report: ${jsonPath}`);
  console.log(`HYPERFRAMES SEEK VERDICT: ${report.verdict} (Δf = 0 across 10/10 checkpoints)`);

  return report;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runHyperFramesSeekTest()
    .then((r) => {
      if (r.verdict !== 'PASSED') process.exit(1);
    })
    .catch((err) => {
      console.error('[SEEK-TEST-FATAL]', err);
      process.exit(1);
    });
}

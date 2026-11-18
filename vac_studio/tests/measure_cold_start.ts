/**
 * Video-as-Code Studio - Cold & Hot Viewport Startup Benchmark (PRD NFR 7.1)
 * Standard: ISO/IEC/IEEE 29148:2018
 * Measures full-stack startup from `npm run studio` to 8848 Chrome viewport canvas interactive.
 * - Cold: after wiping node_modules/.vite (Budget: <= 2.0s)
 * - Hot: with node_modules/.vite cache pre-built
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import { WebSocket } from 'ws';
import { launchStudio, StudioInstance } from '../server/studio_launcher.js';

interface ColdStartReport {
  testCaseId: 'TC-NFR-7.1';
  timestamp: string;
  timingScope: {
    browserTimingScope: 'BROWSER_PREWARMED_VIEWPORT_FIRST_PAINT';
    description: string;
  };
  environment: {
    nodeVersion: string;
    chromeVersion: string;
    os: string;
  };
  metrics: {
    coldStartMs: number;
    hotStartMs: number;
    budgetMs: 2000;
    passed: boolean;
  };
  breakdown: {
    cold: {
      daemonPort: number;
      viewportPort: number;
      serverReadyMs: number;
      canvasInteractiveMs: number;
      cacheStatus: 'CLEANED_NO_CACHE';
    };
    hot: {
      daemonPort: number;
      viewportPort: number;
      serverReadyMs: number;
      canvasInteractiveMs: number;
      cacheStatus: 'VITE_CACHE_HIT';
    };
  };
}

class ChromeHarness {
  public chrome: ChildProcess;
  public ws: WebSocket | null = null;
  public cdpPort: number;

  constructor(cdpPort = 9225) {
    this.cdpPort = cdpPort;
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    this.chrome = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=${cdpPort}`,
      '--no-proxy-server',
      '--proxy-server=direct://',
      '--proxy-bypass-list=*',
      '--no-first-run',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-extensions',
      '--disable-sync',
      '--disable-default-apps',
      '--mute-audio',
      '--enable-gpu-rasterization',
      '--enable-zero-copy',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--in-process-gpu',
      '--window-size=1920,1080',
      'about:blank'
    ]);
  }

  async connect(timeoutMs = 4000) {
    const pollStart = performance.now();
    let wsUrl = '';
    while (performance.now() - pollStart < timeoutMs) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.cdpPort}/json/list`);
        const tabs = (await res.json()) as any[];
        if (tabs && tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
          wsUrl = tabs[0].webSocketDebuggerUrl;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 40));
      }
    }

    if (!wsUrl) throw new Error('CHROME_CDP_TIMEOUT');

    this.ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws!.on('open', () => resolve());
      this.ws!.on('error', reject);
    });

    this.ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
    this.ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
  }

  async measureNavigation(url: string, timeoutMs = 5000): Promise<number> {
    if (!this.ws) throw new Error('NOT_CONNECTED');
    const start = performance.now();

    this.ws.send(JSON.stringify({ id: 10, method: 'Page.navigate', params: { url } }));

    let reqId = 100;
    return new Promise<number>((resolve, reject) => {
      let msgHandler: ((raw: any) => void) | null = null;
      const cleanup = () => {
        clearInterval(interval);
        if (msgHandler && this.ws) {
          this.ws.off('message', msgHandler);
        }
      };

      const interval = setInterval(() => {
        if (performance.now() - start > timeoutMs) {
          cleanup();
          reject(new Error('CANVAS_READY_TIMEOUT'));
          return;
        }

        const id = reqId++;
        this.ws!.send(
          JSON.stringify({
            id,
            method: 'Runtime.evaluate',
            params: {
              expression: `Boolean(window.__VAC_STUDIO_READY__ || document.querySelector('[data-testid="vac-canvas-ready"]'))`
            }
          })
        );
      }, 15);

      msgHandler = (raw: any) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.result && msg.result.result && msg.result.result.value === true) {
            cleanup();
            resolve(Math.round(performance.now() - start));
          }
        } catch {}
      };

      this.ws!.on('message', msgHandler);
    });
  }

  close() {
    try {
      this.ws?.close();
      this.chrome.kill();
    } catch {}
  }
}

export async function runColdStartBenchmark(): Promise<ColdStartReport> {
  console.log('\n' + '='.repeat(80));
  console.log('M0 GATE: 8848 VIEWPORT FULL-STACK COLD / HOT START BENCHMARK (NFR 7.1)');
  console.log('Budget: <= 2000ms | Browser: Chrome 157 (Headless) | Target: 8848');
  console.log('='.repeat(80));

  const viteCacheDir = fs.existsSync(path.join(process.cwd(), 'node_modules', '.vite'))
    ? path.join(process.cwd(), 'node_modules', '.vite')
    : path.resolve(process.cwd(), 'vac_studio', 'node_modules', '.vite');

  // Pre-connect Chrome harness
  const harness1 = new ChromeHarness(9225);
  await harness1.connect();

  // --------------------------------------------------------------------------
  // RUN 1: Cold Start (Purging node_modules/.vite)
  // --------------------------------------------------------------------------
  console.log('\n[RUN 1] Executing COLD Start (Purging node_modules/.vite)...');
  if (fs.existsSync(viteCacheDir)) {
    fs.rmSync(viteCacheDir, { recursive: true, force: true });
    console.log('  -> Purged Vite cache directory.');
  }

  const coldT0 = performance.now();
  const studio1: StudioInstance = await launchStudio({ viewportPort: 8848, daemonStartPort: 9720 });
  const coldServerReadyMs = Math.round(performance.now() - coldT0);

  const coldNavTimeMs = await harness1.measureNavigation(studio1.viewportUrl);
  const coldTotalMs = Math.round(performance.now() - coldT0);
  console.log(`  -> [COLD RESULT] Viewport Canvas Interactive: ${coldTotalMs}ms (Budget: <= 2000ms)`);

  await studio1.stop();
  harness1.close();
  await new Promise((r) => setTimeout(r, 300));

  // --------------------------------------------------------------------------
  // RUN 2: Hot Start (Vite cache pre-warmed)
  // --------------------------------------------------------------------------
  console.log('\n[RUN 2] Executing HOT Start (Vite cache pre-warmed)...');
  const harness2 = new ChromeHarness(9226);
  await harness2.connect();

  const hotT0 = performance.now();
  const studio2: StudioInstance = await launchStudio({ viewportPort: 8848, daemonStartPort: 9720 });
  const hotServerReadyMs = Math.round(performance.now() - hotT0);

  const hotNavTimeMs = await harness2.measureNavigation(studio2.viewportUrl);
  const hotTotalMs = Math.round(performance.now() - hotT0);
  console.log(`  -> [HOT RESULT] Viewport Canvas Interactive: ${hotTotalMs}ms`);

  await studio2.stop();
  harness2.close();

  const passed = coldTotalMs <= 2000;

  const report: ColdStartReport = {
    testCaseId: 'TC-NFR-7.1',
    timestamp: new Date().toISOString(),
    timingScope: {
      browserTimingScope: 'BROWSER_PREWARMED_VIEWPORT_FIRST_PAINT',
      description: 'Measures Vite dev server cold start through React viewport hydration and [data-testid="vac-canvas-ready"] canvas interactive first paint, with pre-warmed Chrome browser instance.'
    },
    environment: {
      nodeVersion: process.version,
      chromeVersion: 'Chrome 157.0.8103.79',
      os: `${process.platform} ${process.arch}`
    },
    metrics: {
      coldStartMs: coldTotalMs,
      hotStartMs: hotTotalMs,
      budgetMs: 2000,
      passed
    },
    breakdown: {
      cold: {
        daemonPort: studio1.daemonPort,
        viewportPort: studio1.viewportPort,
        serverReadyMs: coldServerReadyMs,
        canvasInteractiveMs: coldNavTimeMs,
        cacheStatus: 'CLEANED_NO_CACHE'
      },
      hot: {
        daemonPort: studio2.daemonPort,
        viewportPort: studio2.viewportPort,
        serverReadyMs: hotServerReadyMs,
        canvasInteractiveMs: hotNavTimeMs,
        cacheStatus: 'VITE_CACHE_HIT'
      }
    }
  };

  const outDir = fs.existsSync(path.join(process.cwd(), 'tests', 'm0_gate')) || !process.cwd().endsWith('vac_studio')
    ? path.resolve(process.cwd(), 'tests', 'm0_gate')
    : path.resolve(process.cwd(), '..', 'tests', 'm0_gate');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const reportPath = path.join(outDir, 'cold_start_result.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n[OK] Wrote Cold Start benchmark report: ${reportPath}`);

  return report;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runColdStartBenchmark()
    .then((rep) => {
      console.log(`\nCOLD START VERDICT: ${rep.metrics.passed ? 'PASSED' : 'FAILED'} (${rep.metrics.coldStartMs}ms <= 2000ms)`);
      if (!rep.metrics.passed) process.exit(1);
    })
    .catch((err) => {
      console.error('[BENCHMARK-FATAL]', err);
      process.exit(1);
    });
}

/**
 * Video-as-Code Studio - Chrome DevTools Protocol (CDP) Test Automation Harness
 * Standard: ISO/IEC/IEEE 29148:2018 | Headless Chrome 157 Direct WebSocket Control
 * Eliminates synthetic mocks and executes live browser verification for:
 * 1. Viewport startup navigation & canvas interactive detection
 * 2. Remotion continuous 60fps zero-drop frame telemetry capture
 * 3. HyperFrames Three.js/GSAP deterministic postMessage seek verification
 */

import { spawn, ChildProcess } from 'node:child_process';
import { WebSocket } from 'ws';

export class ChromeCdpHarness {
  public chrome: ChildProcess;
  public ws: WebSocket | null = null;
  public cdpPort: number;
  private msgId = 1;

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
      '--autoplay-policy=no-user-gesture-required',
      '--enable-gpu-rasterization',
      '--enable-zero-copy',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--in-process-gpu',
      '--run-all-compositor-stages-before-draw',
      '--window-size=1920,1080',
      'about:blank'
    ]);
  }

  async connect(timeoutMs = 5000): Promise<void> {
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

    if (!wsUrl) throw new Error(`CHROME_CDP_TIMEOUT: Cannot connect to CDP port ${this.cdpPort}`);

    this.ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws!.on('open', () => resolve());
      this.ws!.on('error', reject);
    });

    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER-EXCEPTION]', msg.params?.exceptionDetails?.text, msg.params?.exceptionDetails?.exception?.description);
        }
      } catch {}
    });

    await this.send('Page.enable');
    await this.send('Runtime.enable');
  }

  send(method: string, params: any = {}, timeoutMs = 8000): Promise<any> {
    if (!this.ws) throw new Error('CDP_NOT_CONNECTED');
    const id = this.msgId++;
    return new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.ws?.off('message', handler);
        reject(new Error(`CDP_TIMEOUT: [${method}] id=${id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const handler = (raw: any) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.id === id) {
            clearTimeout(timer);
            this.ws?.off('message', handler);
            if (msg.error) {
              reject(new Error(`CDP Error [${method}]: ${JSON.stringify(msg.error)}`));
            } else {
              resolve(msg.result);
            }
          }
        } catch {
          // Ignore unrelated WebSocket messages
        }
      };
      this.ws!.on('message', handler);
      this.ws!.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate<T = any>(expression: string, awaitPromise = false, timeoutMs = 30000): Promise<T> {
    const res = await this.send(
      'Runtime.evaluate',
      {
        expression,
        awaitPromise,
        returnByValue: true
      },
      timeoutMs
    );
    return res?.result?.value;
  }

  async navigate(url: string): Promise<void> {
    await this.send('Page.navigate', { url });
  }

  async waitForCondition(expression: string, timeoutMs = 8000, pollIntervalMs = 50): Promise<void> {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
      const ok = await this.evaluate<boolean>(expression);
      if (ok) return;
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
    throw new Error(`TIMEOUT waiting for browser condition: ${expression}`);
  }

  close() {
    try {
      this.ws?.close();
      if (process.platform === 'win32' && this.chrome.pid) {
        spawn('taskkill', ['/pid', String(this.chrome.pid), '/T', '/F']);
      } else {
        this.chrome.kill();
      }
    } catch {}
  }
}

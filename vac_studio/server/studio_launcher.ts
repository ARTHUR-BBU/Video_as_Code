/**
 * Video-as-Code Studio - Unified Studio Launcher
 * PRD §4.1 & NFR 7.1 Single-Command Studio Bootstrap (`npm run studio`)
 * Launches:
 * 1. VAC Studio Daemon (JSON-RPC 2.0 / WebSocket / Port Fallback [9720..9740])
 * 2. Vite Frontend SPA Server (Interactive Viewport on Port 8848)
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, ViteDevServer } from 'vite';
import { VacStudioDaemon } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const studioDir = path.resolve(__dirname, '..');

export interface StudioInstance {
  daemon: VacStudioDaemon;
  vite: ViteDevServer;
  daemonPort: number;
  viewportPort: number;
  viewportUrl: string;
  stop: () => Promise<void>;
}

export async function launchStudio(options: { daemonStartPort?: number; viewportPort?: number } = {}): Promise<StudioInstance> {
  const daemonStartPort = options.daemonStartPort ?? 9720;
  const viewportPort = options.viewportPort ?? 8848;

  const t0 = performance.now();
  console.log('='.repeat(70));
  console.log('Launching Video-as-Code Studio (PRD v2.1.2)');
  console.log('='.repeat(70));

  // Launch Daemon and Vite Server concurrently
  const daemon = new VacStudioDaemon();
  const [daemonInfo, vite] = await Promise.all([
    daemon.start({ startPort: daemonStartPort, endPort: 9740 }),
    createServer({
      configFile: false,
      root: studioDir,
      server: {
        port: viewportPort,
        strictPort: false,
        host: '127.0.0.1'
      },
      esbuild: {
        jsx: 'automatic'
      },
      optimizeDeps: {
        noDiscovery: true,
        holdUntilCrawlEnd: false,
        include: [
          'react',
          'react-dom',
          'react-dom/client',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'clsx',
          'tailwind-merge'
        ]
      }
    }).then(async (v) => {
      await v.listen();
      return v;
    })
  ]);

  console.log(`[STUDIO-BOOT] Daemon bound to port ${daemonInfo.port} (${daemonInfo.elapsedMs}ms)`);
  const address = vite.httpServer?.address();
  const boundViewportPort = typeof address === 'object' && address ? address.port : viewportPort;
  const viewportUrl = `http://127.0.0.1:${boundViewportPort}`;

  const elapsedTotal = Math.round(performance.now() - t0);
  console.log(`[STUDIO-BOOT] Viewport active at ${viewportUrl} (Total launch: ${elapsedTotal}ms)`);
  console.log('='.repeat(70));

  const stop = async () => {
    console.log('[STUDIO-SHUTDOWN] Stopping Studio services...');
    daemon.stop();
    await vite.close();
    console.log('[STUDIO-SHUTDOWN] Services stopped cleanly.');
  };

  return {
    daemon,
    vite,
    daemonPort: daemonInfo.port,
    viewportPort: boundViewportPort,
    viewportUrl,
    stop
  };
}

// Standalone execution entrypoint
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  launchStudio()
    .then((instance) => {
      const shutdown = async () => {
        await instance.stop();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
      console.error('[STUDIO-FATAL] Failed to launch studio:', err);
      process.exit(1);
    });
}

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { probeAndBindPort } from './port_prober.js';
import { attemptSceneMutation } from './ast_engine/guard.js';
import { parseAstToMotionIR } from './ast_engine/parser.js';

export interface VacDaemonConfig {
  startPort?: number;
  endPort?: number;
  host?: string;
}

export class VacStudioDaemon {
  public port = 0;
  public server: http.Server | null = null;
  public wss: WebSocketServer | null = null;
  public runtimePath = '';
  private wsClients = new Set<WebSocket>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  async start(config: VacDaemonConfig = {}) {
    const startPort = config.startPort ?? 9720;
    const endPort = config.endPort ?? 9740;
    const host = config.host ?? '127.0.0.1';

    // 1. Probe & Bind Port with Collision Detection (PRD §4.1)
    const probeResult = await probeAndBindPort(startPort, endPort, host, (req, res) => {
      this.handleHttpRequest(req, res);
    });

    this.server = probeResult.server;
    this.port = probeResult.port;
    this.runtimePath = probeResult.runtimePath;

    // 2. Attach WebSocket Server for RFC-VAC-WSS-01 JSON-RPC
    this.wss = new WebSocketServer({ server: this.server, path: '/rpc' });
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      this.handleWsConnection(ws, req);
    });

    // 3. Heartbeat Monitor
    this.heartbeatInterval = setInterval(() => {
      for (const client of this.wsClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      }
    }, 30000);

    // 4. Clean exit handling
    const cleanExit = () => {
      this.stop();
      process.exit(0);
    };
    process.once('SIGINT', cleanExit);
    process.once('SIGTERM', cleanExit);

    return {
      port: this.port,
      runtimePath: this.runtimePath,
      errorLog: probeResult.errorLog,
      elapsedMs: probeResult.elapsedMs
    };
  }

  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const client of this.wsClients) {
      client.close(1000, 'DAEMON_SHUTDOWN');
    }
    this.wsClients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    if (this.runtimePath && fs.existsSync(this.runtimePath)) {
      try {
        fs.unlinkSync(this.runtimePath);
        console.log(`[VAC-DAEMON] Cleaned lockfile: ${this.runtimePath}`);
      } catch {
        // Ignored during shutdown
      }
    }
  }

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    // Universal CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    // Endpoint 1: Handshake Probe (PRD §4.2 Contract)
    if (url.pathname === '/api/handshake') {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          service: 'vac-studio-daemon',
          status: 'READY',
          version: '1.0.0',
          port: this.port,
          pid: process.pid,
          protocol: 'RFC-VAC-WSS-01',
          uptime: process.uptime(),
          timestamp: Date.now()
        })
      );
      return;
    }

    // Endpoint 2: System Status
    if (url.pathname === '/api/status') {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          service: 'vac-studio-daemon',
          status: 'HEALTHY',
          port: this.port,
          pid: process.pid,
          uptime: process.uptime(),
          activeWsConnections: this.wsClients.size,
          workspace: process.cwd()
        })
      );
      return;
    }

    // Endpoint 3: Project Metadata
    if (url.pathname === '/api/project/metadata') {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          projectId: 'vac_studio_core',
          name: 'Video-as-Code Studio Engine',
          version: '1.0.0',
          canvas: {
            width: 1920,
            height: 1080,
            fps: 60,
            durationInFrames: 900,
            colorSpace: 'bt709'
          },
          clock: {
            masterType: 'web-audio-hardware-crystal',
            bpm: 120,
            pace: 'calm'
          },
          status: 'LOADED'
        })
      );
      return;
    }

    // Fallback 404
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'NOT_FOUND', path: url.pathname }));
  }

  private handleWsConnection(ws: WebSocket, _req: http.IncomingMessage) {
    this.wsClients.add(ws);
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[VAC-WS] Client connected: ${clientId} (Total active: ${this.wsClients.size})`);

    ws.on('message', (rawMessage: string) => {
      try {
        const payload = JSON.parse(rawMessage.toString());
        this.handleJsonRpc(ws, payload, clientId);
      } catch (err: any) {
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error', data: err.message },
            id: null
          })
        );
      }
    });

    ws.on('close', () => {
      this.wsClients.delete(ws);
      console.log(`[VAC-WS] Client disconnected: ${clientId} (Remaining active: ${this.wsClients.size})`);
    });

    // Send initial connection welcome banner
    ws.send(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'daemon.connected',
        params: {
          clientId,
          serverVersion: '1.0.0',
          activePort: this.port,
          pid: process.pid,
          time: Date.now()
        }
      })
    );
  }

  private handleJsonRpc(ws: WebSocket, msg: any, clientId: string) {
    const { id, method, params } = msg;

    if (!method) {
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid Request: method is missing' },
          id: id ?? null
        })
      );
      return;
    }

    switch (method) {
      case 'ping':
        ws.send(JSON.stringify({ jsonrpc: '2.0', result: 'pong', id, timestamp: Date.now() }));
        break;

      case 'handshake':
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            result: {
              status: 'ESTABLISHED',
              clientId,
              serverVersion: '1.0.0',
              capabilities: ['ast-sync', 'diff-view', 'telemetry-hud', 'earshot-mix']
            },
            id
          })
        );
        break;

      case 'project.getMetadata':
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            result: {
              projectId: 'vac_studio_core',
              name: 'Video-as-Code Studio',
              fps: 60,
              durationInFrames: 900,
              resolution: [1920, 1080],
              bpm: 120
            },
            id
          })
        );
        break;

      case 'timeline.getMotionIR': {
        const targetPath = params?.targetFile || path.resolve(process.cwd(), 'src', 'acts', 'Act1.tsx');
        try {
          const result = parseAstToMotionIR(targetPath);
          ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              result: {
                status: 'SUCCESS',
                scenes: result.scenes,
                totalNodes: result.rawNodeCount
              },
              id
            })
          );
        } catch (err: any) {
          ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32000, message: err.message },
              id
            })
          );
        }
        break;
      }

      case 'timeline.mutateSceneDuration': {
        const { sceneId, newDurationInFrames, targetFile } = params ?? {};
        if (!sceneId || typeof sceneId !== 'string') {
          ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Invalid params: sceneId is required and must be a string' },
              id
            })
          );
          break;
        }

        const durationNum = Number(newDurationInFrames);
        if (typeof newDurationInFrames === 'undefined' || isNaN(durationNum) || durationNum <= 0 || !Number.isInteger(durationNum)) {
          ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Invalid params: newDurationInFrames must be a strictly positive integer' },
              id
            })
          );
          break;
        }

        const targetPath = targetFile || path.resolve(process.cwd(), 'tests', 'fixtures', 'ast_sample_act1.tsx');

        attemptSceneMutation(targetPath, sceneId, durationNum)
          .then((res) => {
            ws.send(
              JSON.stringify({
                jsonrpc: '2.0',
                result: {
                  status: res.code,
                  success: res.success,
                  blocked: res.blocked,
                  ownership: res.ownership,
                  isReadOnly: res.isReadOnly,
                  warningMessage: res.warningMessage,
                  bytesModified: res.bytesModified,
                  sceneId: res.sceneId,
                  duration: res.duration
                },
                id
              })
            );
          })
          .catch((err: any) => {
            ws.send(
              JSON.stringify({
                jsonrpc: '2.0',
                error: { code: -32000, message: err.message },
                id
              })
            );
          });
        break;
      }

      default:
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id
          })
        );
    }
  }
}

// Standalone execution entry
if (process.argv[1] && process.argv[1].endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const daemon = new VacStudioDaemon();
  daemon.start().then((info) => {
    console.log(`[VAC-DAEMON] VAC Studio Daemon is live on port ${info.port} (PID ${process.pid})`);
  }).catch((err) => {
    console.error(`[VAC-DAEMON-ERROR] Failed to start:`, err);
    process.exit(1);
  });
}

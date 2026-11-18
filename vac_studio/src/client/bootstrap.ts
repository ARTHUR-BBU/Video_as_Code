/**
 * Video-as-Code Studio - Client Bootstrap & Port Discovery
 * Implements PRD §4.2 Concurrent Multi-Port Probing Protocol (TC-NET-02)
 * Discovers the active VAC Studio Daemon in the range [9720..9740] within <= 150ms budget.
 */

export interface DaemonHandshakeResponse {
  service: string;
  status: 'READY' | 'BUSY';
  port: number;
  pid: number;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

export interface DiscoveryResult {
  port: number;
  httpBase: string;
  wsEndpoint: string;
  latencyMs: number;
  metadata: DaemonHandshakeResponse;
}

export type ProberState = 'IDLE' | 'PROBING' | 'CONNECTED' | 'FAILED';

export class DaemonDiscovery {
  private static cachedResult: DiscoveryResult | null = null;

  /**
   * Probe a single candidate port via /api/handshake
   */
  private static async probePort(port: number, timeoutMs = 150): Promise<DiscoveryResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = performance.now();

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/handshake`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as DaemonHandshakeResponse;
      if (data.service === 'vac-studio-daemon' && data.status === 'READY') {
        const latencyMs = Math.round(performance.now() - start);
        return {
          port,
          httpBase: `http://127.0.0.1:${port}`,
          wsEndpoint: `ws://127.0.0.1:${port}/rpc`,
          latencyMs,
          metadata: data
        };
      }
      throw new Error('INVALID_SERVICE_SIGNATURE');
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * Concurrently discover active daemon across range [9720..9740] in 5-port chunks
   */
  public static async discover(
    startPort = 9720,
    endPort = 9740,
    batchTimeoutMs = 150
  ): Promise<DiscoveryResult> {
    // Return cache if still responsive
    if (this.cachedResult) {
      try {
        const ping = await this.probePort(this.cachedResult.port, 100);
        return (this.cachedResult = ping);
      } catch {
        this.cachedResult = null;
      }
    }

    const candidatePorts = Array.from(
      { length: endPort - startPort + 1 },
      (_, i) => startPort + i
    );

    const startTime = performance.now();

    // Probe in concurrent batches of 5 (e.g. [9720..9724], [9725..9729]...)
    for (let i = 0; i < candidatePorts.length; i += 5) {
      const batch = candidatePorts.slice(i, i + 5);
      const probePromises = batch.map((p) => this.probePort(p, batchTimeoutMs));

      try {
        const winner = await Promise.any(probePromises);
        winner.latencyMs = Math.round(performance.now() - startTime);
        this.cachedResult = winner;
        return winner;
      } catch {
        // Continue to next batch
      }
    }

    throw new Error(`VAC Daemon could not be found within ports ${startPort}..${endPort}`);
  }
}

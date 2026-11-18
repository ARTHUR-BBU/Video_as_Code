/**
 * Video-as-Code Studio - WebSocket JSON-RPC 2.0 Bridge
 * Handles duplex communication between SPA Viewport and Daemon.
 */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export type MessageListener = (notification: JsonRpcNotification) => void;
export type StateListener = (state: ConnectionState) => void;

export class VacRpcClient {
  private ws: WebSocket | null = null;
  private reqId = 1;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void; timer: any }>();
  private listeners: Set<MessageListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private state: ConnectionState = 'DISCONNECTED';
  private reconnectTimer: any = null;
  private endpoint = '';

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  public onNotification(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    for (const listener of this.stateListeners) {
      try {
        listener(newState);
      } catch (err) {
        console.error('[VAC-RPC] State listener error:', err);
      }
    }
  }

  public connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    this.setState('CONNECTING');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.endpoint);

        this.ws.onopen = async () => {
          this.setState('CONNECTED');
          try {
            // Perform protocol handshake
            await this.call('handshake', { clientType: 'vac-studio-spa' });
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if ('id' in data && data.id !== undefined) {
              // RPC Response
              const pending = this.pendingRequests.get(data.id);
              if (pending) {
                clearTimeout(pending.timer);
                this.pendingRequests.delete(data.id);
                if (data.error) {
                  pending.reject(new Error(data.error.message || 'RPC_ERROR'));
                } else {
                  pending.resolve(data.result);
                }
              }
            } else if ('method' in data) {
              // Notification / Event
              for (const listener of this.listeners) {
                try {
                  listener(data as JsonRpcNotification);
                } catch (err) {
                  console.error('[VAC-RPC] Notification listener error:', err);
                }
              }
            }
          } catch (parseErr) {
            console.error('[VAC-RPC] Failed to parse incoming frame:', parseErr);
          }
        };

        this.ws.onclose = () => {
          this.setState('DISCONNECTED');
          this.scheduleReconnect();
        };

        this.ws.onerror = (err) => {
          console.error('[VAC-RPC] Socket error:', err);
          if (this.state === 'CONNECTING') {
            reject(err);
          }
        };
      } catch (err) {
        this.setState('DISCONNECTED');
        reject(err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.setState('RECONNECTING');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => this.scheduleReconnect());
    }, 2000);
  }

  public call<T = any>(method: string, params?: any, timeoutMs = 5000): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('SOCKET_NOT_CONNECTED'));
    }

    const id = this.reqId++;
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`RPC_TIMEOUT (${method})`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.ws!.send(JSON.stringify(payload));
    });
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState('DISCONNECTED');
  }
}

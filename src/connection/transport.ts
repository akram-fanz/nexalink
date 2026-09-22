import { WebSocket } from 'ws';
import type { TransportAdapter, TransportListener } from '../connection/types.js';

export interface WebSocketTransportOptions {
  readonly connectTimeoutMs: number;
}

export class WebSocketTransport implements TransportAdapter {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly options: WebSocketTransportOptions;
  private _isOpen = false;

  constructor(url: string, options: WebSocketTransportOptions) {
    this.url = url;
    this.options = options;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const timer = setTimeout(() => {
        cleanup();
        ws.terminate();
        reject(new Error(`WebSocket connect timeout after ${this.options.connectTimeoutMs}ms`));
      }, this.options.connectTimeoutMs);

      const onOpen = () => {
        this._isOpen = true;
        cleanup();
        resolve();
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        clearTimeout(timer);
        ws.off('open', onOpen);
        ws.off('error', onError);
      };

      ws.once('open', onOpen);
      ws.once('error', onError);
    });
  }

  async disconnect(): Promise<void> {
    if (!this.ws) return;
    if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.terminate();
    }
    this._isOpen = false;
    this.ws = null;
  }

  async send(data: Uint8Array): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.ws.send(data);
  }

  on(event: 'open' | 'close' | 'error' | 'message', listener: TransportListener): () => void {
    if (!this.ws) {
      throw new Error('Transport not initialized');
    }

    const wrapped = (data?: unknown) => {
      if (event === 'message' && data instanceof Buffer) {
        (listener as (data: Uint8Array) => void | Promise<void>)(new Uint8Array(data));
        return;
      }
      if (event === 'error' && data instanceof Error) {
        (listener as (error: Error) => void | Promise<void>)(data);
        return;
      }
      (listener as () => void | Promise<void>)();
    };

    this.ws.on(event, wrapped);
    return () => this.ws?.off(event, wrapped);
  }
}

export function createWebSocketTransport(url: string): TransportAdapter {
  return new WebSocketTransport(url, { connectTimeoutMs: 30_000 });
}

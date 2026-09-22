/**
 * Transport-agnostic connection state.
 * The actual transport (ws WebSocket, mock, test double) implements TransportAdapter.
 */
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'disconnecting'
  | 'disconnected'
  | 'failed';

export interface TransportAdapter {
  readonly isOpen: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  on(event: 'open' | 'close' | 'error' | 'message', listener: TransportListener): () => void;
}

export type TransportListener =
  | (() => void | Promise<void>)
  | ((data: Uint8Array) => void | Promise<void>)
  | ((error: Error) => void | Promise<void>);

export interface BackoffOptions {
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly maxAttempts: number;
}

export interface ConnectionManagerOptions {
  readonly serverUrl: string;
  readonly timeoutMs: number;
  readonly reconnect: boolean;
  readonly backoff: BackoffOptions;
  readonly createTransport: (url: string) => TransportAdapter;
}

export interface ConnectionStateTransition {
  readonly previous: ConnectionState;
  readonly current: ConnectionState;
  readonly reason?: string;
}

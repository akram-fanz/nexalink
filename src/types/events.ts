/**
 * Connection lifecycle states.
 * `connected` is only emitted after the handshake is verified.
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

export interface ConnectionUpdateEvent {
  readonly state: ConnectionState;
  readonly previousState: ConnectionState;
  readonly reason?: string;
}

export interface AuthUpdateEvent {
  readonly qr?: string;
  readonly pairingCode?: string;
  readonly sessionLoaded: boolean;
}

export interface NexaErrorEvent {
  readonly name: string;
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

export interface MessageEvent {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly text?: string;
  readonly timestamp?: number;
}

export interface NexaEventMap {
  'connection.update': ConnectionUpdateEvent;
  'auth.update': AuthUpdateEvent;
  message: MessageEvent;
  error: NexaErrorEvent;
}

export type NexaEventName = keyof NexaEventMap;

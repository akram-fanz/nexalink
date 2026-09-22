import { EventEmitter } from 'node:events';
import { calculateBackoff } from '../utils/backoff.js';
import { ConnectionError, TimeoutError } from '../errors/index.js';
import type { NexaLogger } from '../logger.js';
import { ConnectionStateMachine } from './state.js';
import type {
  ConnectionManagerOptions,
  ConnectionState,
  ConnectionStateTransition,
  TransportAdapter,
} from './types.js';

export interface ConnectionManagerEvents {
  transition: ConnectionStateTransition;
  error: Error;
}

export class ConnectionManager {
  private readonly stateMachine: ConnectionStateMachine;
  private readonly options: ConnectionManagerOptions;
  private readonly logger: NexaLogger;
  private readonly events = new EventEmitter();
  private transport: TransportAdapter | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectingPromise: Promise<void> | null = null;
  private disconnectingPromise: Promise<void> | null = null;
  private cleanupFns: Array<() => void> = [];

  constructor(options: ConnectionManagerOptions, logger: NexaLogger) {
    this.options = options;
    this.logger = logger;
    this.stateMachine = new ConnectionStateMachine();
  }

  get state(): ConnectionState {
    return this.stateMachine.state;
  }

  get isConnected(): boolean {
    return this.transport?.isOpen ?? false;
  }

  on<K extends keyof ConnectionManagerEvents>(
    event: K,
    listener: (payload: ConnectionManagerEvents[K]) => void,
  ): () => void {
    this.events.on(event, listener);
    return () => this.events.off(event, listener);
  }

  async connect(): Promise<void> {
    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    if (this.state !== 'idle' && this.state !== 'disconnected' && this.state !== 'failed') {
      throw new ConnectionError(`Already in state ${this.state}`, {
        metadata: { state: this.state },
      });
    }

    this.connectingPromise = this.performConnect();
    try {
      await this.connectingPromise;
    } finally {
      this.connectingPromise = null;
    }
  }

  private async performConnect(): Promise<void> {
    this.stateMachine.transition('connecting', 'user.connect');
    this.emitTransition();

    while (true) {
      try {
        await this.attemptConnection();
        this.reconnectAttempt = 0;
        return;
      } catch (error) {
        this.logger.error('Connection attempt failed', { error });

        if (!this.options.reconnect) {
          this.stateMachine.transition('failed', 'reconnect.disabled');
          this.emitTransition();
          throw error;
        }

        this.reconnectAttempt += 1;
        if (this.reconnectAttempt > this.options.backoff.maxAttempts) {
          this.stateMachine.transition('failed', 'max.reconnect.attempts');
          this.emitTransition();
          throw new ConnectionError('Max reconnect attempts reached', {
            cause: error,
            metadata: { attempts: this.reconnectAttempt },
          });
        }

        this.stateMachine.transition('reconnecting', 'connection.failed');
        this.emitTransition();

        const delay = calculateBackoff(
          this.reconnectAttempt,
          this.options.backoff.baseDelayMs,
          this.options.backoff.maxDelayMs,
        );

        this.logger.info('Scheduling reconnect', {
          attempt: this.reconnectAttempt,
          delayMs: delay,
        });
        await this.sleep(delay);
        this.stateMachine.transition('connecting', 'reconnect.retry');
        this.emitTransition();
      }
    }
  }

  private async attemptConnection(): Promise<void> {
    const transport = this.options.createTransport(this.options.serverUrl);
    this.transport = transport;

    this.cleanupFns.push(
      transport.on('open', async () => {
        this.logger.debug('Transport opened');
        if (this.stateMachine.state === 'connecting') {
          this.stateMachine.transition('authenticating', 'transport.open');
          this.emitTransition();
        }
      }),
    );

    this.cleanupFns.push(
      transport.on('message', async () => {
        // PHASE 4: handle protocol messages
      }),
    );

    this.cleanupFns.push(
      transport.on('close', async () => {
        this.logger.warn('Transport closed unexpectedly');
        if (this.stateMachine.state === 'connected') {
          this.stateMachine.transition('reconnecting', 'transport.close');
          this.emitTransition();
        }
      }),
    );

    this.cleanupFns.push(
      transport.on('error', async (err: Error) => {
        this.logger.error('Transport error', { error: err });
        this.events.emit('error', err);
      }),
    );

    await this.withTimeout(transport.connect(), this.options.timeoutMs, 'connect');

    // In PHASE 3 we do not perform the real WhatsApp handshake.
    // Instead we allow tests to push the state to 'connected' externally.
  }

  async markConnected(): Promise<void> {
    if (this.stateMachine.state === 'authenticating') {
      this.stateMachine.transition('connected', 'auth.success');
      this.emitTransition();
    }
  }

  async disconnect(): Promise<void> {
    if (this.disconnectingPromise) {
      return this.disconnectingPromise;
    }

    if (this.stateMachine.isTerminal()) {
      return;
    }

    this.disconnectingPromise = this.performDisconnect();
    try {
      await this.disconnectingPromise;
    } finally {
      this.disconnectingPromise = null;
    }
  }

  private async performDisconnect(): Promise<void> {
    const current = this.stateMachine.state;
    if (current === 'idle' || current === 'disconnected') {
      return;
    }

    this.clearReconnectTimer();

    if (current !== 'disconnecting') {
      this.stateMachine.transition('disconnecting', 'user.disconnect');
      this.emitTransition();
    }

    await this.cleanupTransport();

    if (this.stateMachine.state !== 'disconnected') {
      this.stateMachine.transition('disconnected', 'transport.closed');
      this.emitTransition();
    }
  }

  private async cleanupTransport(): Promise<void> {
    for (const fn of this.cleanupFns) {
      fn();
    }
    this.cleanupFns = [];

    if (this.transport) {
      try {
        await this.transport.disconnect();
      } catch (error) {
        this.logger.warn('Error while disconnecting transport', { error });
      }
      this.transport = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emitTransition(): void {
    const transition = this.stateMachine.transitions[this.stateMachine.transitions.length - 1];
    if (transition) {
      this.events.emit('transition', transition);
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new TimeoutError(`Connection ${operation} timed out after ${ms}ms`, {
            metadata: { operation, timeoutMs: ms },
          }),
        );
      }, ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.reconnectTimer = setTimeout(resolve, ms);
    });
  }
}

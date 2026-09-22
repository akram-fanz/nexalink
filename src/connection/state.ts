import type { ConnectionState, ConnectionStateTransition } from './types.js';
import { ConnectionError, ProtocolError } from '../errors/index.js';

type TransitionGuard = Readonly<Record<ConnectionState, ReadonlyArray<ConnectionState>>>;

const ALLOWED_TRANSITIONS: TransitionGuard = {
  idle: ['connecting'],
  connecting: ['authenticating', 'reconnecting', 'disconnecting', 'disconnected', 'failed'],
  authenticating: ['connected', 'reconnecting', 'disconnecting', 'disconnected', 'failed'],
  connected: ['disconnecting', 'reconnecting', 'disconnected', 'failed'],
  reconnecting: ['connecting', 'disconnecting', 'disconnected', 'failed'],
  disconnecting: ['disconnected', 'failed'],
  disconnected: ['connecting'],
  failed: ['connecting'],
};

export class ConnectionStateMachine {
  private current: ConnectionState = 'idle';
  private history: ConnectionStateTransition[] = [];

  get state(): ConnectionState {
    return this.current;
  }

  get transitions(): ReadonlyArray<ConnectionStateTransition> {
    return this.history;
  }

  transition(to: ConnectionState, reason?: string): ConnectionStateTransition {
    const allowed = ALLOWED_TRANSITIONS[this.current];
    if (!allowed.includes(to)) {
      throw new ConnectionError(
        `Invalid connection state transition from ${this.current} to ${to}`,
        {
          metadata: { from: this.current, to, reason },
        },
      );
    }

    const transition: ConnectionStateTransition = {
      previous: this.current,
      current: to,
      reason,
    };
    this.history.push(transition);
    this.current = to;
    return transition;
  }

  assert(expected: ConnectionState, operation: string): void {
    if (this.current !== expected) {
      throw new ProtocolError(`Cannot ${operation} while in state ${this.current}`, {
        metadata: { expected, actual: this.current },
      });
    }
  }

  isTerminal(): boolean {
    return this.current === 'disconnected' || this.current === 'failed';
  }
}

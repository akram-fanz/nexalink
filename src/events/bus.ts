import { EventEmitter } from 'node:events';
import type { NexaEventMap, NexaEventName } from '../types/events.js';
import { createLogger, type NexaLogger } from '../logger.js';

type Listener<T> = (payload: T) => void | Promise<void>;

/**
 * Typed event bus with error isolation.
 *
 * Behavior:
 * - Listeners are snapshotted via rawListeners at emit time.
 * - `once` wrappers still self-remove because rawListeners keeps EventEmitter wrappers.
 * - A throwing listener (sync or async) is logged and does not block remaining listeners.
 * - emit() awaits all listeners that were present at snapshot time.
 */
export class NexaEventBus {
  private readonly emitter = new EventEmitter();
  private readonly logger: NexaLogger;

  constructor(logger?: NexaLogger) {
    this.logger = logger ?? createLogger({ name: 'nexalink-events', level: 'warn' });
    this.emitter.setMaxListeners(50);
  }

  on<K extends NexaEventName>(event: K, listener: Listener<NexaEventMap[K]>): () => void {
    this.emitter.on(event, listener);
    return () => this.off(event, listener);
  }

  once<K extends NexaEventName>(event: K, listener: Listener<NexaEventMap[K]>): () => void {
    this.emitter.once(event, listener);
    return () => this.off(event, listener);
  }

  off<K extends NexaEventName>(event: K, listener: Listener<NexaEventMap[K]>): void {
    this.emitter.off(event, listener);
  }

  async emit<K extends NexaEventName>(event: K, payload: NexaEventMap[K]): Promise<void> {
    const listeners = [...this.emitter.rawListeners(event)] as Array<Listener<NexaEventMap[K]>>;

    await Promise.allSettled(
      listeners.map((listener) =>
        (async () => {
          try {
            await listener(payload);
          } catch (error) {
            this.logger.error('Event listener failed', {
              event,
              error,
            });
          }
        })(),
      ),
    );
  }

  removeAllListeners(event?: NexaEventName): void {
    if (event) {
      this.emitter.removeAllListeners(event);
      return;
    }
    this.emitter.removeAllListeners();
  }

  listenerCount(event: NexaEventName): number {
    return this.emitter.listenerCount(event);
  }
}

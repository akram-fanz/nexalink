import type { NexaClientConfig } from '../config.js';
import { NexaEventBus } from '../events/bus.js';
import { createLogger, type NexaLogger } from '../logger.js';
import type { ConnectionState, NexaEventMap, NexaEventName } from '../types/events.js';

export interface NexaClient {
  readonly config: NexaClientConfig;
  readonly state: ConnectionState;
  on<K extends NexaEventName>(
    event: K,
    listener: (payload: NexaEventMap[K]) => void | Promise<void>,
  ): () => void;
  once<K extends NexaEventName>(
    event: K,
    listener: (payload: NexaEventMap[K]) => void | Promise<void>,
  ): () => void;
  off<K extends NexaEventName>(
    event: K,
    listener: (payload: NexaEventMap[K]) => void | Promise<void>,
  ): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  logout(): Promise<void>;
  sendMessage(to: string, options: unknown): Promise<{ readonly id: string }>;
}

export interface NexaClientBaseDeps {
  readonly events: NexaEventBus;
  readonly logger: NexaLogger;
}

export class NexaClientCore {
  readonly config: NexaClientConfig;
  readonly events: NexaEventBus;
  readonly logger: NexaLogger;

  constructor(config: NexaClientConfig, deps: NexaClientBaseDeps) {
    this.config = config;
    this.events = deps.events;
    this.logger = deps.logger;
  }

  on<K extends NexaEventName>(
    event: K,
    listener: (payload: NexaEventMap[K]) => void | Promise<void>,
  ): () => void {
    return this.events.on(event, listener);
  }

  once<K extends NexaEventName>(
    event: K,
    listener: (payload: NexaEventMap[K]) => void | Promise<void>,
  ): () => void {
    return this.events.once(event, listener);
  }

  off<K extends NexaEventName>(
    event: K,
    listener: (payload: NexaEventMap[K]) => void | Promise<void>,
  ): void {
    this.events.off(event, listener);
  }

  async connect(): Promise<void> {
    throw new Error('Not implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Not implemented');
  }

  async logout(): Promise<void> {
    throw new Error('Not implemented');
  }

  async sendMessage(_to: string, _options: unknown): Promise<{ readonly id: string }> {
    throw new Error('Not implemented');
  }
}

export function createBaseDependencies(config: NexaClientConfig): NexaClientBaseDeps {
  const logger = createLogger({
    level: config.logLevel,
    name: config.loggerName,
  });
  return {
    logger,
    events: new NexaEventBus(logger),
  };
}

import type { NexaClientConfig } from '../config.js';
import { ConfigurationError } from '../errors/index.js';
import { NexaEventBus } from '../events/bus.js';
import type { NexaLogger } from '../logger.js';
import type { NexaClient } from './core.js';

/**
 * PHASE 2 stub client used when the library is imported in unit-test-only mode.
 * connect() is intentionally unsupported.
 */
export class NexaClientStub implements NexaClient {
  readonly config: NexaClientConfig;
  private currentState: import('../types/events.js').ConnectionState = 'idle';
  private readonly events: NexaEventBus;
  private readonly logger: NexaLogger;

  constructor(config: NexaClientConfig, logger: NexaLogger) {
    this.config = config;
    this.logger = logger;
    this.events = new NexaEventBus(logger);
  }

  get state(): import('../types/events.js').ConnectionState {
    return this.currentState;
  }

  on: NexaClient['on'] = (event, listener) => this.events.on(event, listener);
  once: NexaClient['once'] = (event, listener) => this.events.once(event, listener);
  off: NexaClient['off'] = (event, listener) => this.events.off(event, listener);

  async connect(): Promise<void> {
    throw new ConfigurationError('Connection is not implemented in PHASE 2. Wait for PHASE 3.', {
      metadata: { phase: 2, feature: 'connect' },
    });
  }

  async disconnect(): Promise<void> {
    if (this.currentState === 'idle' || this.currentState === 'disconnected') {
      return;
    }
    const previousState = this.currentState;
    this.currentState = 'disconnecting';
    await this.events.emit('connection.update', {
      state: this.currentState,
      previousState,
      reason: 'client.disconnect',
    });
    this.currentState = 'disconnected';
    await this.events.emit('connection.update', {
      state: this.currentState,
      previousState: 'disconnecting',
    });
    this.logger.info('Client disconnected');
  }

  async logout(): Promise<void> {
    await this.disconnect();
    this.logger.info('Logout requested; session cleanup is planned for PHASE 3');
  }

  async sendMessage(): Promise<{ readonly id: string }> {
    throw new ConfigurationError(
      'Messaging is not available on the stub client. Use createClient().',
      { metadata: { phase: 2, feature: 'sendMessage' } },
    );
  }
}

import type { NexaClientConfig } from '../config.js';
import { ConfigurationError } from '../errors/index.js';
import { ConnectionManager } from '../connection/manager.js';
import { createWebSocketTransport } from '../connection/transport.js';
import type { NexaEventBus } from '../events/bus.js';
import type { NexaLogger } from '../logger.js';
import { StubAuthProvider } from '../auth/provider.js';
import { createFileSessionStore, type SessionStore } from '../auth/session.js';
import { MessageService } from '../messaging/service.js';
import type { ConnectionState } from '../types/events.js';
import type { NexaClient, NexaClientBaseDeps } from './core.js';

const WHATSAPP_WEB_WS_URL = 'wss://web.whatsapp.com/ws/chat';

export async function buildPhase3Client(
  config: NexaClientConfig,
  base: NexaClientBaseDeps,
): Promise<NexaClient> {
  const connection = new ConnectionManager(
    {
      serverUrl: WHATSAPP_WEB_WS_URL,
      timeoutMs: config.connectionTimeoutMs,
      reconnect: config.reconnect,
      backoff: {
        baseDelayMs: config.retryBaseDelayMs,
        maxDelayMs: 60_000,
        maxAttempts: config.maxReconnectAttempts,
      },
      createTransport: createWebSocketTransport,
    },
    base.logger,
  );

  const sessionStore = createFileSessionStore(config, base.logger);
  const authProvider = new StubAuthProvider(base.logger);
  const messaging = new MessageService({
    send: async () => {
      /* stub: implement in PHASE 5 when we have real protocol */
    },
    logger: base.logger,
  });

  return new NexaClientPhase3(config, base, connection, sessionStore, authProvider, messaging);
}

class NexaClientPhase3 implements NexaClient {
  readonly config: NexaClientConfig;
  private readonly logger: NexaLogger;
  private readonly events: NexaEventBus;
  private readonly connection: ConnectionManager;
  private readonly sessionStore: SessionStore;
  private readonly authProvider: StubAuthProvider;
  private readonly messaging: MessageService;
  private disposed = false;

  constructor(
    config: NexaClientConfig,
    base: NexaClientBaseDeps,
    connection: ConnectionManager,
    sessionStore: SessionStore,
    authProvider: StubAuthProvider,
    messaging: MessageService,
  ) {
    this.config = config;
    this.logger = base.logger;
    this.events = base.events;
    this.connection = connection;
    this.sessionStore = sessionStore;
    this.authProvider = authProvider;
    this.messaging = messaging;

    this.connection.on('transition', (transition) => {
      this.events.emit('connection.update', {
        state: transition.current,
        previousState: transition.previous,
        reason: transition.reason,
      });
    });

    this.messaging.onMessage(async (message) => {
      await this.events.emit('message', {
        id: message.id,
        from: message.from,
        to: message.to,
        text: message.text,
        timestamp: message.timestamp,
      });
    });
  }

  get state(): ConnectionState {
    return this.connection.state;
  }

  on: NexaClient['on'] = (event, listener) => this.events.on(event, listener);
  once: NexaClient['once'] = (event, listener) => this.events.once(event, listener);
  off: NexaClient['off'] = (event, listener) => this.events.off(event, listener);

  async connect(): Promise<void> {
    if (this.disposed) {
      throw new ConfigurationError('Client has been disposed');
    }

    const existingSession = await this.sessionStore.load();
    const restored = await this.authProvider.restore(existingSession);

    if (restored) {
      this.logger.info('Restored session', {
        deviceId: restored.deviceId,
        sessionName: this.config.sessionName,
      });
    } else {
      await this.authProvider.authenticate();
      this.events.emit('auth.update', {
        sessionLoaded: false,
        pairingCode: 'STUB-CODE',
      });
    }

    await this.connection.connect();
  }

  async disconnect(): Promise<void> {
    await this.connection.disconnect();
  }

  async logout(): Promise<void> {
    await this.disconnect();
    await this.sessionStore.destroy();
    this.logger.info('Session destroyed');
  }

  async sendMessage(to: string, options: unknown): Promise<{ readonly id: string }> {
    if (this.disposed) {
      throw new ConfigurationError('Client has been disposed');
    }
    const message = await this.messaging.sendText(to, options);
    return { id: message.id };
  }
}

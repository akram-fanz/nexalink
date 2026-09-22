import type { NexaLogger } from '../logger.js';
import type { SessionData } from './session.js';

export interface AuthCredentials {
  readonly clientId: string;
  readonly clientToken: string;
  readonly serverToken: string;
  readonly deviceId: string;
}

export interface AuthProvider {
  /**
   * Begin the authentication flow. For PHASE 3 this emits pairing/QR needs via the client event bus.
   */
  authenticate(): Promise<AuthCredentials>;
  /**
   * Restore credentials from session data, returning null if invalid/missing.
   */
  restore(session: SessionData): Promise<AuthCredentials | null>;
  /**
   * Convert credentials to session data for persistence.
   */
  serialize(credentials: AuthCredentials): SessionData;
}

/**
 * PHASE 3 placeholder: does not implement real WhatsApp pairing/QR protocol.
 * It only validates the shape of credentials and returns a deterministic stub.
 */
export class StubAuthProvider implements AuthProvider {
  private readonly logger: NexaLogger;

  constructor(logger: NexaLogger) {
    this.logger = logger;
  }

  async authenticate(): Promise<AuthCredentials> {
    this.logger.info('Stub authentication started; real QR/pairing is PHASE 4+');
    return {
      clientId: 'stub-client-id',
      clientToken: 'stub-client-token',
      serverToken: 'stub-server-token',
      deviceId: 'stub-device-id',
    };
  }

  async restore(session: SessionData): Promise<AuthCredentials | null> {
    if (!session.clientToken || !session.serverToken || !session.deviceId) {
      return null;
    }
    return {
      clientId: session.identityKeyPair?.publicKey ?? 'stub-client-id',
      clientToken: session.clientToken,
      serverToken: session.serverToken,
      deviceId: session.deviceId,
    };
  }

  serialize(credentials: AuthCredentials): SessionData {
    return {
      clientToken: credentials.clientToken,
      serverToken: credentials.serverToken,
      deviceId: credentials.deviceId,
      lastUsedAt: new Date().toISOString(),
    };
  }
}

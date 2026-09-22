import { UnsupportedFeatureError } from '../errors/index.js';
import type { NexaLogger } from '../logger.js';

export class PresenceService {
  private readonly logger: NexaLogger;

  constructor(logger: NexaLogger) {
    this.logger = logger;
  }

  async sendTyping(_jid: string): Promise<void> {
    this.logger.debug('Presence simulation requested');
    throw new UnsupportedFeatureError('Presence updates require active WebSocket protocol session');
  }
}

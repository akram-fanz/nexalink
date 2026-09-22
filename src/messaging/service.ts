import type { NexaLogger } from '../logger.js';
import { ProtocolError } from '../errors/index.js';
import { normalizeMessage } from './model.js';
import { validateSendOptions } from './validator.js';
import type { NexaMessage } from './types.js';

export interface MessageServiceDeps {
  readonly send: (data: Uint8Array) => Promise<void>;
  readonly logger: NexaLogger;
}

export class MessageService {
  private readonly deps: MessageServiceDeps;
  private readonly listeners: Array<(msg: NexaMessage) => void | Promise<void>> = [];

  constructor(deps: MessageServiceDeps) {
    this.deps = deps;
  }

  async sendText(to: string, options: unknown): Promise<NexaMessage> {
    const validated = validateSendOptions(options);
    const message = normalizeMessage('stub-self@s.whatsapp.net', to, validated);

    const serialized = this.serializeStub(message);
    await this.deps.send(serialized);

    this.deps.logger.info('Message sent', {
      id: message.id,
      to: message.to,
      textLength: message.text?.length,
    });

    return message;
  }

  onMessage(listener: (msg: NexaMessage) => void | Promise<void>): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  async handleIncoming(binary: Uint8Array): Promise<void> {
    try {
      const message = this.parseStub(binary);
      this.deps.logger.debug('Message received', { id: message.id, from: message.from });

      await Promise.allSettled(this.listeners.map((fn) => Promise.resolve(fn(message))));
    } catch (error) {
      throw new ProtocolError('Failed to parse incoming message', { cause: error });
    }
  }

  private serializeStub(message: NexaMessage): Uint8Array {
    const json = JSON.stringify(message);
    return new TextEncoder().encode(json);
  }

  private parseStub(binary: Uint8Array): NexaMessage {
    const text = new TextDecoder().decode(binary);
    const parsed = JSON.parse(text) as NexaMessage;
    if (!parsed.id || !parsed.from || !parsed.to) {
      throw new ProtocolError('Invalid message structure');
    }
    return parsed;
  }
}

import { ValidationError } from '../errors/index.js';
import type { NexaLogger } from '../logger.js';

export interface NexaContact {
  readonly id: string;
  readonly name?: string;
  readonly status?: string;
  readonly profilePictureUrl?: string;
}

export class ContactService {
  private readonly contacts = new Map<string, NexaContact>();
  private readonly logger: NexaLogger;

  constructor(logger: NexaLogger) {
    this.logger = logger;
  }

  upsert(contact: NexaContact): NexaContact {
    if (!contact.id || !contact.id.endsWith('@s.whatsapp.net')) {
      throw new ValidationError('Invalid contact ID format', { metadata: { id: contact.id } });
    }
    this.contacts.set(contact.id, contact);
    this.logger.debug('Contact upserted', { id: contact.id });
    return contact;
  }

  get(id: string): NexaContact | undefined {
    return this.contacts.get(id);
  }

  list(): ReadonlyArray<NexaContact> {
    return [...this.contacts.values()];
  }
}

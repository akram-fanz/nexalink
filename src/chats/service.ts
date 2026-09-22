import type { NexaLogger } from '../logger.js';

export interface NexaChat {
  readonly id: string;
  readonly unreadCount?: number;
  readonly lastMessageTimestamp?: number;
  readonly archived?: boolean;
  readonly pinned?: boolean;
}

export class ChatService {
  private readonly chats = new Map<string, NexaChat>();
  private readonly logger: NexaLogger;

  constructor(logger: NexaLogger) {
    this.logger = logger;
  }

  upsert(chat: NexaChat): NexaChat {
    this.chats.set(chat.id, chat);
    this.logger.debug('Chat upserted', { id: chat.id });
    return chat;
  }

  get(id: string): NexaChat | undefined {
    return this.chats.get(id);
  }

  list(): ReadonlyArray<NexaChat> {
    return [...this.chats.values()];
  }
}

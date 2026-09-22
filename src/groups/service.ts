import { ValidationError, UnsupportedFeatureError } from '../errors/index.js';
import type { NexaLogger } from '../logger.js';

export interface NexaGroup {
  readonly id: string;
  readonly subject: string;
  readonly participants: ReadonlyArray<string>;
  readonly owner?: string;
  readonly createdAt?: number;
}

export class GroupService {
  private readonly groups = new Map<string, NexaGroup>();
  private readonly logger: NexaLogger;

  constructor(logger: NexaLogger) {
    this.logger = logger;
  }

  upsert(group: NexaGroup): NexaGroup {
    if (!group.id || !group.id.endsWith('@g.us')) {
      throw new ValidationError('Invalid group ID format', { metadata: { id: group.id } });
    }
    this.groups.set(group.id, group);
    this.logger.debug('Group upserted', { id: group.id });
    return group;
  }

  get(id: string): NexaGroup | undefined {
    return this.groups.get(id);
  }

  list(): ReadonlyArray<NexaGroup> {
    return [...this.groups.values()];
  }

  async create(_options: { readonly subject: string; readonly participants: ReadonlyArray<string> }): Promise<NexaGroup> {
    throw new UnsupportedFeatureError('Group creation requires active WebSocket protocol session');
  }

  async addParticipant(_groupId: string, _participantId: string): Promise<void> {
    throw new UnsupportedFeatureError('Group mutation requires active WebSocket protocol session');
  }
}

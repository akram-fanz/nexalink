import { describe, expect, it } from 'vitest';
import { ChatService } from '../../src/chats/service.js';
import { ContactService } from '../../src/contacts/service.js';
import { GroupService } from '../../src/groups/service.js';
import { PresenceService } from '../../src/presence/service.js';
import { UnsupportedFeatureError, ValidationError } from '../../src/errors/index.js';
import { createLogger } from '../../src/logger.js';

const logger = createLogger({ level: 'silent' });

describe('GroupService', () => {
  it('upserts local group metadata', () => {
    const groups = new GroupService(logger);
    const group = groups.upsert({
      id: '123@g.us',
      subject: 'Nexa',
      participants: ['1@s.whatsapp.net'],
    });
    expect(groups.get('123@g.us')?.subject).toBe('Nexa');
    expect(groups.list()).toHaveLength(1);
    expect(group.participants).toEqual(['1@s.whatsapp.net']);
  });

  it('rejects invalid group ids', () => {
    const groups = new GroupService(logger);
    expect(() => groups.upsert({ id: 'not-a-group', subject: 'x' })).toThrow(ValidationError);
  });

  it('marks live mutations unsupported', async () => {
    const groups = new GroupService(logger);
    await expect(groups.create({ subject: 'x' })).rejects.toBeInstanceOf(UnsupportedFeatureError);
    await expect(groups.addParticipant('123@g.us', '1@s.whatsapp.net')).rejects.toBeInstanceOf(
      UnsupportedFeatureError,
    );
  });
});

describe('ContactService', () => {
  it('stores normalized contacts', () => {
    const contacts = new ContactService(logger);
    contacts.upsert({ id: '6281@s.whatsapp.net', name: 'Akram' });
    expect(contacts.get('6281@s.whatsapp.net')?.name).toBe('Akram');
    expect(contacts.list()).toHaveLength(1);
  });

  it('rejects invalid contact ids', () => {
    const contacts = new ContactService(logger);
    expect(() => contacts.upsert({ id: 'nope' })).toThrow(ValidationError);
  });
});

describe('ChatService', () => {
  it('tracks chat metadata locally', () => {
    const chats = new ChatService(logger);
    chats.upsert({ id: '6281@s.whatsapp.net', unreadCount: 2 });
    expect(chats.get('6281@s.whatsapp.net')?.unreadCount).toBe(2);
  });
});

describe('PresenceService', () => {
  it('does not fabricate presence protocol', async () => {
    const presence = new PresenceService(logger);
    await expect(presence.sendTyping('6281@s.whatsapp.net')).rejects.toBeInstanceOf(
      UnsupportedFeatureError,
    );
  });
});

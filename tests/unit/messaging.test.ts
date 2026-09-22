import { describe, expect, it } from 'vitest';
import { normalizeMessage, generateMessageId } from '../../src/messaging/model.js';
import { validateSendOptions } from '../../src/messaging/validator.js';
import { ValidationError } from '../../src/errors/index.js';

describe('Message Model', () => {
  it('generates unique message IDs', () => {
    const id1 = generateMessageId();
    const id2 = generateMessageId();
    expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('normalizes message with defaults', () => {
    const msg = normalizeMessage('user@s.whatsapp.net', 'contact@s.whatsapp.net', {
      text: 'hello',
    });
    expect(msg.type).toBe('text');
    expect(msg.text).toBe('hello');
    expect(msg.from).toBe('user@s.whatsapp.net');
    expect(msg.timestamp).toBeGreaterThan(0);
  });

  it('normalizes message with media', () => {
    const msg = normalizeMessage('user@s.whatsapp.net', 'contact@s.whatsapp.net', {
      text: 'photo',
      type: 'image',
      mediaUrl: 'https://example.com/photo.jpg',
      caption: 'Check it out',
    });
    expect(msg.type).toBe('image');
    expect(msg.mediaUrl).toBe('https://example.com/photo.jpg');
    expect(msg.caption).toBe('Check it out');
  });
});

describe('Send Options Validator', () => {
  it('accepts valid text message options', () => {
    const result = validateSendOptions({ text: 'hello' });
    expect(result.text).toBe('hello');
  });

  it('rejects empty text', () => {
    expect(() => validateSendOptions({ text: '' })).toThrow(ValidationError);
  });

  it('rejects text over 4096 chars', () => {
    expect(() => validateSendOptions({ text: 'x'.repeat(4097) })).toThrow(ValidationError);
  });

  it('accepts mentions array', () => {
    const result = validateSendOptions({
      text: 'hello',
      mentions: ['1234567890@s.whatsapp.net'],
    });
    expect(result.mentions).toHaveLength(1);
  });

  it('rejects invalid mentions', () => {
    expect(() =>
      validateSendOptions({ text: 'hello', mentions: ['invalid-format'] }),
    ).toThrow(ValidationError);
  });
});

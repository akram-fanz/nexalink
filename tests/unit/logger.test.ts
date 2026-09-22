import { describe, expect, it } from 'vitest';
import { createLogger, redactSensitiveData } from '../../src/logger.js';

describe('redactSensitiveData', () => {
  it('redacts secret keys in nested objects', () => {
    const result = redactSensitiveData({
      sessionName: 'bot',
      privateKey: 'super-secret',
      nested: { apiKey: 'k', phone: '6281' },
    }) as Record<string, unknown>;

    expect(result.sessionName).toBe('bot');
    expect(result.privateKey).toBe('[REDACTED]');
    expect((result.nested as Record<string, unknown>).apiKey).toBe('[REDACTED]');
    expect((result.nested as Record<string, unknown>).phone).toBe('6281');
  });

  it('redacts pairing codes and passphrases', () => {
    const result = redactSensitiveData({
      pairingCode: '12345678',
      passphrase: 'sixteen-chars-min',
    }) as Record<string, unknown>;
    expect(result.pairingCode).toBe('[REDACTED]');
    expect(result.passphrase).toBe('[REDACTED]');
  });

  it('strips error stacks', () => {
    const result = redactSensitiveData(new Error('privateKey leaked')) as Record<string, unknown>;
    expect(result.stack).toBeUndefined();
    expect(result.name).toBe('Error');
    expect(String(result.message)).toContain('[REDACTED]');
  });

  it('handles circular references', () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    const result = redactSensitiveData(circular) as Record<string, unknown>;
    expect(result.self).toBe('[Circular]');
  });

  it('does not mutate the original object', () => {
    const original = { password: 'hunter2', ok: true };
    redactSensitiveData(original);
    expect(original.password).toBe('hunter2');
  });
});

describe('createLogger', () => {
  it('creates a logger that does not throw on secret-looking payloads', () => {
    const logger = createLogger({ level: 'silent', name: 'test' });
    expect(() =>
      logger.info('login', { password: 'hunter2', privateKey: 'abc' }),
    ).not.toThrow();
  });
});

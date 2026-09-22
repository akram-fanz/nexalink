import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeClientConfig } from '../../src/config.js';
import { ConfigurationError } from '../../src/errors/index.js';

describe('normalizeClientConfig', () => {
  it('applies defaults and resolves authDirectory', () => {
    const config = normalizeClientConfig({ sessionName: 'my-bot' });
    expect(config.sessionName).toBe('my-bot');
    expect(config.logLevel).toBe('info');
    expect(config.reconnect).toBe(true);
    expect(config.maxReconnectAttempts).toBe(5);
    expect(config.qrMaxAttempts).toBe(3);
    expect(config.encryption.enabled).toBe(false);
    expect(path.isAbsolute(config.authDirectory)).toBe(true);
    expect(config.authDirectory).toBe(path.resolve('./sessions'));
  });

  it('requires sessionName', () => {
    expect(() => normalizeClientConfig({})).toThrow(ConfigurationError);
    expect(() => normalizeClientConfig({ sessionName: '' })).toThrow(ConfigurationError);
  });

  it('rejects encryption without passphrase', () => {
    expect(() =>
      normalizeClientConfig({
        sessionName: 'bot',
        encryption: { enabled: true },
      }),
    ).toThrow(ConfigurationError);
  });

  it('accepts encryption with a long passphrase', () => {
    const config = normalizeClientConfig({
      sessionName: 'bot',
      encryption: { enabled: true, passphrase: 'sixteen-chars-ok' },
    });
    expect(config.encryption.enabled).toBe(true);
    expect(config.encryption.passphrase).toBe('sixteen-chars-ok');
  });

  it('rejects NUL in authDirectory', () => {
    expect(() =>
      normalizeClientConfig({ sessionName: 'bot', authDirectory: 'sess\0ions' }),
    ).toThrow(ConfigurationError);
  });

  it('rejects out-of-range reconnect attempts', () => {
    expect(() =>
      normalizeClientConfig({ sessionName: 'bot', maxReconnectAttempts: -1 }),
    ).toThrow(ConfigurationError);
  });
});

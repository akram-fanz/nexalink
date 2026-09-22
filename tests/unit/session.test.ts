import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FileSessionStore } from '../../src/auth/session.js';
import { createLogger } from '../../src/logger.js';
import { AuthenticationError, PermissionError } from '../../src/errors/index.js';

const logger = createLogger({ level: 'silent' });

describe('FileSessionStore', () => {
  let tmpDir = '';

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexalink-session-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('saves and loads plaintext session', async () => {
    const store = new FileSessionStore(
      { sessionName: 'bot', authDirectory: tmpDir, encryptionEnabled: false },
      logger,
    );
    expect(await store.exists()).toBe(false);
    await store.save({ clientToken: 'ct', serverToken: 'st', deviceId: 'd1' });
    expect(await store.exists()).toBe(true);

    const loaded = await store.load();
    expect(loaded.clientToken).toBe('ct');
    expect(loaded.deviceId).toBe('d1');
  });

  it('encrypts session with passphrase', async () => {
    const store = new FileSessionStore(
      {
        sessionName: 'bot',
        authDirectory: tmpDir,
        encryptionEnabled: true,
        encryptionPassphrase: 'sixteen-chars-ok',
      },
      logger,
    );
    await store.save({ clientToken: 'ct', serverToken: 'st', deviceId: 'd1' });
    const raw = await fs.readFile(store.filePath);
    const text = raw.toString('utf8');
    expect(text).not.toContain('"clientToken":"ct"');

    const loaded = await store.load();
    expect(loaded.clientToken).toBe('ct');
    expect(loaded.deviceId).toBe('d1');
  });

  it('fails to decrypt with wrong passphrase', async () => {
    const store = new FileSessionStore(
      {
        sessionName: 'bot',
        authDirectory: tmpDir,
        encryptionEnabled: true,
        encryptionPassphrase: 'sixteen-chars-ok',
      },
      logger,
    );
    await store.save({ clientToken: 'ct' });

    const evilStore = new FileSessionStore(
      {
        sessionName: 'bot',
        authDirectory: tmpDir,
        encryptionEnabled: true,
        encryptionPassphrase: 'wrong-passphrase',
      },
      logger,
    );
    await expect(evilStore.load()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('destroys session directory', async () => {
    const store = new FileSessionStore(
      { sessionName: 'bot', authDirectory: tmpDir, encryptionEnabled: false },
      logger,
    );
    await store.save({ clientToken: 'ct' });
    await store.destroy();
    expect(await store.exists()).toBe(false);
  });

  it('throws PermissionError if destroy fails', async () => {
    const store = new FileSessionStore(
      { sessionName: 'bot', authDirectory: '/dev/null/nope', encryptionEnabled: false },
      logger,
    );
    await expect(store.destroy()).rejects.toBeInstanceOf(PermissionError);
  });
});

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { NexaClientConfig } from '../config.js';
import { AuthenticationError, ConfigurationError, PermissionError } from '../errors/index.js';
import type { NexaLogger } from '../logger.js';

export interface SessionData {
  readonly identityKeyPair?: {
    readonly publicKey: string;
    readonly privateKey: string;
  };
  readonly serverToken?: string;
  readonly clientToken?: string;
  readonly deviceId?: string;
  readonly lastUsedAt?: string;
}

export interface SessionStore {
  readonly sessionName: string;
  readonly authDirectory: string;
  exists(): Promise<boolean>;
  load(): Promise<SessionData>;
  save(data: SessionData): Promise<void>;
  destroy(): Promise<void>;
}

export interface FileSessionStoreOptions {
  readonly sessionName: string;
  readonly authDirectory: string;
  readonly encryptionEnabled: boolean;
  readonly encryptionPassphrase?: string;
}

const SESSION_FILE = 'session.json';
const ENCRYPTED_FILE = 'session.enc';
const SALT_BYTES = 16;
const IV_BYTES = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100_000;
const DIGEST = 'sha512';

export class FileSessionStore implements SessionStore {
  readonly sessionName: string;
  readonly authDirectory: string;
  private readonly encryptionEnabled: boolean;
  private readonly encryptionPassphrase?: string;
  private readonly logger: NexaLogger;

  constructor(options: FileSessionStoreOptions, logger: NexaLogger) {
    this.sessionName = options.sessionName;
    this.authDirectory = options.authDirectory;
    this.encryptionEnabled = options.encryptionEnabled;
    this.encryptionPassphrase = options.encryptionPassphrase;
    this.logger = logger;
  }

  get directory(): string {
    return path.join(this.authDirectory, this.sessionName);
  }

  get filePath(): string {
    return path.join(this.directory, this.encryptionEnabled ? ENCRYPTED_FILE : SESSION_FILE);
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  async load(): Promise<SessionData> {
    if (!(await this.exists())) {
      return {};
    }

    try {
      const raw = await fs.readFile(this.filePath);

      const text = this.encryptionEnabled
        ? await this.decrypt(raw)
        : raw.toString('utf8');

      const parsed = JSON.parse(text) as SessionData;

      if (parsed.identityKeyPair?.privateKey) {
        this.logger.debug('Session loaded with identity key');
      }

      return parsed;
    } catch (error) {
      throw new AuthenticationError('Failed to load session', { cause: error });
    }
  }

  async save(data: SessionData): Promise<void> {
    await this.ensureDirectory();

    const text = JSON.stringify({ ...data, lastUsedAt: new Date().toISOString() });

    try {
      const payload = this.encryptionEnabled
        ? await this.encrypt(text)
        : Buffer.from(text, 'utf8');

      await fs.writeFile(this.filePath, payload, { mode: 0o600 });
    } catch (error) {
      throw new ConfigurationError('Failed to save session', { cause: error });
    }
  }

  async destroy(): Promise<void> {
    try {
      await fs.rm(this.directory, { recursive: true, force: true });
    } catch (error) {
      throw new PermissionError('Failed to destroy session directory', { cause: error });
    }
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    } catch (error) {
      throw new ConfigurationError('Failed to create auth directory', { cause: error });
    }
  }

  private async deriveKey(salt: Buffer): Promise<Buffer> {
    if (!this.encryptionPassphrase) {
      throw new AuthenticationError('Encryption passphrase is required');
    }
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        this.encryptionPassphrase!,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        DIGEST,
        (err, key) => {
          if (err) reject(err);
          else resolve(key);
        },
      );
    });
  }

  private async encrypt(plainText: string): Promise<Buffer> {
    const salt = crypto.randomBytes(SALT_BYTES);
    const iv = crypto.randomBytes(IV_BYTES);
    const key = await this.deriveKey(salt);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    return Buffer.concat([salt, iv, encrypted]);
  }

  private async decrypt(buffer: Buffer): Promise<string> {
    const salt = buffer.subarray(0, SALT_BYTES);
    const iv = buffer.subarray(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const encrypted = buffer.subarray(SALT_BYTES + IV_BYTES);
    const key = await this.deriveKey(salt);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

export function createFileSessionStore(config: NexaClientConfig, logger: NexaLogger): SessionStore {
  return new FileSessionStore(
    {
      sessionName: config.sessionName,
      authDirectory: config.authDirectory,
      encryptionEnabled: config.encryption.enabled,
      encryptionPassphrase: config.encryption.passphrase,
    },
    logger,
  );
}

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MediaError, ValidationError } from '../errors/index.js';
import type { NexaLogger } from '../logger.js';
import { detectMediaKind, sniffMimeType, type MediaKind } from './mime.js';

export interface PreparedMedia {
  readonly kind: MediaKind;
  readonly mimeType: string;
  readonly size: number;
  readonly filename?: string;
  readonly buffer: Uint8Array;
}

export type MediaInput =
  | { readonly buffer: Uint8Array; readonly filename?: string }
  | { readonly path: string };

export interface MediaServiceOptions {
  /** Only files inside this directory may be read by path. Prevents arbitrary file reads. */
  readonly mediaDirectory: string;
  readonly maxBytes: number;
  readonly tempDirectory?: string;
  readonly logger: NexaLogger;
}

const DEFAULT_MAX_BYTES = 16 * 1024 * 1024;

export class MediaService {
  private readonly options: MediaServiceOptions;
  private readonly tempDirectory: string;
  private readonly tempFiles = new Set<string>();

  constructor(options: MediaServiceOptions) {
    this.options = options;
    this.tempDirectory =
      options.tempDirectory ?? path.join(os.tmpdir(), 'nexalink-media');
  }

  get maxBytes(): number {
    return this.options.maxBytes ?? DEFAULT_MAX_BYTES;
  }

  async prepare(input: MediaInput): Promise<PreparedMedia> {
    const { buffer, filename } = await this.resolveInput(input);
    this.assertSize(buffer);
    const mimeType = sniffMimeType(buffer, filename);
    return {
      kind: detectMediaKind(mimeType, filename),
      mimeType,
      size: buffer.byteLength,
      filename,
      buffer,
    };
  }

  /** Writes a temporary file that must be removed via cleanup(). */
  async writeTemp(buffer: Uint8Array, filename = 'media.bin'): Promise<string> {
    await fs.mkdir(this.tempDirectory, { recursive: true, mode: 0o700 });
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const target = path.join(
      this.tempDirectory,
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`,
    );
    await fs.writeFile(target, buffer, { mode: 0o600 });
    this.tempFiles.add(target);
    return target;
  }

  async cleanup(): Promise<void> {
    const targets = [...this.tempFiles];
    this.tempFiles.clear();
    await Promise.allSettled(targets.map((file) => fs.rm(file, { force: true })));
  }

  private assertSize(buffer: Uint8Array): void {
    if (buffer.byteLength === 0) {
      throw new ValidationError('Media payload is empty');
    }
    if (buffer.byteLength > this.maxBytes) {
      throw new MediaError(`Media exceeds the ${this.maxBytes} byte limit`, {
        metadata: { size: buffer.byteLength, maxBytes: this.maxBytes },
      });
    }
  }

  private async resolveInput(
    input: MediaInput,
  ): Promise<{ buffer: Uint8Array; filename?: string }> {
    if ('path' in input) {
      return this.readFromPath(input.path);
    }
    return { buffer: input.buffer, filename: input.filename };
  }

  private async readFromPath(filePath: string): Promise<{ buffer: Uint8Array; filename: string }> {
    if (filePath.includes('\0')) {
      throw new MediaError('Media path contains invalid characters');
    }

    const root = path.resolve(this.options.mediaDirectory);
    const resolved = path.resolve(filePath);

    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new MediaError('Media path escapes the configured media directory', {
        metadata: { mediaDirectory: root },
      });
    }

    try {
      const data = await fs.readFile(resolved);
      return { buffer: new Uint8Array(data), filename: path.basename(resolved) };
    } catch (error) {
      throw new MediaError('Failed to read media file', { cause: error });
    }
  }
}

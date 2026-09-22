import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MediaError, ValidationError } from '../../src/errors/index.js';
import { detectMediaKind, sniffMimeType } from '../../src/media/mime.js';
import { MediaService } from '../../src/media/service.js';
import { createLogger } from '../../src/logger.js';

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const PDF = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

describe('sniffMimeType', () => {
  it('detects JPEG, PNG, and PDF magic bytes', () => {
    expect(sniffMimeType(JPEG)).toBe('image/jpeg');
    expect(sniffMimeType(PNG)).toBe('image/png');
    expect(sniffMimeType(PDF)).toBe('application/pdf');
  });

  it('falls back to extension when magic is unknown', () => {
    expect(sniffMimeType(new Uint8Array([1, 2, 3]), 'note.txt')).toBe('text/plain');
  });
});

describe('detectMediaKind', () => {
  it('maps mime types to kinds', () => {
    expect(detectMediaKind('image/jpeg')).toBe('image');
    expect(detectMediaKind('video/mp4')).toBe('video');
    expect(detectMediaKind('audio/ogg')).toBe('audio');
    expect(detectMediaKind('application/pdf')).toBe('document');
    expect(detectMediaKind('image/webp')).toBe('sticker');
  });
});

describe('MediaService', () => {
  let tmp = '';
  let mediaDir = '';
  const logger = createLogger({ level: 'silent' });

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'nexalink-media-'));
    mediaDir = path.join(tmp, 'allowed');
    await fs.mkdir(mediaDir);
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  function service(maxBytes = 1024): MediaService {
    return new MediaService({
      logger,
      mediaDirectory: mediaDir,
      maxBytes,
      tempDirectory: path.join(tmp, 'temp'),
    });
  }

  it('prepares a buffer and infers kind', async () => {
    const prepared = await service().prepare({ buffer: JPEG, filename: 'shot.jpg' });
    expect(prepared.kind).toBe('image');
    expect(prepared.mimeType).toBe('image/jpeg');
    expect(prepared.size).toBe(JPEG.byteLength);
    expect(prepared.filename).toBe('shot.jpg');
  });

  it('reads a file from the media directory', async () => {
    const file = path.join(mediaDir, 'a.png');
    await fs.writeFile(file, PNG);
    const prepared = await service().prepare({ path: file });
    expect(prepared.kind).toBe('image');
    expect(prepared.mimeType).toBe('image/png');
  });

  it('rejects oversized payloads', async () => {
    await expect(service(4).prepare({ buffer: JPEG, filename: 'a.jpg' })).rejects.toBeInstanceOf(
      MediaError,
    );
  });

  it('rejects empty buffers', async () => {
    await expect(service().prepare({ buffer: new Uint8Array() })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('rejects path traversal outside mediaDirectory', async () => {
    const outside = path.join(tmp, 'secret.bin');
    await fs.writeFile(outside, JPEG);
    await expect(service().prepare({ path: outside })).rejects.toBeInstanceOf(MediaError);
  });

  it('rejects NUL in paths', async () => {
    await expect(service().prepare({ path: `${mediaDir}/x\0.jpg` })).rejects.toBeInstanceOf(
      MediaError,
    );
  });

  it('writes and cleans temporary files', async () => {
    const svc = service();
    const tempPath = await svc.writeTemp(JPEG, 'x.jpg');
    expect(tempPath.startsWith(path.join(tmp, 'temp'))).toBe(true);
    await expect(fs.access(tempPath)).resolves.toBeUndefined();
    await svc.cleanup();
    await expect(fs.access(tempPath)).rejects.toThrow();
  });
});

export type MediaKind = 'image' | 'video' | 'audio' | 'document' | 'sticker';

const MAGIC_SIGNATURES: ReadonlyArray<{
  readonly bytes: ReadonlyArray<number>;
  readonly mime: string;
  readonly kind: MediaKind;
}> = Object.freeze([
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg', kind: 'image' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png', kind: 'image' },
  { bytes: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif', kind: 'image' },
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf', kind: 'document' },
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], mime: 'video/webm', kind: 'video' },
  { bytes: [0x4f, 0x67, 0x67, 0x53], mime: 'audio/ogg', kind: 'audio' },
  { bytes: [0x49, 0x44, 0x33], mime: 'audio/mpeg', kind: 'audio' },
]);

const EXTENSION_MIME: Readonly<Record<string, string>> = Object.freeze({
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  mp3: 'audio/mpeg',
  pdf: 'application/pdf',
  txt: 'text/plain',
  json: 'application/json',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

function startsWith(buffer: Uint8Array, signature: ReadonlyArray<number>): boolean {
  if (buffer.byteLength < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

/**
 * Detects a MIME type from magic bytes first, then falls back to the file extension.
 * Returns `application/octet-stream` when nothing matches. Never trusts a caller-supplied type.
 */
export function sniffMimeType(buffer: Uint8Array, filename?: string): string {
  for (const signature of MAGIC_SIGNATURES) {
    if (startsWith(buffer, signature.bytes)) {
      return signature.mime;
    }
  }

  if (filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension && EXTENSION_MIME[extension]) {
      return EXTENSION_MIME[extension];
    }
  }

  return 'application/octet-stream';
}

/**
 * Maps a MIME type to a coarse media kind. WebP is treated as a sticker candidate.
 */
export function detectMediaKind(mimeType: string, filename?: string): MediaKind {
  if (mimeType.startsWith('image/')) {
    if (mimeType === 'image/webp') return 'sticker';
    return 'image';
  }
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (filename?.toLowerCase().endsWith('.webp')) return 'sticker';
  return 'document';
}

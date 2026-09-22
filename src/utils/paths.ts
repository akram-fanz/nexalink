import path from 'node:path';
import { ConfigurationError } from '../errors/index.js';

/**
 * Rejects NUL bytes and empty values, then returns an absolute path.
 * Callers remain responsible for filesystem permissions.
 */
export function assertSafeDirectory(input: string, fieldName = 'authDirectory'): string {
  if (input.includes('\0')) {
    throw new ConfigurationError(`${fieldName} contains invalid characters`, {
      metadata: { fieldName },
    });
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new ConfigurationError(`${fieldName} must not be empty`, {
      metadata: { fieldName },
    });
  }

  return path.resolve(trimmed);
}

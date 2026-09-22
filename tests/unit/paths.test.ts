import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertSafeDirectory } from '../../src/utils/paths.js';
import { ConfigurationError } from '../../src/errors/index.js';

describe('assertSafeDirectory', () => {
  it('resolves relative paths', () => {
    expect(assertSafeDirectory('./sessions')).toBe(path.resolve('./sessions'));
  });

  it('rejects empty and whitespace-only values', () => {
    expect(() => assertSafeDirectory('   ')).toThrow(ConfigurationError);
    expect(() => assertSafeDirectory('')).toThrow(ConfigurationError);
  });

  it('rejects NUL bytes', () => {
    expect(() => assertSafeDirectory('/tmp/se\0ssions')).toThrow(ConfigurationError);
  });
});

import { describe, expect, it } from 'vitest';
import { calculateBackoff } from '../../src/utils/backoff.js';
import { ValidationError } from '../../src/errors/index.js';

describe('calculateBackoff', () => {
  it('doubles the base delay per attempt', () => {
    expect(calculateBackoff(1, 1000)).toBe(1000);
    expect(calculateBackoff(2, 1000)).toBe(2000);
    expect(calculateBackoff(3, 1000)).toBe(4000);
    expect(calculateBackoff(4, 1000)).toBe(8000);
  });

  it('caps at maxDelayMs', () => {
    expect(calculateBackoff(10, 1000, 5000)).toBe(5000);
  });

  it('rejects invalid inputs', () => {
    expect(() => calculateBackoff(0, 1000)).toThrow(ValidationError);
    expect(() => calculateBackoff(1, 0)).toThrow(ValidationError);
    expect(() => calculateBackoff(1.5, 1000)).toThrow(ValidationError);
  });
});

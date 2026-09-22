import { ValidationError } from '../errors/index.js';

/**
 * Exponential backoff: `baseDelayMs * 2^(attempt - 1)`, capped at maxDelayMs.
 * `attempt` is 1-based.
 */
export function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs = 60_000,
): number {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new ValidationError('attempt must be an integer >= 1', {
      metadata: { attempt },
    });
  }
  if (!Number.isInteger(baseDelayMs) || baseDelayMs < 1) {
    throw new ValidationError('baseDelayMs must be an integer >= 1', {
      metadata: { baseDelayMs },
    });
  }
  if (!Number.isInteger(maxDelayMs) || maxDelayMs < 1) {
    throw new ValidationError('maxDelayMs must be an integer >= 1', {
      metadata: { maxDelayMs },
    });
  }

  const delay = baseDelayMs * 2 ** (attempt - 1);
  return Math.min(delay, maxDelayMs);
}

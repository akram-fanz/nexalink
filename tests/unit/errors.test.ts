import { describe, expect, it } from 'vitest';
import {
  AuthenticationError,
  ConfigurationError,
  ConnectionError,
  MediaError,
  NexaError,
  NexaErrorCode,
  PermissionError,
  ProtocolError,
  RetryableError,
  TimeoutError,
  UnsupportedFeatureError,
  ValidationError,
} from '../../src/errors/index.js';

const classes = [
  [AuthenticationError, NexaErrorCode.AUTHENTICATION_ERROR],
  [ConnectionError, NexaErrorCode.CONNECTION_ERROR],
  [TimeoutError, NexaErrorCode.TIMEOUT_ERROR],
  [ValidationError, NexaErrorCode.VALIDATION_ERROR],
  [UnsupportedFeatureError, NexaErrorCode.UNSUPPORTED_FEATURE],
  [ProtocolError, NexaErrorCode.PROTOCOL_ERROR],
  [MediaError, NexaErrorCode.MEDIA_ERROR],
  [PermissionError, NexaErrorCode.PERMISSION_ERROR],
  [ConfigurationError, NexaErrorCode.CONFIGURATION_ERROR],
] as const;

describe('error classes', () => {
  it.each(classes)('%s exposes stable name, code, and JSON', (Ctor, code) => {
    const error = new Ctor('boom', { metadata: { field: 'sessionName' } });
    expect(error).toBeInstanceOf(NexaError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(Ctor.name);
    expect(error.code).toBe(code);
    expect(error.retryable).toBe(false);
    expect(error.toJSON()).toMatchObject({
      name: Ctor.name,
      code,
      message: 'boom',
      retryable: false,
      metadata: { field: 'sessionName' },
    });
  });

  it('RetryableError is always retryable', () => {
    const error = new RetryableError('try again', { retryAfterMs: 1500 });
    expect(error.retryable).toBe(true);
    expect(error.retryAfterMs).toBe(1500);
    expect(error.code).toBe(NexaErrorCode.RETRYABLE_ERROR);
  });

  it('preserves cause without putting secrets into JSON', () => {
    const cause = new Error('privateKey=abc');
    const error = new AuthenticationError('auth failed', { cause });
    const json = error.toJSON();
    expect(json).not.toHaveProperty('cause');
    expect(json.message).toBe('auth failed');
    expect(error.cause).toBe(cause);
  });

  it('freezes metadata', () => {
    const error = new ValidationError('invalid', { metadata: { field: 'x' } });
    expect(() => {
      (error.metadata as Record<string, unknown>).field = 'y';
    }).toThrow();
  });
});

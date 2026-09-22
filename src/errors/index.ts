import { NexaError } from './base.js';
import { NexaErrorCode, type NexaErrorMetadata } from './types.js';

export { NexaError } from './base.js';
export { NexaErrorCode, type NexaErrorMetadata } from './types.js';

export type NexaErrorOptions = NexaErrorMetadata & { readonly cause?: unknown };

export class AuthenticationError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.AUTHENTICATION_ERROR, message, options);
  }
}

export class ConnectionError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.CONNECTION_ERROR, message, options);
  }
}

export class TimeoutError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.TIMEOUT_ERROR, message, options);
  }
}

export class ValidationError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.VALIDATION_ERROR, message, options);
  }
}

export class UnsupportedFeatureError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.UNSUPPORTED_FEATURE, message, options);
  }
}

export class ProtocolError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.PROTOCOL_ERROR, message, options);
  }
}

export class MediaError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.MEDIA_ERROR, message, options);
  }
}

export class PermissionError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.PERMISSION_ERROR, message, options);
  }
}

export class RetryableError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.RETRYABLE_ERROR, message, { ...options, retryable: true });
  }
}

export class ConfigurationError extends NexaError {
  constructor(message: string, options: NexaErrorOptions = {}) {
    super(NexaErrorCode.CONFIGURATION_ERROR, message, options);
  }
}

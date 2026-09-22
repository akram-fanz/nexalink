/**
 * Stable error codes exposed through the public API.
 * Codes are intentionally string-based for backwards compatibility.
 */
export enum NexaErrorCode {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNSUPPORTED_FEATURE = 'UNSUPPORTED_FEATURE',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  MEDIA_ERROR = 'MEDIA_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RETRYABLE_ERROR = 'RETRYABLE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export interface NexaErrorMetadata {
  /** Safe diagnostic metadata only. Never include secrets, keys, or full payloads. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Human-readable retry guidance when relevant. */
  readonly retryAfterMs?: number;
  /** Whether the operation may be retried safely. */
  readonly retryable?: boolean;
}

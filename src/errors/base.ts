import { NexaErrorCode, type NexaErrorMetadata } from './types.js';

export abstract class NexaError extends Error {
  readonly code: NexaErrorCode;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;

  protected constructor(
    code: NexaErrorCode,
    message: string,
    options: NexaErrorMetadata & { readonly cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = code;
    this.metadata = Object.freeze({ ...(options.metadata ?? {}) });
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Returns a safe representation suitable for logging and user-facing errors. */
  toJSON(): Readonly<Record<string, unknown>> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      retryAfterMs: this.retryAfterMs,
      metadata: this.metadata,
    };
  }
}

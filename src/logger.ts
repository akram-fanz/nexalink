import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';

const SECRET_KEY_PATTERN =
  /private[_-]?key|session[_-]?token|access[_-]?token|refresh[_-]?token|api[_-]?key|password|secret|authorization|cookie|pairing[_-]?code|passphrase|credential/i;

const REDACTED = '[REDACTED]';

/**
 * Redacts sensitive values from arbitrary log data before writing.
 * Handles nested objects, arrays, and Error instances without mutating inputs.
 */
export function redactSensitiveData(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message),
      stack: undefined,
    };
  }

  if (typeof value === 'string') {
    return redactText(value);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    output[key] = SECRET_KEY_PATTERN.test(key)
      ? REDACTED
      : redactSensitiveData(nestedValue, seen);
  }
  return output;
}

function redactText(value: string): string {
  return value.replace(SECRET_KEY_PATTERN, (match) => `${match}=${REDACTED}`);
}

export interface NexaLogger {
  readonly debug: (message: string, data?: unknown) => void;
  readonly info: (message: string, data?: unknown) => void;
  readonly warn: (message: string, data?: unknown) => void;
  readonly error: (message: string, data?: unknown) => void;
  readonly fatal: (message: string, data?: unknown) => void;
}

export interface NexaLoggerOptions {
  readonly level?: 'silent' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  readonly name?: string;
}

function write(
  logger: PinoLogger,
  method: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  message: string,
  data?: unknown,
): void {
  const safeMessage = redactText(message);
  if (data === undefined) {
    logger[method](safeMessage);
    return;
  }
  const safeData = redactSensitiveData(data);
  if (typeof safeData === 'object' && safeData !== null) {
    logger[method](safeData as Record<string, unknown>, safeMessage);
    return;
  }
  logger[method]({ value: safeData }, safeMessage);
}

/**
 * Creates a logger that never writes secrets, credentials, or stack traces.
 */
export function createLogger(options: NexaLoggerOptions = {}): NexaLogger {
  const level = options.level ?? 'info';
  const name = options.name ?? 'nexalink';
  const pinoOptions: LoggerOptions = {
    level,
    name,
    messageKey: 'message',
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
  };

  const logger: PinoLogger = pino(pinoOptions);

  return {
    debug: (message, data) => write(logger, 'debug', message, data),
    info: (message, data) => write(logger, 'info', message, data),
    warn: (message, data) => write(logger, 'warn', message, data),
    error: (message, data) => write(logger, 'error', message, data),
    fatal: (message, data) => write(logger, 'fatal', message, data),
  };
}

import { z } from 'zod';
import { ConfigurationError } from './errors/index.js';
import { assertSafeDirectory } from './utils/paths.js';

export const LogLevelSchema = z.enum(['silent', 'debug', 'info', 'warn', 'error', 'fatal']);

export const NexaClientConfigSchema = z.object({
  sessionName: z.string().min(1, 'sessionName is required').max(64),
  authDirectory: z.string().min(1, 'authDirectory is required').default('./sessions'),
  logLevel: LogLevelSchema.default('info'),
  loggerName: z.string().max(64).default('nexalink'),
  qrMaxAttempts: z.number().int().min(1).max(10).default(3),
  reconnect: z.boolean().default(true),
  maxReconnectAttempts: z.number().int().min(0).max(100).default(5),
  connectionTimeoutMs: z.number().int().min(1000).max(120_000).default(30_000),
  retryBaseDelayMs: z.number().int().min(100).max(60_000).default(1_000),
  encryption: z
    .object({
      enabled: z.boolean().default(false),
      passphrase: z.string().min(16).optional(),
    })
    .refine((value) => !value.enabled || typeof value.passphrase === 'string', {
      message: 'encryption.passphrase is required when encryption is enabled',
    })
    .default({ enabled: false }),
});

export type NexaClientConfig = z.infer<typeof NexaClientConfigSchema>;

export type NexaLogLevel = z.infer<typeof LogLevelSchema>;

export function normalizeClientConfig(input: unknown): NexaClientConfig {
  const result = NexaClientConfigSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    throw new ConfigurationError(`Invalid NexaLink configuration: ${issues}`, {
      metadata: { issueCount: result.error.issues.length },
    });
  }

  return {
    ...result.data,
    authDirectory: assertSafeDirectory(result.data.authDirectory),
  };
}

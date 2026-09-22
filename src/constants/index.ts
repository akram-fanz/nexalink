/**
 * Public constants for NexaLink.
 * Protocol internals stay in src/protocol and are not re-exported.
 */
export const SUPPORTED_NODE_VERSIONS = ['20', '22', '24'] as const;

export const DEFAULT_AUTH_DIRECTORY = './sessions';

export const DEFAULT_CONNECTION_TIMEOUT_MS = 30_000;

export const DEFAULT_RETRY_BASE_DELAY_MS = 1_000;

export const MAX_RECONNECT_ATTEMPTS = 5;

export const LIBRARY_NAME = 'nexalink';

export const LIBRARY_VERSION = '0.1.0';

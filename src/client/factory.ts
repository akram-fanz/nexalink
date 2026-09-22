import { normalizeClientConfig } from '../config.js';
import { createBaseDependencies, type NexaClient } from './core.js';
import { createLogger } from '../logger.js';

/**
 * Creates a fully wired PHASE 3 client (connection manager + file session store).
 * `connect()` will attempt a real WebSocket connection.
 */
export async function createClient(input: unknown): Promise<NexaClient> {
  const config = normalizeClientConfig(input);
  const base = createBaseDependencies(config);
  base.logger.info('NexaLink client created', {
    sessionName: config.sessionName,
    reconnect: config.reconnect,
  });

  const { buildPhase3Client } = await import('./phase3.js');
  return buildPhase3Client(config, base);
}

/**
 * Creates an offline stub client for unit tests. `connect()` is unsupported.
 */
export async function createStubClient(input: unknown): Promise<NexaClient> {
  const config = normalizeClientConfig(input);
  const logger = createLogger({
    level: config.logLevel,
    name: config.loggerName,
  });
  logger.info('NexaLink stub client created', { sessionName: config.sessionName });

  const { NexaClientStub } = await import('./phase2.js');
  return new NexaClientStub(config, logger);
}

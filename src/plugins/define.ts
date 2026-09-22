import type { NexaLogger } from '../logger.js';
import type { NexaClient } from '../client/core.js';

export interface NexaPluginHost {
  readonly on: NexaClient['on'];
  readonly sendMessage: NexaClient['sendMessage'];
  readonly state: NexaClient['state'];
  readonly logger: NexaLogger;
}

export interface NexaPlugin {
  readonly name: string;
  readonly version?: string;
  readonly description?: string;
  setup(host: NexaPluginHost): void | Promise<void>;
  teardown?(): void | Promise<void>;
}

/** Identity helper that provides type inference for plugin authors. */
export function definePlugin(plugin: NexaPlugin): NexaPlugin {
  return plugin;
}

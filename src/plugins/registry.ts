import { ConfigurationError } from '../errors/index.js';
import type { NexaLogger } from '../logger.js';
import type { NexaPlugin, NexaPluginHost } from './define.js';

/**
 * Registers plugins by unique name and guarantees teardown.
 * Setup failures are surfaced and the plugin is not registered.
 */
export class PluginRegistry {
  private readonly logger: NexaLogger;
  private readonly plugins = new Map<string, NexaPlugin>();

  constructor(logger: NexaLogger) {
    this.logger = logger;
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  list(): ReadonlyArray<string> {
    return [...this.plugins.keys()];
  }

  async use(plugin: NexaPlugin, host: NexaPluginHost): Promise<void> {
    if (!plugin || typeof plugin.name !== 'string' || plugin.name.trim().length === 0) {
      throw new ConfigurationError('Plugin must expose a non-empty name');
    }
    if (this.plugins.has(plugin.name)) {
      throw new ConfigurationError(`Plugin "${plugin.name}" is already registered`, {
        metadata: { plugin: plugin.name },
      });
    }

    await plugin.setup(host);
    this.plugins.set(plugin.name, plugin);
    this.logger.info('Plugin registered', { plugin: plugin.name, version: plugin.version });
  }

  async teardownAll(): Promise<void> {
    const plugins = [...this.plugins.values()].reverse();
    this.plugins.clear();

    await Promise.allSettled(
      plugins.map(async (plugin) => {
        try {
          await plugin.teardown?.();
          this.logger.info('Plugin removed', { plugin: plugin.name });
        } catch (error) {
          this.logger.error('Plugin teardown failed', { plugin: plugin.name, error });
        }
      }),
    );
  }
}

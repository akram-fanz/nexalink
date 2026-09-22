import { describe, expect, it, vi } from 'vitest';
import { ConfigurationError } from '../../src/errors/index.js';
import { PluginRegistry } from '../../src/plugins/registry.js';
import { definePlugin } from '../../src/plugins/define.js';
import { createLogger } from '../../src/logger.js';

describe('PluginRegistry', () => {
  const logger = createLogger({ level: 'silent' });

  function host() {
    return {
      on: vi.fn(() => () => undefined),
      sendMessage: vi.fn(async () => ({ id: 'msg_1' })),
      state: 'idle' as const,
      logger,
    };
  }

  it('registers and tears down a plugin', async () => {
    const teardown = vi.fn();
    const setup = vi.fn();
    const registry = new PluginRegistry(logger);
    const plugin = definePlugin({
      name: 'logger-plugin',
      version: '1.0.0',
      setup,
      teardown,
    });

    await registry.use(plugin, host());
    expect(setup).toHaveBeenCalledOnce();
    expect(registry.has('logger-plugin')).toBe(true);

    await registry.teardownAll();
    expect(teardown).toHaveBeenCalledOnce();
    expect(registry.has('logger-plugin')).toBe(false);
  });

  it('rejects duplicate plugin names', async () => {
    const registry = new PluginRegistry(logger);
    const plugin = definePlugin({ name: 'dup', setup() {} });
    await registry.use(plugin, host());
    await expect(registry.use(plugin, host())).rejects.toBeInstanceOf(ConfigurationError);
  });

  it('rejects plugins without a name', async () => {
    const registry = new PluginRegistry(logger);
    await expect(
      registry.use({ name: '', setup() {} }, host()),
    ).rejects.toBeInstanceOf(ConfigurationError);
  });

  it('isolates setup errors', async () => {
    const registry = new PluginRegistry(logger);
    await expect(
      registry.use(
        definePlugin({
          name: 'boom',
          setup() {
            throw new Error('plugin exploded');
          },
        }),
        host(),
      ),
    ).rejects.toThrow(/plugin exploded/);
    expect(registry.has('boom')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { createStubClient } from '../../src/client/index.js';
import { ConfigurationError } from '../../src/errors/index.js';

describe('createStubClient', () => {
  it('creates a client in idle state', async () => {
    const client = await createStubClient({ sessionName: 'phase2', logLevel: 'silent' });
    expect(client.state).toBe('idle');
    expect(client.config.sessionName).toBe('phase2');
  });

  it('rejects invalid config with ConfigurationError', async () => {
    await expect(createStubClient({})).rejects.toBeInstanceOf(ConfigurationError);
  });

  it('stub connect is unsupported', async () => {
    const client = await createStubClient({ sessionName: 'phase2', logLevel: 'silent' });
    await expect(client.connect()).rejects.toBeInstanceOf(ConfigurationError);
    await expect(client.connect()).rejects.toThrow(/PHASE 2/);
  });

  it('disconnect is a no-op from idle', async () => {
    const client = await createStubClient({ sessionName: 'phase2', logLevel: 'silent' });
    await expect(client.disconnect()).resolves.toBeUndefined();
    expect(client.state).toBe('idle');
  });
});

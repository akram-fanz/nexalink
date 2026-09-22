import { describe, expect, it } from 'vitest';
import { ConnectionManager } from '../../src/connection/manager.js';
import { createLogger } from '../../src/logger.js';
import type { TransportAdapter } from '../../src/connection/types.js';

function createMockTransport(open = true): TransportAdapter {
  const listeners: Record<string, Array<() => void | Promise<void>>> = {};
  return {
    get isOpen() { return open; },
    async connect() {
      listeners['open']?.forEach((fn) => fn());
    },
    async disconnect() { open = false; },
    async send() {},
    on(event, listener) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(listener as () => void | Promise<void>);
      return () => {
        listeners[event] = listeners[event].filter((fn) => fn !== listener);
      };
    },
  };
}

function createFailingTransport(error: Error): TransportAdapter {
  return {
    get isOpen() { return false; },
    async connect() { throw error; },
    async disconnect() {},
    async send() {},
    on() { return () => {}; },
  };
}

const logger = createLogger({ level: 'silent' });

describe('ConnectionManager', () => {
  it('connects and emits transitions', async () => {
    const manager = new ConnectionManager(
      {
        serverUrl: 'ws://test',
        timeoutMs: 1000,
        reconnect: false,
        backoff: { baseDelayMs: 10, maxDelayMs: 100, maxAttempts: 2 },
        createTransport: () => createMockTransport(),
      },
      logger,
    );

    const transitions: unknown[] = [];
    manager.on('transition', (t) => transitions.push(t));

    await manager.connect();
    expect(manager.state).toBe('authenticating');
    await manager.markConnected();
    expect(manager.state).toBe('connected');
    expect(transitions).toHaveLength(3);
  });

  it('does not allow concurrent connect calls', async () => {
    const manager = new ConnectionManager(
      {
        serverUrl: 'ws://test',
        timeoutMs: 1000,
        reconnect: false,
        backoff: { baseDelayMs: 10, maxDelayMs: 100, maxAttempts: 0 },
        createTransport: () => createMockTransport(),
      },
      logger,
    );

    const [a, b] = await Promise.all([manager.connect(), manager.connect()]);
    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
    expect(manager.state).toBe('authenticating');
  });

  it('gives up after max reconnect attempts', async () => {
    const manager = new ConnectionManager(
      {
        serverUrl: 'ws://test',
        timeoutMs: 100,
        reconnect: true,
        backoff: { baseDelayMs: 1, maxDelayMs: 5, maxAttempts: 2 },
        createTransport: () => createFailingTransport(new Error('down')),
      },
      logger,
    );

    await expect(manager.connect()).rejects.toThrow(/Max reconnect attempts reached/);
    expect(manager.state).toBe('failed');
  });

  it('disconnects cleanly from idle', async () => {
    const manager = new ConnectionManager(
      {
        serverUrl: 'ws://test',
        timeoutMs: 1000,
        reconnect: false,
        backoff: { baseDelayMs: 10, maxDelayMs: 100, maxAttempts: 0 },
        createTransport: () => createMockTransport(),
      },
      logger,
    );

    await manager.disconnect();
    expect(manager.state).toBe('idle');
  });

  it('ignores double disconnect', async () => {
    const manager = new ConnectionManager(
      {
        serverUrl: 'ws://test',
        timeoutMs: 1000,
        reconnect: false,
        backoff: { baseDelayMs: 10, maxDelayMs: 100, maxAttempts: 0 },
        createTransport: () => createMockTransport(),
      },
      logger,
    );

    await manager.connect();
    await manager.disconnect();
    await manager.disconnect();
    expect(manager.state).toBe('disconnected');
  });
});

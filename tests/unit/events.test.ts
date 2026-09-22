import { describe, expect, it, vi } from 'vitest';
import { NexaEventBus } from '../../src/events/bus.js';

describe('NexaEventBus', () => {
  it('delivers typed payloads to multiple listeners', async () => {
    const bus = new NexaEventBus();
    const first = vi.fn();
    const second = vi.fn();
    bus.on('connection.update', first);
    bus.on('connection.update', second);

    await bus.emit('connection.update', {
      state: 'connecting',
      previousState: 'idle',
    });

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(first.mock.calls[0]?.[0]).toMatchObject({ state: 'connecting' });
  });

  it('isolates listener errors', async () => {
    const bus = new NexaEventBus();
    const failing = vi.fn(() => {
      throw new Error('listener boom');
    });
    const surviving = vi.fn();
    bus.on('error', failing);
    bus.on('error', surviving);

    await expect(
      bus.emit('error', {
        name: 'ConnectionError',
        code: 'CONNECTION_ERROR',
        message: 'down',
        retryable: true,
      }),
    ).resolves.toBeUndefined();

    expect(failing).toHaveBeenCalledOnce();
    expect(surviving).toHaveBeenCalledOnce();
  });

  it('supports unsubscribe and once', async () => {
    const bus = new NexaEventBus();
    const persistent = vi.fn();
    const once = vi.fn();
    const off = bus.on('auth.update', persistent);
    bus.once('auth.update', once);

    const payload = { sessionLoaded: false, qr: 'qr' };
    await bus.emit('auth.update', payload);
    off();
    await bus.emit('auth.update', payload);

    expect(persistent).toHaveBeenCalledOnce();
    expect(once).toHaveBeenCalledOnce();
    expect(bus.listenerCount('auth.update')).toBe(0);
  });

  it('snapshots listeners so removal during dispatch still runs queued handlers', async () => {
    const bus = new NexaEventBus();
    const second = vi.fn();
    const first = vi.fn(() => {
      bus.off('connection.update', second);
    });
    bus.on('connection.update', first);
    bus.on('connection.update', second);

    await bus.emit('connection.update', {
      state: 'disconnected',
      previousState: 'connected',
    });

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });
});

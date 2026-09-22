import { describe, expect, it } from 'vitest';
import { ConnectionStateMachine } from '../../src/connection/state.js';
import { ConnectionError } from '../../src/errors/index.js';

describe('ConnectionStateMachine', () => {
  it('starts in idle', () => {
    const sm = new ConnectionStateMachine();
    expect(sm.state).toBe('idle');
    expect(sm.transitions).toHaveLength(0);
  });

  it('allows valid transitions', () => {
    const sm = new ConnectionStateMachine();
    sm.transition('connecting');
    sm.transition('authenticating');
    sm.transition('connected');
    expect(sm.state).toBe('connected');
    expect(sm.transitions).toHaveLength(3);
  });

  it('rejects invalid transitions', () => {
    const sm = new ConnectionStateMachine();
    expect(() => sm.transition('connected')).toThrow(ConnectionError);
    sm.transition('connecting');
    expect(() => sm.transition('connected')).toThrow(ConnectionError);
  });

  it('asserts expected state', () => {
    const sm = new ConnectionStateMachine();
    sm.transition('connecting');
    sm.assert('connecting', 'connect');
    expect(() => sm.assert('connected', 'send')).toThrow();
  });

  it('detects terminal states', () => {
    const sm = new ConnectionStateMachine();
    expect(sm.isTerminal()).toBe(false);
    sm.transition('connecting');
    sm.transition('disconnected');
    expect(sm.isTerminal()).toBe(true);
  });
});

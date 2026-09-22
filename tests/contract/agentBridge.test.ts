import { describe, it, expect } from 'vitest';
import { AgentEvent, AgentTurnInput } from '../../src/agent/bridge.js';
import { MockEveAgent } from '../mocks/mockEveAgent.js';

describe('Eve Agent Bridge Contract', () => {
  it('dispatches lifecycle events in correct sequence', async () => {
    const bridge = new MockEveAgent();
    await bridge.initialize('mock/path');

    const events: AgentEvent[] = [];
    const abortController = new AbortController();

    const input: AgentTurnInput = {
      sessionId: 'test-session',
      prompt: 'Hello agent',
      selectedModel: 'gemini-2.5-flash',
      workingContext: [],
      persistentMemories: [],
      abortSignal: abortController.signal,
    };

    const result = await bridge.executeTurn(input, (e) => events.push(e));

    expect(events.length).toBeGreaterThan(2);
    expect(events[0].type).toBe('step_start');
    expect(events.some((e) => e.type === 'token_stream')).toBe(true);
    expect(events[events.length - 1].type).toBe('step_finish');

    expect(result.completedCleanly).toBe(true);
    expect(result.fullText.length).toBeGreaterThan(0);
    expect(result.inputTokens).toBeGreaterThan(0);
  });

  it('handles immediate cancellation via AbortSignal', async () => {
    const bridge = new MockEveAgent();
    bridge.tokenDelayMs = 20;

    const events: AgentEvent[] = [];
    const abortController = new AbortController();

    const input: AgentTurnInput = {
      sessionId: 'test-session-abort',
      prompt: 'Long generation prompt',
      selectedModel: 'gemini-2.5-flash',
      workingContext: [],
      persistentMemories: [],
      abortSignal: abortController.signal,
    };

    setTimeout(() => {
      abortController.abort();
    }, 15);

    const result = await bridge.executeTurn(input, (e) => events.push(e));

    expect(result.completedCleanly).toBe(false);
    expect(events.some((e) => e.type === 'cancelled')).toBe(true);
  });
});

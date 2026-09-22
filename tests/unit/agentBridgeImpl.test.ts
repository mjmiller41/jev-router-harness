import { describe, it, expect } from 'vitest';
import { EveAgentBridge, AgentEvent } from '../../src/agent/bridge.js';

describe('EveAgentBridge Implementation', () => {
  it('initializes and executes turn with token streaming', async () => {
    const bridge = new EveAgentBridge();
    await bridge.initialize();

    const events: AgentEvent[] = [];
    const abortController = new AbortController();

    const result = await bridge.executeTurn(
      {
        sessionId: 'sess-impl-test',
        prompt: 'Explain quicksort algorithm',
        selectedModel: 'gemini-2.5-flash',
        workingContext: [],
        persistentMemories: ['Use concise explanations'],
        abortSignal: abortController.signal,
      },
      (e) => events.push(e)
    );

    expect(result.completedCleanly).toBe(true);
    expect(result.fullText).toContain('quicksort');
    expect(events.some((e) => e.type === 'step_start')).toBe(true);
    expect(events.some((e) => e.type === 'token_stream')).toBe(true);
    expect(events.some((e) => e.type === 'step_finish')).toBe(true);
  });

  it('handles cancellation immediately during execution', async () => {
    const bridge = new EveAgentBridge();
    await bridge.initialize();

    const events: AgentEvent[] = [];
    const abortController = new AbortController();
    abortController.abort(); // pre-aborted

    const result = await bridge.executeTurn(
      {
        sessionId: 'sess-cancel-test',
        prompt: 'Long calculation',
        selectedModel: 'gpt-4o-mini',
        workingContext: [],
        persistentMemories: [],
        abortSignal: abortController.signal,
      },
      (e) => events.push(e)
    );

    expect(result.completedCleanly).toBe(false);
    expect(events.some((e) => e.type === 'cancelled')).toBe(true);
  });

  it('registers custom tools', () => {
    const bridge = new EveAgentBridge();
    bridge.registerTool({
      name: 'test_tool',
      description: 'A test tool',
      parameters: {},
      execute: async () => ({ status: 'ok' }),
    });
  });
});

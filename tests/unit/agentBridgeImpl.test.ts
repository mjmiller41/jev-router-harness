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

  it('executes tools and analyzes repository on examination prompt', async () => {
    const bridge = new EveAgentBridge();
    await bridge.initialize();

    const events: AgentEvent[] = [];
    const abortController = new AbortController();

    const result = await bridge.executeTurn(
      {
        sessionId: 'sess-repo-test',
        prompt: 'Examin this repo, and tell me what it does',
        selectedModel: 'gemini-2.5-flash',
        workingContext: [],
        persistentMemories: [],
        abortSignal: abortController.signal,
      },
      (e) => events.push(e)
    );

    expect(result.completedCleanly).toBe(true);
    expect(result.toolCallsExecuted).toBeGreaterThanOrEqual(2);
    expect(result.fullText).toContain('Repository Analysis');
    expect(result.fullText).toContain('jev-router-harness');
    expect(events.some((e) => e.type === 'tool_call_start')).toBe(true);
    expect(events.some((e) => e.type === 'tool_call_finish')).toBe(true);
  });

  it('evaluates mathematical expressions using calculator tool', async () => {
    const bridge = new EveAgentBridge();
    await bridge.initialize();

    const events: AgentEvent[] = [];
    const abortController = new AbortController();

    const result = await bridge.executeTurn(
      {
        sessionId: 'sess-calc-test',
        prompt: 'calculate 25 * 4',
        selectedModel: 'gemini-2.5-flash',
        workingContext: [],
        persistentMemories: [],
        abortSignal: abortController.signal,
      },
      (e) => events.push(e)
    );

    expect(result.completedCleanly).toBe(true);
    expect(result.fullText).toContain('100');
    expect(events.some((e) => e.type === 'tool_call_start' && e.payload.toolName === 'calculator')).toBe(true);
  });

  it('responds with pong on ping query', async () => {
    const bridge = new EveAgentBridge();
    await bridge.initialize();

    const events: AgentEvent[] = [];
    const abortController = new AbortController();

    const result = await bridge.executeTurn(
      {
        sessionId: 'sess-ping-test',
        prompt: 'ping',
        selectedModel: 'gemini-2.5-flash',
        workingContext: [],
        persistentMemories: [],
        abortSignal: abortController.signal,
      },
      (e) => events.push(e)
    );

    expect(result.completedCleanly).toBe(true);
    expect(result.fullText.toLowerCase()).toContain('pong');
  });

  it('executes tools and returns audit report for bug scan query', async () => {
    const bridge = new EveAgentBridge();
    await bridge.initialize();

    const events: AgentEvent[] = [];
    const abortController = new AbortController();

    const result = await bridge.executeTurn(
      {
        sessionId: 'sess-scan-test',
        prompt: 'Scan the repo for bugs and improvement opportunities',
        selectedModel: 'gpt-4o-mini',
        workingContext: [],
        persistentMemories: [],
        abortSignal: abortController.signal,
      },
      (e) => events.push(e)
    );

    expect(result.completedCleanly).toBe(true);
    expect(result.toolCallsExecuted).toBeGreaterThanOrEqual(3);
    expect(result.fullText).toContain('Repository Bug Scan & Improvement Opportunities');
    expect(events.some((e) => e.type === 'tool_call_start' && e.payload.toolName === 'listFiles')).toBe(true);
    expect(events.some((e) => e.type === 'tool_call_start' && e.payload.toolName === 'searchFiles')).toBe(true);
    expect(events.some((e) => e.type === 'tool_call_start' && e.payload.toolName === 'runCommand')).toBe(true);
  });
});

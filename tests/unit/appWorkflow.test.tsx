import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../src/tui/App.js';
import { createRouter } from '../../src/router/index.js';
import { EveAgentBridge } from '../../src/agent/bridge.js';

describe('TUI Harness Full Loop Workflow', () => {
  it('processes prompt, routes to free model, executes tools, and displays response', async () => {
    const router = createRouter();
    const agentBridge = new EveAgentBridge();
    await agentBridge.initialize();

    const { lastFrame, unmount } = render(
      React.createElement(App, {
        router,
        agentBridge,
        initialPrompt: 'Examin this repo, and tell me what it does',
      })
    );

    expect(lastFrame()).toContain('Jev Router Harness');

    // Wait for the asynchronous turn execution and token streaming to complete
    let attempts = 0;
    while (attempts < 50 && !lastFrame()?.includes('Repository Analysis')) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }

    const frame = lastFrame() || '';
    expect(frame).toContain('Repository Analysis');
    expect(frame).toContain('jev-router-harness');
    expect(frame).toContain('Tool [listFiles]');
    expect(frame).toContain('Tool [readFile]');

    unmount();
  }, 10000);

  it('routes every chat prompt dynamically to optimal model without locking into the first model', async () => {
    const router = createRouter();
    const routeSpy = vi.spyOn(router, 'route');

    const agentBridge = new EveAgentBridge();
    await agentBridge.initialize();

    // Turn 1: Simple routine prompt -> free tier
    const turn1Decision = await router.route({
      prompt: 'What is 2 + 2?',
      modelOverride: undefined,
    });
    expect(turn1Decision.selectedTier).toBe('free');
    expect(turn1Decision.selectedModel).toBe('gemini-2.5-flash');

    // Turn 2: Complex architecture prompt -> must dynamically evaluate to premium, NOT lock to gemini
    const turn2Decision = await router.route({
      prompt: 'Architect a distributed consensus protocol with raft leader election, network partition healing, and formal invariant proofs.',
      modelOverride: undefined,
    });
    expect(turn2Decision.selectedTier).toBe('premium');
    expect(['claude-3-5-sonnet', 'gpt-4o']).toContain(turn2Decision.selectedModel);
    expect(turn2Decision.selectedModel).not.toBe('gemini-2.5-flash');

    // Turn 3: Moderate prompt -> budget tier
    const turn3Decision = await router.route({
      prompt: 'Refactor this database query and explain the performance trade-offs with indexing.',
      modelOverride: undefined,
    });
    expect(turn3Decision.selectedTier).toBe('budget');
    expect(['gemini-2.5-flash-paid', 'gpt-4o-mini']).toContain(turn3Decision.selectedModel);
    expect(turn3Decision.selectedModel).not.toBe('gemini-2.5-flash');

    routeSpy.mockRestore();
  });
});

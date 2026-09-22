import { describe, it, expect } from 'vitest';
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

    // Initial frame shows harness header and routing/thinking
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
});

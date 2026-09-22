import { describe, it, expect, beforeEach } from 'vitest';
import { ContextManager } from '../../src/memory/contextManager.js';

describe('Context Manager', () => {
  let manager: ContextManager;

  beforeEach(() => {
    manager = new ContextManager({
      maxTokens: 1000,
      compactionThreshold: 0.75,
      preserveRecentTurns: 4,
    });
  });

  it('tracks token usage as turns are added', () => {
    manager.addTurn({ role: 'user', content: 'Turn 1 user', tokens: 100 });
    manager.addTurn({ role: 'assistant', content: 'Turn 1 reply', tokens: 150 });

    const status = manager.getStatus();
    expect(status.currentTokens).toBe(250);
    expect(status.utilizationRatio).toBe(0.25);
    expect(status.isCompactionNeeded).toBe(false);
  });

  it('detects when compaction is needed above 75% threshold', () => {
    manager.addTurn({ role: 'user', content: 'Big user turn', tokens: 400 });
    manager.addTurn({ role: 'assistant', content: 'Big reply', tokens: 400 });

    const status = manager.getStatus();
    expect(status.currentTokens).toBe(800);
    expect(status.utilizationRatio).toBe(0.8);
    expect(status.isCompactionNeeded).toBe(true);
    expect(manager.shouldCompact()).toBe(true);
  });

  it('compacts older turns while preserving recent 4 turns', async () => {
    // Add 8 turns
    for (let i = 1; i <= 8; i++) {
      manager.addTurn({ role: 'user', content: `User query ${i}`, tokens: 100 });
      manager.addTurn({ role: 'assistant', content: `Assistant answer ${i}`, tokens: 100 });
    }

    expect(manager.shouldCompact()).toBe(true);

    await manager.compact(async (textToSummarize) => {
      expect(textToSummarize).toContain('User query 1');
      return 'Summary of queries 1 to 4: Discussed setup and initial parameters.';
    });

    const formatted = manager.getFormattedContext();
    expect(formatted[0].role).toBe('system');
    expect(formatted[0].content).toContain('Consolidated Previous Context');

    const status = manager.getStatus();
    expect(status.compactionPasses).toBe(1);
    expect(status.uncompactedTurnCount).toBeLessThanOrEqual(8);
  });

  it('resets context cleanly', () => {
    manager.addTurn({ role: 'user', content: 'Hi', tokens: 50 });
    manager.reset();
    expect(manager.getStatus().currentTokens).toBe(0);
    expect(manager.getFormattedContext()).toHaveLength(0);
  });
});

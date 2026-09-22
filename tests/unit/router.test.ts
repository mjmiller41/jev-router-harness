import { describe, it, expect, beforeEach } from 'vitest';
import { HeuristicRouter } from '../../src/router/heuristicRouter.js';
import { ModelRegistry } from '../../src/router/modelRegistry.js';
import { createRouter } from '../../src/router/index.js';

describe('Dynamic Model Router', () => {
  let registry: ModelRegistry;
  let heuristicRouter: HeuristicRouter;

  beforeEach(() => {
    registry = new ModelRegistry();
    heuristicRouter = new HeuristicRouter(registry);
  });

  it('routes routine simple prompt to free tier model', async () => {
    const result = await heuristicRouter.route({
      prompt: 'How do I check if a file exists in Node.js?',
    });

    expect(result.selectedTier).toBe('free');
    expect(result.selectedModel).toBe('gemini-2.5-flash');
    expect(result.complexityScore).toBeLessThan(0.35);
    expect(result.isFallback).toBe(false);
  });

  it('routes moderate complexity prompt to budget tier model', async () => {
    const result = await heuristicRouter.route({
      prompt: 'Refactor this database query and explain the performance trade-offs with indexing.',
    });

    expect(result.selectedTier).toBe('budget');
    expect(result.complexityScore).toBeGreaterThanOrEqual(0.35);
    expect(result.complexityScore).toBeLessThan(0.70);
  });

  it('routes highly complex architectural prompt to premium tier model', async () => {
    const result = await heuristicRouter.route({
      prompt: 'Architect a distributed consensus protocol with raft leader election, network partition healing, and formal invariant proofs.',
    });

    expect(result.selectedTier).toBe('premium');
    expect(result.complexityScore).toBeGreaterThan(0.70);
    expect(['claude-3-5-sonnet', 'gpt-4o']).toContain(result.selectedModel);
  });

  it('honors explicit model override', async () => {
    const result = await heuristicRouter.route({
      prompt: 'Simple hello',
      modelOverride: 'gpt-4o',
    });

    expect(result.selectedModel).toBe('gpt-4o');
    expect(result.reasoning).toContain('User explicit override');
  });

  it('honors session tier preference', async () => {
    const result = await heuristicRouter.route({
      prompt: 'Simple query',
      sessionTierPreference: 'premium',
    });

    expect(result.selectedTier).toBe('premium');
  });

  it('escalates to fallback when primary model reports failure', async () => {
    const fallbackResult = await heuristicRouter.reportModelFailure(
      'gemini-2.5-flash',
      new Error('Rate limit exceeded 429')
    );

    expect(fallbackResult.isFallback).toBe(true);
    expect(fallbackResult.selectedModel).not.toBe('gemini-2.5-flash');
  });

  it('routes ping to free tier with low complexity score', async () => {
    const result = await heuristicRouter.route({
      prompt: 'ping',
    });

    expect(result.selectedTier).toBe('free');
    expect(result.selectedModel).toBe('gemini-2.5-flash');
    expect(result.complexityScore).toBeLessThanOrEqual(0.10);
  });

  it('routes code audit and bug scan requests to budget tier', async () => {
    const result = await heuristicRouter.route({
      prompt: 'Scan the repo for bugs and improvement opportunities',
    });

    expect(result.selectedTier).toBe('budget');
    expect(result.selectedModel).toBe('gpt-4o-mini');
    expect(result.complexityScore).toBeGreaterThanOrEqual(0.35);
  });

  it('createRouter factory initializes working router', async () => {
    const router = createRouter({ registry });
    const result = await router.route({ prompt: 'Test factory router' });
    expect(result.selectedModel).toBeDefined();
    expect(result.decisionId).toBeDefined();
  });
});

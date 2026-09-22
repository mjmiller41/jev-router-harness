import { describe, it, expect, vi } from 'vitest';
import { JevRouter } from '../../src/router/jevRouter.js';
import { ModelRegistry } from '../../src/router/modelRegistry.js';

describe('JevRouter', () => {
  it('falls back to heuristic router when no API key provided', async () => {
    const router = new JevRouter();
    const result = await router.route({ prompt: 'Write a quick function in JS' });

    expect(result.selectedModel).toBeDefined();
    expect(result.selectedTier).toBe('free');
  });

  it('calls Jev API endpoint and parses decision when key provided', async () => {
    const mockResponse = {
      complexityScore: 0.85,
      tier: 'premium',
      reasoning: 'High-level architectural design requiring advanced synthesis',
      confidence: 0.98,
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    }) as any;

    const router = new JevRouter({ apiKey: 'test-api-key' });
    const result = await router.route({
      prompt: 'Architect a geo-distributed event mesh',
    });

    expect(result.selectedTier).toBe('premium');
    expect(result.complexityScore).toBe(0.85);
    expect(result.reasoning).toContain('typesafe-ai/jev classified');
    expect(result.isFallback).toBe(false);
  });

  it('falls back seamlessly when Jev API network request fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error 500')) as any;

    const router = new JevRouter({ apiKey: 'test-api-key' });
    const result = await router.route({
      prompt: 'Refactor this code',
    });

    expect(result.isFallback).toBe(true);
    expect(result.reasoning).toContain('[Offline Fallback]');
  });

  it('supports model registration and failure reporting', async () => {
    const registry = new ModelRegistry();
    const router = new JevRouter({ registry });

    router.registerModel({
      id: 'custom-model',
      name: 'Custom',
      provider: 'custom',
      tier: 'free',
      contextWindow: 4000,
      costPer1kInputTokensUsd: 0,
      costPer1kOutputTokensUsd: 0,
      isAvailable: true,
    });

    const fallback = await router.reportModelFailure('gemini-2.5-flash', new Error('HTTP 429'));
    expect(fallback.isFallback).toBe(true);
  });
});

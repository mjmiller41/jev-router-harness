import { describe, it, expect } from 'vitest';
import {
  calculateTurnCost,
  calculateSessionMetrics,
  calculateCostSavingsVsPremium,
} from '../../src/telemetry/costCalculator.js';
import { TelemetryRecord } from '../../src/types/index.js';

describe('Cost Calculator and Telemetry', () => {
  it('calculates zero cost for free tier models', () => {
    const cost = calculateTurnCost('gemini-2.5-flash', 500, 1000);
    expect(cost).toBe(0.0);
  });

  it('calculates accurate cost for budget and premium tiers', () => {
    // gpt-4o-mini: 0.00015 input / 0.0006 output per 1k
    const costBudget = calculateTurnCost('gpt-4o-mini', 1000, 1000);
    expect(costBudget).toBeCloseTo(0.00075, 5);

    // claude-3-5-sonnet: 0.003 input / 0.015 output per 1k
    const costPremium = calculateTurnCost('claude-3-5-sonnet', 1000, 1000);
    expect(costPremium).toBeCloseTo(0.018, 5);
  });

  it('aggregates session metrics correctly', () => {
    const records: TelemetryRecord[] = [
      {
        id: '1',
        sessionId: 's1',
        turnIndex: 0,
        timestamp: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        tier: 'free',
        inputTokens: 200,
        outputTokens: 400,
        decisionLatencyMs: 10,
        generationLatencyMs: 300,
        costUsd: 0.0,
        interrupted: false,
      },
      {
        id: '2',
        sessionId: 's1',
        turnIndex: 1,
        timestamp: new Date().toISOString(),
        model: 'claude-3-5-sonnet',
        tier: 'premium',
        inputTokens: 1000,
        outputTokens: 1000,
        decisionLatencyMs: 15,
        generationLatencyMs: 900,
        costUsd: 0.018,
        interrupted: false,
      },
    ];

    const metrics = calculateSessionMetrics(records);
    expect(metrics.totalTurns).toBe(2);
    expect(metrics.freeTurns).toBe(1);
    expect(metrics.premiumTurns).toBe(1);
    expect(metrics.totalInputTokens).toBe(1200);
    expect(metrics.totalOutputTokens).toBe(1400);
    expect(metrics.totalCostUsd).toBeCloseTo(0.018, 4);

    const savings = calculateCostSavingsVsPremium(metrics);
    expect(savings.costIfAllPremiumUsd).toBeGreaterThan(metrics.totalCostUsd);
    expect(savings.percentageSaved).toBeGreaterThan(0);
  });
});

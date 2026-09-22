import { TelemetryRecord } from '../types/index.js';
import { DEFAULT_MODEL_CANDIDATES } from '../router/modelRegistry.js';

export interface SessionMetrics {
  totalTurns: number;
  freeTurns: number;
  budgetTurns: number;
  premiumTurns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  averageLatencyMs: number;
}

export interface CostSavings {
  totalCostUsd: number;
  costIfAllPremiumUsd: number;
  dollarsSavedUsd: number;
  percentageSaved: number;
}

const PRICING_MAP = new Map(
  DEFAULT_MODEL_CANDIDATES.map((m) => [
    m.id,
    { in: m.costPer1kInputTokensUsd, out: m.costPer1kOutputTokensUsd },
  ])
);

export function calculateTurnCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = PRICING_MAP.get(modelId) || { in: 0.001, out: 0.002 };
  const inputCost = (inputTokens / 1000) * rates.in;
  const outputCost = (outputTokens / 1000) * rates.out;
  return inputCost + outputCost;
}

export function calculateSessionMetrics(records: TelemetryRecord[]): SessionMetrics {
  let freeTurns = 0;
  let budgetTurns = 0;
  let premiumTurns = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;
  let totalLatency = 0;

  for (const r of records) {
    if (r.tier === 'free') freeTurns += 1;
    else if (r.tier === 'budget') budgetTurns += 1;
    else if (r.tier === 'premium') premiumTurns += 1;

    totalInputTokens += r.inputTokens;
    totalOutputTokens += r.outputTokens;
    totalCostUsd += r.costUsd;
    totalLatency += r.generationLatencyMs;
  }

  return {
    totalTurns: records.length,
    freeTurns,
    budgetTurns,
    premiumTurns,
    totalInputTokens,
    totalOutputTokens,
    totalCostUsd,
    averageLatencyMs: records.length > 0 ? Math.round(totalLatency / records.length) : 0,
  };
}

export function calculateCostSavingsVsPremium(metrics: SessionMetrics): CostSavings {
  // Benchmark premium rate (Claude 3.5 Sonnet: $0.003 in / $0.015 out per 1k)
  const premiumRateIn = 0.003;
  const premiumRateOut = 0.015;

  const costIfAllPremiumUsd =
    (metrics.totalInputTokens / 1000) * premiumRateIn +
    (metrics.totalOutputTokens / 1000) * premiumRateOut;

  const dollarsSavedUsd = Math.max(0, costIfAllPremiumUsd - metrics.totalCostUsd);
  const percentageSaved =
    costIfAllPremiumUsd > 0 ? Math.round((dollarsSavedUsd / costIfAllPremiumUsd) * 100) : 0;

  return {
    totalCostUsd: metrics.totalCostUsd,
    costIfAllPremiumUsd,
    dollarsSavedUsd,
    percentageSaved,
  };
}

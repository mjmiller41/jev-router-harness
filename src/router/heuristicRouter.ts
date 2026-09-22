import crypto from 'node:crypto';
import { IModelRouter } from './index.js';
import { ModelRegistry } from './modelRegistry.js';
import { RouteRequest, RouteResult, ModelCandidate, ModelTier } from '../types/index.js';

export class HeuristicRouter implements IModelRouter {
  private registry: ModelRegistry;

  constructor(registry?: ModelRegistry) {
    this.registry = registry || new ModelRegistry();
  }

  public async route(request: RouteRequest): Promise<RouteResult> {
    const decisionId = crypto.randomUUID();

    // 1. Explicit model override
    if (request.modelOverride && request.modelOverride !== 'auto') {
      const candidate = this.registry.getModel(request.modelOverride);
      return {
        decisionId,
        selectedModel: request.modelOverride,
        selectedTier: candidate?.tier || 'premium',
        candidateModels: [request.modelOverride],
        complexityScore: 1.0,
        confidence: 1.0,
        reasoning: `User explicit override for model: ${request.modelOverride}`,
        isFallback: false,
        estimatedCostUsd: (candidate?.costPer1kInputTokensUsd || 0.002) * 1.5,
      };
    }

    // 2. Score complexity
    const complexityScore = this.calculateComplexity(request.prompt, request.contextTokens || 0);

    // 3. Determine tier based on score or preference
    let tier: ModelTier;
    if (request.sessionTierPreference && request.sessionTierPreference !== 'auto') {
      tier = request.sessionTierPreference;
    } else if (complexityScore > 0.7) {
      tier = 'premium';
    } else if (complexityScore >= 0.35) {
      tier = 'budget';
    } else {
      tier = 'free';
    }

    // 4. Select candidate model within tier
    const candidates = this.registry.getModelsByTier(tier, true);
    let selectedModel = candidates[0];

    // Fallback if no available model in tier
    let isFallback = false;
    if (!selectedModel) {
      isFallback = true;
      const allAvailable = this.registry.getAllModels().filter((m) => m.isAvailable);
      selectedModel = allAvailable[0] || this.registry.getAllModels()[0];
      tier = selectedModel.tier;
    }

    const estimatedCost =
      selectedModel.costPer1kInputTokensUsd * 0.5 + selectedModel.costPer1kOutputTokensUsd * 1.0;

    return {
      decisionId,
      selectedModel: selectedModel.id,
      selectedTier: tier,
      candidateModels: candidates.map((m) => m.id),
      complexityScore,
      confidence: 0.92,
      reasoning: `Heuristic classifier scored complexity=${complexityScore.toFixed(2)} mapped to ${tier} tier`,
      isFallback,
      estimatedCostUsd: estimatedCost,
    };
  }

  public registerModel(model: ModelCandidate): void {
    this.registry.registerModel(model);
  }

  public async reportModelFailure(modelId: string, error: Error): Promise<RouteResult> {
    this.registry.setModelAvailability(modelId, false);
    const decisionId = crypto.randomUUID();

    // Pick next available model
    const available = this.registry.getAllModels().filter((m) => m.isAvailable && m.id !== modelId);
    const fallback =
      available.find((m) => m.tier === 'budget') || available[0] || this.registry.getAllModels()[0];

    return {
      decisionId,
      selectedModel: fallback.id,
      selectedTier: fallback.tier,
      candidateModels: available.map((m) => m.id),
      complexityScore: 0.5,
      confidence: 0.85,
      reasoning: `Automated fallback triggered from ${modelId} failure: ${error.message}`,
      isFallback: true,
      estimatedCostUsd:
        fallback.costPer1kInputTokensUsd * 0.5 + fallback.costPer1kOutputTokensUsd * 1.0,
    };
  }

  public getAvailableModels(): ModelCandidate[] {
    return this.registry.getAllModels().filter((m) => m.isAvailable);
  }

  private calculateComplexity(prompt: string, contextTokens: number): number {
    const text = prompt.toLowerCase();
    let score = 0.15; // baseline for simple questions

    // Word count & token heuristics
    const wordCount = prompt.trim().split(/\s+/).length;
    if (wordCount > 150) score += 0.25;
    else if (wordCount > 60) score += 0.15;

    // Context weight
    if (contextTokens > 10000) score += 0.25;
    else if (contextTokens > 3000) score += 0.15;

    // High complexity architectural / reasoning markers
    const premiumKeywords = [
      'architect',
      'consensus',
      'distributed',
      'proof',
      'invariant',
      'formal verification',
      'compiler',
      'concurrency',
      'memory leak',
      'vulnerability',
      'cryptographic',
      'zero-knowledge',
    ];
    const premiumMatches = premiumKeywords.filter((kw) => text.includes(kw)).length;
    if (premiumMatches > 0) {
      score += Math.min(0.65, 0.35 + (premiumMatches - 1) * 0.15);
    }

    // Medium complexity / budget keywords
    const budgetKeywords = [
      'refactor',
      'performance',
      'trade-offs',
      'optimize',
      'sql query',
      'database schema',
      'unit test',
      'api integration',
      'debug',
    ];
    const budgetMatches = budgetKeywords.filter((kw) => text.includes(kw)).length;
    if (budgetMatches > 0) {
      score += Math.min(0.35, 0.2 + (budgetMatches - 1) * 0.08);
    }

    // Code blocks presence
    if (prompt.includes('```') || prompt.includes('function ') || prompt.includes('class ')) {
      score += 0.15;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }
}

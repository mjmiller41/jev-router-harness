import { IModelRouter } from '../../src/router/index.js';
import { RouteRequest, RouteResult, ModelCandidate } from '../../src/types/index.js';
import { DEFAULT_MODEL_CANDIDATES } from '../../src/router/modelRegistry.js';

export class MockRouterProvider implements IModelRouter {
  public routeCalls: RouteRequest[] = [];
  public forcedComplexity?: number;
  public candidateModels: ModelCandidate[] = [...DEFAULT_MODEL_CANDIDATES];

  constructor(forcedComplexity?: number) {
    this.forcedComplexity = forcedComplexity;
  }

  public async route(request: RouteRequest): Promise<RouteResult> {
    this.routeCalls.push(request);

    if (request.modelOverride) {
      return {
        decisionId: 'mock-override-id',
        selectedModel: request.modelOverride,
        selectedTier: 'premium',
        candidateModels: [request.modelOverride],
        complexityScore: 1.0,
        confidence: 1.0,
        reasoning: 'Explicit user override in mock',
        isFallback: false,
        estimatedCostUsd: 0.005,
      };
    }

    const complexity =
      this.forcedComplexity ??
      (request.prompt.toLowerCase().includes('complex') || request.prompt.toLowerCase().includes('architect')
        ? 0.85
        : request.prompt.toLowerCase().includes('explain') || request.prompt.toLowerCase().includes('refactor')
        ? 0.5
        : 0.2);

    let tier: 'free' | 'budget' | 'premium' = 'free';
    let model = 'gemini-2.5-flash';
    let cost = 0.0;

    if (complexity > 0.7 || request.sessionTierPreference === 'premium') {
      tier = 'premium';
      model = 'claude-3-5-sonnet';
      cost = 0.008;
    } else if (complexity >= 0.35 || request.sessionTierPreference === 'budget') {
      tier = 'budget';
      model = 'gpt-4o-mini';
      cost = 0.0004;
    }

    return {
      decisionId: 'mock-decision-' + Math.random().toString(36).substring(7),
      selectedModel: model,
      selectedTier: tier,
      candidateModels: this.candidateModels.map((m) => m.id),
      complexityScore: complexity,
      confidence: 0.95,
      reasoning: `Mock evaluated complexity=${complexity} assigned to ${tier}`,
      isFallback: false,
      estimatedCostUsd: cost,
    };
  }

  public registerModel(model: ModelCandidate): void {
    this.candidateModels.push(model);
  }

  public async reportModelFailure(modelId: string, error: Error): Promise<RouteResult> {
    return {
      decisionId: 'mock-fallback-' + Math.random().toString(36).substring(7),
      selectedModel: 'gemini-2.5-flash-paid',
      selectedTier: 'budget',
      candidateModels: this.candidateModels.map((m) => m.id),
      complexityScore: 0.5,
      confidence: 0.8,
      reasoning: `Fallback triggered from ${modelId}: ${error.message}`,
      isFallback: true,
      estimatedCostUsd: 0.0002,
    };
  }

  public getAvailableModels(): ModelCandidate[] {
    return this.candidateModels;
  }
}

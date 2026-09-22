import crypto from 'node:crypto';
import { IModelRouter } from './index.js';
import { ModelRegistry } from './modelRegistry.js';
import { HeuristicRouter } from './heuristicRouter.js';
import { RouteRequest, RouteResult, ModelCandidate, ModelTier } from '../types/index.js';

export interface JevRouterOptions {
  apiKey?: string;
  registry?: ModelRegistry;
  endpoint?: string;
}

export class JevRouter implements IModelRouter {
  private apiKey?: string;
  private endpoint: string;
  private registry: ModelRegistry;
  private fallbackRouter: HeuristicRouter;

  constructor(options: JevRouterOptions = {}) {
    this.apiKey = options.apiKey || process.env.TYPESAFE_AI_API_KEY;
    this.endpoint = options.endpoint || 'https://api.typesafe.ai/v1/decisions';
    this.registry = options.registry || new ModelRegistry();
    this.fallbackRouter = new HeuristicRouter(this.registry);
  }

  public async route(request: RouteRequest): Promise<RouteResult> {
    // If no API key configured, seamlessly route through heuristic classifier
    if (!this.apiKey) {
      return this.fallbackRouter.route(request);
    }

    try {
      // Call typesafe-ai/jev decision model endpoint
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'typesafe-ai/jev',
          schema: {
            complexityScore: 'number (0.0 to 1.0)',
            tier: "'free' | 'budget' | 'premium'",
            reasoning: 'string',
            confidence: 'number (0.0 to 1.0)',
          },
          input: {
            prompt: request.prompt,
            contextTokens: request.contextTokens || 0,
            tierPreference: request.sessionTierPreference || 'auto',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Jev API returned status ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        complexityScore: number;
        tier: ModelTier;
        reasoning: string;
        confidence: number;
      };

      const tier =
        request.sessionTierPreference && request.sessionTierPreference !== 'auto'
          ? request.sessionTierPreference
          : data.tier || 'free';

      const candidates = this.registry.getModelsByTier(tier, true);
      const selectedModel = candidates[0] || this.registry.getAllModels()[0];

      return {
        decisionId: crypto.randomUUID(),
        selectedModel: request.modelOverride || selectedModel.id,
        selectedTier: tier,
        candidateModels: candidates.map((m) => m.id),
        complexityScore: data.complexityScore,
        confidence: data.confidence,
        reasoning: `typesafe-ai/jev classified: ${data.reasoning}`,
        isFallback: false,
        estimatedCostUsd:
          selectedModel.costPer1kInputTokensUsd * 0.5 +
          selectedModel.costPer1kOutputTokensUsd * 1.0,
      };
    } catch {
      // Fallback on network/API failure
      const fallbackResult = await this.fallbackRouter.route(request);
      fallbackResult.isFallback = true;
      fallbackResult.reasoning = `[Offline Fallback] ${fallbackResult.reasoning}`;
      return fallbackResult;
    }
  }

  public registerModel(model: ModelCandidate): void {
    this.registry.registerModel(model);
    this.fallbackRouter.registerModel(model);
  }

  public async reportModelFailure(modelId: string, error: Error): Promise<RouteResult> {
    return this.fallbackRouter.reportModelFailure(modelId, error);
  }

  public getAvailableModels(): ModelCandidate[] {
    return this.registry.getAllModels().filter((m) => m.isAvailable);
  }
}

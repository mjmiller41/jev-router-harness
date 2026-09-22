import { ModelCandidate, ModelTier } from '../types/index.js';

export const DEFAULT_MODEL_CANDIDATES: ModelCandidate[] = [
  // Free Tier
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Free Tier)',
    provider: 'google',
    tier: 'free',
    contextWindow: 1048576,
    costPer1kInputTokensUsd: 0.0,
    costPer1kOutputTokensUsd: 0.0,
    isAvailable: true,
  },
  {
    id: 'groq/llama-3.1-8b-instant',
    name: 'Groq Llama 3.1 8B Instant',
    provider: 'groq',
    tier: 'free',
    contextWindow: 131072,
    costPer1kInputTokensUsd: 0.0,
    costPer1kOutputTokensUsd: 0.0,
    isAvailable: true,
  },
  {
    id: 'ollama/llama3',
    name: 'Ollama Local Llama 3',
    provider: 'ollama',
    tier: 'free',
    contextWindow: 8192,
    costPer1kInputTokensUsd: 0.0,
    costPer1kOutputTokensUsd: 0.0,
    isAvailable: false,
  },

  // Budget Tier
  {
    id: 'gemini-2.5-flash-paid',
    name: 'Gemini 2.5 Flash (Paid)',
    provider: 'google',
    tier: 'budget',
    contextWindow: 1048576,
    costPer1kInputTokensUsd: 0.000075,
    costPer1kOutputTokensUsd: 0.0003,
    isAvailable: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    tier: 'budget',
    contextWindow: 128000,
    costPer1kInputTokensUsd: 0.00015,
    costPer1kOutputTokensUsd: 0.0006,
    isAvailable: true,
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    tier: 'budget',
    contextWindow: 200000,
    costPer1kInputTokensUsd: 0.0008,
    costPer1kOutputTokensUsd: 0.004,
    isAvailable: true,
  },

  // Premium Tier
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    tier: 'premium',
    contextWindow: 200000,
    costPer1kInputTokensUsd: 0.003,
    costPer1kOutputTokensUsd: 0.015,
    isAvailable: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'premium',
    contextWindow: 128000,
    costPer1kInputTokensUsd: 0.0025,
    costPer1kOutputTokensUsd: 0.01,
    isAvailable: true,
  },
];

export class ModelRegistry {
  private models: Map<string, ModelCandidate> = new Map();

  constructor(initialModels: ModelCandidate[] = DEFAULT_MODEL_CANDIDATES) {
    for (const model of initialModels) {
      this.models.set(model.id, { ...model });
    }
  }

  public getModel(id: string): ModelCandidate | undefined {
    return this.models.get(id);
  }

  public getAllModels(): ModelCandidate[] {
    return Array.from(this.models.values());
  }

  public getModelsByTier(tier: ModelTier, availableOnly = true): ModelCandidate[] {
    return this.getAllModels().filter((m) => m.tier === tier && (!availableOnly || m.isAvailable));
  }

  public registerModel(model: ModelCandidate): void {
    this.models.set(model.id, { ...model });
  }

  public setModelAvailability(id: string, isAvailable: boolean): void {
    const existing = this.models.get(id);
    if (existing) {
      existing.isAvailable = isAvailable;
    }
  }
}

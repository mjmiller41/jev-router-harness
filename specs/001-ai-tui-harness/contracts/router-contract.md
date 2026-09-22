# Contract: Dynamic Model Router (`typesafe-ai/jev`)

**Date**: 2026-09-22  
**Feature**: [spec.md](../spec.md)

## Interface: `IModelRouter`

```typescript
export type ModelTier = 'free' | 'budget' | 'premium';

export interface RouteRequest {
  prompt: string;
  contextTokens: number;
  sessionTierPreference?: ModelTier | 'auto';
  modelOverride?: string | null;
  toolsRequired?: string[];
}

export interface ModelCandidate {
  id: string;
  provider: string;
  tier: ModelTier;
  contextWindow: number;
  costPer1kInputTokensUsd: number;
  costPer1kOutputTokensUsd: number;
  isAvailable: boolean;
}

export interface RouteResult {
  decisionId: string;
  selectedModel: string;
  selectedTier: ModelTier;
  candidateModels: string[];
  complexityScore: number; // 0.0 to 1.0
  confidence: number;      // 0.0 to 1.0
  reasoning: string;
  isFallback: boolean;
  estimatedCostUsd: number;
}

export interface IModelRouter {
  /**
   * Evaluates prompt and context to select the most cost-effective capable model.
   */
  route(request: RouteRequest): Promise<RouteResult>;

  /**
   * Registers or updates a model candidate in the routing pool.
   */
  registerModel(model: ModelCandidate): void;

  /**
   * Marks a model as temporarily unavailable (e.g. on rate-limit) and selects a fallback.
   */
  reportModelFailure(modelId: string, error: Error): Promise<RouteResult>;

  /**
   * Returns all currently active model candidates by tier.
   */
  getAvailableModels(): ModelCandidate[];
}
```

## Routing Algorithm Semantics

1. **Explicit Override**: If `request.modelOverride` is set, the router bypasses evaluation and returns the target model with complexity `1.0` and reasoning `"User explicit override"`.
2. **System-One Evaluation (`typesafe-ai/jev`)**:
   - The router sends the prompt to the `typesafe-ai/jev` decision model.
   - Evaluates:
     - `complexityScore` (<0.35: low/routine, 0.35–0.70: medium/budget, >0.70: high/premium)
     - Required capabilities (e.g., code generation, tool calling, multi-step math)
     - Context window compatibility.
3. **Tier Matching**:
   - **Score < 0.35**: Maps to `free` tier candidates (Gemini 2.5 Flash free tier, Groq Llama 3 8B, local Ollama).
   - **Score 0.35 – 0.70**: Maps to `budget` tier candidates (Gemini 2.5 Flash paid, GPT-4o-mini, Claude 3.5 Haiku).
   - **Score > 0.70**: Maps to `premium` tier candidates (Claude 3.5 Sonnet, GPT-4o).
4. **Fallback Handling**:
   - If the selected model fails with HTTP 429 / 5xx, `reportModelFailure` automatically switches to the next available candidate within the tier, or escalates one tier up, flagging `isFallback: true`.

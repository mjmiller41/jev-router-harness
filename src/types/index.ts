import { z } from 'zod';

export const ModelTierSchema = z.enum(['free', 'budget', 'premium']);
export type ModelTier = z.infer<typeof ModelTierSchema>;

export const SessionStatusSchema = z.enum(['active', 'paused', 'terminated']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system', 'tool']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MemoryCategorySchema = z.enum(['preference', 'project-rule', 'entity-fact']);
export type MemoryCategory = z.infer<typeof MemoryCategorySchema>;

export const RoutingDecisionSchema = z.object({
  id: z.string().uuid(),
  promptComplexityScore: z.number().min(0.0).max(1.0),
  selectedTier: ModelTierSchema,
  selectedModel: z.string().min(1),
  candidateModels: z.array(z.string()).min(1),
  reasoning: z.string().min(1),
  confidence: z.number().min(0.0).max(1.0),
  isFallback: z.boolean().default(false),
  estimatedCostUsd: z.number().min(0.0),
});
export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

export const TokenUsageSchema = z.object({
  input: z.number().int().nonnegative(),
  output: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const MessageTurnSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  turnIndex: z.number().int().nonnegative(),
  role: MessageRoleSchema,
  content: z.string(),
  timestamp: z.string().datetime(),
  routingDecision: RoutingDecisionSchema.nullable().default(null),
  tokenUsage: TokenUsageSchema,
  durationMs: z.number().nonnegative(),
});
export type MessageTurn = z.infer<typeof MessageTurnSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().default('New Session'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  activeModelOverride: z.string().nullable().default(null),
  totalInputTokens: z.number().int().nonnegative().default(0),
  totalOutputTokens: z.number().int().nonnegative().default(0),
  totalCostUsd: z.number().nonnegative().default(0.0),
  status: SessionStatusSchema.default('active'),
});
export type Session = z.infer<typeof SessionSchema>;

export const ContextWindowSchema = z.object({
  sessionId: z.string().uuid(),
  maxTokens: z.number().int().positive(),
  currentTokens: z.number().int().nonnegative(),
  compactionThreshold: z.number().min(0.1).max(1.0).default(0.75),
  uncompactedTurns: z.array(MessageTurnSchema),
  summaryBlock: z.string().nullable().default(null),
  compactionCount: z.number().int().nonnegative().default(0),
});
export type ContextWindow = z.infer<typeof ContextWindowSchema>;

export const MemoryItemSchema = z.object({
  id: z.string().uuid(),
  key: z
    .string()
    .regex(/^[a-z0-9-_]{3,64}$/, 'Key must be 3-64 kebab-case alphanumeric characters'),
  category: MemoryCategorySchema,
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  accessCount: z.number().int().nonnegative().default(0),
  tags: z.array(z.string()).default([]),
});
export type MemoryItem = z.infer<typeof MemoryItemSchema>;

export const TelemetryRecordSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  turnIndex: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
  model: z.string(),
  tier: ModelTierSchema,
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  decisionLatencyMs: z.number().nonnegative(),
  generationLatencyMs: z.number().nonnegative(),
  costUsd: z.number().nonnegative(),
  interrupted: z.boolean().default(false),
});
export type TelemetryRecord = z.infer<typeof TelemetryRecordSchema>;

export interface ModelCandidate {
  id: string;
  name: string;
  provider: string;
  tier: ModelTier;
  contextWindow: number;
  costPer1kInputTokensUsd: number;
  costPer1kOutputTokensUsd: number;
  isAvailable: boolean;
}

export interface RouteRequest {
  prompt: string;
  contextTokens?: number;
  sessionTierPreference?: ModelTier | 'auto';
  modelOverride?: string | null;
  toolsRequired?: string[];
}

export interface RouteResult {
  decisionId: string;
  selectedModel: string;
  selectedTier: ModelTier;
  candidateModels: string[];
  complexityScore: number;
  confidence: number;
  reasoning: string;
  isFallback: boolean;
  estimatedCostUsd: number;
}

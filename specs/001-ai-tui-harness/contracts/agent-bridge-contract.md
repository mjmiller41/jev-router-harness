# Contract: Vercel Eve Agent Bridge

**Date**: 2026-09-22  
**Feature**: [spec.md](../spec.md)

## Interface: `IEveAgentBridge`

The Eve Agent Bridge mediates between the filesystem-first Vercel `eve` runtime and the interactive TUI presentation layer, enforcing strict decoupling.

```typescript
export interface AgentTurnInput {
  sessionId: string;
  prompt: string;
  selectedModel: string;
  workingContext: string[];
  persistentMemories: string[];
  abortSignal: AbortSignal;
}

export type AgentEventType =
  | 'step_start'
  | 'token_stream'
  | 'tool_call_start'
  | 'tool_call_finish'
  | 'step_finish'
  | 'error'
  | 'cancelled';

export interface AgentEvent {
  type: AgentEventType;
  timestamp: string;
  payload: {
    token?: string;
    stepIndex?: number;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    toolResult?: unknown;
    error?: Error;
    totalTokens?: { input: number; output: number };
  };
}

export interface IEveAgentBridge {
  /**
   * Initializes the Eve agent environment, discovering instructions.md and tools/.
   */
  initialize(agentDirectory: string): Promise<void>;

  /**
   * Dispatches a user prompt to the Eve agent loop and streams events back.
   */
  executeTurn(
    input: AgentTurnInput,
    onEvent: (event: AgentEvent) => void
  ): Promise<AgentTurnResult>;

  /**
   * Registers a custom dynamic tool in the Eve agent runtime.
   */
  registerTool(toolDefinition: ToolDefinition): void;
}

export interface AgentTurnResult {
  fullText: string;
  toolCallsExecuted: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  completedCleanly: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}
```

## Decoupling Invariants

1. **No UI Imports**: The `eve-bridge` module MUST NOT import any Ink, React, or terminal formatting code.
2. **Headless Execution**: The bridge must be 100% executable in a headless CLI or test environment.
3. **Cancellation Safety**: When `abortSignal` is triggered, the bridge MUST abort ongoing model streaming and tool executions, cleanly releasing any acquired resources.

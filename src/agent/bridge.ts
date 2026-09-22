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

export interface IEveAgentBridge {
  initialize(agentDirectory?: string): Promise<void>;
  executeTurn(
    input: AgentTurnInput,
    onEvent: (event: AgentEvent) => void
  ): Promise<AgentTurnResult>;
  registerTool(toolDefinition: ToolDefinition): void;
}

export class EveAgentBridge implements IEveAgentBridge {
  private tools: Map<string, ToolDefinition> = new Map();
  private initialized = false;

  public async initialize(_agentDirectory?: string): Promise<void> {
    this.initialized = true;
  }

  public registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public async executeTurn(
    input: AgentTurnInput,
    onEvent: (event: AgentEvent) => void
  ): Promise<AgentTurnResult> {
    const startTime = Date.now();

    onEvent({
      type: 'step_start',
      timestamp: new Date().toISOString(),
      payload: { stepIndex: 0 },
    });

    if (input.abortSignal.aborted) {
      onEvent({
        type: 'cancelled',
        timestamp: new Date().toISOString(),
        payload: {},
      });
      return {
        fullText: '',
        toolCallsExecuted: 0,
        inputTokens: 0,
        outputTokens: 0,
        durationMs: Date.now() - startTime,
        completedCleanly: false,
      };
    }

    try {
      // Stream tokens using synthetic/streaming generator or AI SDK stream
      let fullText = '';
      let outputTokens = 0;
      const estimatedInputTokens = Math.max(10, Math.round(input.prompt.length / 4));

      // Build simulated response incorporating model and memory context
      const memoryNotice =
        input.persistentMemories.length > 0
          ? `[Applied ${input.persistentMemories.length} persistent preferences] `
          : '';

      const baseResponse = `${memoryNotice}Response routed to ${input.selectedModel}: Here is the requested analysis and solution for "${input.prompt}".`;
      const words = baseResponse.split(' ');

      for (const word of words) {
        if (input.abortSignal.aborted) {
          onEvent({
            type: 'cancelled',
            timestamp: new Date().toISOString(),
            payload: {},
          });
          return {
            fullText,
            toolCallsExecuted: 0,
            inputTokens: estimatedInputTokens,
            outputTokens,
            durationMs: Date.now() - startTime,
            completedCleanly: false,
          };
        }

        const token = word + ' ';
        fullText += token;
        outputTokens += 1;

        onEvent({
          type: 'token_stream',
          timestamp: new Date().toISOString(),
          payload: { token },
        });

        // Small delay to simulate realistic streaming
        await new Promise((resolve) => setTimeout(resolve, 8));
      }

      onEvent({
        type: 'step_finish',
        timestamp: new Date().toISOString(),
        payload: {
          stepIndex: 0,
          totalTokens: { input: estimatedInputTokens, output: outputTokens },
        },
      });

      return {
        fullText: fullText.trim(),
        toolCallsExecuted: 0,
        inputTokens: estimatedInputTokens,
        outputTokens,
        durationMs: Date.now() - startTime,
        completedCleanly: true,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onEvent({
        type: 'error',
        timestamp: new Date().toISOString(),
        payload: { error },
      });
      return {
        fullText: '',
        toolCallsExecuted: 0,
        inputTokens: 0,
        outputTokens: 0,
        durationMs: Date.now() - startTime,
        completedCleanly: false,
      };
    }
  }
}

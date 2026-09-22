import {
  AgentTurnInput,
  AgentEvent,
  AgentTurnResult,
  IEveAgentBridge,
} from '../../src/agent/bridge.js';

export class MockEveAgent implements IEveAgentBridge {
  public mockResponseText = 'Mock assistant response from offline Eve agent.';
  public streamTokens = true;
  public tokenDelayMs = 5;

  public async initialize(_agentDirectory: string): Promise<void> {
    // Initialized
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

    // Check cancellation before start
    if (input.abortSignal.aborted) {
      onEvent({
        type: 'cancelled',
        timestamp: new Date().toISOString(),
        payload: {},
      });
      return {
        fullText: '',
        toolCallsExecuted: 0,
        inputTokens: 10,
        outputTokens: 0,
        durationMs: Date.now() - startTime,
        completedCleanly: false,
      };
    }

    const words = this.mockResponseText.split(' ');
    let outputTokens = 0;
    let accumulatedText = '';

    for (const word of words) {
      if (input.abortSignal.aborted) {
        onEvent({
          type: 'cancelled',
          timestamp: new Date().toISOString(),
          payload: {},
        });
        return {
          fullText: accumulatedText,
          toolCallsExecuted: 0,
          inputTokens: 15,
          outputTokens,
          durationMs: Date.now() - startTime,
          completedCleanly: false,
        };
      }

      const token = word + ' ';
      accumulatedText += token;
      outputTokens += 1;

      onEvent({
        type: 'token_stream',
        timestamp: new Date().toISOString(),
        payload: { token },
      });

      if (this.streamTokens && this.tokenDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.tokenDelayMs));
      }
    }

    onEvent({
      type: 'step_finish',
      timestamp: new Date().toISOString(),
      payload: {
        stepIndex: 0,
        totalTokens: { input: 20, output: outputTokens },
      },
    });

    return {
      fullText: accumulatedText.trim(),
      toolCallsExecuted: 0,
      inputTokens: 20,
      outputTokens,
      durationMs: Date.now() - startTime,
      completedCleanly: true,
    };
  }

  public registerTool(): void {
    // No-op for mock
  }
}

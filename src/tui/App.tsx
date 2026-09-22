import React, { useState, useRef, useCallback } from 'react';
import { Box, Text, useApp } from 'ink';
import { PromptInput } from './components/PromptInput.js';
import { MessageStream, DisplayMessage } from './components/MessageStream.js';
import { StatusBar } from './components/StatusBar.js';
import { useKeybindings } from './hooks/useKeybindings.js';
import { useTerminalResize } from './hooks/useTerminalResize.js';
import { IModelRouter } from '../router/index.js';
import { IEveAgentBridge } from '../agent/bridge.js';
import { defaultLogger } from '../telemetry/logger.js';
import {
  calculateTurnCost,
  calculateSessionMetrics,
  calculateCostSavingsVsPremium,
} from '../telemetry/costCalculator.js';
import { ContextManager } from '../memory/contextManager.js';
import { defaultMemoryStore } from '../memory/persistentStore.js';
import crypto from 'node:crypto';

export interface AppProps {
  router: IModelRouter;
  agentBridge: IEveAgentBridge;
  initialModel?: string;
  initialTier?: string;
  initialPrompt?: string;
  dryRun?: boolean;
}

export const App: React.FC<AppProps> = ({
  router,
  agentBridge,
  initialModel = 'auto',
  initialTier = 'auto',
  initialPrompt,
  dryRun = false,
}) => {
  const { exit } = useApp();
  const { columns, rows } = useTerminalResize();
  const sessionId = useRef(crypto.randomUUID()).current;

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeModel, setActiveModel] = useState(initialModel);
  const [activeTier, setActiveTier] = useState(initialTier);
  const [statusText, setStatusText] = useState('Ready');
  const [sessionCost, setSessionCost] = useState(0.0);
  const [totalTokens, setTotalTokens] = useState(0);

  const contextManagerRef = useRef(
    new ContextManager({ maxTokens: 32000, compactionThreshold: 0.75 })
  );
  const [contextRatio, setContextRatio] = useState(0.0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatusText('Cancelled by user');
      setIsGenerating(false);
    }
  }, []);

  useKeybindings({
    isGenerating,
    onAbort: handleAbort,
    onClearScreen: () => setMessages([]),
    onExit: () => exit(),
  });

  const handlePromptSubmit = async (promptText: string) => {
    if (isGenerating) return;

    // Handle slash commands
    if (promptText.startsWith('/')) {
      const parts = promptText.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();

      if (cmd === '/exit' || cmd === '/quit') {
        exit();
        return;
      }
      if (cmd === '/clear') {
        setMessages([]);
        return;
      }
      if (cmd === '/context') {
        const ctxStatus = contextManagerRef.current.getStatus();
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Context Status:\n  Tokens: ${ctxStatus.currentTokens} / ${ctxStatus.maxTokens} (${(ctxStatus.utilizationRatio * 100).toFixed(1)}%)\n  Uncompacted turns: ${ctxStatus.uncompactedTurnCount}\n  Compaction passes: ${ctxStatus.compactionPasses}\n  Compaction needed: ${ctxStatus.isCompactionNeeded ? 'YES' : 'NO'}`,
          },
        ]);
        return;
      }
      if (cmd === '/compact') {
        await contextManagerRef.current.compact();
        const updated = contextManagerRef.current.getStatus();
        setContextRatio(updated.utilizationRatio);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Context compacted. Active turns: ${updated.uncompactedTurnCount}, Total tokens: ${updated.currentTokens}`,
          },
        ]);
        return;
      }
      if (cmd === '/memory') {
        const subcmd = parts[1]?.toLowerCase();
        if (subcmd === 'add' && parts[2]) {
          const key = parts[2];
          const content = parts.slice(3).join(' ');
          await defaultMemoryStore.set({
            key,
            category: 'preference',
            content,
            tags: [],
          });
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: 'system', content: `Memory saved: "${key}"` },
          ]);
          return;
        }
        if (subcmd === 'del' && parts[2]) {
          const deleted = await defaultMemoryStore.delete(parts[2]);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'system',
              content: deleted ? `Memory deleted: "${parts[2]}"` : `Key not found: "${parts[2]}"`,
            },
          ]);
          return;
        }
        if (subcmd === 'clear') {
          await defaultMemoryStore.clear();
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'system',
              content: 'All persistent memories cleared.',
            },
          ]);
          return;
        }
        // Default: list memories
        const allMemories = await defaultMemoryStore.query();
        const formattedList =
          allMemories.length === 0
            ? 'No persistent memories found. Use /memory add <key> <content>'
            : allMemories
                .map((m) => `• [${m.category}] ${m.key}: ${m.content} (accessed ${m.accessCount}x)`)
                .join('\n');
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Persistent Memories (${allMemories.length}):\n${formattedList}`,
          },
        ]);
        return;
      }
      if (cmd === '/telemetry') {
        const records = defaultLogger.readRecords(sessionId);
        const metrics = calculateSessionMetrics(records);
        const savings = calculateCostSavingsVsPremium(metrics);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Session Telemetry Summary:\n  Total Turns: ${metrics.totalTurns} (Free: ${metrics.freeTurns}, Budget: ${metrics.budgetTurns}, Premium: ${metrics.premiumTurns})\n  Total Tokens: In=${metrics.totalInputTokens.toLocaleString()}, Out=${metrics.totalOutputTokens.toLocaleString()}\n  Incurred Cost: $${savings.totalCostUsd.toFixed(4)} USD\n  Cost If Premium: $${savings.costIfAllPremiumUsd.toFixed(4)} USD\n  Savings: $${savings.dollarsSavedUsd.toFixed(4)} USD (${savings.percentageSaved}% saved)`,
          },
        ]);
        return;
      }
      if (cmd === '/help') {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content:
              'Commands:\n  /exit - Quit harness\n  /clear - Clear screen\n  /context - View token headroom\n  /compact - Force context compaction\n  /memory list - View persistent memories\n  /memory add <key> <content> - Add rule/preference\n  /memory del <key> - Delete memory\n  /telemetry - View session cost and token metrics\n  /model <name> - Override model\n  /tier <name> - Override tier\n  /help - Show help',
          },
        ]);
        return;
      }
      if (cmd === '/model' && parts[1]) {
        setActiveModel(parts[1]);
        setStatusText(`Model set to: ${parts[1]}`);
        return;
      }
      if (cmd === '/tier' && parts[1]) {
        setActiveTier(parts[1]);
        setStatusText(`Tier set to: ${parts[1]}`);
        return;
      }
    }

    setPromptHistory((prev) => [...prev, promptText]);
    const userMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: promptText }]);

    setIsGenerating(true);
    setStreamingContent('');
    setStatusText('Evaluating prompt...');

    try {
      // 1. Route the prompt through IModelRouter (typesafe-ai/jev)
      const routeResult = await router.route({
        prompt: promptText,
        modelOverride: activeModel !== 'auto' ? activeModel : undefined,
        sessionTierPreference: (activeTier !== 'auto' ? activeTier : undefined) as any,
      });

      setActiveModel(routeResult.selectedModel);
      setActiveTier(routeResult.selectedTier);
      setStatusText(`Streaming from ${routeResult.selectedModel}...`);

      if (dryRun) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: `[Dry Run] Routed to ${routeResult.selectedModel} (${routeResult.selectedTier}) | Complexity: ${routeResult.complexityScore.toFixed(2)} | Reasoning: ${routeResult.reasoning}`,
          },
        ]);
        setIsGenerating(false);
        setStatusText('Ready');
        return;
      }

      // 2. Prepare execution with EveAgentBridge
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let accumulatedTokens = '';

      const memories = await defaultMemoryStore.query();
      const memoryContents = memories.map((m) => m.content);

      const turnResult = await agentBridge.executeTurn(
        {
          sessionId,
          prompt: promptText,
          selectedModel: routeResult.selectedModel,
          workingContext: messages.map((m) => m.content),
          persistentMemories: memoryContents,
          abortSignal: abortController.signal,
        },
        (event) => {
          if (event.type === 'token_stream' && event.payload.token) {
            accumulatedTokens += event.payload.token;
            setStreamingContent(accumulatedTokens);
          }
        }
      );

      setIsGenerating(false);
      setStreamingContent('');

      if (turnResult.completedCleanly) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: turnResult.fullText,
            model: routeResult.selectedModel,
            tier: routeResult.selectedTier,
          },
        ]);

        const turnTokens = turnResult.inputTokens + turnResult.outputTokens;
        const turnCost = calculateTurnCost(
          routeResult.selectedModel,
          turnResult.inputTokens,
          turnResult.outputTokens
        );
        setTotalTokens((prev) => prev + turnTokens);
        setSessionCost((prev) => prev + turnCost);
        setStatusText(`Ready (turn took ${turnResult.durationMs}ms)`);

        // Update context manager
        contextManagerRef.current.addTurn({
          role: 'user',
          content: promptText,
          tokens: turnResult.inputTokens,
        });
        contextManagerRef.current.addTurn({
          role: 'assistant',
          content: turnResult.fullText,
          tokens: turnResult.outputTokens,
        });
        if (contextManagerRef.current.shouldCompact()) {
          await contextManagerRef.current.compact();
        }
        setContextRatio(contextManagerRef.current.getStatus().utilizationRatio);

        // Record telemetry
        defaultLogger.logTurn({
          id: crypto.randomUUID(),
          sessionId,
          turnIndex: messages.length,
          timestamp: new Date().toISOString(),
          model: routeResult.selectedModel,
          tier: routeResult.selectedTier,
          inputTokens: turnResult.inputTokens,
          outputTokens: turnResult.outputTokens,
          decisionLatencyMs: 12,
          generationLatencyMs: turnResult.durationMs,
          costUsd: turnCost,
          interrupted: false,
        });
      }
    } catch (err) {
      setIsGenerating(false);
      setStreamingContent('');
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatusText(`Error: ${errorMsg}`);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'system', content: `⚠️ Error: ${errorMsg}` },
      ]);
    }
  };

  // Process initial prompt on mount if provided
  React.useEffect(() => {
    if (initialPrompt) {
      handlePromptSubmit(initialPrompt);
    }
  }, []);

  return (
    <Box flexDirection="column" paddingX={1} width={columns} minHeight={Math.min(rows, 15)}>
      <Box borderStyle="bold" borderColor="blue" paddingX={1} marginBottom={1}>
        <Text bold color="blueBright">
          ⚡ Jev Router Harness
        </Text>
        <Text color="gray"> | Cost-Optimized AI TUI (Eve + typesafe-ai/jev)</Text>
      </Box>

      <MessageStream
        messages={messages}
        streamingContent={streamingContent}
        activeModel={activeModel}
        isStreaming={isGenerating}
      />

      <PromptInput
        onSubmit={handlePromptSubmit}
        isDisabled={isGenerating}
        history={promptHistory}
      />

      <StatusBar
        model={activeModel}
        tier={activeTier}
        sessionCost={sessionCost}
        totalTokens={totalTokens}
        contextUsageRatio={contextRatio}
        statusText={statusText}
      />
    </Box>
  );
};

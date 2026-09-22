import { estimateContextHeadroom, estimateTokenCount } from './tokenCounter.js';

export interface ContextTurn {
  role: string;
  content: string;
  tokens: number;
}

export interface ContextStatus {
  maxTokens: number;
  currentTokens: number;
  utilizationRatio: number;
  isCompactionNeeded: boolean;
  uncompactedTurnCount: number;
  compactionPasses: number;
}

export interface ContextManagerOptions {
  maxTokens?: number;
  compactionThreshold?: number;
  preserveRecentTurns?: number;
}

export interface IContextManager {
  addTurn(turn: ContextTurn): void;
  shouldCompact(): boolean;
  compact(summarizer?: (textToSummarize: string) => Promise<string>): Promise<void>;
  getFormattedContext(): Array<{ role: string; content: string }>;
  getStatus(): ContextStatus;
  reset(): void;
}

export class ContextManager implements IContextManager {
  private maxTokens: number;
  private compactionThreshold: number;
  private preserveRecentTurns: number;
  private turns: ContextTurn[] = [];
  private summaryBlock: string | null = null;
  private summaryTokens = 0;
  private compactionPasses = 0;

  constructor(options: ContextManagerOptions = {}) {
    this.maxTokens = options.maxTokens || 32000;
    this.compactionThreshold = options.compactionThreshold || 0.75;
    this.preserveRecentTurns = options.preserveRecentTurns || 4;
  }

  public addTurn(turn: ContextTurn): void {
    const tokens = turn.tokens > 0 ? turn.tokens : estimateTokenCount(turn.content);
    this.turns.push({ ...turn, tokens });
  }

  public shouldCompact(): boolean {
    const totalCurrent = this.calculateTotalTokens();
    const headroom = estimateContextHeadroom(
      totalCurrent,
      this.maxTokens,
      this.compactionThreshold
    );
    return headroom.isThresholdExceeded && this.turns.length > 1;
  }

  public async compact(summarizer?: (textToSummarize: string) => Promise<string>): Promise<void> {
    if (this.turns.length <= 1) {
      return;
    }

    const keepCount = Math.max(1, Math.min(this.preserveRecentTurns, this.turns.length - 1));
    const turnsToSummarize = this.turns.slice(0, this.turns.length - keepCount);
    const turnsToKeep = this.turns.slice(this.turns.length - keepCount);

    const rawTranscript = turnsToSummarize
      .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
      .join('\n\n');

    let newSummary: string;
    if (summarizer) {
      newSummary = await summarizer(rawTranscript);
    } else {
      newSummary = `[Summary of ${turnsToSummarize.length} previous turns]: Discussed user inquiries and assistant solutions.`;
    }

    if (this.summaryBlock) {
      this.summaryBlock = `${this.summaryBlock}\n\n${newSummary}`;
    } else {
      this.summaryBlock = newSummary;
    }

    this.summaryTokens = estimateTokenCount(this.summaryBlock);
    this.turns = turnsToKeep;
    this.compactionPasses += 1;
  }

  public getFormattedContext(): Array<{ role: string; content: string }> {
    const result: Array<{ role: string; content: string }> = [];

    if (this.summaryBlock) {
      result.push({
        role: 'system',
        content: `Consolidated Previous Context Summary:\n${this.summaryBlock}`,
      });
    }

    for (const turn of this.turns) {
      result.push({ role: turn.role, content: turn.content });
    }

    return result;
  }

  public getStatus(): ContextStatus {
    const current = this.calculateTotalTokens();
    const headroom = estimateContextHeadroom(current, this.maxTokens, this.compactionThreshold);

    return {
      maxTokens: this.maxTokens,
      currentTokens: current,
      utilizationRatio: headroom.utilizationRatio,
      isCompactionNeeded: headroom.isThresholdExceeded,
      uncompactedTurnCount: this.turns.length,
      compactionPasses: this.compactionPasses,
    };
  }

  public reset(): void {
    this.turns = [];
    this.summaryBlock = null;
    this.summaryTokens = 0;
    this.compactionPasses = 0;
  }

  private calculateTotalTokens(): number {
    const turnsTotal = this.turns.reduce((sum, t) => sum + t.tokens, 0);
    return turnsTotal + this.summaryTokens;
  }
}

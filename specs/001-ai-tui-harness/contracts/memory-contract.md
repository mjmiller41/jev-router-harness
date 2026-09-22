# Contract: Memory & Context Subsystem

**Date**: 2026-09-22  
**Feature**: [spec.md](../spec.md)

## 1. Context Window Manager (`IContextManager`)

```typescript
export interface ContextStatus {
  maxTokens: number;
  currentTokens: number;
  utilizationRatio: number; // 0.0 to 1.0
  isCompactionNeeded: boolean;
  uncompactedTurnCount: number;
  compactionPasses: number;
}

export interface IContextManager {
  /**
   * Adds a message turn to the working context and recalculates token budget.
   */
  addTurn(turn: { role: string; content: string; tokens: number }): void;

  /**
   * Checks if context utilization exceeds the threshold (e.g. 75%).
   */
  shouldCompact(): boolean;

  /**
   * Compacts older turns into a summary block while preserving recent uncompacted turns.
   */
  compact(summarizer: (textToSummarize: string) => Promise<string>): Promise<void>;

  /**
   * Returns formatted messages ready for model injection.
   */
  getFormattedContext(): Array<{ role: string; content: string }>;

  /**
   * Returns current token usage and headroom status.
   */
  getStatus(): ContextStatus;

  /**
   * Clears active conversation turns.
   */
  reset(): void;
}
```

---

## 2. Persistent Memory Store (`IPersistentMemoryStore`)

```typescript
export interface MemoryRecord {
  id: string;
  key: string;
  category: 'preference' | 'project-rule' | 'entity-fact';
  content: string;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  tags: string[];
}

export interface IPersistentMemoryStore {
  /**
   * Saves or updates a memory item. Writes atomically to disk.
   */
  set(item: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<MemoryRecord>;

  /**
   * Retrieves a memory item by exact key.
   */
  get(key: string): Promise<MemoryRecord | null>;

  /**
   * Queries memories by category or search keyword.
   */
  query(filter?: { category?: string; search?: string }): Promise<MemoryRecord[]>;

  /**
   * Deletes a memory item by key.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Deletes all stored memories.
   */
  clear(): Promise<void>;
}
```

## Atomic Write Guarantee

All persistent store modifications MUST use atomic write semantics:
```text
Write content to temp file -> fsync -> atomic rename temp file to target path
```
This guarantees zero file truncation or corrupted states upon sudden SIGINT or power loss.

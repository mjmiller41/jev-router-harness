# Phase 0 Research: AI TUI Router Harness

**Date**: 2026-09-22  
**Feature**: [spec.md](spec.md)

## Overview

This document resolves all technical decisions, integration patterns, and architectural unknowns required to implement the AI TUI Router Harness in strict compliance with the project Constitution (v1.0.0).

---

### Research Topic 1: Dynamic Model Routing with `typesafe-ai/jev`

- **Decision**: Integrate `typesafe-ai/jev` as a fast System-One decision classifier via the Vercel AI SDK (`ai` package) with a deterministic heuristic fallback when offline or when credentials are not configured.
- **Rationale**: 
  - `typesafe-ai/jev` specializes in fast, typed decision inference rather than conversational generation. It evaluates a prompt and outputs structured telemetry containing complexity tier (`free`, `budget`, `premium`), required reasoning capabilities, estimated output length, and confidence score.
  - Sub-second decision latency preserves the < 1.5s time-to-first-token goal (SC-001).
  - Prompts identified as low-complexity route immediately to zero-cost providers (e.g. Gemini Flash free tier, Groq free tier, local Ollama), meeting the requirement that ≥ 80% of routine queries incur zero or minimal cost (SC-002).
  - Escalation to premium models (e.g. Claude 3.5 Sonnet, GPT-4o) occurs deterministically only when complexity thresholds exceed budget bounds or when explicitly instructed by the user.
- **Alternatives Considered**:
  - *Regex / keyword heuristics alone*: Fast but brittle; fails on subtle reasoning queries, multi-turn contexts, or coding requests that require high accuracy.
  - *Full frontier LLM classification*: Using a large LLM to classify each prompt introduces 1-3 seconds of latency and substantial token costs, defeating the cost-optimization goal.
  - *Client-side embedded transformer (e.g. Xenova/transformers.js)*: Adds heavy native binary dependencies and memory overhead unsuitable for a nimble terminal harness.

---

### Research Topic 2: Agent Architecture via Vercel Eve Framework

- **Decision**: Adopt Vercel's `eve` framework as the underlying agent orchestration engine, utilizing its filesystem-first directory structure (`instructions.md`, `agent.ts`, `tools/`) and lifecycle loop, bridged to the TUI via an asynchronous event bus.
- **Rationale**:
  - Complies directly with Constitution Principle II (`Agent Lifecycle Decoupling via Vercel Eve Framework`).
  - Decouples agent task planning, tool discovery, and multi-step execution from the rendering layer.
  - Exposes lifecycle events (`onStepStart`, `onToolCall`, `onTokenStream`, `onStepFinish`, `onError`) that the TUI consumes without blocking the agent's internal state machine.
  - Enables headless CLI and automated testing without running the interactive terminal UI.
- **Alternatives Considered**:
  - *Custom handcrafted agent loop*: Reinvents durable state loops, tool registry mechanisms, and execution guarantees that Eve already standardizes.
  - *LangChain / LangGraph*: Introduces excessive layers of abstraction, proprietary configuration schemas, and heavy runtime overhead that violates Eve framework governance.

---

### Research Topic 3: Terminal User Interface (TUI) Framework

- **Decision**: Use `ink` (v5+ on Node.js / TypeScript) with React-style components for UI rendering, ANSI escape sequence handling, and raw keyboard capture.
- **Rationale**:
  - Declarative, component-based layout model simplifies reactive status bars, streaming markdown text views, and multiline prompt input.
  - Ink's reconciler manages terminal re-renders efficiently, eliminating flicker during fast token streaming.
  - Native raw mode and keypress hooks provide immediate handling of interruption signals (`Ctrl+C`, `Esc`) and dynamic terminal window resize events (`process.stdout.on('resize')`).
  - Excellent TypeScript support and seamless testability via `ink-testing-library`.
- **Alternatives Considered**:
  - *Blessed / Neo-blessed*: Unmaintained, prone to memory leaks, and conflicts with modern terminal emulators and ESM TypeScript setups.
  - *Terminal-kit*: Imperative callback-heavy API that becomes difficult to maintain as UI state complexity grows.
  - *Raw stdout writes*: Lacks layout boundaries, making concurrent streaming, status line updates, and multiline text input fragile and prone to visual tearing.

---

### Research Topic 4: Memory Architecture and Context Window Management

- **Decision**: Implement a two-tiered memory architecture combined with proactive sliding-window context compaction:
  1. **Ephemeral Context Window**: An in-memory buffer tracking message tokens against the routed model's token limits. When usage exceeds 75% of context headroom, a background compaction worker summarizes older turns into a consolidated context block while preserving the 4 most recent turns uncompressed.
  2. **Persistent Knowledge Store**: Stored in a local JSON document (`.jev/memory.json` in project root or `~/.config/jev-router-harness/memory.json` globally) managed via atomic file replacement (`fs.writeFileSync` to temp file + atomic rename).
- **Rationale**:
  - Strictly aligns with Constitution Principle III (`Explicit Memory and Context Lifecycle Management`).
  - Prevents context overflow errors across extended (50+ turn) conversations (SC-003).
  - Atomic file replacement guarantees zero data corruption if the user terminates the process abruptly (SIGINT).
  - Avoids external database daemons or cloud requirements; easily inspectable, portable, and git-ignorable.
- **Alternatives Considered**:
  - *Vector database daemon (Chroma / Qdrant)*: Requires running a background server process and heavy embedding models; overkill for personal harness preferences and project guidelines.
  - *SQLite (better-sqlite3)*: Requires native C++ compilation bindings that can fail across diverse developer environments; JSON flat files are robust, portable, and zero-dependency.

---

### Research Topic 5: Observability, Telemetry, and Testing Strategy

- **Decision**: Vitest test runner with strict mock provider implementations (`MockRouterProvider`, `MockEveAgent`, `MockStreamProvider`) and structured JSON telemetry logging.
- **Rationale**:
  - Satisfies Constitution Principle V (`Observability, Test-First Verification, and Offline Resilience`).
  - Guarantees ≥ 85% unit test coverage on core routing, context compaction, and memory units without requiring live upstream API keys or incurring costs during CI/CD.
  - Structured telemetry tracks: `promptId`, `model`, `tier`, `decisionLatencyMs`, `inputTokens`, `outputTokens`, `estimatedCostUsd`, and `fallbackUsed`.
- **Alternatives Considered**:
  - *Jest*: Slower startup and complicated ESM/TypeScript configuration compared to native Vitest.
  - *Network playback (VCR/cassettes)*: Fragile to prompt changes and risks leaking API tokens in test recordings.

# Implementation Plan: AI TUI Router Harness

**Branch**: `001-ai-tui-harness` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-ai-tui-harness/spec.md`

## Summary

Build an interactive, keyboard-driven Terminal User Interface (TUI) AI harness in TypeScript/Node.js that couples Vercel's `eve` framework for durable agent orchestration with `typesafe-ai/jev` for dynamic, cost-optimized model routing. The harness provides real-time streaming output in the terminal, automated sliding-window context compaction to sustain extended multi-turn conversations, local persistent memory for developer preferences, and granular session cost telemetry.

## Technical Context

**Language/Version**: TypeScript 5.5+ on Node.js 20+ / 22+ LTS (`strict: true`, ESM modules)

**Primary Dependencies**:
- `ink` (v5+) and `react` (v18+) for component-driven terminal user interface
- Vercel `eve` framework for filesystem-first agent loop and tool execution
- `ai` (Vercel AI SDK) for unified model streaming and provider integration
- `typesafe-ai/jev` (or AI SDK gateway decision model) for System-One routing
- `zod` for contract validation and structured schema definitions

**Storage**: Local atomic JSON flat-file storage (`.jev/memory.json` in repository or `~/.config/jev-router-harness/memory.json` globally), with write-temp-and-rename guarantees.

**Testing**: `vitest` for fast ESM test execution and `ink-testing-library` for terminal component verification.

**Target Platform**: Linux, macOS, and Windows terminal emulators supporting standard ANSI escape codes and UTF-8.

**Project Type**: CLI executable / Terminal User Interface application.

**Performance Goals**:
- Time-to-first-token < 1.5s for routine prompts on fast/free models
- Router decision latency < 100ms
- 60fps flicker-free terminal updates during streaming output

**Constraints**:
- Zero external cloud database dependencies for harness state
- Strict secret isolation: API keys loaded exclusively via environment variables or secure local files, never logged
- Minimum 85% automated unit test coverage across routing and memory subsystems
- 100% offline-capable test suites utilizing deterministic mock providers

**Scale/Scope**: Single-operator interactive developer workflow; multi-turn sessions exceeding 50+ turns without context overflow.

## Constitution Check

*GATE: Passed before Phase 0 research. Re-evaluated and confirmed post-design.*

| Principle / Rule | Compliance Status | Architectural Alignment |
|---|---|---|
| **I. Cost-Optimized Dynamic Model Routing (`typesafe-ai/jev`)** | **PASS** | Prompts route through `typesafe-ai/jev` to evaluate complexity and prioritize free/budget tiers with deterministic escalation. |
| **II. Agent Lifecycle Decoupling (Vercel Eve Framework)** | **PASS** | Core agent logic runs on Vercel's `eve` runtime, isolated from the Ink TUI presentation layer via an asynchronous typed event bus. |
| **III. Explicit Memory and Context Lifecycle Management** | **PASS** | Active context tracking with automated 75% threshold compaction; local persistent JSON storage with atomic file replacement. |
| **IV. Terminal-Native User Interface (TUI) First** | **PASS** | Keyboard-driven Ink TUI with streaming ANSI rendering, real-time status indicators, and clean raw-mode signal/resize handling. |
| **V. Observability, Test-First Verification, and Offline Resilience** | **PASS** | Vitest test harness with mock provider drivers (`MockRouterProvider`, `MockEveAgent`), structured NDJSON telemetry, and ≥85% test coverage standard. |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-tui-harness/
├── plan.md              # Implementation architecture and plan (this file)
├── research.md          # Phase 0 technology decisions and evaluations
├── data-model.md        # Phase 1 entity definitions and state machines
├── quickstart.md        # Phase 1 end-to-end validation scenarios
├── contracts/           # Phase 1 interface specifications
│   ├── cli-contract.md
│   ├── router-contract.md
│   ├── agent-bridge-contract.md
│   └── memory-contract.md
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── cli/
│   ├── index.ts                # CLI entry point, argument parsing, startup
│   └── flags.ts                # Command-line option definitions and validation
├── tui/
│   ├── App.tsx                 # Root Ink application component
│   ├── components/
│   │   ├── PromptInput.tsx     # Multiline keyboard prompt editor
│   │   ├── MessageStream.tsx   # Progressive streaming response renderer
│   │   ├── StatusBar.tsx       # Model routing, token count, and cost indicator
│   │   ├── TelemetryView.tsx   # Session cost dashboard overlay
│   │   └── MemoryModal.tsx     # Persistent memory inspector and manager
│   └── hooks/
│       ├── useKeybindings.ts   # Keyboard navigation and interrupt handling
│       └── useTerminalResize.ts# Dynamic window geometry listener
├── router/
│   ├── index.ts                # IModelRouter interface and router factory
│   ├── jevRouter.ts            # typesafe-ai/jev decision model integration
│   ├── heuristicRouter.ts      # Offline/deterministic fallback classifier
│   └── modelRegistry.ts        # Model candidate tier metadata and pricing
├── agent/
│   ├── bridge.ts               # IEveAgentBridge implementation
│   ├── eveRuntime.ts           # Vercel Eve filesystem-first runtime loader
│   └── tools/                  # Built-in agent tools (file I/O, search, etc.)
├── memory/
│   ├── contextManager.ts       # IContextManager sliding-window compaction
│   ├── persistentStore.ts      # IPersistentMemoryStore atomic JSON storage
│   └── tokenCounter.ts         # Token estimation and budget tracking
├── telemetry/
│   ├── logger.ts               # Structured NDJSON telemetry logger
│   └── costCalculator.ts       # Per-turn and aggregate cost calculation
└── types/
    └── index.ts                # Shared TypeScript contracts and domain models

tests/
├── unit/
│   ├── router.test.ts          # Routing policy and tier selection tests
│   ├── contextManager.test.ts  # Compaction and sliding-window tests
│   ├── persistentStore.test.ts # Atomic store and CRUD tests
│   └── tokenCounter.test.ts    # Token budget calculation tests
├── contract/
│   ├── cli.test.ts             # CLI arguments and exit code contract tests
│   └── agentBridge.test.ts     # Eve bridge event dispatch tests
└── mocks/
    ├── mockRouter.ts           # Deterministic offline routing mock
    └── mockEveAgent.ts         # Deterministic offline agent response mock
```

**Structure Decision**: Single project layout with strict directory separation between presentation (`src/tui`), agent orchestration (`src/agent`), dynamic model routing (`src/router`), and memory persistence (`src/memory`).

## Complexity Tracking

> **Constitution Check has zero violations. No unjustified complexity introduced.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | N/A |

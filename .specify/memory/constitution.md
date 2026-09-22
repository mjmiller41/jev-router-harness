# Jev Router Harness Constitution

## Core Principles

### I. Cost-Optimized Dynamic Model Routing (via typesafe-ai/jev)
- Every prompt submission, tool invocation, and agent reasoning step MUST evaluate candidate models through `typesafe-ai/jev` based on prompt complexity, task intent, and token budget.
- The routing engine MUST prioritize free and low-cost models (such as free-tier endpoints, lightweight local LLMs, and high-efficiency cost-effective providers) whenever task capability requirements are satisfied.
- Escalation to premium or high-cost models MUST be explicit, deterministic, and bound by user-defined budget thresholds or override policies.
- Rationale: An AI harness must minimize operational cost and eliminate unnecessary token expenses during daily workflows, reserving expensive models exclusively for complex tasks that demand them.

### II. Agent Lifecycle Decoupling (via Vercel Eve Framework)
- The agent execution core, tool orchestration, and lifecycle loops MUST be built using Vercel's `eve` framework as the underlying agent architecture.
- The agent runtime MUST remain strictly decoupled from presentation logic, interacting with interfaces only through well-typed asynchronous events, state channels, or streaming message protocols.
- Tool executions and agent sub-tasks MUST be discrete, idempotent where feasible, and instrumented with structured progress events.
- Rationale: Decoupling the agent engine from TUI presentation ensures modular testability, enables headless headless/CLI execution, and prevents rendering performance bottlenecks from blocking agent evaluation.

### III. Explicit Memory and Context Lifecycle Management
- Context management MUST be active and strictly bounded; the harness MUST track token utilization across conversation turns and apply deterministic summarization, rolling-window trimming, or compaction before context limits are reached.
- Memory architecture MUST be explicitly partitioned into:
  - **Working Context**: Ephemeral turn state, scratchpad, active tool outputs, and short-term conversation buffers.
  - **Persistent Memory**: Durable cross-session user preferences, indexed project knowledge, and historical session logs.
- All memory mutations, retrievals, and deletions MUST be inspectable, auditable, and directly manageable by the user through the interface.
- Rationale: Uncontrolled context growth degrades model reasoning, introduces hallucinations, and wastes tokens; transparent memory management ensures reliability and user trust.

### IV. Terminal-Native User Interface (TUI) First
- The primary interface MUST be a high-performance, keyboard-driven Terminal User Interface (TUI) delivering responsive streaming rendering, interactive command bars, and real-time state visualization.
- The TUI MUST provide unambiguous visual indicators for agent state, active routed model, token consumption, routing cost tier, and active tool calls.
- The TUI MUST support clean terminal lifecycle handling: non-destructive terminal resizing, safe interruption handling (SIGINT/Ctrl+C) with task cancellation, and complete terminal cleanup upon shutdown.
- Rationale: Terminal-centric workflows demand instantaneous feedback, clean rendering without flicker, and robust process lifecycle control directly in the developer's shell environment.

### V. Observability, Test-First Verification, and Offline Resilience
- Test-Driven Development (TDD) is MANDATORY: unit tests for routing policies, memory stores, context compaction logic, and event dispatchers MUST precede implementation.
- Every routing decision (selected model, routing latency, prompt tokens, cost metrics) MUST be captured in structured telemetry logs for audit and analysis.
- The harness MUST include offline and mock provider drivers so all TUI workflows, context management algorithms, and agent loops can be executed and validated in CI/CD without live API keys or external costs.
- Rationale: Reliable agent harnesses require strict reproducibility, automated regression testing, and transparent observability without incurring continuous external API dependency costs during development.

## Technical Architecture and Operational Constraints

- **Language & Runtime**: TypeScript on Node.js (LTS), configured with strict type checking (`strict: true`).
- **Agent Framework**: Vercel `eve` framework governing agent task loops, tool registration, and multi-turn workflows.
- **Model Routing**: `typesafe-ai/jev` integration managing model selection, routing policies, cost calculations, and fallback chains.
- **TUI Stack**: Modern terminal framework with component-driven architecture and streaming ANSI support.
- **Persistence Layer**: Local filesystem storage (e.g., JSON/SQLite embedded store) rooted in user configuration or workspace paths (`~/.config/jev-router-harness` or local project store), strictly avoiding proprietary external cloud databases for harness metadata.
- **Secret & Key Management**: Provider credentials and API keys MUST be loaded exclusively from local environment variables or secure keystores; secrets MUST NEVER be written to persistent logs, terminal buffers, or version control.

## Development Workflow and Quality Gates

- **Quality Checks**: All code contributions MUST pass static analysis, type checking (`tsc --noEmit`), and linting without warnings or errors.
- **Coverage Standard**: Core libraries—including routing logic, memory stores, and context pruning algorithms—MUST maintain a minimum of 85% automated test coverage.
- **Synthetic Test Gates**: CI/CD pipelines MUST run against deterministic mocks and synthetic prompt matrices to verify routing rules and agent safety without relying on live upstream APIs.
- **Spec-Driven Process**: Feature additions and major architectural changes MUST follow the Spec Kit sequence: specification (`/speckit-specify`), clarification (`/speckit-clarify`), planning (`/speckit-plan`), and tasks (`/speckit-tasks`) before code implementation commences.

## Governance

1. **Constitution Primacy**: This Constitution is the authoritative governance document for the Jev Router Harness repository. All architectural designs, pull requests, and implementations MUST conform to its principles and constraints.
2. **Amendment Procedure**: Any amendment to this Constitution MUST:
   - Provide a formal proposal detailing rationale, architectural implications, and backward compatibility impact.
   - Undergo peer review and consensus approval by core maintainers.
   - Follow Semantic Versioning:
     - **MAJOR**: Incompatible changes to core principles, removal of fundamental constraints (e.g., replacing Eve or Jev, abandoning TUI-first).
     - **MINOR**: Addition of new principles, structural expansion of architecture/workflow guidelines.
     - **PATCH**: Non-semantic clarifications, typographical corrections, or formatting updates.
3. **Compliance Verification**: Pull requests and design documents MUST include explicit verification against the Core Principles. Any temporary exception MUST be justified in writing and tracked with an issue and remediation timeline.
4. **Runtime Guidance**: Detailed operational workflows and project task tracking are maintained under `.specify/` configuration.

**Version**: 1.0.0 | **Ratified**: 2026-09-22 | **Last Amended**: 2026-09-22

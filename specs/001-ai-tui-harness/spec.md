# Feature Specification: AI TUI Router Harness

**Feature Branch**: `001-ai-tui-harness`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "An AI TUI harness using Vercel's eve agent framework, typesafe-ai/jev dynamic model router for cost-optimized LLM selection, and modular memory & context management subsystems."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Terminal Prompting with Cost-Optimized Routing (Priority: P1)

As a software developer working in my command-line terminal, I want to submit natural language questions, code instructions, and agent commands into an interactive terminal interface, and have the system automatically select the most cost-effective capable AI model (prioritizing free and budget tiers) to stream the response back quickly.

**Why this priority**: This represents the foundational MVP interaction loop. Without a functional, responsive terminal UI and automated model routing, no other harness features can deliver value.

**Independent Test**: Can be fully tested by launching the terminal interface, entering a common coding query, observing the interface indicate the selected cost-efficient model tier, and reading the real-time streaming answer rendered in the terminal.

**Acceptance Scenarios**:

1. **Given** the harness is running in a terminal session, **When** the user submits a straightforward coding or reasoning prompt, **Then** the system automatically selects an available zero-cost or lowest-cost model capable of answering the prompt, visually displays the chosen model name and cost tier indicator, and streams the generated response into the terminal.
2. **Given** the user submits a complex prompt requiring advanced multi-step reasoning or high output token limits, **When** the prompt complexity is analyzed, **Then** the system escalates to an appropriate higher-capability model tier and notifies the user of the selected tier before generation begins.
3. **Given** an ongoing streaming response, **When** the user sends an interruption command (such as Ctrl+C or Esc), **Then** streaming aborts immediately, any active generation task is cancelled, and the terminal returns to a clean ready prompt without freezing or corrupting display output.

---

### User Story 2 - Automated Context Window Tracking and Compaction (Priority: P2)

As a developer conducting extended, multi-turn troubleshooting or planning sessions, I want the harness to monitor token consumption continuously and compact earlier conversation turns automatically before model context limits are reached, so that conversations remain fluid and coherent without manual resets.

**Why this priority**: Prolonged agent workflows quickly exceed token limits or become excessively slow and expensive. Automated context compaction guarantees stability across long-running sessions.

**Independent Test**: Can be independently tested by holding a long multi-turn dialogue exceeding standard context thresholds, verifying that earlier turns are summarized while recent messages remain verbatim, and confirming that the agent remembers earlier constraints without errors.

**Acceptance Scenarios**:

1. **Given** an active conversation approaching the configured context safety threshold, **When** the user submits the next prompt turn, **Then** the system automatically summarizes older dialogue history into a concise context block while preserving the most recent turns uncompressed.
2. **Given** a session where earlier turns have been compacted, **When** the user refers to an agreement or constraint made early in the conversation, **Then** the system maintains conversational continuity and incorporates the summarized context accurately in its response.
3. **Given** an active conversation, **When** the user requests context statistics via terminal commands, **Then** the system reports current token consumption, remaining available context headroom, and compaction event counts.

---

### User Story 3 - Persistent Knowledge and Preference Memory (Priority: P3)

As a developer operating across distinct work sessions and repositories, I want the harness to persist project conventions, user preferences, and key architectural facts across session restarts so that I do not need to repeat setup instructions in every new session.

**Why this priority**: Cross-session memory eliminates repetitive prompting and tailors agent behavior to specific project rules over time.

**Independent Test**: Can be tested by configuring a user preference in one session, terminating the harness, starting a brand new session in the same workspace, and observing that the agent respects the preference without re-prompting.

**Acceptance Scenarios**:

1. **Given** an active session, **When** the user instructs the harness to remember a preference or rule (e.g., "prefer strict TypeScript without any types"), **Then** the system persists this memory item in durable local storage.
2. **Given** a newly initiated session, **When** the user issues a prompt where a stored preference applies, **Then** the harness automatically retrieves and injects the relevant memory items into the agent's context.
3. **Given** stored persistent memory items, **When** the user issues a memory management command, **Then** the interface displays all stored memories and allows the user to inspect, edit, or delete them individually or in bulk.

---

### User Story 4 - Session Telemetry and Cost Transparency (Priority: P4)

As an engineer managing API costs, I want full visibility into model routing rationale, token expenditures, latencies, and cumulative session costs so that I can audit usage and optimize prompting efficiency.

**Why this priority**: Automated routing requires user trust; granular telemetry demonstrates how effectively the system is saving costs.

**Independent Test**: Can be tested by executing multiple prompts across various complexity tiers and reviewing the session summary dashboard, verifying that recorded token counts, latencies, and cost calculations match actual provider rates.

**Acceptance Scenarios**:

1. **Given** a completed prompt response, **When** examining the turn metadata in the terminal, **Then** the user sees the specific model used, routing classification, duration/latency, input/output tokens, and estimated cost for that turn.
2. **Given** a session that has processed multiple turns, **When** the user requests a session cost summary, **Then** the system displays aggregated metrics detailing total tokens spent, total monetary cost, and a breakdown across free versus paid model tiers.

---

### Edge Cases

- **Model Availability / Rate Limit Outage**: When a selected free-tier or budget model is temporarily unavailable or rate-limited, the system must automatically fall back to the next available tier without crashing, alerting the user to the fallback event.
- **Context Limit Overshoot**: When an initial user prompt alone exceeds the maximum context window of the preferred budget model, the system must detect the prompt size upfront and route directly to a larger-context model tier or prompt the user for input truncation.
- **Terminal Resize During Streaming**: When the user dynamically resizes the terminal window while text is actively streaming, the display layout must recalculate boundaries cleanly without line doubling or character truncation.
- **Abrupt Termination / Disconnect**: If the terminal process receives a SIGINT or unexpected shutdown while updating memory or session context, disk writes must be atomic to prevent file corruption.
- **Empty or Whitespace-Only Prompts**: When the user presses Enter without typing content, the interface must ignore the input and remain in ready state without dispatching routing or API calls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interactive, keyboard-driven Terminal User Interface (TUI) featuring a multiline prompt input, real-time message stream display, and status indicators.
- **FR-002**: System MUST evaluate the complexity, token volume, and intent of each user prompt to dynamically select the most cost-effective capable model tier, prioritizing free and low-cost models.
- **FR-003**: System MUST support automated escalation to higher-capability model tiers when prompt complexity or reasoning requirements exceed lower-tier thresholds.
- **FR-004**: System MUST allow users to manually override automatic model routing by specifying a preferred model or tier for individual prompts or for the entire session.
- **FR-005**: System MUST render streaming text responses progressively in real time as tokens arrive from the selected provider.
- **FR-006**: System MUST continuously track active conversation token counts against model-specific context window constraints.
- **FR-007**: System MUST automatically compact older conversation history into summarized context when conversation token volume exceeds configurable threshold limits.
- **FR-008**: System MUST isolate ephemeral session working context from persistent long-term memory.
- **FR-009**: System MUST persist cross-session memory items (user preferences, project instructions, architectural facts) in local workspace or user configuration storage.
- **FR-010**: System MUST provide terminal commands enabling users to view, search, export, and delete working context and persistent memory records.
- **FR-011**: System MUST display per-turn telemetry including model name, routing tier, token count, generation latency, and estimated cost.
- **FR-012**: System MUST capture and display session-level aggregated telemetry showing cumulative token consumption and total cost saved through free/low-cost routing.
- **FR-013**: System MUST support immediate task interruption and cancellation (via Ctrl+C, Esc, or stop command) that cleanly terminates streaming and resets the prompt to ready status.
- **FR-014**: System MUST automatically retry with a fallback model tier when the primary routed model encounters transient rate limits or provider downtime.

### Key Entities *(include if feature involves data)*

- **Session**: Represents an active or saved conversation session, containing unique session identifier, creation timestamp, turn history, and cumulative cost/token metrics.
- **Message Turn**: Represents an individual conversational exchange, including role (user, assistant, system), message text, routed model identifier, routing decision metadata, token usage, latency, and estimated cost.
- **Routing Decision**: Captures the rationale for model selection on a given prompt, including evaluated complexity score, requested capabilities, candidate models considered, chosen model, and tier classification (free, low-cost, high-tier).
- **Context Window**: Manages the token volume of active dialogue, tracking uncompacted messages, summary checkpoints, and headroom capacity against model limits.
- **Memory Item**: Represents a discrete piece of persistent knowledge, containing unique identifier, key/subject, content, creation timestamp, category (preference, rule, entity fact), and last accessed date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive the initial rendered streaming token within 1.5 seconds of prompt submission for standard coding and reasoning questions routed to fast/free tiers.
- **SC-002**: In everyday coding assistance workflows (explanations, syntax assistance, code generation), at least 80% of routine prompts are serviced by free or lowest-cost model tiers without requiring user manual intervention.
- **SC-003**: Conversations can exceed 50 continuous turns without exhausting model context limits or requiring manual context clearing.
- **SC-004**: Telemetry accuracy reaches 100% for reporting routed model, token counts, and cost tier on every completed turn.
- **SC-005**: The terminal interface maintains 0% screen artifacts or layout corruption during window resize operations and user generation cancellations.
- **SC-006**: 100% of user-declared persistent preferences are accurately retained and applied in subsequent sessions within the same project directory.

## Assumptions

- Users operate in modern POSIX or Windows terminal emulators supporting ANSI 256-color or Truecolor and standard terminal escape codes.
- Users provide valid API keys or local endpoint addresses for their desired model providers via environment variables or local configuration files.
- Free-tier availability and rate limits are dictated by upstream AI providers; when free tiers are unavailable or depleted, the system transparently utilizes the lowest-cost paid tier configured.
- Persistent memory and session logs are saved locally on the user's filesystem and do not require external cloud storage accounts.
- The harness requires internet connectivity for remote cloud models, but operates fully offline when configured with local models.

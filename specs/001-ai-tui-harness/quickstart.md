# Quickstart Validation Guide: AI TUI Router Harness

**Date**: 2026-09-22  
**Feature**: [spec.md](spec.md)  
**Data Model**: [data-model.md](data-model.md)  
**Contracts**: [contracts/](contracts/)

## Overview

This guide details end-to-end validation scenarios that verify the AI TUI Router Harness meets all requirements, core principles, and success criteria defined in the project Constitution and Feature Specification.

---

## Prerequisites

- **Node.js**: v20.x or v22.x LTS
- **Package Manager**: `pnpm` or `npm`
- **Terminal Emulator**: Any ANSI/VT100-compatible terminal (Alacritty, iTerm2, Kitty, GNOME Terminal, Windows Terminal)
- **API Keys (Optional for live runs, mock runs work offline)**:
  - `TYPESAFE_AI_API_KEY`: For `typesafe-ai/jev` decision scoring
  - `GEMINI_API_KEY`: For Google Gemini free/budget models
  - `GROQ_API_KEY`: For Groq free-tier models

---

## Environment Setup

```bash
# 1. Clone and enter repository
git clone https://github.com/mjmiller41/jev-router-harness.git
cd jev-router-harness

# 2. Install dependencies
pnpm install

# 3. Verify TypeScript build and test suite
pnpm run build
pnpm test
```

---

## Validation Scenarios

### Scenario 1: Offline Deterministic Test Suite (Constitution Gate)

**Objective**: Verify that routing policies, context compaction, and memory isolation pass automated unit testing without requiring live network calls or consuming API tokens.

```bash
# Run test suite with mock providers
pnpm test --run
```

**Expected Outcome**:
- All unit and contract tests pass with 100% success rate.
- Core library code coverage exceeds the 85% requirement defined in the Constitution.
- Zero network calls attempted (offline verified).

---

### Scenario 2: Launch Interactive TUI & Submit Routine Prompt (User Story 1 - P1)

**Objective**: Verify that the TUI launches smoothly, accepts keyboard input, and routes a simple coding query to a free/low-cost model.

```bash
# Launch harness in interactive mode
pnpm start
```

**Steps**:
1. At the interactive prompt `>>> `, type:
   ```text
   How do I check if a file exists in Node.js?
   ```
2. Press `Enter`.

**Expected Outcome**:
- The status bar indicates model routing decision: `[Router: typesafe-ai/jev] -> [Tier: free] -> [Model: gemini-2.5-flash]`.
- Response begins streaming within 1.5 seconds.
- Telemetry line appears on completion: `✓ Turn complete: 34 input tokens, 82 output tokens | Latency: 420ms | Cost: $0.0000`.
- Terminal display does not flicker or tear.

---

### Scenario 3: Complex Prompt Escalation (User Story 1 - P1)

**Objective**: Verify that the router automatically escalates complex tasks to higher-capability model tiers.

**Steps**:
1. At the prompt, enter a complex multi-step reasoning task:
   ```text
   Architect a distributed consensus protocol with raft leader election, network partition healing, and formal invariant proofs.
   ```
2. Press `Enter`.

**Expected Outcome**:
- Router scores complexity above 0.70.
- Router selects `premium` tier (e.g. `claude-3-5-sonnet` or `gpt-4o`).
- Visual indicator displays: `[Router: typesafe-ai/jev] -> [Tier: premium] -> [Model: claude-3-5-sonnet]`.
- Response streams cleanly.

---

### Scenario 4: User Interruption & Graceful Recovery (Edge Case)

**Objective**: Verify that pressing `Ctrl+C` during active streaming cleanly aborts generation without crashing the terminal.

**Steps**:
1. Enter a long-response prompt: `Write a complete 500-line CLI game in Python.`
2. While tokens are streaming, press `Ctrl+C`.

**Expected Outcome**:
- Streaming stops immediately.
- Terminal prints: `[Cancelled by user]`.
- Prompt input is immediately restored to ready status `>>> `.
- Terminal raw mode remains functional.

---

### Scenario 5: Extended Multi-Turn Context Compaction (User Story 2 - P2)

**Objective**: Verify that prolonged conversations automatically compact context when reaching threshold limits.

**Steps**:
1. In an ongoing session, generate 15+ turns of dialogue.
2. Execute slash command: `/context`.
3. If not triggered automatically, execute: `/compact`.

**Expected Outcome**:
- The `/context` command outputs token metrics:
  ```text
  Context Headroom: 4,120 / 32,000 tokens (12.8% used)
  Uncompacted turns: 4
  Compaction passes: 1
  ```
- Subsequent questions retain memory of facts from Turn 1 without context overflow errors.

---

### Scenario 6: Persistent Cross-Session Memory (User Story 3 - P3)

**Objective**: Verify that user preferences persist across harness restarts.

**Steps**:
1. In Session 1, type:
   ```text
   /memory add coding-style Always output TypeScript using interface instead of type aliases.
   ```
2. Verify memory is saved: `/memory list`.
3. Exit harness: `/exit`.
4. Launch harness again: `pnpm start`.
5. Enter: `Give me a TypeScript declaration for a User object.`

**Expected Outcome**:
- Assistant output uses `interface User { ... }` without the user re-specifying the preference.
- Memory item was loaded from `.jev/memory.json`.

---

### Scenario 7: Session Telemetry Inspection (User Story 4 - P4)

**Objective**: Verify session cost and token metrics.

**Steps**:
1. Enter: `/telemetry summary`.

**Expected Outcome**:
- Summary dashboard renders:
  ```text
  Session Telemetry Summary:
  ──────────────────────────────────────────
  Total Turns:        8
  Free Tier Turns:    7 (87.5%)
  Premium Turns:      1 (12.5%)
  Total Tokens In:    1,240
  Total Tokens Out:   2,890
  Total Cost:         $0.0124 USD
  Cost Saved vs All-Premium: $0.1480 USD (92.3% savings)
  ──────────────────────────────────────────
  ```

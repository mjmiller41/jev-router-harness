# Jev Router Harness

An AI Terminal User Interface (TUI) harness that uses Vercel's [Eve](https://github.com/vercel) framework for agent orchestration and [`typesafe-ai/jev`](https://github.com/typesafe-ai/jev) for dynamic, cost-optimized AI model routing.

## Overview

Jev Router Harness provides a keyboard-driven terminal environment for autonomous AI agents. By integrating `typesafe-ai/jev`, every prompt, tool call, and reasoning step is evaluated dynamically to select the best free or low-cost model capable of completing the task, escalating to high-tier models only when strictly necessary.

## Core Capabilities

- **Intelligent Model Routing**: Dynamic model selection via `typesafe-ai/jev`, optimizing for cost and free-tier utilization before escalating to premium models.
- **Vercel Eve Agent Foundation**: Robust task loops, tool orchestration, and lifecycle hooks powered by Vercel Eve, cleanly decoupled from UI presentation.
- **Context & Memory Management**:
  - Deterministic context window compaction, rolling buffers, and summarization.
  - Transparent dual-layer memory (ephemeral working context + persistent cross-session store).
- **Terminal User Interface (TUI)**: Keyboard-first reactive terminal interface with streaming output, model telemetry, and graceful interrupt handling.
- **Offline & Mock Resilience**: First-class support for deterministic synthetic/mock providers to run test suites without external API consumption.

## Project Governance

This project is governed by the [Constitution](.specify/memory/constitution.md) (ratified v1.0.0). All pull requests, architecture decisions, and feature implementations adhere to its principles.

## License

MIT

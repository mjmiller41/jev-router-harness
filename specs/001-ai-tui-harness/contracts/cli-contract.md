# Contract: CLI & TUI Interface

**Date**: 2026-09-22  
**Feature**: [spec.md](../spec.md)

## 1. CLI Invocations

### Command Line Syntax

```bash
jev-harness [options] [initial-prompt]
```

### Options and Flags

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--model <id>` | `-m` | `string` | `auto` | Override dynamic routing with a specific model ID |
| `--tier <tier>` | `-t` | `enum` | `auto` | Restrict routing to a specific tier: `free`, `budget`, `premium`, or `auto` |
| `--session <id>` | `-s` | `string` | `latest` | Resume an existing session or start a new one (`new`) |
| `--dry-run` | | `boolean` | `false` | Evaluate routing decision without executing model generation |
| `--config <path>`| `-c` | `string` | `~/.config/jev/config.json` | Path to custom configuration file |
| `--help` | `-h` | `boolean` | | Display help and usage details |
| `--version` | `-v` | `boolean` | | Print current version |

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `TYPESAFE_AI_API_KEY` | API key for `typesafe-ai/jev` decision model | Optional (heuristic fallback used if absent) |
| `GEMINI_API_KEY` | Google Gemini API key (for Gemini Flash free/budget models) | Optional |
| `GROQ_API_KEY` | Groq API key (for ultra-fast open-weight models) | Optional |
| `OPENAI_API_KEY` | OpenAI API key (for fallback/premium models) | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude fallback/premium models) | Optional |
| `JEV_LOG_LEVEL` | Logging level (`debug`, `info`, `warn`, `error`) | Optional (Default: `info`) |

### Exit Codes

| Code | Meaning |
|---|---|
| `0` | Clean exit (user quit via `/exit` or SIGINT on clean prompt) |
| `1` | Configuration or startup initialization error |
| `2` | Invalid command-line arguments or flags |
| `130` | Terminated by SIGINT (Ctrl+C) |

---

## 2. Interactive TUI Interface Contract

### Key Bindings

| Key Combination | Scope | Action |
|---|---|---|
| `Enter` | Input Prompt | Submit current prompt to agent |
| `Shift+Enter` / `Alt+Enter` | Input Prompt | Insert newline in prompt editor |
| `Ctrl+C` | Active Generation | Cancel generation immediately and reset prompt |
| `Ctrl+C` | Empty Prompt | Exit harness cleanly |
| `Ctrl+L` | Global | Clear screen buffer and re-render |
| `Tab` | Input Prompt | Auto-complete slash command |
| `Up / Down Arrows` | Input Prompt | Navigate prompt submission history |

### Slash Commands

| Command | Arguments | Description |
|---|---|---|
| `/exit` | None | Exit harness session |
| `/clear` | None | Clear current conversation turn display (retaining persistent memory) |
| `/compact` | None | Manually trigger context window compaction |
| `/context` | None | Display current context token usage and headroom breakdown |
| `/model` | `[model-id \| auto]` | View or set model override for the active session |
| `/tier` | `[free \| budget \| premium \| auto]` | View or set routing tier restriction |
| `/memory list` | `[category]` | List all stored persistent memories |
| `/memory add` | `<key> <content>` | Manually add a persistent rule or fact |
| `/memory del` | `<key>` | Delete a specific persistent memory item |
| `/telemetry` | `[summary \| turns]` | View session cost, token usage, and latency metrics |
| `/help` | None | Show list of available commands and keybindings |

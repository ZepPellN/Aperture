---
title: Claude Code
section: entities
sources: 1
updated: 2026-04-15
---

# Claude Code

Claude Code is Anthropic's agentic coding tool. It is a specific implementation of [[concepts/agentic-coding|agentic coding]] principles, built on top of Claude (Sonnet/Opus models).

## Architecture

Claude Code uses two core primitives:
- **Bash tool** — execute shell commands
- **Text editor tool** — read and modify files

All complex capabilities (skills, programmatic tool calling, memory) are compositions of these two primitives.

## Key Features

- **Skills system**: Reusable workflow modules defined in markdown
- **CLAUDE.md**: Project-level schema and instructions
- **MCP integration**: Connect to external tools and data sources
- **Agent loop**: Autonomous planning, execution, and verification

## Position in the Ecosystem

Claude Code is one of several tools competing in the agentic coding space. Its differentiation lies in the skills system and the emphasis on harness engineering — designing the agent's environment rather than prompting the model directly.

## Sources

- [[raw/to-learn/example-article.md|The Rise of Agentic Coding]]

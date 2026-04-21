---
title: Agentic Coding
section: concepts
sources: 1
updated: 2026-04-15
---

# Agentic Coding

Agentic coding is the practice of using AI agents to write, review, and maintain software with minimal human intervention. The human defines the goal; the agent determines the implementation, tests its own code, and iterates based on feedback.

## Core Principles

### Task Delegation over Line-by-Line Generation

Traditional AI coding assistants (copilots) suggest the next few lines. Agentic coding delegates entire tasks: "implement user authentication," "refactor this module for testability," "deploy this feature to staging." The agent plans, executes, and verifies.

### Feedback Loops

The agent operates in a closed loop:
1. Write code
2. Run tests / type checks
3. Read error output
4. Fix and retry

This loop continues until the task is complete or the agent encounters a blocker requiring human input.

### Context Management

Agentic coding tools maintain awareness of the broader codebase. They can read multiple files, understand cross-file dependencies, and make changes that preserve architectural consistency.

## Leading Implementations

| Tool | Company | Key Feature |
|------|---------|-------------|
| [[entities/claude-code\|Claude Code]] | Anthropic | Skills system, bash + text editor primitives |
| Cursor Composer | Anysphere | Multi-file editing, composer interface |
| GitHub Copilot Workspace | GitHub | Task-oriented workspace generation |
| OpenAI Codex | OpenAI | Cloud-based agent with sandboxed execution |

## Implications

Agentic coding shifts the human role from writing code to:
- Designing agent workflows and constraints
- Reviewing architectural decisions
- Verifying outcomes and edge cases
- Managing context and memory systems

This represents a structural change in software engineering comparable to the shift from assembly to high-level languages.

## Sources

- [[raw/to-learn/example-article.md|The Rise of Agentic Coding]]

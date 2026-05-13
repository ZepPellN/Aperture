---
title: Agent-Readable Wiki
updated: 2026-05-11
page_kind: concept
knowledge_status: ai_draft
sources:
  - path: raw/agents/agent-readable-wiki.md
    label: Agent-readable wiki notes
---

# Agent-Readable Wiki

An agent-readable wiki gives Codex and other assistants a stable context layer: files, indexes, backlinks, APIs, and `llms.txt` surfaces that can be read before reasoning.

## Aperture surfaces

- `/api/wiki/<slug>` returns raw markdown, compiled HTML, sources, backlinks, and semantic neighbors.
- `/llms.txt` and `/llms-full.txt` expose compact and full agent onboarding files.
- Skills document how to maintain the vault without inventing a new workflow every session.

## Related pages

[[skills/wiki-query|Wiki Query Skill]], [[concepts/source-provenance|Source Provenance]], and [[workflows/wiki-absorb-loop|Wiki Absorb Loop]].

## Sources

- [Agent-readable wiki notes](raw/agents/agent-readable-wiki.md)

---
title: Wiki Query Skill
updated: 2026-05-11
page_kind: tool
knowledge_status: ai_draft
sources:
  - path: raw/skills/wiki-query.md
    label: Wiki query skill spec
---

# Wiki Query Skill

The Wiki Query skill answers questions by reading the wiki as a linked knowledge system instead of treating notes as a flat pile of documents.

## Behavior

- Read the relevant MOC first.
- Pull supporting concept, entity, and tool pages.
- Preserve uncertainty when pages are marked draft or hypothesis.
- Save reusable synthesis back into outputs when it becomes durable.

## Best paired with

[[concepts/source-provenance|Source Provenance]] and [[agents/agent-readable-wiki|Agent-Readable Wiki]].

## Sources

- [Wiki query skill spec](raw/skills/wiki-query.md)

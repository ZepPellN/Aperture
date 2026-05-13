---
title: Wiki Absorb Skill
updated: 2026-05-12
page_kind: tool
knowledge_status: ai_draft
sources:
  - path: raw/skills/wiki-absorb.md
    label: Wiki absorb skill spec
---

# Wiki Absorb Skill

The Wiki Absorb skill turns raw material into durable knowledge. It decides whether to update an existing page, create an atomic concept, enrich a MOC, or leave the source as raw evidence.

## Decision model

1. Check idempotency through the absorb log.
2. Classify the source before extracting facts.
3. Prefer enriching existing pages over creating thin summaries.
4. Update a MOC only when the topic map actually changes.

## Connected pages

- [[concepts/atomic-notes|Atomic Notes]]
- [[concepts/maps-of-content|Maps of Content]]
- [[workflows/wiki-absorb-loop|Wiki Absorb Loop]]

## Sources

- [Wiki absorb skill spec](raw/skills/wiki-absorb.md)

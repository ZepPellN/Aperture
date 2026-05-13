---
title: Self-Verification Loops
updated: 2026-05-12
page_kind: concept
knowledge_status: ai_draft
sources:
  - path: raw/articles/self-verification.md
    label: Self-verification notes
---

# Self-Verification Loops

Agents improve when the environment lets them observe whether their work actually succeeded. A self-verification loop ties an action to evidence: tests, screenshots, rendered outputs, indexes, or source files.

## In Aperture

- README changes should be verified by rendered screenshots.
- Wiki updates should rebuild indexes and backlinks.
- Video compositions should pass lint, validate, and snapshot checks.

## Related

[[workflows/wiki-absorb-loop|Wiki Absorb Loop]], [[agents/agent-readable-wiki|Agent-Readable Wiki]], and [[concepts/source-provenance|Source Provenance]].

## Sources

- [Self-verification notes](raw/articles/self-verification.md)

---
name: wiki-ingest-status
description: Legacy sub-skill for /wiki-ingest status. Delegates to wiki-status.
parent: wiki-ingest
---

# Wiki Ingest Status

This legacy sub-skill is kept for compatibility with old `/wiki-ingest status`
calls. Prefer the standalone `/wiki-status` skill.

If this file is read directly, report the canonical `/wiki-status` metrics plus
the v2 schema metrics below.

## Required Metrics

- Raw files: total, absorbed, pending, skipped, `skipped_one_off`, and
  `idea_candidate` counts from `_absorb_log.json` when available.
- Wiki pages by section.
- Most-connected pages, orphans, thin pages, crammed pages, stale pages, and
  broken wikilinks.
- Schema adoption:
  - pages missing `page_kind`
  - `concept`, `moc`, or `synthesis` pages missing `knowledge_status`
  - pages missing `judgment_owner`
- Draft judgment load:
  - count and oldest examples of `knowledge_status: ai_draft`
  - count and oldest examples of `knowledge_status: hypothesis`
- MOC quality for:
  - `claude-code/overview`
  - `harness-engineering/overview`
  - `product-trends/overview`
- Concept quality:
  - missing required concept sections
  - concept pages over 150 lines
  - source summaries mislabeled as concepts

## Behavior

- Read-only.
- Report issues only. Do not modify files.
- Use Obsidian CLI for vault reads where practical.

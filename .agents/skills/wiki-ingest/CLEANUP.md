---
name: wiki-ingest-cleanup
description: Legacy sub-skill for /wiki-ingest cleanup. Delegates to wiki-cleanup.
parent: wiki-ingest
---

# Wiki Ingest Cleanup

This legacy sub-skill is kept for compatibility with old `/wiki-ingest cleanup`
calls. Prefer the standalone `/wiki-cleanup` skill.

If this file is read directly, follow `/wiki-cleanup` behavior and the v2 rules
from `.agents/skills/_wiki-common.md`.

## Required v2 Checks

- Thin pages and crammed pages.
- Broken wikilinks and orphan pages.
- Missing `page_kind`, `knowledge_status`, or `judgment_owner` on new or
  substantially updated durable pages.
- `page_kind: concept` pages that are source summaries or contain multiple
  separable ideas.
- MOC pages missing Core Questions, Key Concepts, Main Tensions, Current
  Judgments, To Read / To Verify, or Output Directions.
- `knowledge_status: ai_draft` and `hypothesis` backlog.
- Any `human_verified` page without explicit Jean or `witness/` provenance.
- One-off briefing/newsletter/report material living in `wiki/` instead of
  `raw/` or `outputs/`.

## Behavior

- Read-only by default.
- Do not bulk-upgrade old pages just to add schema.
- Do not mark pages `human_verified`.
- Do not move one-off material without Jean approval.
- End the report with **Pending Jean review** for all judgment-changing actions.

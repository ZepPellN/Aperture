---
name: wiki-ingest-reorganize
description: Legacy sub-skill for /wiki-ingest reorganize. Delegates to wiki-reorganize.
parent: wiki-ingest
---

# Wiki Ingest Reorganize

This legacy sub-skill is kept for compatibility with old `/wiki-ingest
reorganize` calls. Prefer the standalone `/wiki-reorganize` skill.

If this file is read directly, follow `/wiki-reorganize` behavior and the v2
rules from `.agents/skills/_wiki-common.md`.

## Required Assessment

- Merge candidates.
- Split candidates.
- New section candidates.
- Orphaned pages.
- Missing cross-section connections.
- Theme Aggregation Rules that need updates in `$VAULT/CLAUDE.md`.
- MOC health and whether section overviews still work as living maps.
- Concept granularity and whether concepts are atomic.
- Layer boundary problems:
  - raw source summaries in `wiki/`
  - one-off outputs in `wiki/`
  - durable concepts stuck in `outputs/ideas/`
- Judgment status problems:
  - unsafe `human_verified`
  - stale `ai_draft`
  - under-sourced `hypothesis`

## Behavior

- Read-only by default.
- Apply changes only after Jean approves a specific action list.
- Do not create new top-level wiki directories without approval.
- Do not mark pages `human_verified`.
- Run `/wiki-rebuild-index` after approved structural changes.

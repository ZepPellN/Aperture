---
name: wiki-absorb
description: >
  Re-process raw files to update wiki articles. Use when re-compiling sources
  against the current wiki state, or after theme aggregation rules change.
  Invoke when the user says /wiki-absorb with an optional date range.
argument-hint: "[last 7 days | last 30 days | YYYY-MM | YYYY-MM-DD | all | <file-path>]"
---

# Wiki Absorb

Re-process raw files to update wiki articles. Default: last 30 days.

**Read `.claude/skills/_wiki-common.md` for shared standards** (Vault & Paths,
Tracking State, Ingest Protocol, Writing Standards, Concurrency Rules).

## Date Range Options

- `last 7 days` — files modified in the last 7 days
- `last 30 days` — files modified in the last 30 days (default)
- `2026-04` — files from April 2026
- `2026-04-14` — files from a specific date
- `all` — all raw files (expensive)
- `<file-path>` — absorb a specific file

## What Happens

Process files chronologically. For each file:

1. Read the source fully.
2. Understand what it means. Not "what facts" but "what does this tell me?"
3. Match against the wiki index. What existing articles does this touch?
4. Update existing articles or create new ones. Every page touched should get
   meaningfully better. Never just append to the bottom. Integrate so the article
   reads as a coherent whole.
5. Connect to patterns. When the same theme surfaces across sources, ensure the
   concept article captures it.

## Source Priority

| Priority | Source | Treatment |
|----------|--------|-----------|
| 1 | `raw/to-learn/` | Nearly every file seeds or enriches a wiki page. Backbone. |
| 2 | `raw/briefing/` | Selective. Only novel insights. Never create standalone briefing pages. |
| 3 | `raw/newsletters/` | Interest signals. Update existing articles. Never create per-newsletter pages. |
| 4 | `raw/twitter/` | Highly selective. Only standalone threads or builder insights. |
| 5 | `raw/tools/` | Reference notes. Update tool lists or category pages. |

## Anti-Cramming

If you are adding a third paragraph about a sub-topic to an existing article,
that sub-topic probably deserves its own page. Five bloated articles instead of
30 focused ones is a failure mode.

## Anti-Thinning

Creating a page is not the win. Enriching it is. Every time you touch a page,
it should get richer.

## Every 15 Entries: Checkpoint

1. Rebuild `wiki/index.md` and `wiki/_backlinks.json`.
2. **New article audit:** If zero new articles in the last 15, you are cramming.
3. **Quality audit:** Re-read 3 most-updated articles. Rewrite any that read like event logs.
4. Check for articles exceeding 150 lines that should be split.
5. Check directory structure. Create new sections when warranted.

---
name: wiki-inbox
description: >
  Scan raw/ for unabsorbed files, classify them, and route them to absorb,
  emerge, or raw-only handling.
  Invoke when the user says /wiki-inbox or wants to process new raw files.
argument-hint: "[limit]"
---

# Wiki Inbox

Scan `raw/` for unabsorbed files and classify them. This is the entry point for
daily maintenance, but it must not assume every raw file deserves a wiki page.

**Read `.agents/skills/_wiki-common.md` for shared standards** (Vault & Paths,
Tracking State, Ingest Protocol, Classification Rules, Writing Standards).

## Steps

1. List all files under `$VAULT/raw/` recursively, sorted by modification time (newest first).
2. Read `wiki/_absorb_log.json`.
3. For each file, compute SHA256 and check against the absorb log.
   - Skip if path+hash matches.
   - Add to queue if not found or hash changed.
4. If `[limit]` provided, process only the `limit` most recent candidates.
5. If no `[limit]`, process **all** unabsorbed candidates.
6. For each candidate, classify it before absorbing:
   - `absorb_now`: durable concept/entity/tool/synthesis material.
   - `emerge_later`: interesting pattern that needs cross-source confirmation.
   - `raw_only`: one-off news, duplicate update, ordinary briefing item, or
     source material with no reusable insight.
   - `ask_jean`: judgment depends on Jean's priorities.
7. Execute the Ingest Protocol only for `absorb_now` files.
8. Add `emerge_later` files to a `/wiki-emerge` run, preferably scoped to the
   same date range.
9. Report `raw_only` files with reasons. Do not create wiki pages for them.

## Source Priority

| Priority | Source | Treatment |
|----------|--------|-----------|
| 1 | `raw/to-learn/` | Nearly every file seeds or enriches a wiki page. Backbone. |
| 2 | `raw/briefing/` | Selective. Only novel insights. Never create standalone briefing pages. |
| 3 | `raw/newsletters/` | Interest signals. Update existing articles. Never create per-newsletter pages. |
| 4 | `raw/twitter/` | Highly selective. Only standalone threads or builder insights. |
| 5 | `raw/tools/` | Reference notes. Update tool lists or category pages. |

## Output Routing

| Classification | Destination |
|----------------|-------------|
| `absorb_now` | `/wiki-absorb <file>` |
| `emerge_later` | `/wiki-emerge <date-range>` and `outputs/ideas/` |
| `raw_only` | Leave in `raw/`; optionally log `skipped_one_off` |
| `ask_jean` | Include in Pending Jean review |

## Required Report

End every run with:

- Files scanned
- Files already absorbed
- Files routed to `absorb_now`
- Files routed to `emerge_later`
- Files kept as `raw_only`
- Files requiring Jean review
- Any wiki pages created or updated
- Any ideas report created

## Anti-Cramming

The gravitational pull of existing articles is the enemy. If you are adding a
third paragraph about a sub-topic to an existing article, that sub-topic probably
deserves its own page.

## Anti-Thinning

Creating a page is not the win. Enriching it is. Every time you touch a page,
it should get richer.

## Every 15 Entries: Checkpoint

1. Rebuild `wiki/index.md` and `wiki/_backlinks.json`.
2. **New article audit:** If zero new articles in the last 15, you are cramming.
3. **Quality audit:** Re-read 3 most-updated articles as a whole. Rewrite any that read like event logs.
4. Check for articles exceeding 150 lines that should be split.
5. Check directory structure. Create new sections when warranted.

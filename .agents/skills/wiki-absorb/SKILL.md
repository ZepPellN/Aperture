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

**Read `.agents/skills/_wiki-common.md` for shared standards** (Vault & Paths,
Tracking State, Ingest Protocol, Writing Standards, Concurrency Rules).

## Execution Trigger

**When this skill is invoked (via `/wiki-absorb` or `Skill` tool), you MUST immediately execute the full absorb workflow below.** Do NOT just display the documentation. Process files, update wiki pages, rebuild indexes, and log results.

### Determine target files

1. **If a file path was provided as argument** (e.g. `/wiki-absorb /path/to/file.md`): process ONLY that specific file.
2. **If a date range was provided** (e.g. `/wiki-absorb last 7 days`): process files matching that range.
3. **If no argument was provided** (e.g. `/wiki-absorb`): process files modified in the last 30 days.

**Important:** Briefing files located at `raw/briefing/AI Briefing/` and `raw/briefing/AI Builders Digest/` MUST be included in the scan. Do not skip auto-generated briefing directories.

## Date Range Options

- `last 7 days` — files modified in the last 7 days
- `last 30 days` — files modified in the last 30 days (default)
- `2026-04` — files from April 2026
- `2026-04-14` — files from a specific date
- `all` — all raw files (expensive)
- `<file-path>` — absorb a specific file

## Absorb Workflow (Execute on every invocation)

### Step 1: Read shared standards

Read `.agents/skills/_wiki-common.md` for vault paths, tracking state, ingest protocol, and writing standards.

### Step 2: Read vault schema

Read `/Users/jean/Documents/Obsidian Vault/CLAUDE.md` for theme aggregation rules.

### Step 3: Read absorb log

Read `/Users/jean/Documents/Obsidian Vault/wiki/_absorb_log.json` to see what's already been processed.

### Step 4: Find target files

Use `find` to locate all markdown files in `raw/` matching the target criteria:

```bash
# For last 30 days (default)
find "/Users/jean/Documents/Obsidian Vault/raw" -name "*.md" -mtime -30

# For a specific file
ls -la "<file-path>"
```

**Include these directories in every scan:**
- `raw/to-learn/`
- `raw/briefing/AI Briefing/`
- `raw/briefing/AI Builders Digest/`
- `raw/newsletters/`
- `raw/twitter/`
- `raw/tools/`

### Step 5: Filter unprocessed files

For each candidate file:
1. Compute SHA256: `shasum -a 256 <file>`
2. Check `_absorb_log.json` — skip if path + hash match an existing `absorbed` entry

### Step 6: Process each file

For each unprocessed file, in chronological order:

1. **Read the source fully.**
2. **Classify it before extracting.** Decide whether it is one-off material, reference/entity evidence, reusable concept material, durable synthesis, or output material.
3. **Understand what it means.** Not "what facts" but "what reusable insight, if any, does this contain?"
4. **Match against the wiki index.** What existing concepts, entities, MOCs, or overview pages does this touch?
5. **Apply the four absorb decisions from `_wiki-common.md`:**
   - Create a new atomic concept only for one reusable insight that does not fit an existing page.
   - Update a parent concept when the source strengthens an existing idea or when a new atomic concept needs a parent link.
   - Update a MOC only when the topic map, tension, judgment, or output direction changes.
   - Keep ordinary news, briefing items, newsletter issues, and one-off outputs in `raw/` or `outputs/`.
6. **Update existing pages or create new durable pages only when warranted.** Pure news, ordinary briefing items, and one-off newsletter updates stay in `raw/` and are logged. Reusable insights become or update `page_kind: concept` pages.
7. **Connect to patterns.** When the same theme surfaces across sources, ensure the concept article or MOC captures it.

Follow _wiki-common.md ingest protocol for logging and candidate handling.

### Step 6.5: Record absorb state

For every processed file, update `wiki/_absorb_log.json` with the raw file hash
and the decision:

- `absorbed` + `decision: absorb_now` when wiki pages changed.
- `idea_candidate` + `decision: emerge_later` when the material should wait for
  cross-source emergence.
- `skipped_one_off` + `decision: raw_only` when the material is source-only.
- `pending` + `decision: ask_jean` when Jean's judgment is needed.

Include `wiki_pages`, `outputs`, and `observed_hash` when available. The
required idempotency key is always the raw file `hash`.

### Step 7: Rebuild indexes

After all files are processed, rebuild:
- `wiki/index.md`
- `wiki/_backlinks.json`

### Step 8: Report results

Tell the user:
- How many files were processed
- Which wiki pages were created or updated
- Any skipped files (with reason)
- Which files were logged as `absorbed`, `idea_candidate`, `skipped_one_off`,
  or `pending`
- Which parent concepts or MOCs were updated, and why

## Candidate Handling

Follow the Candidate System from `_wiki-common.md`:

**When creating a new page from a single source:**
- Set frontmatter `status: candidate`
- Set `page_kind` based on the page type. Use `page_kind: concept` for reusable insights.
- Set `knowledge_status: ai_draft` by default. Use `hypothesis` for plausible but under-sourced claims.
- Set `source_type` from the raw source category (`article`, `tweet`, `newsletter`, `briefing`, `xhs`, `conversation`, or `personal_judgment`).
- Set `judgment_owner: ai` unless Jean contributed the interpretation.
- Place in `wiki/candidates/` or relevant section
- Use the Concept Page Template when `page_kind: concept`; use the standard
  article format for entity/tool updates.
- Add to `wiki/index.md` with `(candidate)` note

**When a second source enriches an existing candidate:**
- This is a **promotion**. Remove `status: candidate` (or set `status: mature`)
- **Rewrite the page** using the Concept Page Template from `_wiki-common.md`
- The page must synthesize across sources, not just append the new source
- Move from `wiki/candidates/` to the relevant section if applicable
- Update `wiki/index.md` to remove `(candidate)` note

**When updating an existing mature page:**
- Integrate new source into existing structure
- Increment `sources` count in frontmatter
- Preserve existing `knowledge_status`; do not upgrade to `human_verified`
  without Jean's explicit confirmation
- Update `## Evidence across sources` table if present
- Refresh `## Prompts for witness` if new intersections emerge

## Source Priority

| Priority | Source | Treatment |
|----------|--------|-----------|
| 1 | `raw/to-learn/` | Nearly every file seeds or enriches a wiki page. Backbone. |
| 2 | `raw/briefing/` | Selective. Only novel insights. Never create standalone briefing pages. |
| 3 | `raw/newsletters/` | Interest signals. Update existing articles. Never create per-newsletter pages. |
| 4 | `raw/twitter/` | Highly selective. Only standalone threads or builder insights. |
| 5 | `raw/tools/` | Reference notes. Update tool lists or category pages. |

## Output Requirements

Every run must include:

- Files processed and skipped.
- Wiki pages created or updated.
- Output files created, if any.
- **Pending Jean review**: every page left as `knowledge_status: ai_draft` or
  `hypothesis`, with suggested action: keep draft, verify, mark hypothesis,
  dispute, or downgrade to output/source material.

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

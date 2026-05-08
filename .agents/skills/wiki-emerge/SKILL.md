---
name: wiki-emerge
description: >
  Periodically scan accumulated raw sources for repeated themes, MOC-relevant
  tensions, and candidate concepts. Writes an ideas report under outputs/ideas
  and does not directly modify wiki pages. Invoke manually with /wiki-emerge or
  from scheduled OpenClaw jobs.
argument-hint: "[last 7 days | last 14 days | last 30 days | YYYY-MM | all]"
---

# Wiki Emerge

Find patterns emerging from `raw/` without directly promoting them into `wiki/`.
This is the scheduled distillation step between source accumulation and durable
knowledge.

**Read `.agents/skills/_wiki-common.md` first**, especially Raw Emergence
Protocol, Page Kinds and Judgment Status, MOC Pages, and Permanent Knowledge vs
One-Off Material.

## When to Run

- Manually: user says `/wiki-emerge`
- Scheduled: OpenClaw can trigger this skill daily or weekly
- Recommended cadence:
  - Daily: `last 7 days` light scan
  - Weekly: `last 14 days` full emergence report
  - Monthly: `last 30 days` trend review

Default range: `last 14 days`.

## Inputs

Read:

1. `$VAULT/CLAUDE.md`
2. `$VAULT/wiki/index.md`
3. `$VAULT/wiki/_backlinks.json`
4. `$VAULT/wiki/_absorb_log.json`
5. Pilot MOCs:
   - `wiki/claude-code/overview.md`
   - `wiki/harness-engineering/overview.md`
   - `wiki/product-trends/overview.md`
6. Raw files in scope:
   - `raw/to-learn/`
   - `raw/briefing/AI Briefing/`
   - `raw/briefing/AI Builders Digest/`
   - `raw/newsletters/`
   - `raw/twitter/`
   - `raw/tools/`
   - `raw/xhs/` if present

Include both absorbed and unabsorbed raw files in the time range. Absorbed files
can still create cross-source patterns.

## Workflow

### 1. Select Sources

Resolve the date range:

```bash
find "$VAULT/raw" -name "*.md" -mtime -14 | sort
```

For `YYYY-MM`, select files whose path or mtime falls in that month. For `all`,
cap the first pass at a manageable sample and say what was excluded.

### 2. Classify Each Source

For each source, record:

| Field | Meaning |
|-------|---------|
| `source_path` | Raw wikilink path |
| `source_type` | `article`, `tweet`, `newsletter`, `briefing`, `xhs`, `conversation`, or `personal_judgment` |
| `absorb_state` | absorbed / unabsorbed / changed / skipped |
| `material_type` | one-off news / entity evidence / reusable insight / contradiction / output seed |
| `moc_fit` | claude-code / harness-engineering / product-trends / other |
| `candidate_action` | promote_to_concept / update_moc / keep_in_ideas / wait_for_second_source / discard_raw_only / ask_jean |

Do not create wiki pages during this step.

### 3. Cluster Against MOC Questions

Use the six MOC sections as filters:

- Core Questions: does the source change what question matters?
- Key Concepts: does it reinforce or suggest a concept page?
- Main Tensions: does it add a dispute or tradeoff?
- Current Judgments: does it strengthen, weaken, or contradict an existing judgment?
- To Read / To Verify: does it identify missing evidence?
- Output Directions: does it suggest a publishable article or draft?

Prefer cross-source clusters. A single strong source may be listed, but its
action should usually be `wait_for_second_source` or `keep_in_ideas`.

### 4. Write Ideas Report

Create:

```text
$VAULT/outputs/ideas/YYYY-MM-DD-raw-emergent-themes.md
```

Use this format:

```markdown
# Raw Emergent Themes — YYYY-MM-DD

Range: <date range>
Sources scanned: N
Sources cited: N

## Executive Summary

{3-5 bullets. No durable claims without citations.}

## Repeated Themes

| Theme | MOC Fit | Sources | Suggested Action |
|-------|---------|---------|------------------|
| {theme} | {moc} | [[raw/...]], [[raw/...]] | {action} |

## MOC Updates Suggested

### [[claude-code/overview]]

- {What changed or should be added? Cite raw sources.}

### [[harness-engineering/overview]]

- {What changed or should be added? Cite raw sources.}

### [[product-trends/overview]]

- {What changed or should be added? Cite raw sources.}

## Candidate Concepts

| Candidate Concept | Why It May Be Durable | Evidence | Action |
|-------------------|-----------------------|----------|--------|
| {concept} | {reason} | [[raw/...]] | wait_for_second_source |

## Contradictions and Changed Judgments

- {Existing judgment or MOC claim} may need revision because {source evidence}.

## Raw-Only Material

- [[raw/...]] — discard_raw_only; {reason}

## Pending Jean Review

- {candidate or judgment} — suggested action: promote / keep in ideas / wait / dispute / discard.

## Suggested Next Commands

- `/wiki-absorb <file>` for specific durable sources
- `/wiki-query <question>` for synthesis that should become an output
- `/wiki-status` to inspect draft backlog
```

The report is an output artifact. It may cite wiki pages, but wiki concept pages
should not depend on this report.

### 5. Optional Logging

If the run creates an ideas report, append a short entry to `wiki/log.md`:

```markdown
YYYY-MM-DD HH:mm | EMERGE | raw emergent themes | outputs/ideas/YYYY-MM-DD-raw-emergent-themes.md
```

Do not change `_absorb_log.json` unless the run explicitly classifies a raw file
as `skipped_one_off` or `idea_candidate` and records the file hash.

## Output Requirements

Every run must report:

- Date range scanned
- Number of raw files scanned
- Ideas report path
- Top repeated themes
- Candidate concepts
- MOC updates suggested
- Pending Jean review items
- Any files skipped because they were too large, unreadable, or out of scope

## Rules

- Do not directly create or update `wiki/` pages.
- Do not mark anything `human_verified`.
- Do not summarize all raw files. Cluster only what changes questions,
  judgments, concepts, or output directions.
- Do not treat a single briefing item as durable unless it changes an existing
  MOC judgment or connects to another source.
- Use Obsidian wikilinks for all raw, wiki, and output references.

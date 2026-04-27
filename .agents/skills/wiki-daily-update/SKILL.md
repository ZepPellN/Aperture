---
name: wiki-daily-update
description: >
  Daily maintenance: absorb new raw/to-learn files from the last 24 hours,
  refresh the QMD vector index, and generate writing prompts for witness.
  Invoke when the user says /wiki-daily-update or when the daily cron job fires.
argument-hint: "[run]"
---

# Wiki Daily Update

Process newly added `raw/to-learn` files from the last 24 hours, absorb them
into wiki articles, refresh QMD, and generate writing prompts for witness.

**Read `.claude/skills/_wiki-common.md` for shared standards** (Vault & Paths,
Tracking State, Ingest Protocol, Writing Standards).

## When to Run

- Manually: user says `/wiki-daily-update`
- Automatically: cron fires at 03:00 local time every day

## Steps

### 1. Discover New Files

Find markdown files in `raw/to-learn/` modified within the last 24 hours:

```bash
find "$VAULT/raw/to-learn" -name "*.md" -mtime -1 | sort
```

If no files found, report "No new files in the last 24h" and skip to step 4
(QMD refresh + prompts only).

### 2. Check Absorb Log

Read `wiki/_absorb_log.json`. For each candidate file:

1. Compute SHA256: `shasum -a 256 <file>`
2. If path + hash matches the log → skip
3. Otherwise → add to processing queue

### 3. Absorb Queue

For each queued file, execute the **Ingest Protocol** from `_wiki-common.md`:

1. **Read the source fully.**
2. **Read `CLAUDE.md`** for schema and Theme Aggregation Rules.
3. **Match against wiki index.** What existing articles does this touch?
4. **Update existing articles or create new ones.** Integrate so the article
   reads as a coherent whole. Never just append.
5. **Connect to patterns.** Ensure concept articles capture recurring themes.
6. **Append to `wiki/_absorb_log.json`.**
7. **Append to `wiki/log.md`.**

**Source priority override:** All queued files come from `raw/to-learn/`, so
treat every file as Priority 1 (backbone source).

**Anti-cramming / Anti-thinning:** Follow the same rules as `wiki-absorb`.

**Candidate handling:** Follow Candidate System from `_wiki-common.md`:
- Single-source new pages → `status: candidate`
- Second source enriching candidate → promote to mature, rewrite with Concept Page Template

**After every 5 files:** Rebuild `wiki/index.md` and `wiki/_backlinks.json`.

### 4. Refresh QMD

Regardless of whether new files were absorbed, update the QMD index and
embeddings so the vector DB reflects the latest wiki state:

```bash
qmd update && qmd embed
```

Report the QMD status after refresh (file count, vector count).

### 5. Generate Prompts for Witness

After absorption is complete, scan today's changes and generate writing prompts
that bridge compiled knowledge with personal reflection.

**Process:**
1. Read `wiki/log.md` entries from today to identify pages touched/created
2. For each **mature page** (`sources: 2+`) touched today:
   - Read its `## Prompts for witness` section if present
   - Check if any prompt is new or updated
3. For each **new candidate** (`status: candidate`) created today:
   - Generate 1-2 starter prompts based on the single source's themes
4. Read recent `witness/daily/` entries (last 7 days) to avoid repetition

**Output format:**

Create a file at `$VAULT/outputs/prompts-for-witness-YYYY-MM-DD.md`:

```markdown
# Prompts for Witness — YYYY-MM-DD

Based on today's wiki updates:

## From [[wiki/page-name]] (mature, N sources)

{Context: 1-2 sentences on what this page is about}

**Prompt 1:** {Essay-shaped question bridging concept with personal experience}
**Prompt 2:** {Contrarian or exploratory prompt}

## From [[wiki/another-page]] (candidate, 1 source)

{Context: why this is still forming}

**Prompt 1:** {Early reflection — what would confirm or challenge this idea?}

---

*These prompts are suggestions. Write in witness/daily/YYYY-MM-DD.md if inspired.*
```

**Prompt design principles:**
- Specific enough to provoke writing, open enough to allow exploration
- Bridge compiled knowledge (`wiki/`) with personal context (`witness/`)
- Include contrarian angles: "what would the opposite look like?"
- Reference Jean's current projects when relevant (read `wiki/self/goals-tracking`)
- Avoid generic prompts like "what do you think about X?"

### 6. Report

Summarize:
- Files discovered (last 24h)
- Files skipped (already absorbed)
- Files absorbed (new or changed)
- Wiki pages touched / created / promoted
- Candidates created / promoted
- QMD status (files indexed, vectors embedded)
- Prompts for witness generated (count + file path)

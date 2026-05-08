# Wiki Common Standards

Shared by all wiki-* skills. Read this file when you need Writing Standards,
Ingest Protocol, Classification Rules, or vault paths.

## Vault & Paths

- **Vault path**: `/Users/jean/Documents/Obsidian Vault`
- **Raw root**: `$VAULT/raw`
- **Wiki root**: `$VAULT/wiki`
- **Schema file**: `$VAULT/CLAUDE.md`
- **Absorb log**: `$VAULT/wiki/_absorb_log.json`
- **Backlinks index**: `$VAULT/wiki/_backlinks.json`
- **Outputs**: `$VAULT/outputs/`

Always read `CLAUDE.md` before performing an ingest or absorb.
Always read `wiki/_absorb_log.json` before processing raw files to avoid duplicates.
For raw emergence runs, read the pilot MOCs before scanning raw sources so the
report is anchored to active questions instead of becoming a generic digest.

## Directory Structure

```
raw/
  to-learn/                    # Deep articles, essays, builder threads
  newsletters/<source>/        # Newsletter issues
  twitter/x-articles/          # Long-form X posts
  twitter/x-posts/             # Short X posts / bookmarks
  tools/                       # Tool docs, skill references, CLI notes
  briefing/<type>/             # Auto-generated briefings
  assets/                      # Images, downloads
wiki/
  index.md                     # Master index
  _absorb_log.json             # Tracks which raw files have been absorbed
  _backlinks.json              # Reverse link index
  {section}/                   # Topic sections
outputs/                       # Generated answers from /wiki-query
  ideas/                       # Durable ideas that may become drafts
  drafts/                      # Active article/report drafts
  ready/                       # Ready-to-publish artifacts
  published/                   # Published artifacts
```

## Permanent Knowledge vs One-Off Material

`raw/` stores source material. `wiki/` stores durable knowledge. `outputs/`
stores one-off answers, reports, drafts, and published artifacts.

Do not turn a briefing, newsletter, tweet, or XHS note into a standalone wiki
page just because it exists. First decide what kind of material it contains:

| Material | Destination |
|----------|-------------|
| Pure news, duplicate updates, one-off facts | Keep in `raw/`, log absorb/skipped status |
| Reusable facts about a person, product, tool, or project | Update `page_kind: entity` or `tool` page |
| Reusable insight or framework | Create/update `page_kind: concept` |
| Cross-page synthesis with durable value | Create/update `page_kind: synthesis` or a MOC |
| One-off answer, report, draft, or publication | Save under `outputs/` |

`outputs/` may cite `wiki/`, but concept pages should not depend on a specific
output artifact.

## Page Kinds and Judgment Status

New or substantially updated wiki pages should include:

```yaml
page_kind: overview | concept | entity | tool | synthesis | moc | output
knowledge_status: ai_draft | human_verified | hypothesis | disputed | reference
source_type: article | tweet | newsletter | briefing | xhs | conversation | personal_judgment
judgment_owner: ai | jean | mixed
```

Keep the existing `sources`, `status`, `section`, and `updated` fields. `status`
tracks source maturity. `knowledge_status` tracks judgment confidence.

Rules:
- AI-created or AI-substantially-rewritten concepts default to `knowledge_status: ai_draft`.
- AI must not set `knowledge_status: human_verified` unless Jean explicitly confirms it.
- Use `hypothesis` when a claim is plausible but under-sourced.
- Use `disputed` when sources conflict or Jean rejects the claim.
- `personal_judgment` requires explicit Jean input or `witness/` evidence.

## MOC Pages

`page_kind: moc` pages are living Maps of Content, not flat link lists. The first
MOC pilots are `wiki/claude-code/overview.md`,
`wiki/harness-engineering/overview.md`, and
`wiki/product-trends/overview.md`.

Each MOC/overview should include:

```markdown
## Core Questions
## Key Concepts
## Main Tensions
## Current Judgments
## To Read / To Verify
## Output Directions
```

MOC pages should explain how linked pages relate to the topic. If current
judgments are AI-authored, mark them as draft or hypothesis.

## Absorb Decisions

Every absorb run must make these decisions before writing durable knowledge:

1. **Create an atomic concept?** Create `page_kind: concept` only when the
   source contains one reusable insight that cannot be integrated cleanly into
   an existing concept. Single-source concepts stay `status: candidate` and
   `knowledge_status: ai_draft` or `hypothesis`.
2. **Update a parent concept?** Prefer enriching an existing parent concept over
   creating a thin page. When a new atomic concept is created, update the parent
   concept or related overview with a wikilink and a short relationship note.
3. **Update a MOC?** Update a MOC only when the source changes the topic map:
   a new concept becomes important, a tension changes, a current judgment needs
   revision, or an output direction becomes actionable. Ordinary source updates
   should not churn MOCs.
4. **Keep as material?** If the source is news, a briefing item, a newsletter
   issue, or a one-off output with no reusable insight, keep it in `raw/` or
   `outputs/` and record the skip or idea decision.

## Tracking State

State is tracked in `wiki/_absorb_log.json`.

**Before processing any raw file:**
1. Read `_absorb_log.json`
2. Compute SHA256: `shasum -a 256 <file>`
3. Check the log:
   - Path + hash match → skip
   - Path exists, hash changed → re-absorb
   - Path not found → proceed

**After successful ingest, append to `_absorb_log.json`:**
```json
"raw/path/to/file.md": {
  "status": "absorbed",
  "decision": "absorb_now",
  "observed_at": "2026-04-20T09:58:00Z",
  "absorbed_at": "2026-04-20T10:00:00Z",
  "wiki_pages": ["section/page-name"],
  "outputs": [],
  "observed_hash": "sha256:...",
  "hash": "sha256:..."
}
```

Status values: `absorbed` | `skipped_empty` | `skipped_duplicate` |
`skipped_one_off` | `idea_candidate` | `failed` | `pending`

Decision values: `absorb_now` | `emerge_later` | `raw_only` | `ask_jean`.

`observed_hash` is optional and belongs to capture/observe steps that normalize
external material before it becomes a raw file. `hash` is the SHA256 of the raw
file inside the vault and is the required absorb idempotency key. If both are
present, keep both; do not replace the raw-file hash with an external capture
hash.

Also append a human-readable entry to `wiki/log.md`.

## Raw Emergence Protocol

Raw emergence is the periodic distillation step between `raw/` and `wiki/`.
It is used when accumulated source material may contain patterns that are not
visible from a single file.

Default output path:

```text
outputs/ideas/YYYY-MM-DD-raw-emergent-themes.md
```

Rules:
- Do not write directly to `wiki/` during emergence.
- Cluster raw sources against active MOC questions, especially
  `wiki/claude-code/overview.md`, `wiki/harness-engineering/overview.md`, and
  `wiki/product-trends/overview.md`.
- Prefer repeated themes across 2+ sources. Single-source observations can be
  listed as `wait_for_second_source`.
- Every candidate must cite raw sources and propose one action:
  `promote_to_concept`, `update_moc`, `keep_in_ideas`,
  `wait_for_second_source`, `discard_raw_only`, or `ask_jean`.
- Put all judgment calls under **Pending Jean review**. Emergence may recommend
  a concept, but it must not mark anything `human_verified`.
- If a source is clearly one-off, leave it in `raw/` and note why. It does not
  need a wiki page.

## Candidate System

Inspired by Foundry's compile workflow. A concept page needs **at least 2 sources** to be considered "mature." Single-source pages are **Candidates** — they exist but are not yet full concept pages.

### Page Maturity States

| State | Condition | Location/Tag |
|-------|-----------|-------------|
| `candidate` | `sources: 1` | Frontmatter `status: candidate` |
| `mature` | `sources: 2+` | Frontmatter `status: mature` (or omitted, default) |

### Candidate Rules

1. **On creation**: If a new wiki page is seeded by a single source, set `status: candidate` in frontmatter.
2. **On absorb**: When a second (or more) source enriches a candidate page:
   - Remove `status: candidate` (or set `status: mature`)
   - Rewrite the page as a synthesized concept page, not a summary of either source
   - Use the Concept Page Template (see below)
3. **Candidates directory**: Optionally place candidate pages in `wiki/candidates/` subdirectory. Move to relevant section on promotion.
4. **Cleanup**: `wiki-cleanup` flags candidates that have been waiting >30 days without a second source — suggest deletion or merge into a parent page.

### Candidate Frontmatter

```yaml
---
title: Topic Name
section: section-name
page_kind: concept
sources: 1
status: candidate
knowledge_status: ai_draft
source_type: article
judgment_owner: ai
updated: YYYY-MM-DD
---
```

## Ingest Protocol

For each raw file:

1. **Read the source file fully.**
2. **Read `CLAUDE.md`** from the vault root for schema and Theme Aggregation Rules.
3. **Classify before extracting.** Decide whether the source is one-off material, reference/entity evidence, reusable concept material, durable synthesis, or output material.
4. **Check Theme Aggregation Rules.** If the topic merges into a parent page, note it.
5. **Determine affected wiki sections** based on content topics and entities.
6. **Write or update wiki pages only for durable knowledge** in the most relevant `wiki/<section>/` directory.
   - Use `[[wikilinks]]` for entities, concepts, people, products, organizations.
   - Add/update frontmatter: `title`, `section`, `sources`, `updated`, `page_kind`, `knowledge_status`, `source_type`, `judgment_owner`.
   - If merging into parent: append a new section, update `sources` count.
7. **Update related entity/concept/MOC pages.** Create stubs if missing.
8. **Update `wiki/index.md`** with links to any new pages.
9. **Append to `wiki/_absorb_log.json`.**
10. **Append to `wiki/log.md`:**
   ```markdown
   ## [YYYY-MM-DD] ingest | <Source Title>
   Pages touched: [[page1]], [[page2]], ...
   Key additions: one sentence summary.
   Files processed:
   - [[raw/path/to/file.md|Source Title]] → [[wiki/Section/Page]]
   ```

End every ingest/absorb/query write-back with a **Pending Jean review** section
when AI-drafted knowledge was created or materially changed:

```markdown
## Pending Jean review

- [[section/page]] — `ai_draft`; suggested action: keep draft / verify / mark hypothesis / dispute / downgrade to output.
```

## Classification Rules

| Source type | Target path |
|-------------|-------------|
| Web article / blog post / essay | `raw/to-learn/<slug>.md` |
| Newsletter issue | `raw/newsletters/<source-name>/<slug>.md` |
| X/Twitter thread or long-form post | `raw/twitter/x-articles/<slug>.md` |
| X/Twitter short post / bookmark | `raw/twitter/x-posts/<slug>.md` |
| Tool doc / skill reference / CLI note | `raw/tools/<slug>.md` |
| Auto-generated briefing | `raw/briefing/<type>/<slug>.md` |
| Image | `raw/assets/<slug>.<ext>` |

- Never create new top-level directories in `raw/`.
- Only `newsletters/<source-name>/` subdirs can be auto-created.

## Writing Standards

### Tone: Encyclopedic, Not Editorial

Write like Wikipedia. Flat, factual. State what happened.

**Never use:**
- Em dashes
- Peacock words: "legendary," "visionary," "groundbreaking," "deeply," "truly"
- Editorial voice: "interestingly," "importantly," "it should be noted"
- Rhetorical questions
- Progressive narrative: "would go on to," "embarked on"
- Qualifiers: "genuine," "raw," "powerful," "profound"

**Do:**
- Lead with the subject, state facts plainly
- One claim per sentence. Short sentences.
- Simple past or present tense
- Attribution over assertion
- Dates and specifics replace adjectives

### Article Format

```markdown
---
title: Article Title
section: section-name
sources: 3
updated: YYYY-MM-DD
---

# Article Title

{Content organized by theme, not chronology}

## Sources

- [[raw/path/to/source.md|Source Display Name]]
```

### Concept Page Template (for mature pages with 2+ sources)

Use this template when promoting a candidate to mature, or when creating a new
concept page. It is allowed for single-source candidates, but they must keep
`status: candidate` and `knowledge_status: ai_draft` or `hypothesis`.

```markdown
---
title: Concept Name
section: section-name
page_kind: concept
sources: 2
status: mature
knowledge_status: ai_draft
source_type: article
judgment_owner: ai
updated: YYYY-MM-DD
---

# Concept Name

## What it is

{A clear, concise definition of the concept. One paragraph.}

## Why it matters

{Why this concept is important in the context of AI, software engineering, or Jean's work.}

## Key points

- {Point distilled from multiple sources}
- {Another point with consensus or tension across sources}
- {Pattern or framework that emerges}

## Evidence across sources

| Source | Key Claim | Relevance |
|--------|-----------|-----------|
| [[raw/path/to/source-a.md|Source A]] | {Claim} | {How it supports the concept} |
| [[raw/path/to/source-b.md|Source B]] | {Claim} | {How it supports or contradicts} |

## Open questions

- {What remains unclear or contested?}
- {What would change Jean's mind on this?}

## Prompts for witness

- {Essay-shaped question where this concept intersects with Jean's personal experience or goals}
- {Reflection prompt: how does this concept apply to Jean's current projects?}
- {Contrarian prompt: what would the opposite of this concept look like in practice?}

## Related

- [[related-concept]]
- [[another-page]]

## Sources

- [[raw/path/to/source-a.md|Source A]]
- [[raw/path/to/source-b.md|Source B]]
```

**Prompts for witness** are essay-shaped questions designed to bridge compiled knowledge and personal reflection. They should be specific enough to provoke writing but open enough to allow exploration. Update them as new sources arrive.

### Linking

Use `[[wikilinks]]` between articles. For subdirectory articles: `[[section/filename]]`.

**Raw source links — CRITICAL:**
Every reference to a raw file **must** use `[[wikilink]]` format. Backticks break the backlink index.

Correct: `[[raw/to-learn/article.md|Article Title]]`
Wrong: `` `raw/to-learn/article.md` ``

### Length Targets

| Type | Target |
|------|--------|
| Overview / MOC page | 80-180 lines |
| Standard article | 40-80 lines |
| Concept page | 40-100 lines |
| Thin (needs expansion) | <15 lines or <100 words |
| Crammed (needs split) | >150 lines or >3000 words |

## Principles

1. You are a **writer**, not a filing clerk.
2. Every source is classified and logged. Only reusable insight enters durable wiki pages.
3. Articles are knowledge, not chronology. Synthesize, don't summarize.
4. Concept articles are essential. Patterns, themes, frameworks.
5. Revise your work. Rewrite articles that read like event logs.
6. Breadth and depth. Create pages aggressively, but every page must gain substance.
7. The structure is alive. Merge, split, rename, restructure freely.
8. Connect, don't just record.
9. Cite sources. Every claim traces back to a raw file.

## Concurrency Rules

- Never delete or overwrite a file without reading it first.
- Re-read any article immediately before editing it.
- Never modify `_absorb_log.json` except to append.
- Rebuild `index.md` and `_backlinks.json` only at the very end of a command.

## Tool Preferences

- **Obsidian CLI**: `/Applications/Obsidian.app/Contents/MacOS/obsidian` for vault reads/writes.
- **Large files (>10KB)**: Use `cp` into the vault path instead of Obsidian CLI.
- **Hash computation**: `shasum -a 256 <file>` or Python `hashlib.sha256()`.

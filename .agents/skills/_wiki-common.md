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
```

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
  "absorbed_at": "2026-04-20T10:00:00Z",
  "wiki_pages": ["section/page-name"],
  "hash": "sha256:..."
}
```

Status values: `absorbed` | `skipped_empty` | `skipped_duplicate` | `failed` | `pending`

Also append a human-readable entry to `wiki/log.md`.

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
sources: 1
status: candidate
updated: YYYY-MM-DD
---
```

## Ingest Protocol

For each raw file:

1. **Read the source file fully.**
2. **Read `CLAUDE.md`** from the vault root for schema and Theme Aggregation Rules.
3. **Check Theme Aggregation Rules.** If the topic merges into a parent page, note it.
4. **Determine affected wiki sections** based on content topics and entities.
5. **Write or update wiki pages** in the most relevant `wiki/<section>/` directory.
   - Use `[[wikilinks]]` for entities, concepts, people, products, organizations.
   - Add/update frontmatter: `title`, `section`, `sources`, `updated`.
   - If merging into parent: append a new section, update `sources` count.
6. **Update related entity/concept pages.** Create stubs if missing.
7. **Update `wiki/index.md`** with links to any new pages.
8. **Append to `wiki/_absorb_log.json`.**
9. **Append to `wiki/log.md`:**
   ```markdown
   ## [YYYY-MM-DD] ingest | <Source Title>
   Pages touched: [[page1]], [[page2]], ...
   Key additions: one sentence summary.
   Files processed:
   - [[raw/path/to/file.md|Source Title]] → [[wiki/Section/Page]]
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

Use this template when promoting a candidate to mature, or when creating a new page that already has 2+ sources.

```markdown
---
title: Concept Name
section: section-name
sources: 2
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
| Overview / theme page | 80-150 lines |
| Standard article | 40-80 lines |
| Thin (needs expansion) | <15 lines or <100 words |
| Crammed (needs split) | >150 lines or >3000 words |

## Principles

1. You are a **writer**, not a filing clerk.
2. Every source ends up somewhere. Woven into understanding, not mechanically filed.
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

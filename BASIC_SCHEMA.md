# LM Wiki — Basic Schema

A universal schema for LLM-compiled knowledge bases.

This document is the "constitution" of any LM Wiki. It defines the architecture, classification rules, and editorial protocol that let a knowledge base evolve on its own: related concepts auto-associate, duplicate information auto-merges, conflicting views are recorded side by side.

---

## 1. Architecture

Three layers. Each layer has a single responsibility.

```
raw/          # Immutable source documents. You read from here, never modify.
wiki/         # Compiled knowledge. The LLM creates, updates, and maintains.
outputs/      # Generated answers, reports, and query results.
```

### Layer Rules

| Layer | Rule |
|-------|------|
| `raw/` | Immutable. Once a source is dropped here, it never changes. The SHA256 hash is the source of truth. |
| `wiki/` | The LLM owns this entirely. Humans review; the LLM maintains. |
| `outputs/` | Read-only artifacts. Query results live here. They may be filed back into `wiki/` if they meet the synthesis threshold (see Section 7). |

### Tracking State

State is tracked in `wiki/_absorb_log.json`.

**Before processing any raw file:**
1. Read `_absorb_log.json`.
2. Compute SHA256: `shasum -a 256 <file>`.
3. Check the log:
   - Path + hash match → skip.
   - Path exists, hash changed → re-absorb.
   - Path not found → proceed.

**After successful ingest, append:**
```json
"raw/path/to/file.md": {
  "status": "absorbed",
  "absorbed_at": "2026-04-20T10:00:00Z",
  "wiki_pages": ["section/page-name"],
  "hash": "sha256:..."
}
```

Status values: `absorbed` | `skipped_empty` | `skipped_duplicate` | `failed` | `pending`.

---

## 2. Directory Structure (Recommended, Not Mandatory)

Categories emerge from your data. Do not pre-create empty directories. However, every wiki tends toward certain shapes. Here are two recommended starting patterns.

### Pattern A: Knowledge Tracker (Learning & Research)

Use this when your raw sources are articles, newsletters, tweets, videos, and papers — you are building a map of a field.

```
wiki/
  index.md
  _absorb_log.json
  _backlinks.json
  {domain}/           # Domains of knowledge
    overview.md       # Domain introduction and index
    {topic}.md        # Specific topics, concepts, or entities
```

Common domains that tend to emerge:

| Directory | What goes here |
|-----------|---------------|
| `concepts/` | Ideas, frameworks, mental models, techniques |
| `entities/` | Named things: people, companies, products, tools, datasets |
| `sources/` | Papers, articles, talks, books, blog posts (bibliographic depth) |
| `forecasts/` | Predictions, long-horizon thinking, trend analysis |
| `comparisons/` | Side-by-side analysis of related entities or approaches |
| `synthesis/` | Cross-cutting summaries that span multiple domains |

### Pattern B: Life Wiki (Personal Knowledge)

Use this when your raw sources are journals, messages, writing, and bookmarks — you are building a map of a mind.

```
wiki/
  index.md
  _absorb_log.json
  _backlinks.json
  {category}/         # Emergent categories from your life
    article.md
```

Common categories that tend to emerge:

| Directory | What goes here |
|-----------|---------------|
| `people/` | Named individuals |
| `projects/` | Things built with serious commitment |
| `concepts/` | Ideas and mental models |
| `patterns/` | Recurring behavioral or decision cycles |
| `philosophies/` | Articulated positions about how to work and live |
| `eras/` | Major biographical phases |
| `decisions/` | Inflection points with enumerated reasoning |
| `places/` | Cities, buildings, neighborhoods |

### Hybrids Are Fine

Most real wikis become hybrids. A knowledge tracker accumulates `people/` and `patterns/` as it matures. A life wiki grows `concepts/` and `forecasts/` as the subject deepens into fields. The schema does not enforce a pattern — it provides vocabulary for what emerges.

---

## 3. Frontmatter Contract

Every wiki page must include YAML frontmatter. Fields are divided into **required** and **optional**.

```yaml
---
title: Page Title
section: domain-name          # The wiki directory this page belongs to
sources: 3                    # Number of raw sources this page draws from
updated: YYYY-MM-DD           # Last modification date
---
```

### Required Fields

| Field | Description |
|-------|-------------|
| `title` | Human-readable title. Used in indexes and link rendering. |
| `section` | The directory name under `wiki/`. Defines the page's primary category. |
| `sources` | Integer count of raw sources this page synthesizes. Increment when new sources are absorbed. |
| `updated` | ISO date (`YYYY-MM-DD`) of last meaningful edit. Cosmetic fixes do not update this. |

### Optional Fields

| Field | Description |
|-------|-------------|
| `type` | Semantic type: `entity`, `concept`, `source`, `query`, `comparison`, `synthesis`, `overview`. Helps the LLM decide aggregation strategy. Not enforced — use only if it adds clarity. |
| `created` | ISO date when the page was first created. |
| `tags` | Array of strings for cross-cutting themes that span sections. |
| `related` | Array of `[[wikilinks]]` to closely connected pages. |
| `status` | `stub`, `draft`, `complete`, `archived`. Useful for workflow tracking. |

### Notes on `section` vs `type`

- `section` is **spatial** — it tells the viewer and the LLM where the file lives. It is the primary organizational key.
- `type` is **semantic** — it hints at how the page should be treated during aggregation (e.g., a `source` page should not absorb other sources; a `concept` page should).

If you are unsure which to use, use `section` only. `type` is an optional enhancement.

---

## 4. Theme Aggregation Rules (The Core)

These rules answer the question: *"New content has arrived. Do I create a new page, merge it into an existing one, or split an existing one?"*

The default posture is **merge**. Creating a new page requires justification. Splitting a page requires pain.

### Rule 1: When to Create a New Page

Create a new page only when at least one of the following is true:

1. **Named thing with 3+ meaningful references** — A person, company, product, or tool appears across multiple sources with enough substance to write 3+ meaningful sentences that are not just summaries of other pages.
2. **Emergent pattern** — The same theme surfaces across 3+ distinct sources (e.g., a recurring framework, a persistent debate, a novel architectural pattern). This is often the most valuable page type.
3. **Independent conceptual depth** — A sub-topic has 5+ sources *and* enough depth to stand alone. The parent page should link to it, not contain it.
4. **Query synthesis** — A `/wiki query` produced a non-obvious connection spanning 3+ pages that deserves durable recording (see Section 7).

**Anti-pattern:** Creating a stub because a concept was mentioned once. A mention is not a mandate.

### Rule 2: When to Merge into an Existing Page

Merge incoming content into an existing page when:

1. **Versioned variants** — `product-v1`, `product-v2` → section "Versions" on the parent product page.
2. **Feature-specific detail** — A feature with <5 sources and no independent conceptual depth → section on the product page.
3. **Newsletter briefings** — Individual briefings never get standalone pages. They update existing pages.
4. **Event updates** — A product launch, a funding round, a model release → update the entity page's "Recent Changes" section.
5. **Thin overlap** — The new content covers ground already well-represented, adding only minor detail.

**Implementation:**
- Append as a new section rather than tacking onto the bottom.
- Update the parent page's `sources` count.
- Ensure the page still reads as a coherent whole after the merge.

### Rule 3: When to Split an Existing Page

Split a page when:

1. **Length threshold** — Page exceeds 150 lines or 3000 words *and* covers two or more distinct topics that each have 3+ sources.
2. **Structural incoherence** — The page has sections that read like independent articles with weak internal transitions.
3. **Divergent audiences** — Two parts of the page serve readers with fundamentally different goals.

**Implementation:**
- Extract the sub-topic into a new page.
- Replace the extracted content in the parent with a 2-3 sentence summary and a `[[link]]` to the new page.
- Update both pages' `sources` counts.

### Rule 4: Conflict Handling

When two sources contradict each other on the same concept:

1. **Do not resolve arbitrarily.** The wiki records understanding, not truth.
2. **Note the contradiction in the relevant concept or entity page.** Add a "Counterpoints & Gaps" or "Conflicting Views" section.
3. **Create or update a `query` page** to track the open question if the contradiction is significant and unresolved.
4. **Link both sources** from the query page.
5. **Resolve in a `synthesis` page** only once sufficient evidence exists to form a durable conclusion.

**Example:**
```markdown
## Counterpoints & Gaps

- Source A argues X ([[raw/sources/article-a.md|Author A, 2026]]).
- Source B argues not-X, claiming Y ([[raw/sources/article-b.md|Author B, 2026]]).
- The disagreement hinges on Z, which neither source addresses directly.
```

### Rule 5: The Cramming / Thinning Guardrails

| Problem | Symptom | Fix |
|---------|---------|-----|
| **Cramming** | Adding a 3rd paragraph about a sub-topic to an existing article | Create a dedicated page for the sub-topic |
| **Thinning** | A page with <15 lines or <100 words body text | Merge into the most relevant parent page, or expand with 2+ additional sources |
| **Bloating** | A page >150 lines covering multiple distinct themes | Split into child pages |

---

## 5. Classification Guidelines (Automatic & Recommended)

The LLM should classify content automatically. These guidelines help it do so consistently without imposing a rigid taxonomy.

### Source Priority (Absorption Weight)

Not all raw sources carry equal weight. Process in this order:

| Priority | Source Type | Treatment |
|----------|-------------|-----------|
| 1 | **Long-form writing** — essays, blog posts, papers, books | Nearly every source seeds or substantially enriches a wiki page. Backbone. |
| 2 | **Briefings / digests** — auto-generated summaries, newsletters | Selective. Only novel insights. Never create standalone per-briefing pages. |
| 3 | **Short-form** — tweets, bookmarks, notes | Interest signals. Update existing articles. Create standalone only for ideas not covered elsewhere. |
| 4 | **Conversations / messages** — chats, interviews | Highly selective. Only patterns that repeat or moments that clearly mattered. |

### Classification Triggers

When a new source arrives, the LLM asks:

1. **What is this about?** (Extract 1-3 themes.)
2. **Do these themes have pages?** (Check `wiki/index.md` and existing sections.)
3. **Which Theme Aggregation Rule applies?** (Create / Merge / Split / Conflict.)
4. **Where does the resulting content belong?** (Place in the most relevant existing section. Create a new section only when a cluster of 5+ articles clearly warrants it.)

### Section Emergence Rule

Do not create a new top-level section until:
- At least 5 pages clearly belong to it, **and**
- They do not fit cleanly into any existing section, **and**
- They share a coherent conceptual boundary.

When in doubt, use a broader section with a strong `overview.md`.

---

## 6. Linking & Indexing

### Wikilinks

Use `[[wikilinks]]` between articles. Format:
- `[[page-slug]]` — link to page in the same section
- `[[section/page-slug]]` — link to page in another section
- `[[section/page-slug|Display Text]]` — link with custom label

**Every reference to a raw file must also use `[[wikilink]]` format.** Backticks break the backlink index.

Correct: `[[raw/to-learn/article.md|Article Title]]`
Wrong: `` `raw/to-learn/article.md` ``

### Backlinks Index

`wiki/_backlinks.json` tracks the reverse mapping:

```json
{
  "section/page-name": ["other-section/page-a", "other-section/page-b"]
}
```

Keys are link targets (normalized to `section/filename` without `.md`). Values are arrays of pages that link to that target.

Rebuild `_backlinks.json` after any batch of edits that changes links.

### Index Format

`wiki/index.md` is the master catalog:

```markdown
# Wiki Index

## Section Name
- [[section/page-name]] — one-line summary (N sources)

_Last updated: YYYY-MM-DD_
```

---

## 7. Operations

### INGEST

Trigger: New sources arrive in `raw/`.

Steps:
1. List all files under `raw/` recursively, sorted by modification time (newest first).
2. Read `_absorb_log.json`.
3. For each file, compute SHA256. Skip if path+hash matches.
4. Classify the source type and apply the appropriate priority weight.
5. Execute the Ingest Protocol (read source, match against wiki, update/create pages, add wikilinks).
6. Append to `_absorb_log.json` and `wiki/log.md`.

### ABSORB

Trigger: Re-process raw files against current wiki state, or after schema/rule changes.

Process chronologically. For each entry:
1. Read the source fully.
2. Understand what it means — not "what facts" but "what does this tell me?"
3. Match against the wiki index. What existing articles does this touch?
4. Apply Theme Aggregation Rules (Create / Merge / Split / Conflict).
5. Update existing articles or create new ones. Integrate so the article reads as a coherent whole.
6. Connect to patterns. When the same theme surfaces across sources, ensure the concept article captures it.

**Every 15 Entries: Checkpoint**
1. Rebuild `index.md` and `_backlinks.json`.
2. **New article audit:** If zero new articles in the last 15, you are cramming.
3. **Quality audit:** Re-read 3 most-updated articles. Rewrite any that read like event logs.
4. Check for articles exceeding 150 lines that should be split.
5. Check directory structure. Create new sections when warranted.

### QUERY

Trigger: User asks a question about the wiki.

Steps:
1. Read `wiki/index.md`. Scan for relevant pages.
2. Check `_backlinks.json` for articles referencing the topic.
3. Read 3-8 relevant articles. Follow `[[wikilinks]]` 2-3 links deep.
4. Synthesize. Lead with the answer, cite articles by name, connect dots, acknowledge gaps.
5. Save the response to `outputs/` with a descriptive filename.

**Synthesis Write-Back:**
After saving to `outputs/`, evaluate whether the answer qualifies for wiki write-back:
- Drew from 3+ distinct wiki pages?
- Contains a non-obvious connection not present in any single source?
- Topic is durable (not ephemeral news)?

If all true, create or update a wiki page with the synthesis.

### LINT

Trigger: Periodic audit (e.g., weekly) or user request.

Check for:
- Orphan pages (zero inbound wikilinks)
- Missing cross-references (concepts mentioned but not linked)
- Contradictions between pages
- Stale claims superseded by newer sources
- Theme Aggregation violations (pages that should be merged)
- Thin pages (<100 words) and crammed pages (>3000 words)
- Broken wikilinks

Output a lint report. Apply fixes with user approval.

---

## 8. Writing Standards

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
- Attribution over assertion: "She argued X" not "X is true"
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

### Length Targets

| Type | Target |
|------|--------|
| Overview / theme page | 80-150 lines |
| Standard article | 40-80 lines |
| Thin (needs expansion) | <15 lines or <100 words |
| Crammed (needs split) | >150 lines or >3000 words |

---

## 9. Principles

1. **You are a writer, not a filing clerk.** Every source ends up woven into understanding, not mechanically filed.
2. **Articles are knowledge, not chronology.** Synthesize, don't summarize.
3. **Concept articles are essential.** Patterns, themes, frameworks — this is where the wiki becomes a map of understanding.
4. **Revise your work.** Rewrite articles that read like event logs.
5. **Breadth and depth.** Create pages aggressively, but every page must gain real substance.
6. **The structure is alive.** Merge, split, rename, restructure freely.
7. **Connect, don't just record.** Find the web of meaning between entities.
8. **Cite sources.** Every claim traces back to a raw file.
9. **The human reviews; the LLM maintains.** Corrections are normal and expected.

---

## 10. Concurrency Rules

- Never delete or overwrite a file without reading it first.
- Re-read any article immediately before editing it.
- Never modify `_absorb_log.json` except to append.
- Rebuild `index.md` and `_backlinks.json` only at the very end of a command.

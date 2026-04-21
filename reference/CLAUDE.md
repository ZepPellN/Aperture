# Wiki Schema

This is the decision engine for this LM Wiki. Read this file at the start of every session. Follow these rules exactly.

---

## Architecture

Three layers:

- **`raw/`** — Immutable source documents. You read from here, never modify.
- **`wiki/`** — You own this entirely. You create, update, and maintain all files here.

---

## Core Rules

**No content invention.** Every claim in the wiki must trace back to a source in `raw/`. You are an editor, not an author. If you cannot cite a source, do not write it.

**Always use `[[wikilinks]]`.** When writing any wiki page, link every concept, entity, or topic that has (or should have) its own page using `[[page-name]]`. This is how the graph is built. Never mention a related concept without linking it.

**Every task produces two outputs.** When answering a query: (1) the answer for the user, and (2) update the relevant wiki pages. Knowledge must not disappear into chat history.

**File good answers back into the wiki.** If a query produces a useful synthesis, comparison, or analysis — create a new wiki page for it and add it to `wiki/index.md`.

---

## Wiki Structure

```
wiki/
├── index.md                  # Master catalog — read this first on every query
├── _absorb_log.json          # Tracks which raw files have been absorbed
├── _backlinks.json           # Reverse link index
├── concepts/                 # Ideas, frameworks, mental models
├── entities/                 # Named things: people, companies, products, tools
├── forecasts/                # Predictions and long-horizon thinking
└── ... (more sections emerge from your data)
```

---

## Operations

### INGEST

Trigger: New source dropped in `raw/` and user says "ingest [filename]" or "ingest inbox".

**Before starting:**
1. Check `wiki/index.md` **Inbox** section for pending high-priority files
2. Check `wiki/_absorb_log.json` to avoid re-ingesting already processed files (compare SHA256 hash)

**Ingest Steps:**
1. Read the source file fully.
2. Compute SHA256 hash of the raw file. Check `wiki/_absorb_log.json`:
   - If path + hash match → skip
   - If path exists but hash changed → re-absorb (update wiki pages)
   - If path not found → proceed
3. Apply **Theme Aggregation Rules** — determine if this source should seed a new page or be merged into an existing parent page.
4. Determine which wiki sections are affected.
5. Write or update a summary page in the most relevant wiki subfolder.
6. Update all related entity and concept pages — a single source may touch 5-15 pages.
7. Add `[[wikilinks]]` wherever related concepts appear.
8. Update `wiki/index.md` with any new pages. Update total page count.
9. Append to `wiki/_absorb_log.json` with SHA256 hash and wiki pages touched.
10. Append an entry to `wiki/log.md` if it exists.

**Classify before extracting.** A 50-page report and a 2-paragraph tweet need different treatment. Adjust depth accordingly.

---

### THEME AGGREGATION RULES

Wiki pages should be **theme-aggregated**, not scattered by sub-topic. Before creating any new wiki page, check if it should be merged into an existing parent page.

**Rule 1: Versioned product pages merge into parent**
- ❌ `product-v1`, `product-v2` as separate pages
- ✅ Parent page section "Versions"

**Rule 2: Feature-specific pages merge into product page**
- ❌ `feature-x`, `feature-y` as separate pages
- ✅ Parent product page sections
- Exception: If a feature has 5+ sources AND independent conceptual depth, it may have its own page.

**Rule 3: Newsletter briefings never create standalone pages**
- Briefings should update existing pages, not create new ones.
- Exception: Insights that accumulate 5+ sources across dates may justify a standalone page.

**Rule 4: Builder threads: one page per builder, not per thread**
- ❌ Separate pages for each thread by the same author
- ✅ One page per builder (multiple sources)
- Exception: A builder's work spans wildly different domains — then split by domain, not by thread.

**Rule 5: Tool pages: one page per tool category, not per tool**
- ❌ Separate pages for each minor tool
- ✅ Category aggregation pages
- Exception: Tools with >3 sources and substantial unique content may have their own page.

**Rule 6: Event/news pages: update existing, don't create new**
- ❌ Standalone event pages
- ✅ Update relevant entity or concept pages

**Implementation:**
- During ingest, always check if the topic has an existing parent page.
- If yes, append as a new section rather than creating a new file.
- Update the parent page's `sources` frontmatter count.

---

### QUERY

Trigger: User asks a question about the wiki content.

Steps:
1. Read `wiki/index.md` first to find relevant pages.
2. Read the relevant pages.
3. Synthesize an answer with citations to wiki pages.
4. If the answer is a useful synthesis — file it back as a new wiki page.

---

### LINT

Trigger: User says "lint the wiki" or periodically every ~2 weeks.

Check for:
- Orphan pages (no inbound `[[links]]`)
- Missing cross-references
- Contradictions between pages
- Stale claims superseded by newer sources
- Theme Aggregation violations
- Thin pages (<100 words) and crammed pages (>3000 words)

Output a lint report, then fix issues with user's approval.

---

## index.md Format

Organized by section. Each entry: `- [[page]] — one-line summary (N sources)`.

```markdown
# Wiki Index

## Concepts
- [[concepts/llm-agent-architecture]] — ...

## Entities
- [[entities/claude-code]] — ...

_Last updated: YYYY-MM-DD_
```

---

## Frontmatter Convention

Every wiki page should have:

```yaml
---
title: Page Title
section: concepts   # top-level wiki section
sources: 3          # number of raw sources this page draws from
updated: YYYY-MM-DD
---
```

---

## Raw Sources Location

```
raw/
├── to-learn/       # Web clips, long-form articles, essays
├── newsletters/    # Newsletter issues
├── twitter/        # X threads, bookmarks, long-form posts
├── tools/          # Tool docs, skill references
└── assets/         # Images (set as attachment folder)
```

---

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

---

## Concurrency Rules

- Never delete or overwrite a file without reading it first.
- Re-read any article immediately before editing it.
- Never modify `_absorb_log.json` except to append.
- Rebuild `index.md` and `_backlinks.json` only at the very end of a command.

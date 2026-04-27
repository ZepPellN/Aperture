---
name: wiki-query
description: >
  Query the wiki to answer questions. Synthesizes across articles, saves output,
  and writes back to wiki when synthesis is non-obvious and spans 3+ pages.
  Supports witness layer queries when the question involves personal context.
  Invoke when the user says /wiki-query or asks a question about the wiki.
argument-hint: "<question>"
---

# Wiki Query

Answer questions about the wiki by navigating compiled articles.

**Read `.claude/skills/_wiki-common.md` for vault paths and Writing Standards**
(needed only if synthesis write-back is triggered).

## How to Answer

### 1. QMD Quick Lookup (Always First)

Before manually browsing, run a semantic search via QMD to surface the most
relevant documents:

```bash
# Hybrid search (recommended): keyword + vector + reranking
qmd query "<question>" -c vault -n 10 --full

# If results are sparse, also try vector-only
qmd vsearch "<question>" -c vault -n 10 --full
```

**Use QMD results to:**
- Identify the top 3-5 most relevant wiki pages (prioritize `wiki/` paths).
- Discover relevant raw sources (`raw/to-learn/`, `raw/briefing/`, etc.) that may
  not yet be fully absorbed into wiki articles.
- Guide which `[[wikilinks]]` to follow in step 3.

**QMD output handling:**
- If QMD returns high-confidence matches from `wiki/`, read those first.
- If QMD returns matches only from `raw/`, note them as source material and
  check whether a wiki article already covers the topic.
- If QMD returns nothing useful, proceed with manual navigation.

### 2. Determine Query Scope

Before reading articles, decide if the question involves personal context:

**Wiki-only queries** (default): Questions about concepts, tools, people, events.
- Read `wiki/index.md` and follow wikilinks
- Never read `witness/` or `raw/`

**Witness-aware queries**: Questions about Jean's goals, experiences, decisions,
or anything that asks "what do I think about X?" or "how does X apply to me?"
- Read relevant `wiki/` pages first
- Then read `witness/daily/` entries and `wiki/self/` pages for personal context
- Synthesize compiled knowledge + personal reflection

**How to decide:** If the question contains first-person references
("my", "I", "my projects", "my goals") or asks for personal opinion/application,
treat it as witness-aware.

### 3. Manual Navigation (Fallback / Enrichment)

1. **Read `wiki/index.md`.** Scan for articles relevant to the query.
2. **Check `wiki/_backlinks.json`** to find articles that reference the topic.
3. **Read 3-8 relevant articles.** Follow `[[wikilinks]]` 2-3 links deep when relevant.
4. **For witness-aware queries:** Read relevant `wiki/self/` pages and recent
   `witness/daily/` entries. Do NOT read witness entries older than 30 days unless
   the query specifically asks for historical context.

### 4. Synthesize with Citations

Lead with the answer. Every key claim must cite its source:

**Citation format:**
- Wiki claims: `[[section/page-name]]` immediately after the claim
- Witness claims: `[witness/YYYY-MM-DD.md]` for personal context
- Raw source claims: `[[raw/path/file.md|Source Name]]` when referencing unabsorbed material

**Example:**
> Harness engineering treats the scaffolding around the model as a real artifact
> that tightens every time the agent slips [[harness-engineering/overview]].
> Jean has been applying this ratchet pattern to his own Claude Code workflow
> since March 2026 [witness/2026-03-15.md].

Use direct quotes sparingly. Connect dots across articles. Acknowledge gaps.

## Saving Outputs

After answering, save the response as a markdown file in `$VAULT/outputs/` with a
descriptive filename (e.g., `outputs/2026-04-20-agent-native-principles.md`).
Include the original question and the synthesized answer.

## Synthesis Write-Back

After saving to `outputs/`, evaluate whether the answer qualifies for wiki write-back:

**Conditions (all must be true):**
1. The answer drew from **3 or more distinct wiki pages**
2. The synthesis contains a **non-obvious connection** not present in any single source page
3. The topic is **durable** — not a one-time event or ephemeral news item

**Witness-aware write-back (additional condition):**
4. If the query was witness-aware and the synthesis bridges compiled knowledge
   with personal insight, prefer writing back to `wiki/self/` or creating a
   bridge page that links both `wiki/` and `witness/` content.

**If all conditions are met:**
1. Determine the best target: an existing wiki page that should gain a new section,
   or a new page if the synthesis represents a standalone concept.
2. For witness-aware synthesis: target `wiki/self/` or create a bridge page.
3. Place the article in the most relevant existing section. If no section fits,
   create a new one following topic-driven rules (not a catch-all).
4. Write the synthesis following Writing Standards from `_wiki-common.md`.
   - Frontmatter: `title`, `section`, `sources: N`, `updated: YYYY-MM-DD`
   - Link back to every source wiki page with `[[wikilinks]]`
   - Link to the output file: `[[outputs/filename.md|Query: ...]]`
5. Update `wiki/index.md` if a new page was created.
6. Update `wiki/_backlinks.json` for any new wikilinks.

**If conditions are not met:** save to `outputs/` only.

## Rules

- Don't guess. If the wiki doesn't cover it, say so.
- Don't read the entire wiki. Be surgical.
- For wiki-only queries: Never read raw source files (`raw/`). The wiki is the knowledge base.
- For witness-aware queries: `witness/` is read-only. Never modify witness entries.
- Read-only **except** for synthesis write-back when all conditions above are met.

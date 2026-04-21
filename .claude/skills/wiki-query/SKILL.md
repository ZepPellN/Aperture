---
name: wiki-query
description: >
  Query the wiki to answer questions. Synthesizes across articles, saves output,
  and writes back to wiki when synthesis is non-obvious and spans 3+ pages.
  Invoke when the user says /wiki-query or asks a question about the wiki.
argument-hint: "<question>"
---

# Wiki Query

Answer questions about the wiki by navigating compiled articles.

**Read `.claude/skills/_wiki-common.md` for vault paths and Writing Standards**
(needed only if synthesis write-back is triggered).

## How to Answer

1. **Read `wiki/index.md`.** Scan for articles relevant to the query.
2. **Check `wiki/_backlinks.json`** to find articles that reference the topic.
3. **Read 3-8 relevant articles.** Follow `[[wikilinks]]` 2-3 links deep when relevant.
4. **Synthesize.** Lead with the answer, cite articles by name, use direct quotes
   sparingly, connect dots across articles, acknowledge gaps.

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

**If all conditions are met:**
1. Determine the best target: an existing wiki page that should gain a new section,
   or a new page if the synthesis represents a standalone concept.
2. Place the article in the most relevant existing section. If no section fits,
   create a new one following topic-driven rules (not a catch-all).
3. Write the synthesis following Writing Standards from `_wiki-common.md`.
   - Frontmatter: `title`, `section`, `sources: N`, `updated: YYYY-MM-DD`
   - Link back to every source wiki page with `[[wikilinks]]`
   - Link to the output file: `[[outputs/filename.md|Query: ...]]`
4. Update `wiki/index.md` if a new page was created.
5. Update `wiki/_backlinks.json` for any new wikilinks.

**If conditions are not met:** save to `outputs/` only.

## Rules

- Never read raw source files (`raw/`). The wiki is the knowledge base.
- Don't guess. If the wiki doesn't cover it, say so.
- Don't read the entire wiki. Be surgical.
- Read-only **except** for synthesis write-back when all conditions above are met.

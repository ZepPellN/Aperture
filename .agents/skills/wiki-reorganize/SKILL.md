---
name: wiki-reorganize
description: >
  Step back and rethink wiki structure. Identifies pages to merge/split,
  missing sections, orphans, and cross-section connection gaps.
  Invoke when the user says /wiki-reorganize. Apply changes only with user approval.
argument-hint: ""
---

# Wiki Reorganize

Step back and rethink wiki structure. Report findings. Apply changes **only with
user approval**. After any structural changes, run `/wiki-rebuild-index`.

**Read `.agents/skills/_wiki-common.md` for Writing Standards, vault paths,
and Concurrency Rules.**

## What to Assess

Read `wiki/index.md` and sample articles across sections. Ask:

1. **Merge candidates** — Are any pages redundant? Should two articles be one?
2. **Split candidates** — Are any pages bloated (>150 lines) covering two distinct topics?
3. **New sections** — Is there a cluster of articles that would be better organized under a new section?
4. **Orphaned articles** — Pages with zero inbound wikilinks (check `wiki/_backlinks.json`).
5. **Missing cross-section connections** — Articles in different sections that clearly relate but don't link to each other.
6. **Theme Aggregation Rules** — Are there patterns in `$VAULT/CLAUDE.md` that need updating based on how the wiki has grown?
7. **MOC health** — Are the section overviews functioning as MOCs with Core
   Questions, Key Concepts, Main Tensions, Current Judgments, To Read / To
   Verify, and Output Directions?
8. **Concept granularity** — Are `page_kind: concept` pages atomic, or do they
   mix source summaries, entities, and outputs?
9. **Layer boundary** — Are one-off reports, drafts, or briefing summaries
   living in `wiki/` when they belong in `outputs/` or `raw/`?
10. **Judgment status** — Are `ai_draft`, `hypothesis`, `disputed`, and
   `human_verified` used safely?

## Output

Present findings as a structured report with:
- A list of proposed actions (each labeled: merge / split / create section / delete / add links)
- Rationale for each
- Layer impact: `raw`, `outputs`, `wiki`, or `MOC`
- Judgment impact: whether any page needs `knowledge_status` changes
- A **Pending Jean review** section for actions that affect durable judgments
- No changes made until user approves

Once approved, execute the changes, then invoke `/wiki-rebuild-index`.

## Rules

- Do not bulk-update old pages just to add schema.
- Do not mark pages `human_verified`.
- Do not move output artifacts into wiki.
- If a proposed restructure would make an overview too long, recommend splitting
  to a dedicated MOC page only after Jean approves.

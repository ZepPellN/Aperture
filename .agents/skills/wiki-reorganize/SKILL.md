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

**Read `.claude/skills/_wiki-common.md` for Writing Standards, vault paths,
and Concurrency Rules.**

## What to Assess

Read `wiki/index.md` and sample articles across sections. Ask:

1. **Merge candidates** — Are any pages redundant? Should two articles be one?
2. **Split candidates** — Are any pages bloated (>150 lines) covering two distinct topics?
3. **New sections** — Is there a cluster of articles that would be better organized under a new section?
4. **Orphaned articles** — Pages with zero inbound wikilinks (check `wiki/_backlinks.json`).
5. **Missing cross-section connections** — Articles in different sections that clearly relate but don't link to each other.
6. **Theme Aggregation Rules** — Are there patterns in `$VAULT/CLAUDE.md` that need updating based on how the wiki has grown?

## Output

Present findings as a structured report with:
- A list of proposed actions (each labeled: merge / split / create section / delete / add links)
- Rationale for each
- No changes made until user approves

Once approved, execute the changes, then invoke `/wiki-rebuild-index`.

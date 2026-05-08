---
name: wiki-breakdown
description: >
  Find missing entity, concept, MOC, or output candidates. Creates pages only
  when the candidate is durable and schema-ready.
  Invoke when the user says /wiki-breakdown.
argument-hint: ""
---

# Wiki Breakdown

Find missing pages and over-crammed concepts. This skill expands the wiki only
when the candidate is durable knowledge. It must not turn source summaries,
briefings, or one-off outputs into wiki pages.

**Read `.agents/skills/_wiki-common.md` for Writing Standards, Concurrency Rules,
and Tool Preferences.**

## Phase 1: Survey

Read `wiki/index.md` and `wiki/_backlinks.json`. Identify:
- High-reference backlink targets without articles
- Bare directories (directories with only an overview.md)
- Bloated articles (>150 lines) that should be split
- Concept pages that contain multiple separable ideas
- MOC pages missing the required six sections
- Repeated ideas in `outputs/ideas/` that may deserve promotion

## Phase 2: Mining

Spawn parallel subagents in batches of 10 articles each. Each agent extracts
concrete entities using the **concrete noun test**: "X is a ___"

Extract and classify:
- Named people, companies, products, tools, projects, frameworks
- Recurring concepts, patterns, strategies
- MOC-level themes that belong in an overview rather than a standalone page
- Output-only ideas that should stay in `outputs/ideas/`

Do NOT extract:
- Generic technologies without a documented learning arc
- Entities already covered by existing pages
- Passing mentions with no context
- Single-source news items with no reusable insight
- Article or newsletter summaries masquerading as concepts

## Phase 3: Planning

1. Deduplicate candidates across all subagent reports.
2. Count references per candidate.
3. Rank by reference count.
4. Classify each candidate as `concept`, `entity`, `tool`, `moc_update`,
   `output_only`, or `discard`.
5. Present candidate table to the user for review before creating.

Candidate table columns:

| Candidate | page_kind | Evidence | Suggested Destination | knowledge_status | Needs Jean? |
|-----------|-----------|----------|-----------------------|------------------|-------------|

## Phase 4: Creation

Create new articles in parallel batches of 5 agents only after user approval.
Each agent:
1. Greps existing articles for all mentions of the entity.
2. Collects material across mentions.
3. Writes the article following Writing Standards and the correct v2 template.
4. Adds frontmatter:
   - `page_kind`
   - `knowledge_status: ai_draft` unless Jean explicitly confirms otherwise
   - `source_type`
   - `judgment_owner: ai` or `mixed`
5. Adds `[[wikilinks]]` back from every source article that mentioned it.
6. Adds a **Pending Jean review** item for every new `ai_draft` or
   `hypothesis` page.

After all articles are created, rebuild `wiki/index.md` and `wiki/_backlinks.json`.

## Rules

- Do not create `human_verified` pages.
- Do not create new top-level wiki directories unless Jean approves.
- Prefer updating a MOC when the candidate is a theme map, not a single atomic
  concept.
- Prefer `outputs/ideas/` when the candidate is a writing seed rather than
  durable knowledge.

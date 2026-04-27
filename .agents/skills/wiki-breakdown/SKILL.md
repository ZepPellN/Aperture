---
name: wiki-breakdown
description: >
  Find and create missing articles. Expands the wiki by identifying concrete
  entities and themes that deserve their own pages.
  Invoke when the user says /wiki-breakdown.
argument-hint: ""
---

# Wiki Breakdown

Find and create missing articles. Expands the wiki by surfacing concrete entities
and themes that deserve their own pages.

**Read `.claude/skills/_wiki-common.md` for Writing Standards, Concurrency Rules,
and Tool Preferences.**

## Phase 1: Survey

Read `wiki/index.md` and `wiki/_backlinks.json`. Identify:
- High-reference backlink targets without articles
- Bare directories (directories with only an overview.md)
- Bloated articles (>150 lines) that should be split

## Phase 2: Mining

Spawn parallel subagents in batches of 10 articles each. Each agent extracts
concrete entities using the **concrete noun test**: "X is a ___"

Extract:
- Named people, companies, products, tools, projects, frameworks
- Recurring concepts, patterns, strategies

Do NOT extract:
- Generic technologies without a documented learning arc
- Entities already covered by existing pages
- Passing mentions with no context

## Phase 3: Planning

1. Deduplicate candidates across all subagent reports.
2. Count references per candidate.
3. Rank by reference count.
4. Present candidate table to the user for review before creating.

## Phase 4: Creation

Create new articles in parallel batches of 5 agents. Each agent:
1. Greps existing articles for all mentions of the entity.
2. Collects material across mentions.
3. Writes the article following Writing Standards.
4. Adds `[[wikilinks]]` back from every source article that mentioned it.

After all articles are created, rebuild `wiki/index.md` and `wiki/_backlinks.json`.

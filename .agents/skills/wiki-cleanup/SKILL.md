---
name: wiki-cleanup
description: >
  Audit and enrich every article in the wiki using parallel subagents.
  Fixes structure, tone, wikilinks, and identifies missing articles.
  Invoke when the user says /wiki-cleanup.
argument-hint: ""
---

# Wiki Cleanup

Audit and enrich every article in the wiki using parallel subagents.

**Read `.agents/skills/_wiki-common.md` for Writing Standards, Concurrency Rules,
and Tool Preferences.**

## Phase 1: Build Context

Read `wiki/index.md` and sample articles across sections. Build a map of:
- All article titles and sections
- All wikilinks (existing)
- Every concrete entity mentioned that lacks its own page

## Phase 2: Per-Article Subagents

Spawn parallel subagents in batches of 5. Each agent reads one article and:

**Assesses:**
- Structure: theme-driven or chronological-dump?
- Length: bloated (>150 lines) or thin (<15 lines / <100 words)?
- Tone: flat/encyclopedic or editorial?
- Quote density: more than 2 direct quotes?
- Wikilinks: broken links? Missing links to existing articles?
- Wiki v2 schema: missing `page_kind`, `knowledge_status`, or `judgment_owner`
  on new or substantially updated durable pages?
- Concept quality: is a `page_kind: concept` page one reusable insight, or is it
  really a source summary / multi-topic dump?
- MOC quality: do overview/MOC pages include Core Questions, Key Concepts, Main
  Tensions, Current Judgments, To Read / To Verify, and Output Directions?
- Judgment safety: is any page marked `human_verified` without explicit Jean or
  witness provenance?

**Restructures if needed.** The most common problem is chronological structure.

Bad:
```
## The March Update
## The April Launch
## The June Pivot
```

Good:
```
## Origins
## The Shift to Production
## Architecture Decisions
```

**Identifies missing article candidates** using the concrete noun test:
"X is a ___" — named people, companies, products, tools, projects, frameworks,
concepts that appear in text but lack their own page.

## Phase 3: Candidate Audit

Check all pages with `status: candidate` in frontmatter:

1. **Stale candidates**: `updated` > 30 days ago and still `sources: 1`
   - Suggest deletion or merge into parent page
   - Flag in report: "Candidate abandoned — no second source after N days"

2. **Candidates ready to compile**: `sources: 1` but a second relevant source exists in `raw/` (not yet absorbed)
   - List: candidate page + matching raw file(s)
   - Suggest: run `/wiki-absorb` on the raw file to promote

3. **Candidate quality**: Even with `sources: 1`, is the page thin (<100 words)?
   - Suggest merge or expansion

## Phase 3.5: Judgment Status Audit

Check all pages with `knowledge_status`:

1. **AI draft backlog**
   - List pages with `knowledge_status: ai_draft`
   - Sort by `updated` ascending
   - Recommend one of: keep draft, ask Jean to verify, mark hypothesis, mark disputed, downgrade to output/source material

2. **Hypothesis backlog**
   - List pages with `knowledge_status: hypothesis`
   - Suggest sources that could confirm or disconfirm the claim

3. **Human-verified safety**
   - Flag any `human_verified` page that lacks explicit Jean statement or `witness/` provenance

4. **One-off material in wiki**
   - Flag briefing/newsletter standalone pages that should be raw-only or output-only
   - Do not delete or merge automatically without Jean approval

## Phase 4: Integration

1. Deduplicate candidates across all subagent reports.
2. Create new articles for high-value candidates.
3. Fix broken wikilinks.
4. Rebuild `wiki/index.md` and `wiki/_backlinks.json`.

Cleanup may report schema and judgment issues automatically, but it must not
bulk-upgrade old pages, mark pages `human_verified`, or move one-off material
without Jean approval.

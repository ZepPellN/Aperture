---
name: wiki-ingest-reorganize
description: Sub-skill for /wiki-ingest reorganize. Structural rethink of wiki organization.
parent: wiki-ingest
---

# Wiki Reorganize

Run when the user invokes `/wiki-ingest reorganize`.

## Purpose

Step back and rethink the wiki structure. Read the index, sample pages, and ask:
- Should anything be merged? Split?
- Should new categories exist?
- Are there orphaned articles? Missing patterns?
- Are pages distributed evenly across sections, or is one section overloaded?

## Process

1. **Read `wiki/index.md`** to understand current structure.
2. **Sample ~20% of pages** across all sections (pick representative pages, not random).
3. **Analyze section balance:**
   - Section with >30 pages → consider sub-categorization
   - Section with <5 pages → consider merging into a broader section
4. **Identify merge candidates** using Theme Aggregation Rules:
   - Versioned products → parent page
   - Features → product page
   - Events → update existing
5. **Identify missing cross-references:**
   - Concepts mentioned in 3+ pages but without their own page
   - Concepts with their own page but not linked from pages that mention them
6. **Suggest new groupings** if warranted:
   - New sub-sections within overloaded sections
   - New thematic categories that emerge from content patterns

## Output Format

```markdown
# Wiki Reorganize Report — YYYY-MM-DD

## Section Balance
| Section | Pages | Assessment |
|---------|-------|-----------|
| harness-engineering | 70 | Overloaded — consider sub-categories |
| claude-code | 56 | Healthy |
| ai-ecosystem | 49 | Healthy |
| forecasts | 9 | Thin — could merge into mental-models |

## Merge Candidates (N found)
| Page | Target Parent | Reason |
|------|--------------|--------|
| [[claude-opus-47]] | [[claude-code/overview]] | Rule 1: versioned product |
| [[claude-design]] | [[claude-code/overview]] | Rule 2: feature page |

## Missing Cross-References (N found)
| Concept | Mentioned In | Suggested Action |
|---------|-------------|-----------------|
| "context engineering" | 5 pages | Create [[concepts/context-engineering]] or link to existing |

## Structural Suggestions
1. Create `harness-engineering/patterns/` sub-section for recurring patterns
2. Merge `forecasts/` into `mental-models/` (too thin)
3. ...

---

**Apply changes?** (Requires user approval. Do not modify without confirmation.)
```

## Behavior

- **Read-only by default.** The analysis itself never modifies files.
- Apply changes **only when user explicitly approves**.
- When applying structural changes:
  1. Create new pages / sections as needed
  2. Move/merge content per approved plan
  3. Update `wiki/index.md` to reflect new structure
  4. Update all affected wikilinks
  5. Append reorganization record to `wiki/log.md`

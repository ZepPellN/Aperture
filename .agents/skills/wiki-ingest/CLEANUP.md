---
name: wiki-ingest-cleanup
description: Sub-skill for /wiki-ingest cleanup. Quality audit of wiki pages.
parent: wiki-ingest
---

# Wiki Cleanup

Run when the user invokes `/wiki-ingest cleanup`.

## Audit Checklist

1. **Thin Pages** — Body text < 100 words
   - These are stubs. Flag for expansion or merging into a parent page.
   - If the topic is covered in a parent page per Theme Aggregation Rules, suggest merge.

2. **Crammed Pages** — Body text > 3000 words
   - These are overloaded. Flag for splitting into child pages or restructuring with better sectioning.

3. **Broken Wikilinks** — `[[Target]]` where Target page doesn't exist
   - List broken links and suggest fixes (create target page, or fix link).

4. **Duplicate Titles** — Pages with same title in different sections
   - Suggest consolidation or disambiguation.

5. **Single-Source Pages** — Frontmatter `sources: 1`
   - Check if the topic is a sub-topic of an existing parent page.
   - If yes, suggest merging into parent.
   - If no but the page is thin, suggest either expansion or deletion.

6. **Theme Aggregation Violations**
   - Versioned product pages that should be in a parent (e.g. `claude-opus-47` → `claude-code/overview`)
   - Feature pages that should be sections (e.g. `claude-design` → `claude-code/overview`)
   - Event pages that should be updates (e.g. `cache-ttl-drop-2026-04` → `claude-code/overview`)

7. **Orphan Pages** — No inbound wikilinks
   - Suggest connections to related pages, or deletion if truly isolated.

## Output Format

```markdown
# Wiki Cleanup Report — YYYY-MM-DD

## Thin Pages (N found)
| Page | Word Count | Suggested Action |
|------|-----------|-----------------|
| [[page]] | 45 | Merge into [[parent]] |

## Crammed Pages (N found)
| Page | Word Count | Suggested Action |
|------|-----------|-----------------|
| [[page]] | 4200 | Split into child pages or add TOC |

## Broken Wikilinks (N found)
| Source Page | Broken Link | Suggested Fix |
|-------------|------------|---------------|
| [[page]] | [[missing]] | Create page or fix link |

## Theme Aggregation Violations (N found)
| Page | Violation | Suggested Action |
|------|-----------|-----------------|
| [[claude-opus-47]] | Rule 1: versioned product | Merge into [[claude-code/overview]] |

## Orphan Pages (N found)
| Page | Suggested Connection |
|------|----------------------|
| [[page]] | Link from [[related-page]] |

---

**Apply fixes?** (Requires user approval. Do not modify without confirmation.)
```

## Behavior

- **Read-only by default.** The audit itself never modifies files.
- Apply fixes **only when user explicitly approves** (e.g., "yes, apply all" or "apply merge for X").
- When applying merges:
  1. Copy content from child page into a new section of parent page
  2. Update parent page frontmatter (sources count, updated date)
  3. Delete child page
  4. Update `wiki/index.md` (remove child, update parent description)
  5. Update `_absorb_log.json` if applicable
  6. Append cleanup record to `wiki/log.md`

---
name: wiki-ingest-status
description: Sub-skill for /wiki-ingest status. Report wiki health metrics.
parent: wiki-ingest
---

# Wiki Status

Run when the user invokes `/wiki-ingest status`.

## Report Metrics

1. **Raw Files**
   - Total files in `raw/` (recursive)
   - Absorbed count (from `_absorb_log.json` entries with status "absorbed")
   - Pending count (total - absorbed - skipped)
   - Skipped count (empty/duplicate/failed)

2. **Wiki Pages**
   - Total pages (from `wiki/index.md` count or file system scan)
   - Orphan pages (no inbound wikilinks from other wiki pages)
   - Thin pages (<100 words body text)
   - Crammed pages (>3000 words body text)
   - Stale pages (frontmatter `updated` older than 30 days)
   - Pages with `sources: 1` (merge candidates)

3. **Section Breakdown**
   - Count per section (harness-engineering/, claude-code/, ai-ecosystem/, etc.)

## Output Format

```markdown
# Wiki Status Report — YYYY-MM-DD

## Raw Sources
| Metric | Count |
|--------|-------|
| Total raw files | N |
| Absorbed | N |
| Pending | N |
| Skipped | N |

## Wiki Pages
| Metric | Count |
|--------|-------|
| Total pages | N |
| Orphans | N |
| Thin (<100 words) | N |
| Crammed (>3000 words) | N |
| Stale (>30d) | N |
| Single-source (merge candidates) | N |

## By Section
| Section | Pages |
|---------|-------|
| harness-engineering | N |
| claude-code | N |
| ... | ... |

## Recommendations
- Run `/wiki-ingest cleanup` to audit quality
- Run `/wiki-ingest reorganize` to check for merge candidates
```

## Tool Preferences

- Count files: `find "$VAULT/raw" -type f | wc -l`
- Count words: `wc -w`
- Parse frontmatter: Obsidian CLI or Python `yaml.safe_load`
- Parse wikilinks: grep `\[\[...\]\]` patterns

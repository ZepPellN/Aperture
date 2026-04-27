---
name: wiki-status
description: >
  Show wiki health stats: raw file counts, articles by section, most-connected
  pages, orphans, thin/crammed pages, stale pages, broken wikilinks.
  Invoke when the user says /wiki-status.
argument-hint: ""
---

# Wiki Status

Show wiki health stats.

**Vault path**: `/Users/jean/Documents/Obsidian Vault`

**Tool**: Use `/Applications/Obsidian.app/Contents/MacOS/obsidian` for vault reads.

## Report

1. **Raw files**
   - Total files under `raw/`
   - Absorbed count (status `absorbed` in `wiki/_absorb_log.json`)
   - Pending count (not in log or status `pending`)

2. **Articles by section**
   - File count per `wiki/<section>/` directory

3. **Most-connected articles**
   - Top 10 by inbound wikilinks (from `wiki/_backlinks.json`)

4. **Orphans**
   - Pages with zero inbound wikilinks

5. **Thin pages**
   - Pages with <100 words body

6. **Crammed pages**
   - Pages with >3000 words body

7. **Stale pages**
   - Pages with `updated` frontmatter 30+ days ago

8. **Broken wikilinks**
   - `[[links]]` in wiki pages that point to non-existent targets

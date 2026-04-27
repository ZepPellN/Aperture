---
name: wiki-rebuild-index
description: >
  Regenerate wiki/index.md and wiki/_backlinks.json from current wiki state.
  Invoke when the user says /wiki-rebuild-index or after structural changes.
argument-hint: ""
---

# Wiki Rebuild Index

Regenerate `wiki/index.md` and `wiki/_backlinks.json` from the current wiki state.

**Vault path**: `/Users/jean/Documents/Obsidian Vault`

**Tool**: Use `/Applications/Obsidian.app/Contents/MacOS/obsidian` for vault reads/writes.

## Rebuild index.md

Scan all files under `wiki/` (excluding `_absorb_log.json`, `_backlinks.json`, `log.md`).

`index.md` must contain:
- Total page count
- Sections with page listings (grouped by `wiki/<section>/`)
- Recently updated pages (top 10 by `updated` frontmatter)

## Rebuild _backlinks.json

Scan every wiki page for `[[wikilink]]` patterns. Record the reverse mapping.

Format:
```json
{
  "claude-code/overview": ["product-trends/agent-native-architecture", "harness-engineering/overview"],
  "harness-engineering/overview": ["claude-code/overview", "product-trends/saas-extinction"]
}
```

Keys are link targets (normalized to `section/filename` without `.md`).
Values are arrays of pages that contain a link to that target.

**Note:** Only `[[wikilink]]` patterns are indexed. Backtick paths are invisible
to this index and will cause false orphan reports in `/wiki-status`.

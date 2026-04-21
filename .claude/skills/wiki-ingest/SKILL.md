---
name: wiki-ingest
description: >
  Legacy entry point for the wiki skill suite. Routes to the appropriate
  specialized skill. Invoke when the user says /wiki-ingest with a subcommand.
argument-hint: "inbox | absorb | query | cleanup | breakdown | status | rebuild-index | reorganize"
---

# Wiki Ingest (Router)

This skill has been split into focused skills. Use the appropriate one:

| Command | Skill |
|---------|-------|
| `inbox [limit]` | `/wiki-inbox` — scan raw/ and ingest unabsorbed files |
| `absorb [date-range\|file]` | `/wiki-absorb` — re-compile raw files into wiki articles |
| `query <question>` | `/wiki-query` — answer questions, save outputs, synthesis write-back |
| `cleanup` | `/wiki-cleanup` — audit and enrich articles with parallel subagents |
| `breakdown` | `/wiki-breakdown` — find and create missing articles |
| `status` | `/wiki-status` — show health stats |
| `rebuild-index` | `/wiki-rebuild-index` — regenerate index.md and _backlinks.json |
| `reorganize` | `/wiki-reorganize` — rethink wiki structure |

If the user invoked `/wiki-ingest <subcommand>`, execute the corresponding skill above.

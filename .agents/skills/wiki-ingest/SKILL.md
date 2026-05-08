---
name: wiki-ingest
description: >
  Legacy entry point for the wiki skill suite. Routes to the appropriate
  specialized skill. Invoke when the user says /wiki-ingest with a subcommand.
argument-hint: "inbox | absorb | emerge | triage | query | cleanup | breakdown | status | rebuild-index | reorganize"
---

# Wiki Ingest (Router)

This skill has been split into focused skills. Use the appropriate one:

| Command | Skill |
|---------|-------|
| `inbox [limit]` | `/wiki-inbox` — scan raw/ and ingest unabsorbed files |
| `absorb [date-range\|file]` | `/wiki-absorb` — re-compile raw files into wiki articles |
| `emerge [date-range]` | `/wiki-emerge` — scan raw/ for repeated themes and write an ideas report without modifying wiki pages |
| `triage <raw-file>` | `/wiki-triage` — propose source-to-wiki changes and wait for confirmation |
| `query <question>` | `/wiki-query` — answer questions, save outputs, synthesis write-back |
| `cleanup` | `/wiki-cleanup` — audit and enrich articles with parallel subagents |
| `breakdown` | `/wiki-breakdown` — find and create missing articles |
| `status` | `/wiki-status` — show health stats |
| `rebuild-index` | `/wiki-rebuild-index` — regenerate index.md and _backlinks.json |
| `reorganize` | `/wiki-reorganize` — rethink wiki structure |

If the user invoked `/wiki-ingest <subcommand>`, execute the corresponding skill above.
For scheduled discovery from accumulated raw material, prefer `emerge` before
`absorb` unless the source file is already known to contain durable knowledge.

Legacy files under `wiki-ingest/` (`CLEANUP.md`, `STATUS.md`, `REORGANIZE.md`)
are compatibility shims only. Prefer the standalone skills listed above.

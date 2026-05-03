# Aperture — LLM Wiki Framework

Aperture is a markdown-first LLM Wiki framework: it turns raw documents into an interlinked wiki, renders that wiki as a browsable graph-aware website, and exposes the same knowledge in agent-readable formats.

It is designed for agent workflows. Humans should not need to memorize the setup sequence; hand the repo to an agent and let it initialize the vault, install skills, ingest sources, and open the viewer.

---

## Use It

Give your agent this instruction:

```text
Set up this Aperture repo for my knowledge base. Read AGENT_SETUP.md and BASIC_SCHEMA.md, create or connect a vault with raw/ and wiki/, install the .agents/skills/wiki-* skills plus _wiki-common.md, configure WIKI_ROOT in .env.local, run the initial wiki ingest, start the Aperture viewer, and verify the main UI routes plus maintenance commands.
```

For a quick local run after setup:

```bash
npm install
cp .env.example .env.local
# Set WIKI_ROOT=/absolute/path/to/your/vault in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## What Aperture Provides

### 1. Markdown Wiki Viewer

- Renders `wiki/**/*.md` as a static Next.js site.
- Supports YAML frontmatter, `[[wikilinks]]`, backlinks, reading time, word count, and category browsing.
- Keeps markdown as the source of truth, so the wiki stays portable across Obsidian, git, and agents.

### 2. Source Provenance

- Shows a `Sources` section on article pages.
- Reads sources from page `## Sources`, `_absorb_log.json`, frontmatter arrays, and `_source_contributions.json`.
- Displays contribution level (`high`, `medium`, `low`), source summary, and affected sections.
- Derives safe fallback contribution metadata for older pages that do not yet have explicit contribution records.

### 3. Evolution Timeline

- Shows an `Evolution` section under each article when lineage exists.
- Reads explicit events from `_evolution.json`.
- Derives a baseline `source → page` event from page dates and sources when old pages have no explicit evolution metadata.

### 4. Graph Exploration

- Article pages include a `View in Graph` button.
- `/graph?focus=<slug>` opens focus mode for one article and its direct neighbors.
- `/clusters` shows semantic islands across the wiki.
- `/graph?cluster=<id>` highlights a semantic cluster in the graph.
- Article pages also include a compact `Local Graph`.

### 5. Semantic Discovery

- If qmd embeddings are available, Aperture builds semantic layouts, semantic neighbors, semantic trails, and clusters.
- If qmd is missing, the app falls back to link-based graph behavior.

### 6. Agent-Readable Interfaces

- `/api/wiki/<slug>` returns one article as JSON with markdown, HTML, sources, evolution, backlinks, and semantic neighbors.
- `/llms.txt` exposes a compact wiki index for agents.
- `/llms-full.txt` exposes a fuller index with summaries, source counts, and API links.

### 7. Wiki Maintenance Skills

The repo ships wiki skills under `.agents/skills/`:

- `/wiki-inbox` — scan raw files and ingest unabsorbed sources.
- `/wiki-absorb` — re-process raw sources into wiki pages.
- `/wiki-triage` — interactively review one important source before writing.
- `/wiki-query` — answer questions from the wiki.
- `/wiki-cleanup` — audit and enrich articles.
- `/wiki-breakdown` — find missing pages.
- `/wiki-status` — report current wiki health.
- `/wiki-rebuild-index` — rebuild index and backlinks.
- `/wiki-reorganize` — rethink structure and merges/splits.

### 8. Maintenance Commands

These produce reviewable artifacts in `exports/`:

```bash
npm run graph:proposal -- --focus <slug>
npm run graph:proposal -- --cluster <id>
npm run export:wiki
npm run wiki:health
npm run wiki:entities
```

They cover graph research proposals, wiki snapshot export, health reports, entity detection, aliases, confidence, and suggested wikilinks.

---

## Core Routes

| Route | Purpose |
|-------|---------|
| `/` | Search, recently updated pages, and category overview |
| `/wiki/<slug>` | Article view with sources, evolution, backlinks, semantic trail, and local graph |
| `/graph` | Full graph explorer |
| `/graph?focus=<slug>` | Focused article graph |
| `/clusters` | Semantic cluster browser |
| `/graph?cluster=<id>` | Cluster-focused graph |
| `/api/wiki/<slug>` | Per-page JSON |
| `/llms.txt` | Compact agent index |
| `/llms-full.txt` | Full agent index |

---

## Repository Contents

| Path | Purpose |
|------|---------|
| `AGENT_SETUP.md` | Agent-facing setup guide |
| `BASIC_SCHEMA.md` | Wiki structure and editorial rules |
| `.agents/skills/` | Wiki and design skills |
| `reference/` | Minimal example vault |
| `app/` | Next.js app routes |
| `components/` | UI components |
| `lib/` | Wiki, graph, semantic, and metadata loaders |
| `scripts/` | Export, report, and proposal commands |

---

## Build

```bash
npm run build
```

The static site is exported to `dist/`.

Required environment:

| Variable | Description |
|----------|-------------|
| `WIKI_ROOT` | Absolute path to the vault directory that contains `wiki/` |
| `QMD_INDEX` | Optional qmd index path for semantic features |

---

## Credits

- Inspired by [Andrej Karpathy's LLM Knowledge Bases](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Farza's Farzapedia](https://gist.github.com/farzaa/c35ac0cfbeb957788650e36aabea836d) — the skill-driven wiki pattern
- [Steph Ango's File Over App](https://stephango.com/file-over-app) — the philosophy of universal file formats

---

## License

MIT

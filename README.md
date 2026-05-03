# Aperture — LLM Wiki Framework

A complete framework for building an LLM-compiled knowledge base.

Aperture turns scattered documents into a structured, interlinked wiki — and renders it as a browsable website with search, backlinks, provenance, evolution history, local graphs, cluster exploration, and agent-readable APIs. It is designed for the **AI agent workflow**: you drop raw sources, your agent ingests them, and the knowledge base evolves over time while staying plain markdown.

---

## What This Is

This repository contains everything you need to build and maintain an LM Wiki:

1. **BASIC_SCHEMA.md** — The "constitution" of your wiki. Defines how knowledge is organized, when to create or merge pages, and how to handle conflicts.
2. **Wiki Skills** — Claude Code skills for ingest, absorb, query, cleanup, and maintenance.
3. **Aperture Web Viewer** — A Next.js app that renders your wiki as a website with wikilinks, backlinks, sources, evolution, local graphs, semantic trails, and a full graph view.
4. **Reference Vault** — A minimal example you can copy as a starting point.
5. **AGENT_SETUP.md** — A guide for any AI agent to help you scaffold your wiki from scratch.

---

## Architecture

Three layers:

```
raw/          # Immutable source documents (articles, tweets, notes, papers)
wiki/         # Compiled knowledge (markdown with wikilinks, maintained by AI)
outputs/      # Generated answers and reports
```

The web viewer reads `wiki/` and wiki metadata at build time and renders a static site. Markdown remains the canonical data layer; JSON metadata adds provenance, evolution, and graph intelligence without making the wiki dependent on a private database.

---

## Two Ways to Start

### Option A: Let an Agent Set You Up (Recommended)

1. Copy the contents of `AGENT_SETUP.md` and send it to your AI agent (Claude Code, Cursor, Chronicle, etc.).
2. The agent will interview you, scaffold your vault, organize your documents, and run the first ingest.
3. The agent will set up Aperture and open it for you.

### Option B: Manual Setup

#### 1. Copy the Reference Vault

```bash
cp -r reference /path/to/your/vault
cd /path/to/your/vault
```

#### 2. Add Your Documents

Drop your scattered documents into `raw/`:

| Directory | Content |
|-----------|---------|
| `raw/to-learn/` | Articles, essays, papers |
| `raw/newsletters/<source>/` | Newsletter issues |
| `raw/twitter/x-articles/` | Long-form X posts |
| `raw/twitter/x-posts/` | Short posts / bookmarks |
| `raw/tools/` | Tool docs, CLI notes |
| `raw/briefing/<type>/` | Auto-generated briefings |
| `raw/assets/` | Images and attachments |

#### 3. Install Wiki Skills

Copy the skills to your project's `.agents/skills/` directory:

```bash
mkdir -p /path/to/your/vault/.agents/skills
cp -r .agents/skills/wiki-* /path/to/your/vault/.agents/skills/
cp .agents/skills/_wiki-common.md /path/to/your/vault/.agents/skills/
```

#### 4. Ingest Your Sources

Open Claude Code in your vault and run:

```
/wiki-inbox
```

This reads your raw files, understands them, and writes wiki articles.

#### 5. Set Up Aperture Viewer

In a separate directory:

```bash
git clone https://github.com/YOUR_USERNAME/aperture.git
cd aperture
npm install
```

Point Aperture at your vault:

```bash
cp .env.example .env.local
# Edit .env.local:
# WIKI_ROOT=/path/to/your/vault
```

Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
aperture/
├── BASIC_SCHEMA.md          # Universal wiki schema and editorial rules
├── AGENT_SETUP.md           # Step-by-step guide for AI agents
├── README.md                # This file
├── .agents/
│   └── skills/              # Codex/Claude-compatible skills for wiki maintenance
│       ├── _wiki-common.md  # Shared standards
│       ├── wiki-ingest/     # Router skill
│       ├── wiki-inbox/      # Scan and ingest unabsorbed files
│       ├── wiki-absorb/     # Re-process raw files
│       ├── wiki-triage/     # Interactive save/skip intake for one source
│       ├── wiki-query/      # Answer questions
│       ├── wiki-cleanup/    # Audit and enrich articles
│       ├── wiki-breakdown/  # Find missing articles
│       ├── wiki-status/     # Show health stats
│       ├── wiki-rebuild-index/  # Regenerate index
│       └── wiki-reorganize/     # Rethink structure
├── reference/               # Example vault (copy this)
│   ├── CLAUDE.md            # Project-level AI instructions
│   ├── raw/                 # Example source documents
│   └── wiki/                # Example compiled wiki
├── app/                     # Next.js App Router
│   ├── page.tsx             # Homepage with stats
│   ├── graph/
│   │   └── page.tsx         # Knowledge graph view
│   ├── clusters/
│   │   └── page.tsx         # Semantic cluster browser
│   ├── api/wiki/[...slug]/  # Per-page JSON API
│   ├── llms.txt/            # Agent-readable short index
│   ├── llms-full.txt/       # Agent-readable full index
│   └── wiki/
│       └── [...slug]/       # Individual article pages
├── components/              # React components
├── lib/                     # Markdown, graph, semantic, and metadata loaders
├── scripts/                 # Export, health, entity, and graph proposal tools
├── next.config.ts
└── package.json
```

---

## Feature Guide

The most important user-facing routes are:

| Route | What it shows |
|-------|---------------|
| `/` | Search, recently updated pages, category cards, and latest update dates per category |
| `/wiki/<slug>` | A wiki article with semantic trail, sources, contribution badges, evolution, backlinks, and a local graph |
| `/graph?focus=<slug>` | A focused graph view for one article and its direct neighbors |
| `/clusters` | Semantic clusters discovered across the wiki |
| `/graph?cluster=<id>` | A graph view with one semantic cluster highlighted |
| `/api/wiki/<slug>` | JSON for one article, including markdown, HTML, sources, backlinks, semantic neighbors, and evolution |
| `/llms.txt` | Compact agent-readable wiki index |
| `/llms-full.txt` | Full agent-readable wiki index with summaries and source counts |

### Article Pages

Open any `/wiki/<slug>` page to see the main reading experience.

| Area | Purpose |
|------|---------|
| `View in Graph` button | Opens `/graph?focus=<slug>` for deeper graph exploration |
| `Semantic Trail` | Shows related pages discovered from semantic neighbors |
| `Sources` | Lists raw/wiki/web sources used to synthesize the page |
| Contribution badge | Shows `high`, `medium`, or `low`; explicit metadata wins, otherwise Aperture derives a conservative fallback |
| Source summary | Explains what that source contributed, such as `Primary source for this page.` |
| Source sections | Shows the affected section, such as `Whole page` or explicit section names from metadata |
| `Evolution` | Shows how the page was created, absorbed, merged, refined, or linked |
| `From` / `To` | Shows source-to-page or page-to-page lineage |
| `Linked from` | Backlinks from other wiki pages |
| `Local Graph` | A small one-hop graph of the current article and direct neighbors |

### Graph Views

`/graph` has four modes: Network, Topo Map, Semantic, and Nest. Focused graph links always start in Network mode.

| URL | Behavior |
|-----|----------|
| `/graph` | Full graph view |
| `/graph?focus=<slug>` | Focus mode: shows the selected article and direct neighbors, with an `Open article` card |
| `/graph?cluster=<id>` | Cluster mode: highlights a semantic island from `/clusters` |

Focus mode intentionally renders a small subgraph instead of trying to center one node inside the full graph. This makes the feature usable on both desktop and mobile viewports.

### Sources And Evolution Metadata

Aperture reads source information from multiple compatible places:

1. A page's `## Sources` markdown section.
2. `wiki/_absorb_log.json`, which maps raw sources to touched wiki pages.
3. Frontmatter `sources` arrays when present.
4. `wiki/_source_contributions.json`, which records source contribution level, section, and summary.

Evolution comes from `wiki/_evolution.json` when present. If no explicit evolution entry exists, Aperture derives a baseline event from the page's `created`, `date`, or `updated` frontmatter and its sources. That means older pages still show a useful `From source → To page` lineage instead of an empty section.

Example contribution metadata:

```json
{
  "ai-ecosystem/builder-2-collaborative-coding": [
    {
      "source": "raw/briefing/AI Briefing/2026-04-12.md",
      "contribution": "high",
      "sections": ["Whole page"],
      "summary": "Primary source for this page."
    }
  ]
}
```

Example evolution metadata:

```json
{
  "ai-ecosystem/builder-2-collaborative-coding": [
    {
      "date": "2026-04-12",
      "type": "absorbed",
      "title": "Derived from source material",
      "summary": "This page is currently synthesized from one source.",
      "from": [{ "slug": "raw/briefing/AI Briefing/2026-04-12.md", "title": "AI Briefing" }],
      "to": [{ "slug": "ai-ecosystem/builder-2-collaborative-coding", "title": "Builder 2.0" }]
    }
  ]
}
```

---

## Wiki Skills

All skills are invoked inside Claude Code with `/skill-name`.

| Skill | Command | Description |
|-------|---------|-------------|
| Router | `/wiki-ingest` | Routes to specialized skills |
| Inbox | `/wiki-inbox [limit]` | Scan `raw/` and ingest unabsorbed files |
| Absorb | `/wiki-absorb [range]` | Re-compile raw files into wiki articles |
| Triage | `/wiki-triage <raw-file-path>` | Read one high-value source, propose save/skip decisions, and wait for confirmation before writing |
| Query | `/wiki-query "question"` | Answer questions across the wiki |
| Cleanup | `/wiki-cleanup` | Audit and enrich all articles |
| Breakdown | `/wiki-breakdown` | Find and create missing articles |
| Status | `/wiki-status` | Show wiki health stats |
| Rebuild Index | `/wiki-rebuild-index` | Regenerate `index.md` and `_backlinks.json` |
| Reorganize | `/wiki-reorganize` | Rethink wiki structure |

Read `.agents/skills/_wiki-common.md` for shared standards (vault paths, tracking state, ingest protocol, writing standards).

`/wiki-triage` is intentionally interactive. It proposes changes first and writes only after the user chooses `save 1`, `save all`, `skip`, or an edit instruction. This is the high-value single-source counterpart to batch `/wiki-absorb`.

---

## Assumed Wiki Format

Aperture works with standard markdown files that use YAML frontmatter and `[[wikilinks]]`:

```markdown
---
title: Article Title
section: concepts
sources: 3
updated: 2026-04-13
---

# Article Title

This is a paragraph with a [[another-article|wikilink]].
```

Articles are organized into categories by their `section` frontmatter and/or parent directory inside `wiki/`.

---

## Key Design Decisions

### Why `section` over directory-as-category?

Aperture supports both. The `section` frontmatter is the primary organizational key because it survives reorganization — you can move a file without breaking its identity. Directories are for your convenience; `section` is for the system.

### Why Theme Aggregation Rules?

Without rules, LLMs tend to either create too many stubs or cram everything into a few bloated pages. The Theme Aggregation Rules in `BASIC_SCHEMA.md` provide explicit guardrails:
- **Anti-cramming**: If you're adding a 3rd paragraph about a sub-topic, it deserves its own page.
- **Anti-thinning**: A stub with 3 sentences is a failure unless it has 4+ sources waiting to expand it.
- **Conflict handling**: Contradictions are recorded, not resolved arbitrarily.

### Why separate `raw/` and `wiki/`?

`raw/` is immutable — your original sources never change. `wiki/` is alive — the LLM creates, merges, splits, and restructures. This separation lets you re-absorb from scratch if your schema evolves, without losing source material.

---

## Customizing

### Change the sidebar title

Edit `components/WikiLayout.tsx`. Find the title text and change it.

### Change the home page text

Edit `app/page.tsx`. Replace the welcome text.

### Add custom fonts or colors

Edit `app/globals.css` to add `@font-face` declarations or update the color scheme.

### Disable the knowledge graph

Remove the graph route or remove the link from the navigation in `components/WikiLayout.tsx`.

---

## Semantic Features

Aperture supports semantic discovery via vector embeddings. These features require [qmd](https://qmd.sh) (Quick Markdown Search) to be installed and your wiki indexed.

```bash
# Install qmd
brew install qmd

# Index your vault
qmd collection add vault /path/to/your/vault
qmd update
qmd embed
```

The build process automatically generates semantic layouts and neighbor maps from qmd's index:

- **Cognitive Map** — UMAP projection of your wiki's semantic landscape (Graph page)
- **Semantic Trail** — Related-article discovery paths on each article page
- **Knowledge Clusters** — Semantic islands at `/clusters`
- **Cluster Focus** — `/graph?cluster=<id>` highlights one island in the graph

If qmd is not installed or the index is missing, the build falls back gracefully to link-based layouts only.

---

## Agent-Readable Interfaces

Aperture exposes the wiki in formats that agents and scripts can consume directly:

| Interface | Description |
|-----------|-------------|
| `/api/wiki/<slug>` | Full JSON for one page: title, content, HTML, frontmatter, sources, evolution, backlinks, semantic neighbors, reading time, and word count |
| `/llms.txt` | Short index of article URLs and API endpoints |
| `/llms-full.txt` | Full index with summaries, source counts, evolution counts, and source lists |

Example:

```bash
curl http://localhost:3000/api/wiki/ai-ecosystem/builder-2-collaborative-coding
curl http://localhost:3000/llms.txt
curl http://localhost:3000/llms-full.txt
```

---

## Maintenance Commands

These commands produce files in `exports/`, which is ignored by git.

| Command | Output | Purpose |
|---------|--------|---------|
| `npm run graph:proposal -- --focus <slug>` | `exports/graph-research/*.md` | Generate a research/triage proposal from one graph focus |
| `npm run graph:proposal -- --cluster <id>` | `exports/graph-research/*.md` | Generate a research/triage proposal from one semantic cluster |
| `npm run export:wiki` | `exports/wiki-snapshot-*.zip` | Export the current markdown wiki and metadata as a zip snapshot |
| `npm run wiki:health` | `exports/wiki-health-*.md` | Report broken wikilinks, thin pages, long pages, pages without sources, orphan pages, and stale pages |
| `npm run wiki:entities` | `exports/wiki-entities-*.md` and `.json` | Report page entities, candidate entities, aliases, confidence, and suggested wikilinks |

Common examples:

```bash
WIKI_ROOT="/path/to/your/vault" npm run graph:proposal -- --focus ai-ecosystem/builder-2-collaborative-coding
WIKI_ROOT="/path/to/your/vault" npm run graph:proposal -- --cluster 0
WIKI_ROOT="/path/to/your/vault" npm run export:wiki
WIKI_ROOT="/path/to/your/vault" npm run wiki:health
WIKI_ROOT="/path/to/your/vault" npm run wiki:entities
```

The graph proposal flow does not write to the wiki directly. It creates markdown proposals that can be reviewed and then passed into `/wiki-triage` or `/wiki-absorb`.

---

## Validation Checklist

Use this checklist after changing wiki viewer behavior:

1. Open `/wiki/<slug>` and confirm `View in Graph`, `Sources`, contribution badge/summary, `Evolution`, backlinks, and `Local Graph`.
2. Open `/graph?focus=<slug>` and confirm the focused article, direct neighbor count, and `Open article` card.
3. Open `/clusters`, then a cluster's `View in Graph`, and confirm `/graph?cluster=<id>` highlights the cluster.
4. Open `/`, confirm `Recently updated` and `Latest <date>` on category cards.
5. Open `/api/wiki/<slug>`, `/llms.txt`, and `/llms-full.txt`.
6. Run `npm run wiki:health`, `npm run wiki:entities`, `npm run graph:proposal`, and `npm run export:wiki`.
7. Run `npm run build` before publishing.

## Deploying

### Static Export (Recommended)

```bash
npm run build
```

This outputs a static site to `dist/`. Deploy to Vercel, Netlify, GitHub Pages, or any static host.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WIKI_ROOT` | Yes | Absolute path to your vault (the directory containing `wiki/`) |
| `QMD_INDEX` | No | Path to qmd's sqlite index (default: `~/.cache/qmd/index.sqlite`) |

---

## Workflow

A typical ongoing workflow:

1. **Collect** — Over days/weeks, accumulate articles, notes, bookmarks.
2. **Drop** — Place new sources in `raw/`.
3. **Ingest** — Run `/wiki-inbox` in Claude Code. The agent reads new sources and updates/creates articles.
4. **Browse** — Run `npm run dev` and explore your wiki.
5. **Refine** — Run `/wiki-cleanup` to improve quality. Run `/wiki-breakdown` to find missing articles.
6. **Query** — Use `/wiki-query` to ask questions across your knowledge base.
7. **Repeat** — The wiki compounds over time. Each cycle makes it richer.

---

## Troubleshooting

### "WIKI_ROOT not configured"

Create `.env.local` and set `WIKI_ROOT` to the absolute path of your vault.

### "No articles found"

Ensure `WIKI_ROOT` points to the directory containing `wiki/`, not the `wiki/` directory itself. Aperture expects `WIKI_ROOT/wiki/*.md`.

### "Build fails with module not found"

Run `npm install` again.

### "Links not clickable"

Ensure `[[wikilinks]]` use forward slashes for subdirectories. Avoid backticks around links.

### "How do I start over?"

Delete generated wiki content and re-ingest:

```bash
rm -rf wiki/**/*.md wiki/_*.json
# Then in Claude Code:
/wiki absorb all
```

---

## Credits

- Inspired by [Andrej Karpathy's LLM Knowledge Bases](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Farza's Farzapedia](https://gist.github.com/farzaa/c35ac0cfbeb957788650e36aabea836d) — The Claude Code skill pattern
- [Steph Ango's File Over App](https://stephango.com/file-over-app) — The philosophy of universal file formats

---

## License

MIT

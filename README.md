<div align="center">
  <h1>Aperture</h1>
  <p><b>A markdown-first wiki and life system for agent-native work.</b></p>
  <a href="https://github.com/ZepPellN/Aperture/stargazers"><img src="https://img.shields.io/github/stars/ZepPellN/Aperture?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"></a>
  <a href="https://x.com/plutozeppln"><img src="https://img.shields.io/badge/follow-@plutozeppln-black?style=flat-square&logo=X" alt="X"></a>
</div>

## Why

Every knowledge worker eventually faces the same problem: notes, bookmarks, transcripts, and journal entries scattered across tools that don't talk to each other. Notion, Obsidian, Logseq — each holds a fragment. When you ask an AI agent to help you think through something, it has no map of what you already know.

Aperture is that map. It keeps your source files in plain markdown, turns them into a structured knowledge graph, and gives both you and your agents clean APIs to read, navigate, and query the whole system. Knowledge work and life management stay in one file-first system that compounds over time.

## What It Provides

| Feature | Description |
|---|---|
| **LLM Wiki** | Browse `wiki/**/*.md` with wikilinks, backlinks, search, categories, and semantic trails. |
| **Source Provenance** | Every article shows where it came from: source links, contribution levels, summaries, and evolution history. |
| **Graph Exploration** | Navigate from any article into a focused knowledge graph, inspect semantic clusters, or browse by cluster. |
| **Life Dashboard** | `/life` reads the same vault for journals, tasks, habits, mood, ideas, goals, and weekly reviews. |
| **Agent Interfaces** | Consume the wiki through `/api/wiki/<slug>`, `/llms.txt`, `/llms-full.txt`, and bundled wiki skills. |

## Agent Quick Start

Open this repo in your agent and say:

```text
Read AGENT_SETUP.md and set up Aperture for my vault.
```

The agent will scaffold your vault, install skills, ingest sources, and start the viewer.

## Manual Setup

```bash
git clone https://github.com/ZepPellN/Aperture.git
cd Aperture
npm install
cp .env.example .env.local
# Set WIKI_ROOT=/absolute/path/to/your/vault
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Design

Aperture is built on three constraints:

| Constraint | Rule |
|---|---|
| **Markdown-first** | Source files are plain markdown with YAML frontmatter. No lock-in, no proprietary format. |
| **File-over-app** | Your data lives in your filesystem, not a database. The app is just a viewer. |
| **Agent-native** | Every feature is designed so that AI agents can read, write, and maintain it programmatically. |

## Maintenance

```bash
npm run tasks
npm run weekly-review
npm run graph:proposal -- --focus <slug>
npm run graph:proposal -- --cluster <id>
npm run export:wiki
npm run wiki:health
npm run wiki:entities
```

## Build

```bash
npm run build
```

Required environment:

| Variable | Description |
|---|---|
| `WIKI_ROOT` | Absolute path to the vault directory |
| `QMD_INDEX` | Optional qmd index path for semantic features |

## Credits

Inspired by [Andrej Karpathy's LLM Knowledge Bases](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), [Farza's Farzapedia](https://gist.github.com/farzaa/c35ac0cfbeb957788650e36aabea836d), and [Steph Ango's File Over App](https://stephango.com/file-over-app).

## License

MIT

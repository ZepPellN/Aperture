<div align="center">
  <h1>Aperture</h1>
  <p><b>A markdown-first wiki and life system that turns your notes into a navigable knowledge graph.</b></p>
  <a href="https://github.com/ZepPellN/Aperture/stargazers"><img src="https://img.shields.io/github/stars/ZepPellN/Aperture?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"></a>
  <a href="https://x.com/plutozeppln"><img src="https://img.shields.io/badge/follow-@plutozeppln-black?style=flat-square&logo=X" alt="X"></a>
</div>

## What You Get

Aperture is a Next.js viewer that reads plain markdown files from your filesystem and renders them as a structured knowledge system. It is not a note-taking app. It is a lens: you keep writing markdown as you always have, and Aperture compiles it into something you and your agents can explore.

### Homepage

Open `/` and you land on a dashboard that surfaces what matters now:

- **Search** — keyword search across all articles, with an optional semantic expansion mode that finds related ideas even when the words do not match.
- **Category navigation** — sidebar (desktop) or pill bar (mobile) listing every category in your wiki. Click a category to open an overlay with all its articles.
- **Recently Updated timeline** — articles grouped by time: Today, This Week, This Month, Earlier. You see at a glance what you have been thinking about.
- **Stats bar** — total articles, total links, orphan count, category count.
- **Category cards** — each category shows a preview of its latest articles.

The homepage is designed as a jumping-off point: search for something specific, browse a category, or follow the timeline to pick up where you left off.

### Wiki Articles

Every article at `/wiki/<slug>` is a self-contained page with more than just rendered markdown:

- **Breadcrumb and metadata** — category, last modified date, reading time, word count.
- **Rendered body** — GitHub Flavored Markdown with syntax highlighting, wikilink resolution (`[[slug|label]]`), and source link expansion.
- **Source provenance** — every article lists its sources with contribution levels (high / medium / low / unknown). Sources are extracted from inline links, absorb logs, frontmatter, and manual contributions. You always know where an idea came from.
- **Evolution timeline** — a chronological list of events (created, absorbed, merged, split, renamed, refined, linked) so you can see how an idea changed over time.
- **Semantic trail** — "Explore undiscovered paths" shows the top semantic neighbors of this article with match scores, letting you wander through related concepts.
- **Backlinks** — every article that links to this one is listed at the bottom.
- **Floating mini graph** — a toggleable SVG overlay showing the 1-degree neighborhood of the current article, with a link to open it in the full graph explorer.

### Graph Exploration

Aperture ships with four distinct graph visualizers. They all read the same underlying data (articles as nodes, wikilinks as edges) but answer different questions:

| View | Technology | What it shows |
|---|---|---|
| **Network** | Sigma.js + WebGL | A force-directed graph with node sizing by link count, category-colored nodes, focus mode (isolate a neighborhood), cluster highlighting, and animated camera transitions. SVG fallback for environments without WebGL. |
| **Topo Map** | Canvas + D3-contour | A topographic density map. Articles are points; contour bands show knowledge density; category-colored glows reveal cluster territories; centroid labels name each category. Hover for link stats. |
| **Semantic Map** | Canvas + D3-contour | Same visual language as Topo Map, but laid out by UMAP semantic coordinates instead of force-directed placement. Articles with similar meaning cluster together regardless of direct links. |
| **Nest** | React Three Fiber + Three.js | A 3D organic cluster visualization. Categories are arranged in a circle; each article is a "seed" shape made of line-segment bursts. Edges are animated growing arcs. Orbit controls: left-drag to pan, right-drag to rotate. Click a node to focus the camera and open a detail card. |

Switch between views with tabs. The graph explorer is reachable from any article via "View in Graph" or directly at `/graph`.

### Semantic Clusters

`/clusters` runs DBSCAN on UMAP-reduced embeddings to find knowledge islands — groups of articles that are semantically close even without direct links. Each cluster shows its member count, centroid article, and a preview of its contents. This is where you find unexpected connections.

### Random Walk

`/walk` starts you at a random article and presents its semantic neighbors. Pick one, and you wander. It is a deliberate mechanism for serendipitous discovery when you do not know what you are looking for.

### Life Dashboard

`/life` reads a separate set of markdown files (daily journals, weekly intents, habit trackers, goal lists) and compiles them into a unified personal dashboard:

- **Weekly stats bar** — current week number, pending tasks, completed tasks, ideas captured.
- **Weekly intent cards** — four fixed categories: STOP (what to stop doing), START (what to start), FORGIVE (what to let go of), SELF-CARE (what to do for yourself).
- **Next actions** — extracted from recent diary entries, displayed as a grid.
- **Mood timeline** — a bar chart showing dominant emotion and energy level per day over the last two weeks.
- **Habit heatmap** — exercise, meals, sleep quality, supplements. Days as columns, habits as rows, color intensity by completion.
- **Task velocity** — a stacked bar chart of pending vs. completed tasks per week.
- **Recent diaries** — expandable entries from the last several days.
- **Life areas** — collapsible sections for each life domain, showing goal counts and linked documents.
- **2026 goals** — domain-grouped goals with expandable plan and target details.
- **Weekly reviews** — collapsible historical reviews with building days count and ideas generated.

The life dashboard and the wiki share the same markdown-first philosophy. There is no database. There is no sync service. Just files.

### Agent Interfaces

Aperture is built for agents as much as for humans:

- **`/api/wiki/<slug>`** — JSON API for any article. Returns slug, title, category, raw markdown, compiled HTML, sources, backlinks, semantic neighbors, reading time, and word count.
- **`/llms.txt`** — Compact agent onboarding file describing the system.
- **`/llms-full.txt`** — Full agent-readable index.
- **Bundled skills** — Installable Claude Code skills for wiki maintenance (`wiki-absorb`, `wiki-health`, `wiki-query`, etc.) located in `.agents/skills/`.

## Pages & Routes

| Route | Purpose |
|---|---|
| `/` | Homepage: search, categories, recently updated, stats |
| `/wiki/<slug>` | Article page with provenance, evolution, backlinks, mini graph |
| `/graph` | Full-screen graph explorer with 4 view modes |
| `/clusters` | Semantic cluster browser |
| `/walk` | Random walk through semantic neighbors |
| `/life` | Personal life dashboard |
| `/api/wiki/<slug>` | JSON API for article data |

## Design

Three constraints govern every decision:

| Constraint | Rule |
|---|---|
| **Markdown-first** | Source files are plain markdown with YAML frontmatter. No lock-in, no proprietary format. |
| **File-over-app** | Your data lives in your filesystem, not a database. The app is just a viewer. |
| **Agent-native** | Every feature is designed so that AI agents can read, write, and maintain it programmatically. |

Visual design: warm earth-tone palette in OKLCH, Newsreader serif for headings, Geist sans-serif for body, subtle noise texture overlay, light/dark mode toggle with localStorage persistence.

## Automation

Aperture includes a suite of CLI scripts that operate on your markdown files:

```bash
# Extract tasks from daily journals and weekly intents
npm run tasks

# Generate weekly review Markdown from daily journals
npm run weekly-review

# Run a full wiki health audit (broken links, thin pages, orphans, stale pages)
npm run wiki:health

# Analyze entity mentions and suggest new wikilinks
npm run wiki:entities

# Generate a research proposal for a topic or cluster
npm run graph:proposal -- --focus <slug>
npm run graph:proposal -- --cluster <id>

# Generate an insight report from a natural language question
npm run insight

# Export the entire wiki as a timestamped ZIP
npm run export:wiki

# Rebuild semantic embeddings, UMAP layout, and clusters
npm run build:semantic

# Regenerate llms.txt files
npm run generate:llms-txt
```

## Quick Start

For agents:

```text
Read AGENT_SETUP.md and set up Aperture for my vault.
```

For humans:

```bash
git clone https://github.com/ZepPellN/Aperture.git
cd Aperture
npm install
cp .env.example .env.local
# Set WIKI_ROOT=/absolute/path/to/your/vault
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Description |
|---|---|
| `WIKI_ROOT` | Absolute path to the vault directory |
| `QMD_INDEX` | Optional qmd index path for semantic features |

## Build

```bash
npm run build
```

This runs the full pipeline: semantic rebuild, task extraction, weekly review generation, llms.txt generation, and Next.js static export.

## Credits

Inspired by [Andrej Karpathy's LLM Knowledge Bases](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), [Farza's Farzapedia](https://gist.github.com/farzaa/c35ac0cfbeb957788650e36aabea836d), and [Steph Ango's File Over App](https://stephango.com/file-over-app).

## License

MIT

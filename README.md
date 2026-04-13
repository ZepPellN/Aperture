# Loom

A web reader for LLM-compiled personal wikis.

Loom turns a folder of markdown wiki files into a browsable website with search, backlinks, and an interactive knowledge graph. It is designed for the **Claude Code + Obsidian** workflow where an LLM ingests raw sources and writes structured, interlinked wiki articles.

---

## What it does

- **Article pages** — Renders markdown with YAML frontmatter, clickable `[[wikilinks]]`, table of contents, and backlinks.
- **Knowledge graph** — Visualizes the entire wiki as an interactive network (Sigma.js).
- **Stats dashboard** — Shows article count, link density, categories, and orphan pages.
- **Zero-backend** — Reads markdown files at build time. Deploy anywhere that hosts static sites.

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/ZepPellN/loom.git
cd loom
npm install
```

### 2. Point to your wiki

Copy the example environment file and edit it to point at your vault:

```bash
cp .env.example .env.local
```

```bash
# .env.local
WIKI_ROOT=/Users/jean/Documents/Obsidian Vault
```

Loom expects the target directory to contain a `wiki/` folder with markdown files.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
```

This outputs a static site to the `dist/` folder.

---

## Project structure

```
loom/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Homepage with stats and recent articles
│   ├── graph/
│   │   └── page.tsx        # Knowledge graph view
│   └── wiki/
│       └── [...slug]/      # Individual article pages
├── components/
│   ├── WikiLayout.tsx      # Top navigation shell
│   ├── ArticleView.tsx     # Article renderer + backlinks
│   └── GraphView.tsx       # Sigma.js graph component
├── lib/
│   ├── wiki-loader.ts      # Markdown parsing, wikilink extraction, stats
│   └── graph-builder.ts    # Graph data generation for Sigma
├── public/
├── next.config.ts
├── package.json
└── README.md
```

---

## Assumed wiki format

Loom works with standard markdown files that use YAML frontmatter and `[[wikilinks]]`:

```markdown
---
title: Example Article
section: harness-engineering
sources: 3
updated: 2026-04-13
---

# Example Article

This is a paragraph with a [[another-article|wikilink]].
```

Articles are organized into categories by their parent directory inside `wiki/`.

---

## Roadmap

- [x] Article rendering with wikilinks
- [x] Backlinks
- [x] Knowledge graph
- [x] Stats dashboard
- [ ] Full-text search
- [ ] Dark mode
- [ ] RSS feed

---

## License

MIT

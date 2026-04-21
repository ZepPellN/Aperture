# Agent Setup Guide — LM Wiki

This document is designed to be read by any AI agent (Claude Code, Cursor, Chronicle, etc.). If you are an AI assistant helping a user set up their LM Wiki, follow this guide exactly.

---

## Your Goal

Transform the user's scattered documents into a structured LM Wiki with:
1. A properly organized `raw/` directory
2. An initial `wiki/` knowledge base
3. A working Aperture web viewer
4. Ingest pipeline ready to run

---

## Prerequisites (Confirm with User)

Before starting, ensure the user has:
- **Node.js 18+** (`node --version`)
- **npm** or **yarn**
- A folder containing their scattered documents (markdown, text, or other formats)
- **Claude Code** or another AI coding tool installed (for ongoing wiki maintenance)

---

## Phase 1: Understand the User's Context

### Step 1: Read the Schema

Read `BASIC_SCHEMA.md` in this repository. Internalize:
- The three-layer architecture (`raw/` → `wiki/` → `outputs/`)
- Theme Aggregation Rules (when to create, merge, or split pages)
- Frontmatter contract (`title`, `section`, `sources`, `updated`)
- Writing standards (encyclopedic tone, no editorial voice)

### Step 2: Interview the User

Ask the user:
1. **What kind of content do you have?**
   - Articles, newsletters, tweets, notes, messages, papers?
   - Personal journal vs. research/learning materials?
2. **What is the primary purpose of this wiki?**
   - Knowledge tracking (learning about AI, tech, science)?
   - Personal life wiki (journal, relationships, decisions)?
   - Hybrid?
3. **Where are your documents currently stored?**
   - Single folder? Multiple folders? Obsidian vault? Notion export?
4. **Do you have preferred topic categories?**
   - Or should categories emerge from the data?

### Step 3: Choose a Pattern

Based on the interview, decide which pattern to start with:

**Pattern A: Knowledge Tracker** — Use when content is articles, papers, newsletters, videos about external topics.
- Start with: `concepts/`, `entities/`, `forecasts/`, `sources/`

**Pattern B: Life Wiki** — Use when content is journals, messages, personal writing.
- Start with: `people/`, `patterns/`, `philosophies/`, `eras/`, `decisions/`

**Pattern C: Hybrid** — Most common. Start with a mix and let the data dictate expansion.

---

## Phase 2: Scaffold the Vault

### Step 1: Create Directory Structure

In the user's chosen vault root, create:

```
vault-root/
├── CLAUDE.md              # Copy from reference/CLAUDE.md, customize for user
├── raw/
│   ├── to-learn/          # Long-form articles, essays, papers
│   ├── newsletters/       # Newsletter issues (create subdirs per source)
│   ├── twitter/           # X threads, bookmarks
│   │   ├── x-articles/    # Long-form posts
│   │   └── x-posts/       # Short posts / bookmarks
│   ├── tools/             # Tool docs, skill references, CLI notes
│   ├── briefing/          # Auto-generated briefings
│   └── assets/            # Images, downloads
├── wiki/
│   ├── index.md           # Master catalog
│   ├── _absorb_log.json   # Start with: {}
│   ├── _backlinks.json    # Start with: {}
│   └── {sections}/        # Create based on chosen pattern
└── outputs/               # Query results (start empty)
```

### Step 2: Copy and Customize CLAUDE.md

1. Copy `reference/CLAUDE.md` to the vault root.
2. Customize it:
   - Update the "Wiki Structure" section to match the chosen pattern
   - Add any domain-specific rules the user mentioned
   - Keep Theme Aggregation Rules exactly as written — they are universal

### Step 3: Initialize Tracking Files

Create empty tracking files:
- `wiki/_absorb_log.json` → `{}`
- `wiki/_backlinks.json` → `{}`
- `wiki/index.md` → Use template from `reference/wiki/index.md`

---

## Phase 3: Organize Raw Sources

### Step 1: Inventory Existing Documents

List all documents the user wants to ingest. For each document, determine:
- **Format**: `.md`, `.txt`, `.pdf`, `.html`, etc.
- **Type**: article, newsletter, tweet, note, message, paper
- **Date**: When was it created? (use file mod date if unknown)
- **Priority**: Is this high-signal content or noise?

### Step 2: Copy to raw/

Move or copy each document into the appropriate `raw/` subdirectory:

| Document Type | Target Directory | Notes |
|---------------|------------------|-------|
| Articles, essays, papers | `raw/to-learn/` | Preserve original filename or use `YYYY-MM-DD-slug.md` |
| Newsletter issues | `raw/newsletters/{source-name}/` | Create source-name subdir if needed |
| X/Twitter threads | `raw/twitter/x-articles/` | Long-form posts only |
| X bookmarks | `raw/twitter/x-posts/` | Short posts, interest signals |
| Tool docs, CLI notes | `raw/tools/` | Reference materials |
| Auto briefings | `raw/briefing/{type}/` | Generated digests |
| Images | `raw/assets/` | Keep original extensions |

**Rules:**
- Do not modify document contents during this move.
- If a document has no clear type, default to `raw/to-learn/`.
- If a document is not markdown, leave it as-is. The ingest skill will handle conversion.

### Step 3: Document the Inventory

Create a temporary file (do not commit to wiki):
```markdown
# Ingest Inventory

## High Priority (Process First)
- [ ] raw/to-learn/article-a.md — Key framework essay
- [ ] raw/to-learn/paper-b.md — Foundational paper

## Medium Priority
- [ ] raw/newsletters/source-x/2026-04-01.md — Weekly digest

## Low Priority / Noise
- [ ] raw/twitter/x-posts/misc.md — Bookmark dumps
```

Show this to the user for approval before proceeding.

---

## Phase 4: Initial Ingest

### Step 1: Configure the Environment

If using Claude Code, ensure the wiki skills are available:
1. Copy `.claude/skills/` from this repository to the user's project `.claude/skills/`.
2. Or, if the user has their own skills directory, merge the `wiki-*` directories.

### Step 2: Run Ingest

In the user's AI coding tool, run:

```
/wiki-inbox [limit]
```

Where `[limit]` is optional — if omitted, all unabsorbed files are processed.

**What happens:**
1. The agent reads each raw file.
2. Computes SHA256 and checks `_absorb_log.json`.
3. Skips duplicates.
4. Applies Theme Aggregation Rules.
5. Creates or updates wiki pages.
6. Adds `[[wikilinks]]`.
7. Updates `_absorb_log.json`, `index.md`, and `_backlinks.json`.

### Step 3: Review Initial Output

After the first batch:
1. Read `wiki/index.md` — are the categories sensible?
2. Read 2-3 generated wiki pages — is the tone encyclopedic? Are sources cited?
3. Check `_backlinks.json` — are links being captured?

Show the user:
- Total pages created
- Sections (categories) that emerged
- Any pages flagged as "thin" or "crammed"

Ask for feedback before continuing.

---

## Phase 5: Set Up Aperture Viewer

### Step 1: Clone Aperture

In a separate directory (or as a sibling to the vault):

```bash
git clone https://github.com/YOUR_USERNAME/aperture.git
cd aperture
npm install
```

### Step 2: Point Aperture at the Vault

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
WIKI_ROOT=/path/to/user/vault
```

Aperture expects `WIKI_ROOT` to contain a `wiki/` folder with markdown files.

### Step 3: Run Aperture

```bash
npm run dev
```

Open `http://localhost:3000`.

Show the user:
- The homepage with stats (article count, link density)
- The knowledge graph view (`/graph`)
- A sample article page with backlinks

### Step 4: Build for Production (Optional)

```bash
npm run build
```

Outputs a static site to `dist/`.

---

## Phase 6: Ongoing Workflow

Teach the user the maintenance cycle:

```
1. COLLECT  → Drop new sources into raw/
2. INGEST   → Run /wiki-inbox in Claude Code
3. BROWSE   → Open Aperture at localhost:3000
4. REFINE   → Run /wiki-cleanup and /wiki-breakdown
5. QUERY    → Run /wiki-query "your question"
6. REPEAT   → The wiki compounds over time
```

### Key Commands Reference

| Command | When to Use |
|---------|-------------|
| `/wiki-inbox [limit]` | Process new raw files |
| `/wiki-absorb [range]` | Re-process raw files (e.g., after schema changes) |
| `/wiki-cleanup` | Audit and improve article quality |
| `/wiki-breakdown` | Find and create missing articles |
| `/wiki-query "question"` | Ask questions across the wiki |
| `/wiki-status` | Show health stats |
| `/wiki-rebuild-index` | Regenerate index and backlinks |
| `/wiki-reorganize` | Rethink structure (with user approval) |

---

## Troubleshooting

### "No wiki pages found"
- Ensure `WIKI_ROOT` in `.env.local` points to the directory containing `wiki/`.
- Ensure wiki files have `.md` extension and valid YAML frontmatter.

### "Links not clickable"
- Check that `[[wikilinks]]` use forward slashes for subdirectories: `[[section/page-name]]`.
- Avoid backticks around wikilinks — they break the backlink index.

### "Articles look like chronological dumps"
- Run `/wiki-cleanup`. The agent will restructure theme-driven sections.
- Review Writing Standards in `BASIC_SCHEMA.md`.

### "Too many stubs / too few substantial pages"
- Run `/wiki-breakdown` to identify high-reference entities worth expanding.
- Run `/wiki-reorganize` to merge thin pages into parents.

---

## Checklist

Before declaring the setup complete, verify:

- [ ] `raw/` contains organized source documents
- [ ] `wiki/` contains at least one article per section
- [ ] `wiki/index.md` lists all pages with summaries
- [ ] `wiki/_absorb_log.json` tracks absorbed sources
- [ ] `wiki/_backlinks.json` captures links
- [ ] `CLAUDE.md` is customized for the user's domain
- [ ] Aperture runs locally and renders articles
- [ ] User knows how to run `/wiki-inbox`
- [ ] User knows how to browse the wiki in Aperture
- [ ] User knows how to ask questions with `/wiki-query`

---

## Note to Agents

This guide is intentionally procedural. Do not skip steps. Do not assume the user's setup matches your training data. Always:
1. Read `BASIC_SCHEMA.md` first.
2. Ask the user before making structural changes.
3. Show outputs before and after transforms.
4. Let the user review the wiki index before bulk operations.

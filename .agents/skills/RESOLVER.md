# Aperture Skills Resolver — Routing Table

Routing index for aperture project skills: design taste system and visual design tools.

## Routing by Function

### Design Taste System
- **`design-taste-frontend/SKILL.md`** — Frontend design taste evaluation and guidance
- **`gpt-taste/SKILL.md`** — GPT-based design taste analysis
- **`stitch-design-taste/SKILL.md`** — Stitch multiple design taste references together

### Visual Design Styles
- **`high-end-visual-design/SKILL.md`** — Premium, high-end visual design patterns
- **`industrial-brutalist-ui/SKILL.md`** — Industrial brutalist user interface style
- **`minimalist-ui/SKILL.md`** — Minimalist UI design principles
- **`image-taste-frontend/SKILL.md`** — Image-based design taste for frontend

### Design Operations
- **`full-output-enforcement/SKILL.md`** — Ensure complete design output, prevent truncation
- **`redesign-existing-projects/SKILL.md`** — Redesign and refresh existing project UIs

### Wiki Management (Standalone Copy)
Aperture ships its own copy of the wiki management skills for open-source distribution. These are identical to personal_daily's wiki-* skills.

- **`wiki-inbox/SKILL.md`** — Scan raw/ and ingest unabsorbed files
- **`wiki-ingest/SKILL.md`** — Router to specialized wiki sub-skills
- **`wiki-absorb/SKILL.md`** — Re-process raw files to update/create wiki articles
- **`wiki-breakdown/SKILL.md`** — Find and create missing articles
- **`wiki-cleanup/SKILL.md`** — Audit and enrich articles with parallel subagents
- **`wiki-daily-update/SKILL.md`** — Daily wiki maintenance
- **`wiki-query/SKILL.md`** — Answer questions from wiki
- **`wiki-rebuild-index/SKILL.md`** — Regenerate index and backlinks
- **`wiki-reorganize/SKILL.md`** — Rethink wiki structure
- **`wiki-status/SKILL.md`** — Report wiki health statistics

## Disambiguation Rules

1. **Style selection** — When choosing a visual style, read the relevant style skill (brutalist, minimalist, high-end)
2. **Taste evaluation** — General taste → `/gpt-taste`; Frontend-specific → `/design-taste-frontend`; Image-based → `/image-taste-frontend`
3. **Combining styles** — Multiple taste references → `/stitch-design-taste`
4. **Complete output** — Always consider `/full-output-enforcement` when generating design output

## Chaining

Common chains:
- `gpt-taste` → `design-taste-frontend` → implement
- `minimalist-ui` / `industrial-brutalist-ui` / `high-end-visual-design` → implement
- `redesign-existing-projects` → style skill → implement
- implement → `full-output-enforcement` (verify completeness)

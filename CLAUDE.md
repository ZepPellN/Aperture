# Aperture Project Rules

## Skill Management

### Directory Convention

| Layer | Path | Content |
|-------|------|---------|
| **Source** (canonical) | `.agents/skills/<name>/SKILL.md` | Real skill files — edit here |
| **Runtime** (symlink) | `.claude/skills/<name>` → `../../.agents/skills/<name>` | All symlinks — never real dirs |

### Creating a New Skill

1. Create in `.agents/skills/`:
   ```bash
   mkdir -p .agents/skills/<skill-name>
   # write .agents/skills/<skill-name>/SKILL.md
   ```
2. Auto-link to `.claude/skills/`:
   ```bash
   cd .agents/skills && ./link-to-claude.sh <skill-name>
   ```
3. Register in `.agents/skills/RESOLVER.md`

### Skill Scope

This project owns: design taste system (design-taste-frontend, gpt-taste, stitch-design-taste, etc.), visual design styles (high-end, industrial-brutalist, minimalist, etc.), and wiki management (independent copy for open-source distribution).

Development workflow and general CLI tools live in global `~/.agents/skills/`. Life management and information intake live in `personal_daily/.agents/skills/`.

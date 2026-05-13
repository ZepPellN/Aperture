# Codex Knowledge LLM vs Aperture

Date: 2026-05-12

## Short Version

Codex Knowledge LLM is an onboarding and ingestion kit: install a Codex plugin, initialize an Obsidian-ready vault, paste a source, and generate structured note packs.

Aperture is a viewer and maintenance layer for an existing markdown knowledge system: read local files, render pages, expose provenance, visualize links, support semantic exploration, and give agents APIs plus wiki-maintenance skills.

They are complementary. Codex Knowledge LLM is strongest at first-run capture. Aperture is stronger at long-term navigation, auditability, and public/agent-facing presentation.

## Similarities

| Area | Codex Knowledge LLM | Aperture |
| --- | --- | --- |
| Data model | Plain markdown vault | Plain markdown vault |
| Agent orientation | Codex plugin + skill instructions | Bundled skills + JSON API + llms.txt |
| Obsidian compatibility | Obsidian-ready folders and links | Reads Obsidian-style wiki markdown |
| Source handling | Preserves original/source/index note packs | Shows sources, contribution levels, absorb logs, and evolution |
| Public promise | Compounding context from source material | Compounding context through graph, provenance, and skills |

## Key Differences

| Question | Codex Knowledge LLM | Aperture |
| --- | --- | --- |
| Primary job | Create structured notes from pasted or local sources | Render and explore an existing markdown knowledge system |
| First-run experience | One-command onboarding and throwaway vault demo | Next.js app configured through `WIKI_ROOT` |
| Output shape | `notes/`, `ideas/`, `projects/`, `Home.md` | `/`, `/wiki/<slug>`, `/graph`, `/clusters`, `/walk`, `/life`, `/api/wiki/<slug>` |
| Automation style | Deterministic Python note-pack generator | TypeScript scripts for health, entities, semantic build, weekly review, exports |
| Visualization | Optional Graphify docs | Built-in graph, topo map, semantic map, 3D nest, local mini graph |
| Knowledge maturity | Route-based note types | `page_kind`, `knowledge_status`, candidate/mature states, MOCs |
| Publishing surface | README + example notes | README gallery, static showcase HTML, HyperFrames video, app UI |

## What Aperture Should Learn From It

1. **Make first-run obvious.** Codex Knowledge LLM has a very clear reader journey: clone, run onboarding, ingest sample, inspect generated notes. Aperture should keep the demo-vault command and screenshot gallery prominent.
2. **Ship deterministic helpers for demos.** Their `create-note-pack.py` makes the promise testable without relying on a long agent run. Aperture can benefit from a small `scripts/create-demo-vault.ts` or `scripts/capture-readme-screenshots.ts`.
3. **Document the workflow as an arrow diagram.** The README explains the system in one compact source-to-vault flow. Aperture should keep a similarly concise raw-to-wiki-to-agent loop.
4. **Separate onboarding from advanced docs.** Their install-only, vault-kit-only, demo, and smoke-test sections reduce confusion. Aperture should distinguish quick start, public demo, real vault setup, and production build.
5. **Include sample inputs and outputs.** Aperture now has `docs/demo-vault/`; keeping it small and curated will make new users understand the model without needing private data.
6. **Add a smoke-test mindset.** Codex Knowledge LLM validates plugin manifest, vault embedding, install behavior, and expected files. Aperture already has scripts, but a single README-oriented verification command would improve trust.

## Aperture's Stronger Points

- It has a real UI, not only generated note files.
- It makes provenance and evolution visible on article pages.
- It exposes graph exploration as a first-class product surface.
- It combines wiki and life-dashboard views from markdown.
- It has public-facing capture assets: screenshots, showcase HTML, and a rendered product video.

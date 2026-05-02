---
name: wiki-triage
description: >
  Interactively read one high-value raw source, compare it against the current
  wiki, propose precise article updates, and wait for user confirmation before
  writing. Use when the user says /wiki-triage, asks to "精读" a single source,
  or wants save/skip decisions instead of batch wiki-absorb.
argument-hint: "<raw-file-path>"
---

# Wiki Triage

Use this for one important source that deserves human review before it changes
the wiki. It complements `wiki-absorb`: triage proposes and confirms; absorb can
batch-write.

Read `.agents/skills/_wiki-common.md` before writing. Follow its vault paths,
tracking state, candidate system, and writing standards.

## Required Input

One raw file path, usually under:

- `raw/to-learn/`
- `raw/twitter/x-articles/`
- `raw/briefing/`
- `raw/newsletters/`
- `raw/tools/`

If the path is ambiguous, search with the Obsidian CLI:

```bash
/Applications/Obsidian.app/Contents/MacOS/obsidian files vault="Obsidian Vault"
```

## Operating Rule

Do not write wiki pages during proposal generation. Write only after the user
confirms a specific action such as `save 1`, `save 1,3`, `save all`, `skip`, or
`edit 2`.

## Workflow

### 1. Load Context

1. Read `_wiki-common.md`.
2. Read `$VAULT/CLAUDE.md`.
3. Read `wiki/_absorb_log.json`.
4. Read `wiki/index.md`.
5. Read the source file fully.
6. Compute SHA256:

```bash
shasum -a 256 "<raw-file>"
```

Use the Obsidian CLI for normal vault reads:

```bash
/Applications/Obsidian.app/Contents/MacOS/obsidian read vault="Obsidian Vault" path="<path>"
```

### 2. Find Candidate Target Pages

Use at least three signals:

- Existing wiki index titles and summaries.
- Wikilinks/entities mentioned in the source.
- Backlinks or nearby section overview pages.

Prefer updating mature pages over creating thin new pages. Create a candidate
page only when the source contains a distinct topic that does not fit an
existing page.

### 3. Produce a Proposal

Output a numbered list. Each proposal must include:

- **Action**: `update`, `create_candidate`, `promote_candidate`, `split`, or `skip`.
- **Target**: wiki page path.
- **Change**: 1-3 sentence summary of what would be added or rewritten.
- **Sections**: existing or proposed headings touched.
- **Evidence**: source paragraphs, claims, or timestamps that justify the change.
- **Links**: wikilinks to add.
- **Risk**: conflict, duplication, thin-page risk, or none.

Keep each item concise. The user should be able to decide without reading a
second essay.

### 4. Wait for Confirmation

Ask for one concise decision:

```text
Reply with: save 1 | save 1,3 | save all | skip | edit <number>
```

If the user chooses `edit <number>`, ask what to change and regenerate only that
proposal.

### 5. Write Confirmed Changes

For each confirmed proposal:

1. Read the target page immediately before editing.
2. Integrate content into the correct section. Do not append event-log text to
   the bottom.
3. Preserve encyclopedic tone.
4. Update frontmatter `sources` count and `updated`.
5. Ensure a `## Sources` section exists and includes the raw source wikilink.
6. Create candidate pages with `status: candidate` when there is only one
   source.
7. Rebuild `wiki/index.md` and `wiki/_backlinks.json` after writes if links or
   page inventory changed.

For files over 10KB, write via direct file copy as required by project rules.
For smaller edits, Obsidian CLI writes are acceptable.

### 6. Update Logs

Update `wiki/_absorb_log.json` after successful writes:

```json
"raw/path/to/source.md": {
  "status": "triaged",
  "absorbed_at": "2026-05-02T00:00:00Z",
  "wiki_pages": ["section/page"],
  "hash": "sha256:...",
  "decisions": [
    {
      "action": "saved",
      "target": "section/page",
      "sections": ["## Key points"],
      "summary": "Added the source's main claim."
    }
  ]
}
```

Also append to `wiki/log.md`:

```markdown
## [YYYY-MM-DD] triage | <Source Title>
Pages touched: [[section/page]]
Decisions: saved 1, skipped 2.
Files processed:
- [[raw/path/to/source.md|Source Title]] → [[section/page]]
```

## Proposal Quality Bar

Good proposals are:

- Few: usually 1-5 items.
- Specific: name exact target pages and sections.
- Conservative: avoid new pages unless the topic has independent depth.
- Reversible: each decision maps to a clear write.
- Traceable: every proposed claim points back to the raw source.

Bad proposals:

- Summarize the source without saying where it belongs.
- Suggest broad rewrites without evidence.
- Create a page for every named entity.
- Ask the user open-ended questions before doing source-to-wiki matching.

## Completion Checklist

- Source read fully.
- Existing wiki checked.
- Numbered proposal shown.
- User confirmed writes.
- Confirmed pages updated.
- `## Sources` updated.
- `_absorb_log.json` updated with `status: triaged`.
- `wiki/log.md` updated.
- Index/backlinks rebuilt when needed.

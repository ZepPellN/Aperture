# Reference Vault

This is a minimal example of an LM Wiki vault. Copy this structure as a starting point for your own wiki.

## Structure

```
.
├── CLAUDE.md              # Your wiki's decision engine — read by your AI agent
├── raw/                   # Immutable source documents
│   ├── to-learn/          # Long-form articles, essays, videos
│   ├── newsletters/       # Newsletter issues
│   ├── twitter/           # X threads and bookmarks
│   ├── tools/             # Tool docs and skill references
│   └── assets/            # Images and attachments
└── wiki/                  # Compiled knowledge base
    ├── index.md           # Master catalog
    ├── _absorb_log.json   # Tracks absorbed sources
    ├── _backlinks.json    # Reverse link index
    ├── concepts/          # Ideas and frameworks
    ├── entities/          # Named things
    └── forecasts/         # Predictions and trends
```

## How to Use

1. Copy this entire `reference/` directory to your Obsidian vault (or any folder).
2. Replace the example content in `raw/` with your own sources.
3. Open your AI agent (Claude Code, Cursor, Chronicle, etc.) in the vault root.
4. Give your agent the `CLAUDE.md` file and your `BASIC_SCHEMA.md`.
5. Run `/wiki-inbox` or `/wiki-absorb` to start ingesting.

## Key Files

- **`CLAUDE.md`** — The "brain" of your wiki. Defines how the agent should ingest, classify, and maintain pages. Customize this for your domain.
- **`wiki/index.md`** — The master catalog. Your agent reads this first on every query.
- **`wiki/_absorb_log.json`** — Prevents duplicate processing. Never edit manually.
- **`wiki/_backlinks.json`** — Powers the knowledge graph. Auto-generated.

## Next Steps

See the main project `README.md` for:
- Connecting this vault to the Aperture web viewer
- Full skill documentation
- Agent setup instructions

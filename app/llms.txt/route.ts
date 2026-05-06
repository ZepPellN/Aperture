import { loadWikiIndex } from '@/lib/wiki-loader';

export const dynamic = 'force-static';

export async function GET() {
  const articles = await loadWikiIndex();
  const lines = [
    '# Aperture',
    '',
    '> A markdown-first wiki and life system for agent-native work.',
    '> It turns raw notes, links, transcripts, and daily logs into a browsable knowledge graph with source provenance, semantic trails, and agent APIs.',
    '',
    '## Links',
    '',
    '- [Repository](https://github.com/ZepPellN/Aperture)',
    '- [README](https://github.com/ZepPellN/Aperture#readme)',
    '- [Author](https://x.com/plutozeppln)',
    '',
    '## About',
    '',
    'Aperture is built for knowledge workers who want their notes to compound.',
    'Instead of scattering bookmarks, transcripts, and journal entries across tools that do not talk to each other,',
    'Aperture keeps everything in plain markdown and turns it into a structured knowledge graph.',
    'It gives both humans and AI agents clean APIs to read, navigate, and query the whole system.',
    'Knowledge work and life management — tasks, habits, goals, weekly reviews — stay in one file-first system.',
    '',
    '## Core Routes',
    '',
    '- `/wiki/<slug>`: human-readable article page with sources, semantic trail, and local graph.',
    '- `/graph?focus=<slug>`: focused knowledge graph for an article.',
    '- `/clusters`: browse knowledge by semantic clusters.',
    '- `/life`: life dashboard (tasks, habits, mood, weekly reviews).',
    '- `/api/wiki/<slug>`: full JSON for an article (for AI consumption).',
    '- `/llms-full.txt`: complete article index.',
    '',
    '## Agent Onboarding',
    '',
    'Tell your agent to read `AGENT_SETUP.md` for full setup: scaffolding, skill installation, content ingestion, and viewer launch.',
    '',
    '## Article Index',
    '',
    ...articles
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((article) => `- [${article.title}](/wiki/${article.slug}) — /api/wiki/${article.slug}`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

import { loadWikiIndex } from '@/lib/wiki-loader';

export const dynamic = 'force-static';

export async function GET() {
  const articles = await loadWikiIndex();
  const lines = [
    '# Aperture Wiki',
    '',
    'Aperture is a static, LLM-compiled wiki with article pages, graph views, and per-page JSON.',
    '',
    '## Core Routes',
    '',
    '- `/wiki/<slug>`: human-readable article page.',
    '- `/graph?focus=<slug>`: graph view focused on one article.',
    '- `/api/wiki/<slug>`: JSON for one article, including markdown, html, sources, backlinks, semantic neighbors, and evolution.',
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

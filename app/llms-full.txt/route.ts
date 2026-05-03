import { extractSummary, loadAllArticles } from '@/lib/wiki-loader';

export const dynamic = 'force-static';

function sourceLine(label: string, path: string): string {
  return label === path ? path : `${label} (${path})`;
}

export async function GET() {
  const articles = await loadAllArticles();
  const lines = [
    '# Aperture Wiki Full Index',
    '',
    'This file is a compact, agent-readable index of every wiki article, including stable page URLs, JSON URLs, summaries, sources, and graph metadata counts.',
    '',
    'Use `/api/wiki/<slug>` for full markdown and HTML for any individual article.',
    '',
    `Total articles: ${articles.length}`,
    '',
    '## Articles',
    '',
    ...articles
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .flatMap((article) => [
        `### ${article.title}`,
        '',
        `- Slug: ${article.slug}`,
        `- Category: ${article.category}`,
        `- Page: /wiki/${article.slug}`,
        `- JSON: /api/wiki/${article.slug}`,
        `- Updated: ${article.lastModified || 'unknown'}`,
        `- Words: ${article.wordCount}`,
        `- Sources: ${article.sources.length}`,
        `- Evolution events: ${article.evolution.length}`,
        `- Summary: ${extractSummary(article.content, 240) || 'No summary available.'}`,
        ...(article.sources.length > 0
          ? [
              '- Source list:',
              ...article.sources
                .slice(0, 5)
                .map((source) => `  - ${sourceLine(source.label, source.path)}`),
            ]
          : []),
        '',
      ]),
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

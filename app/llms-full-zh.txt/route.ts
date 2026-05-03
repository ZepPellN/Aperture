import { extractSummary, loadAllArticles } from '@/lib/wiki-loader';

export const dynamic = 'force-static';

function sourceLine(label: string, path: string): string {
  return label === path ? path : `${label} (${path})`;
}

export async function GET() {
  const articles = await loadAllArticles();
  const lines = [
    '# Aperture 完整文章索引',
    '',
    '本文档是 Aperture Wiki 的完整机器可读索引，包含每篇文章的页面地址、JSON API 地址、摘要、来源及图谱元数据。',
    '',
    '如需获取单篇文章的完整 Markdown 与 HTML，请使用 `/api/wiki/<slug>`。',
    '',
    `- 总文章数: ${articles.length}`,
    `- 开源仓库: https://github.com/ZepPellN/Aperture`,
    '',
    '## 文章列表',
    '',
    ...articles
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .flatMap((article) => [
        `### ${article.title}`,
        '',
        `- Slug: ${article.slug}`,
        `- 分类: ${article.category}`,
        `- 页面: /wiki/${article.slug}`,
        `- JSON: /api/wiki/${article.slug}`,
        `- 更新日期: ${article.lastModified || '未知'}`,
        `- 字数: ${article.wordCount}`,
        `- 来源数: ${article.sources.length}`,
        `- 演化事件: ${article.evolution.length}`,
        `- 摘要: ${extractSummary(article.content, 240) || '暂无摘要'}`,
        ...(article.sources.length > 0
          ? [
              '- 来源列表:',
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

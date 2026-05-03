import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadWikiIndex, loadAllArticles, extractSummary } from '../lib/wiki-loader';

const PUBLIC_DIR = join(process.cwd(), 'public');

function sourceLine(label: string, path: string): string {
  return label === path ? path : `${label} (${path})`;
}

async function generate() {
  mkdirSync(PUBLIC_DIR, { recursive: true });

  const [index, articles] = await Promise.all([
    loadWikiIndex(),
    loadAllArticles(),
  ]);

  // --- llms.txt (English) ---
  const llmsLines = [
    '# Aperture',
    '',
    'Aperture is a markdown-first wiki and life system for agent-native work.',
    'It turns raw notes, links, transcripts, and daily logs into a browsable knowledge graph with source provenance, semantic trails, and agent APIs.',
    '',
    '- Repository: https://github.com/ZepPellN/Aperture',
    '- README: https://github.com/ZepPellN/Aperture#readme',
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
    ...index
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((article) => `- [${article.title}](/wiki/${article.slug}) — /api/wiki/${article.slug}`),
    '',
  ];
  writeFileSync(join(PUBLIC_DIR, 'llms.txt'), llmsLines.join('\n'), 'utf-8');

  // --- llms-zh.txt (Chinese) ---
  const llmsZhLines = [
    '# Aperture',
    '',
    'Aperture 是一个面向 AI Agent 的 Markdown-first 个人 Wiki 系统。',
    '将原始笔记、链接、摘录和日常日志转换为可浏览的知识图谱，保留来源出处、语义关联、演化历史，并为 AI 提供结构化 API。',
    '',
    '- 开源仓库: https://github.com/ZepPellN/Aperture',
    '- 项目主页: https://github.com/ZepPellN/Aperture#readme',
    '',
    '## 核心路由',
    '',
    '- `/wiki/<slug>`: 文章页面（人类可读，含来源、语义轨迹、局部图谱）',
    '- `/graph?focus=<slug>`: 以某篇文章为中心的知识图谱',
    '- `/clusters`: 按语义聚类浏览知识',
    '- `/life`: 生活仪表盘（任务、习惯、情绪、周刊）',
    '- `/api/wiki/<slug>`: 文章的完整 JSON 数据（供 AI 读取）',
    '- `/llms-full-zh.txt`: 所有文章的完整中文索引',
    '',
    '## Agent 接入',
    '',
    'AI Agent 读取 `AGENT_SETUP.md` 即可完成全套部署：脚手架、技能安装、内容摄取、启动查看器。',
    '',
    '## 文章索引',
    '',
    ...index
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((article) => `- [${article.title}](/wiki/${article.slug}) — /api/wiki/${article.slug}`),
    '',
  ];
  writeFileSync(join(PUBLIC_DIR, 'llms-zh.txt'), llmsZhLines.join('\n'), 'utf-8');

  // --- llms-full.txt (English) ---
  const fullLines = [
    '# Aperture Full Article Index',
    '',
    'This file is a compact, agent-readable index of every wiki article, including stable page URLs, JSON API URLs, summaries, sources, and graph metadata counts.',
    '',
    'Use `/api/wiki/<slug>` for full markdown and HTML of any individual article.',
    '',
    `- Total articles: ${articles.length}`,
    `- Repository: https://github.com/ZepPellN/Aperture`,
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
  writeFileSync(join(PUBLIC_DIR, 'llms-full.txt'), fullLines.join('\n'), 'utf-8');

  // --- llms-full-zh.txt (Chinese) ---
  const fullZhLines = [
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
  writeFileSync(join(PUBLIC_DIR, 'llms-full-zh.txt'), fullZhLines.join('\n'), 'utf-8');

  console.log(`[llms.txt] Generated 4 files in ${PUBLIC_DIR}:`);
  console.log(`  - llms.txt (${index.length} articles)`);
  console.log(`  - llms-zh.txt (${index.length} articles)`);
  console.log(`  - llms-full.txt (${articles.length} articles)`);
  console.log(`  - llms-full-zh.txt (${articles.length} articles)`);
}

generate().catch((err) => {
  console.error('[llms.txt] Failed to generate:', err);
  process.exit(1);
});

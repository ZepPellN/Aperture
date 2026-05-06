import { loadWikiIndex } from '@/lib/wiki-loader';

export const dynamic = 'force-static';

export async function GET() {
  const articles = await loadWikiIndex();
  const lines = [
    '# Aperture',
    '',
    '> 一个面向 AI Agent 的 Markdown-first 个人 Wiki 系统。',
    '> 将原始笔记、链接、摘录和日常日志转换为可浏览的知识图谱，保留来源出处、语义关联、演化历史，并为 AI 提供结构化 API。',
    '',
    '## 链接',
    '',
    '- [开源仓库](https://github.com/ZepPellN/Aperture)',
    '- [项目主页](https://github.com/ZepPellN/Aperture#readme)',
    '- [作者](https://x.com/plutozeppln)',
    '',
    '## 关于',
    '',
    'Aperture 为希望笔记产生复利的知识工作者而设计。',
    '不再把书签、摘录和日记分散在互不相通的工具里，',
    'Aperture 让所有内容保留在纯 Markdown 中，并将其转换为结构化的知识图谱。',
    '它为人类和 AI Agent 提供清晰的 API，用于阅读、导航和查询整个系统。',
    '知识工作与生活管理——任务、习惯、目标、周刊回顾——都在同一个文件优先的系统中完成。',
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

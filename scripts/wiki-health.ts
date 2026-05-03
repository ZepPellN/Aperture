import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { loadAllArticles, transformWikilinks, type WikiArticle } from '../lib/wiki-loader';

interface CliOptions {
  out?: string;
}

interface BrokenLink {
  from: WikiArticle;
  target: string;
  label: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out' && argv[i + 1]) {
      options.out = argv[i + 1];
      i += 1;
    }
  }

  return options;
}

function defaultOutputPath(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return join(process.cwd(), 'exports', `wiki-health-${stamp}.md`);
}

function normalizeSlug(slug: string): string {
  return slug.replace(/\\+$/g, '').split('#')[0].toLowerCase().replace(/\s+/g, '-');
}

function isSourceLikeTarget(target: string): boolean {
  return (
    target.startsWith('#') ||
    target.startsWith('../') ||
    target.startsWith('raw/') ||
    target.startsWith('outputs/') ||
    /^https?:\/\//.test(target)
  );
}

function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function row(article: WikiArticle, extra = ''): string {
  const suffix = extra ? ` — ${extra}` : '';
  return `- [[${article.slug}|${article.title}]]${suffix}`;
}

function renderSection(title: string, items: string[], empty = 'No issues found.'): string[] {
  return [
    `## ${title}`,
    '',
    ...(items.length > 0 ? items : [`- ${empty}`]),
    '',
  ];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const articles = await loadAllArticles();
  const articleByNormalizedSlug = new Map(articles.map((article) => [normalizeSlug(article.slug), article]));
  const incomingCounts = new Map<string, number>();
  const brokenLinks: BrokenLink[] = [];

  for (const article of articles) {
    const { links } = transformWikilinks(article.content);
    for (const link of links) {
      const normalizedTarget = normalizeSlug(link.to);
      if (!normalizedTarget || isSourceLikeTarget(link.to)) continue;

      const target = articleByNormalizedSlug.get(normalizedTarget);
      if (target) {
        incomingCounts.set(target.slug, (incomingCounts.get(target.slug) || 0) + 1);
      } else {
        brokenLinks.push({ from: article, target: normalizedTarget, label: link.label });
      }
    }
  }

  const thinPages = articles
    .filter((article) => article.wordCount < 180)
    .sort((a, b) => a.wordCount - b.wordCount)
    .slice(0, 30);
  const longPages = articles
    .filter((article) => article.wordCount > 2500)
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 30);
  const missingSources = articles
    .filter((article) => article.sources.length === 0)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, 50);
  const orphans = articles
    .filter((article) => (incomingCounts.get(article.slug) || 0) === 0)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, 50);
  const stalePages = articles
    .map((article) => ({ article, age: daysSince(article.lastModified) }))
    .filter((item): item is { article: WikiArticle; age: number } => item.age !== null && item.age > 120)
    .sort((a, b) => b.age - a.age)
    .slice(0, 50);

  const lines = [
    '---',
    'title: Wiki Health Report',
    `date: ${new Date().toISOString().slice(0, 10)}`,
    'status: report',
    '---',
    '',
    '# Wiki Health Report',
    '',
    '## Summary',
    '',
    `- Articles: ${articles.length}`,
    `- Broken wikilinks: ${brokenLinks.length}`,
    `- Thin pages under 180 words: ${thinPages.length}`,
    `- Long pages over 2500 words: ${longPages.length}`,
    `- Pages without sources: ${missingSources.length}`,
    `- Orphan pages: ${orphans.length}`,
    `- Pages older than 120 days: ${stalePages.length}`,
    '',
    ...renderSection(
      'Broken Wikilinks',
      brokenLinks
        .slice(0, 50)
        .map((link) => `- [[${link.from.slug}|${link.from.title}]] → \`${link.target}\` (${link.label})`)
    ),
    ...renderSection(
      'Thin Pages',
      thinPages.map((article) => row(article, `${article.wordCount} words`))
    ),
    ...renderSection(
      'Long Pages',
      longPages.map((article) => row(article, `${article.wordCount} words`))
    ),
    ...renderSection(
      'Pages Without Sources',
      missingSources.map((article) => row(article))
    ),
    ...renderSection(
      'Orphan Pages',
      orphans.map((article) => row(article))
    ),
    ...renderSection(
      'Stale Pages',
      stalePages.map(({ article, age }) => row(article, `${age} days old`))
    ),
  ];

  const outputPath = resolve(options.out || defaultOutputPath());
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, lines.join('\n'));
  console.log(`Wrote wiki health report to ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

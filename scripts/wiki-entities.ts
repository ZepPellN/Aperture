import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { loadAllArticles, transformWikilinks, type WikiArticle } from '../lib/wiki-loader';

interface CliOptions {
  out?: string;
  jsonOut?: string;
  minMentions: number;
}

interface MentionStats {
  article: WikiArticle;
  linked: number;
  unlinked: number;
}

interface EntitySeed {
  name: string;
  slug?: string;
  aliases: string[];
  kind: 'page' | 'candidate';
}

interface EntityRecord {
  name: string;
  slug?: string;
  kind: 'page' | 'candidate';
  aliases: string[];
  confidence: number;
  first_seen?: string;
  total_mentions: number;
  linked_mentions: number;
  unlinked_mentions: number;
  pages_with_mentions: number;
  mentioned_in: Array<{
    slug: string;
    title: string;
    linked: number;
    unlinked: number;
  }>;
  neighboring_entities: string[];
  suggested_links: Array<{
    from: string;
    title: string;
    mentions: number;
  }>;
}

const STOPWORDS = new Set([
  'App',
  'AI',
  'API',
  'CEO',
  'CLI',
  'CPU',
  'CSS',
  'CSV',
  'DNS',
  'Every',
  'GPU',
  'HTML',
  'HTTP',
  'JSON',
  'Level',
  'LLM',
  'MCP',
  'NLP',
  'PDF',
  'PR',
  'Pro',
  'Related',
  'README',
  'SDK',
  'Sources',
  'SQL',
  'UI',
  'URL',
  'UX',
  'XML',
]);

const GENERIC_PAGE_TITLES = new Set(['pattern', 'patterns']);

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { minMentions: 3 };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out' && argv[i + 1]) {
      options.out = argv[i + 1];
      i += 1;
    } else if (arg === '--json-out' && argv[i + 1]) {
      options.jsonOut = argv[i + 1];
      i += 1;
    } else if (arg === '--min-mentions' && argv[i + 1]) {
      options.minMentions = Number(argv[i + 1]);
      i += 1;
    }
  }

  return options;
}

function defaultOutputPath(extension: 'md' | 'json'): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return join(process.cwd(), 'exports', `wiki-entities-${stamp}.${extension}`);
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeSlug(value: string): string {
  return value.toLowerCase().replace(/\.md$/, '').replace(/\s+/g, '-');
}

function frontmatterAliases(article: WikiArticle): string[] {
  const value = article.frontmatter.aliases || article.frontmatter.alias;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return [value];
  return [];
}

function stripLinkedText(content: string): string {
  return content
    .replace(/\[\[[^\]]+\]\]/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/^#{1,6}\s+(sources?|related)\s*$/gim, ' ');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function countOccurrences(text: string, term: string): number {
  const trimmed = term.trim();
  if (trimmed.length < 2) return 0;

  const pattern = escapeRegExp(trimmed).replace(/\s+/g, '\\s+');
  const regex = hasCjk(trimmed)
    ? new RegExp(pattern, 'gi')
    : new RegExp(`(^|[^A-Za-z0-9])(${pattern})(?=$|[^A-Za-z0-9])`, 'gi');

  return Array.from(text.matchAll(regex)).length;
}

function linkedMentionsFor(article: WikiArticle, seed: EntitySeed): number {
  const { links } = transformWikilinks(article.content);
  const slug = seed.slug ? normalizeSlug(seed.slug) : undefined;
  const keys = new Set([seed.name, ...seed.aliases].map(normalizeKey));

  return links.filter((link) => {
    const target = normalizeSlug(link.to);
    if (slug && target === slug) return true;
    return keys.has(normalizeKey(link.label)) || keys.has(normalizeKey(link.to));
  }).length;
}

function mentionStats(seed: EntitySeed, articles: WikiArticle[]): MentionStats[] {
  const aliases = [seed.name, ...seed.aliases]
    .filter((alias, index, aliasList) => aliasList.findIndex((item) => normalizeKey(item) === normalizeKey(alias)) === index)
    .filter((alias) => !(seed.kind === 'page' && GENERIC_PAGE_TITLES.has(normalizeKey(alias))));

  return articles
    .map((article) => {
      const linked = linkedMentionsFor(article, seed);
      const text = stripLinkedText(article.content);
      const unlinked = aliases.reduce((sum, alias) => sum + countOccurrences(text, alias), 0);
      return { article, linked, unlinked };
    })
    .filter((item) => item.linked > 0 || item.unlinked > 0);
}

function confidenceFor(seed: EntitySeed, totalMentions: number, articleCount: number): number {
  if (seed.kind === 'page') {
    const aliasBoost = Math.min(seed.aliases.length * 0.03, 0.09);
    return Math.min(0.99, 0.72 + Math.min(articleCount, 8) * 0.025 + aliasBoost);
  }

  return Math.min(0.82, 0.36 + Math.min(totalMentions, 12) * 0.03 + Math.min(articleCount, 6) * 0.03);
}

function firstSeen(stats: MentionStats[]): string | undefined {
  return stats
    .map((item) => item.article.lastModified)
    .filter((date): date is string => Boolean(date))
    .sort()[0];
}

function candidateSeeds(articles: WikiArticle[], existingKeys: Set<string>, minMentions: number): EntitySeed[] {
  const counts = new Map<string, { name: string; count: number }>();
  const pattern = /\b(?:[A-Z][A-Za-z0-9+.-]{2,}|[A-Z]{2,})(?:\s+(?:[A-Z][A-Za-z0-9+.-]{2,}|[a-z][A-Za-z0-9+.-]{2,}))*\b/g;

  for (const article of articles) {
    const text = stripLinkedText(article.content);
    for (const match of text.matchAll(pattern)) {
      const name = match[0].trim().replace(/\s+/g, ' ');
      const key = normalizeKey(name);
      if (name.length < 3 || STOPWORDS.has(name) || existingKeys.has(key)) continue;

      const existing = counts.get(key);
      if (existing) {
        counts.set(key, { name: existing.name.length >= name.length ? existing.name : name, count: existing.count + 1 });
      } else {
        counts.set(key, { name, count: 1 });
      }
    }
  }

  return Array.from(counts.values())
    .filter((item) => item.count >= minMentions)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 80)
    .map(({ name }) => ({ name, aliases: [], kind: 'candidate' }));
}

function neighboringEntities(stats: MentionStats[], seed: EntitySeed, articleBySlug: Map<string, WikiArticle>): string[] {
  const counts = new Map<string, number>();

  for (const item of stats) {
    const { links } = transformWikilinks(item.article.content);
    for (const link of links) {
      const slug = normalizeSlug(link.to);
      const linkedArticle = articleBySlug.get(slug);
      if (!linkedArticle || slug === seed.slug) continue;
      counts.set(linkedArticle.title, (counts.get(linkedArticle.title) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([name]) => name);
}

function buildEntityRecord(seed: EntitySeed, articles: WikiArticle[], articleBySlug: Map<string, WikiArticle>): EntityRecord | null {
  const stats = mentionStats(seed, articles);
  const linkedMentions = stats.reduce((sum, item) => sum + item.linked, 0);
  const unlinkedMentions = stats.reduce((sum, item) => sum + item.unlinked, 0);
  const totalMentions = linkedMentions + unlinkedMentions;

  if (totalMentions === 0) return null;

  return {
    name: seed.name,
    slug: seed.slug,
    kind: seed.kind,
    aliases: seed.aliases,
    confidence: Number(confidenceFor(seed, totalMentions, stats.length).toFixed(2)),
    first_seen: firstSeen(stats),
    total_mentions: totalMentions,
    linked_mentions: linkedMentions,
    unlinked_mentions: unlinkedMentions,
    pages_with_mentions: stats.length,
    mentioned_in: stats
      .sort((a, b) => b.linked + b.unlinked - (a.linked + a.unlinked) || a.article.slug.localeCompare(b.article.slug))
      .slice(0, 20)
      .map((item) => ({
        slug: item.article.slug,
        title: item.article.title,
        linked: item.linked,
        unlinked: item.unlinked,
      })),
    neighboring_entities: neighboringEntities(stats, seed, articleBySlug),
    suggested_links: stats
      .filter((item) => item.unlinked > 0 && item.linked === 0 && item.article.slug !== seed.slug)
      .sort((a, b) => b.unlinked - a.unlinked || a.article.slug.localeCompare(b.article.slug))
      .slice(0, 10)
      .map((item) => ({
        from: item.article.slug,
        title: item.article.title,
        mentions: item.unlinked,
      })),
  };
}

function renderReport(records: EntityRecord[], articles: WikiArticle[]): string {
  const pageEntities = records.filter((record) => record.kind === 'page');
  const candidateEntities = records.filter((record) => record.kind === 'candidate');
  const linkSuggestions = pageEntities
    .filter((record) => record.suggested_links.length > 0)
    .sort((a, b) => b.unlinked_mentions - a.unlinked_mentions || a.name.localeCompare(b.name))
    .slice(0, 30);

  return [
    '---',
    'title: Wiki Entity Report',
    `date: ${new Date().toISOString().slice(0, 10)}`,
    'status: report',
    '---',
    '',
    '# Wiki Entity Report',
    '',
    '## Summary',
    '',
    `- Articles scanned: ${articles.length}`,
    `- Page entities: ${pageEntities.length}`,
    `- Candidate entities: ${candidateEntities.length}`,
    `- Existing pages with unlinked mention suggestions: ${linkSuggestions.length}`,
    '',
    '## Suggested Wikilinks',
    '',
    ...(linkSuggestions.length > 0
      ? linkSuggestions.flatMap((record) => [
          `### [[${record.slug}|${record.name}]]`,
          '',
          `- Confidence: ${record.confidence}`,
          `- Unlinked mentions: ${record.unlinked_mentions}`,
          `- Aliases: ${record.aliases.length > 0 ? record.aliases.join(', ') : 'None'}`,
          '',
          ...record.suggested_links.map((suggestion) => `- [[${suggestion.from}|${suggestion.title}]] — ${suggestion.mentions} mentions`),
          '',
        ])
      : ['- No obvious unlinked page mentions found.', '']),
    '## New Entity Candidates',
    '',
    ...(candidateEntities.length > 0
      ? candidateEntities
          .sort((a, b) => b.total_mentions - a.total_mentions || a.name.localeCompare(b.name))
          .slice(0, 40)
          .map(
            (record) =>
              `- ${record.name} — ${record.total_mentions} mentions, confidence ${record.confidence}, seen in ${record.pages_with_mentions} pages`
          )
      : ['- No frequent new candidates found.']),
    '',
    '## Highest Confidence Entities',
    '',
    ...records
      .sort((a, b) => b.confidence - a.confidence || b.total_mentions - a.total_mentions || a.name.localeCompare(b.name))
      .slice(0, 40)
      .map((record) => {
        const page = record.slug ? `[[${record.slug}|${record.name}]]` : record.name;
        return `- ${page} — confidence ${record.confidence}, ${record.total_mentions} mentions`;
      }),
    '',
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const articles = await loadAllArticles();
  const articleBySlug = new Map(articles.map((article) => [article.slug, article]));
  const pageSeeds: EntitySeed[] = articles.map((article) => ({
    name: article.title,
    slug: article.slug,
    aliases: frontmatterAliases(article),
    kind: 'page',
  }));
  const existingKeys = new Set(pageSeeds.flatMap((seed) => [seed.name, ...seed.aliases]).map(normalizeKey));
  const seeds = [...pageSeeds, ...candidateSeeds(articles, existingKeys, options.minMentions)];
  const records = seeds
    .map((seed) => buildEntityRecord(seed, articles, articleBySlug))
    .filter((record): record is EntityRecord => Boolean(record))
    .sort((a, b) => b.total_mentions - a.total_mentions || a.name.localeCompare(b.name));
  const outputPath = resolve(options.out || defaultOutputPath('md'));
  const jsonPath = resolve(options.jsonOut || defaultOutputPath('json'));

  mkdirSync(dirname(outputPath), { recursive: true });
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(outputPath, renderReport(records, articles));
  writeFileSync(jsonPath, `${JSON.stringify({ generated_at: new Date().toISOString(), entities: records }, null, 2)}\n`);
  console.log(`Wrote wiki entity report to ${outputPath}`);
  console.log(`Wrote wiki entity JSON to ${jsonPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

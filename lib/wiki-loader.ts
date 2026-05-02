import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, relative, basename, dirname } from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';

export interface WikiArticle {
  slug: string;
  category: string;
  title: string;
  content: string;
  html: string;
  frontmatter: Record<string, unknown>;
  sources: WikiSource[];
  evolution: WikiEvolutionEvent[];
  readingTime: number;
  wordCount: number;
  lastModified?: string;
}

export interface WikiIndexEntry {
  slug: string;
  category: string;
  title: string;
  summary?: string;
  updated?: string;
}

export interface WikiLink {
  from: string;
  to: string;
  label: string;
}

export interface WikiSource {
  path: string;
  label: string;
  href?: string;
  origin: 'body' | 'absorb_log' | 'frontmatter' | 'contribution';
  contribution?: SourceContributionLevel;
  sections?: string[];
  summary?: string;
}

export type SourceContributionLevel = 'high' | 'medium' | 'low' | 'unknown';

interface SourceContribution {
  source: string;
  contribution: SourceContributionLevel;
  sections: string[];
  summary?: string;
}

export interface WikiEvolutionRef {
  slug: string;
  title?: string;
}

export interface WikiEvolutionEvent {
  date: string;
  type: 'created' | 'absorbed' | 'merged' | 'split' | 'renamed' | 'refined' | 'linked';
  summary: string;
  title?: string;
  from?: WikiEvolutionRef[];
  to?: WikiEvolutionRef[];
  sources?: string[];
}

const WIKI_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'wiki')
  : join(process.cwd(), 'reference', 'wiki');

const SKIP_FILES = new Set(['index.md', 'log.md']);

function toDateString(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val);
}

export function getWikiDir(): string {
  return WIKI_DIR;
}

export function getWikiFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getWikiFiles(fullPath));
    } else if (entry.name.endsWith('.md') && !SKIP_FILES.has(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

export function filePathToSlug(filePath: string): string {
  const rel = relative(WIKI_DIR, filePath);
  return rel.replace(/\.md$/, '');
}

export function slugToFilePath(slug: string): string {
  return join(WIKI_DIR, `${slug}.md`);
}

export function extractSummary(content: string, maxLen = 160): string {
  const text = content
    .replace(/#+\s+/g, '')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, '$2')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen).trim() + '...' : text;
}

export function transformWikilinks(markdown: string): { html: string; links: WikiLink[] } {
  const links: WikiLink[] = [];

  const html = markdown.replace(/\[\[([^\]]+)\]\]/g, (_match, link: string) => {
    const parts = link.split('|');
    const targetRaw = parts[0].trim();
    const label = parts.length > 1 ? parts[1].trim() : targetRaw;
    const targetSlug = targetRaw.toLowerCase().replace(/\s+/g, '-');
    const from = ''; // filled in by caller if needed
    links.push({ from, to: targetSlug, label });
    return `<a href="/wiki/${targetSlug}" class="wikilink">${label}</a>`;
  });

  return { html, links };
}

function normalizeSourcePath(path: string): string {
  return path.replace(/^wiki\//, '').replace(/\.md$/, '');
}

function sourceHref(path: string): string | undefined {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = normalizeSourcePath(path);
  if (path.startsWith('wiki/')) return `/wiki/${normalized}`;
  if (!path.startsWith('raw/')) return `/wiki/${normalized}`;
  return undefined;
}

function findSourcesSection(content: string): { section: string; start: number; end: number } | null {
  const headingPattern = /^##\s+Sources?\s*$/im;
  const match = headingPattern.exec(content);
  if (!match) return null;

  const start = match.index;
  const afterHeading = start + match[0].length;
  const rest = content.slice(afterHeading);
  const nextHeading = /\n#{1,6}\s+\S/.exec(rest);
  const end = nextHeading ? afterHeading + nextHeading.index : content.length;

  return {
    section: content.slice(afterHeading, end),
    start,
    end,
  };
}

export function stripSourcesSection(content: string): string {
  const sourcesSection = findSourcesSection(content);
  if (!sourcesSection) return content;
  return `${content.slice(0, sourcesSection.start).trimEnd()}\n${content.slice(sourcesSection.end).trimStart()}`.trim();
}

export function extractSourcesFromContent(content: string): WikiSource[] {
  const sourcesSection = findSourcesSection(content);
  if (!sourcesSection) return [];

  const sources: WikiSource[] = [];
  const seen = new Set<string>();
  const section = sourcesSection.section;

  const wikilinkPattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  for (const match of section.matchAll(wikilinkPattern)) {
    const path = match[1].trim();
    const label = (match[2] || match[1]).trim();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    sources.push({
      path,
      label,
      href: sourceHref(path),
      origin: 'body',
    });
  }

  const markdownLinkPattern = /\[([^\]]+)\]\(([^\)]+)\)/g;
  for (const match of section.matchAll(markdownLinkPattern)) {
    const label = match[1].trim();
    const path = match[2].trim();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    sources.push({
      path,
      label,
      href: sourceHref(path),
      origin: 'body',
    });
  }

  return sources;
}

function normalizeWikiPageRef(ref: string): string {
  return ref.replace(/^wiki\//, '').replace(/\.md$/, '');
}

function loadAbsorbLogSources(slug: string): WikiSource[] {
  const logPath = join(WIKI_DIR, '_absorb_log.json');
  if (!existsSync(logPath)) return [];

  try {
    const raw = readFileSync(logPath, 'utf-8');
    const log = JSON.parse(raw) as Record<string, unknown>;
    const sources: WikiSource[] = [];
    const seen = new Set<string>();

    for (const [sourcePath, entry] of Object.entries(log)) {
      if (!entry || typeof entry !== 'object' || !('wiki_pages' in entry)) continue;
      const wikiPages = (entry as { wiki_pages?: unknown }).wiki_pages;
      if (!Array.isArray(wikiPages)) continue;

      const touchesSlug = wikiPages
        .map((page: unknown) => normalizeWikiPageRef(String(page)))
        .includes(slug);

      if (!touchesSlug || seen.has(sourcePath)) continue;
      seen.add(sourcePath);
      sources.push({
        path: sourcePath,
        label: basename(sourcePath).replace(/\.md$/, ''),
        href: sourceHref(sourcePath),
        origin: 'absorb_log',
      });
    }

    return sources;
  } catch {
    return [];
  }
}

function sourcesFromFrontmatter(value: unknown): WikiSource[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): WikiSource | null => {
      if (typeof item === 'string') {
        return {
          path: item,
          label: basename(item).replace(/\.md$/, ''),
          href: sourceHref(item),
          origin: 'frontmatter',
        };
      }

      if (item && typeof item === 'object' && 'path' in item) {
        const path = String((item as { path: unknown }).path);
        return {
          path,
          label:
            'label' in item
              ? String((item as { label: unknown }).label)
              : basename(path).replace(/\.md$/, ''),
          href: sourceHref(path),
          origin: 'frontmatter',
        };
      }

      return null;
    })
    .filter((source): source is WikiSource => source !== null);
}

function parseContributionLevel(value: unknown): SourceContributionLevel {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'unknown';
}

function loadSourceContributions(slug: string): SourceContribution[] {
  const path = join(WIKI_DIR, '_source_contributions.json');
  if (!existsSync(path)) return [];

  try {
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    const entries = data[slug];
    if (!Array.isArray(entries)) return [];

    return entries
      .map((entry): SourceContribution | null => {
        if (!entry || typeof entry !== 'object' || !('source' in entry)) return null;
        const rawEntry = entry as {
          source?: unknown;
          contribution?: unknown;
          sections?: unknown;
          summary?: unknown;
        };
        const source = typeof rawEntry.source === 'string' ? rawEntry.source : '';
        if (!source) return null;

        return {
          source,
          contribution: parseContributionLevel(rawEntry.contribution),
          sections: Array.isArray(rawEntry.sections)
            ? rawEntry.sections.map(String).filter(Boolean)
            : [],
          summary: typeof rawEntry.summary === 'string' ? rawEntry.summary : undefined,
        };
      })
      .filter((entry): entry is SourceContribution => entry !== null);
  } catch {
    return [];
  }
}

function sourcesFromContributions(contributions: SourceContribution[]): WikiSource[] {
  return contributions.map((entry) => ({
    path: entry.source,
    label: basename(entry.source).replace(/\.md$/, ''),
    href: sourceHref(entry.source),
    origin: 'contribution',
    contribution: entry.contribution,
    sections: entry.sections,
    summary: entry.summary,
  }));
}

function parseEvolutionRefs(value: unknown): WikiEvolutionRef[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const refs = value
    .map((item): WikiEvolutionRef | null => {
      if (typeof item === 'string') {
        const slug = normalizeWikiPageRef(item);
        return slug ? { slug } : null;
      }

      if (!item || typeof item !== 'object' || !('slug' in item)) return null;
      const raw = item as { slug?: unknown; title?: unknown };
      const slug = typeof raw.slug === 'string' ? normalizeWikiPageRef(raw.slug) : '';
      if (!slug) return null;

      return {
        slug,
        title: typeof raw.title === 'string' ? raw.title : undefined,
      };
    })
    .filter((ref): ref is WikiEvolutionRef => ref !== null);

  return refs.length > 0 ? refs : undefined;
}

function loadEvolution(slug: string): WikiEvolutionEvent[] {
  const path = join(WIKI_DIR, '_evolution.json');
  if (!existsSync(path)) return [];

  try {
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    const entries = data[slug];
    if (!Array.isArray(entries)) return [];

    return entries
      .map((entry): WikiEvolutionEvent | null => {
        if (!entry || typeof entry !== 'object') return null;
        const rawEntry = entry as {
          date?: unknown;
          type?: unknown;
          summary?: unknown;
          title?: unknown;
          from?: unknown;
          to?: unknown;
          sources?: unknown;
        };
        const date = typeof rawEntry.date === 'string' ? rawEntry.date : '';
        const summary = typeof rawEntry.summary === 'string' ? rawEntry.summary : '';
        if (!date || !summary) return null;

        return {
          date,
          type: parseEvolutionType(rawEntry.type),
          summary,
          title: typeof rawEntry.title === 'string' ? rawEntry.title : undefined,
          from: parseEvolutionRefs(rawEntry.from),
          to: parseEvolutionRefs(rawEntry.to),
          sources: Array.isArray(rawEntry.sources)
            ? rawEntry.sources.map(String).filter(Boolean)
            : undefined,
        };
      })
      .filter((event): event is WikiEvolutionEvent => event !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

function parseEvolutionType(value: unknown): WikiEvolutionEvent['type'] {
  if (
    value === 'created' ||
    value === 'absorbed' ||
    value === 'merged' ||
    value === 'split' ||
    value === 'renamed' ||
    value === 'refined' ||
    value === 'linked'
  ) {
    return value;
  }

  return 'refined';
}

function dedupeSources(sources: WikiSource[]): WikiSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.path;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enrichSourcesWithContributions(
  sources: WikiSource[],
  contributions: SourceContribution[]
): WikiSource[] {
  const contributionBySource = new Map(contributions.map((entry) => [entry.source, entry]));
  const rank: Record<SourceContributionLevel, number> = {
    high: 0,
    medium: 1,
    low: 2,
    unknown: 3,
  };

  return sources
    .map((source, index) => {
      const contribution = contributionBySource.get(source.path);
      return {
        index,
        source: {
          ...source,
          contribution: contribution?.contribution ?? source.contribution,
          sections: contribution?.sections ?? source.sections,
          summary: contribution?.summary ?? source.summary,
        },
      };
    })
    .sort((a, b) => {
      const aRank = rank[a.source.contribution ?? 'unknown'];
      const bRank = rank[b.source.contribution ?? 'unknown'];
      return aRank === bRank ? a.index - b.index : aRank - bRank;
    })
    .map((entry) => entry.source);
}

export async function compileMarkdown(content: string): Promise<string> {
  const { html: transformed } = transformWikilinks(content);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(transformed);

  return String(result);
}

export function estimateReadingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 250));
}

export async function loadArticle(slug: string): Promise<WikiArticle | null> {
  const filePath = slugToFilePath(slug);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, 'utf-8');
  let parsed: { data: Record<string, unknown>; content: string };

  try {
    parsed = matter(raw);
  } catch {
    // Fallback: treat entire file as content if frontmatter parsing fails
    console.warn(`[Aperture] Failed to parse frontmatter for ${slug}, using fallback.`);
    parsed = { data: {}, content: raw };
  }

  const content = parsed.content;
  const sourceContributions = loadSourceContributions(slug);
  const sources = enrichSourcesWithContributions(dedupeSources([
    ...extractSourcesFromContent(content),
    ...loadAbsorbLogSources(slug),
    ...sourcesFromFrontmatter(parsed.data.sources),
    ...sourcesFromContributions(sourceContributions),
  ]), sourceContributions);
  const evolution = loadEvolution(slug);
  const displayContent = stripSourcesSection(content);
  const html = await compileMarkdown(displayContent);
  const words = displayContent.split(/\s+/).filter(Boolean).length;
  const category = dirname(slug) || 'uncategorized';
  const title = typeof parsed.data.title === 'string'
    ? parsed.data.title
    : basename(slug).replace(/-/g, ' ');

  return {
    slug,
    category,
    title,
    content,
    html,
    frontmatter: parsed.data,
    sources,
    evolution,
    readingTime: estimateReadingTime(words),
    wordCount: words,
    lastModified: toDateString(parsed.data.updated || parsed.data.date),
  };
}

export async function loadAllArticles(): Promise<WikiArticle[]> {
  const files = getWikiFiles(WIKI_DIR);
  const articles: WikiArticle[] = [];

  for (const file of files) {
    const slug = filePathToSlug(file);
    const article = await loadArticle(slug);
    if (article) articles.push(article);
  }

  return articles;
}

export async function loadWikiIndex(): Promise<WikiIndexEntry[]> {
  const articles = await loadAllArticles();
  return articles.map((a) => ({
    slug: a.slug,
    category: a.category,
    title: a.title,
    summary: extractSummary(a.content),
    updated: a.lastModified,
  }));
}

export function getBacklinks(articles: WikiArticle[], targetSlug: string): WikiLink[] {
  const seen = new Set<string>();
  const backlinks: WikiLink[] = [];

  for (const article of articles) {
    const { links } = transformWikilinks(article.content);
    for (const link of links) {
      if (link.to === targetSlug.toLowerCase().replace(/\s+/g, '-')) {
        if (!seen.has(article.slug)) {
          seen.add(article.slug);
          backlinks.push({ from: article.slug, to: targetSlug, label: article.title });
        }
        break;
      }
    }
  }

  return backlinks;
}

export function getStats(articles: WikiArticle[]) {
  const total = articles.length;
  let totalLinks = 0;
  const orphanSlugs = new Set(articles.map((a) => a.slug));
  const categories = new Set<string>();

  for (const article of articles) {
    categories.add(article.category);
    const { links } = transformWikilinks(article.content);
    totalLinks += links.length;
    if (links.length > 0) {
      orphanSlugs.delete(article.slug);
    }
    for (const link of links) {
      orphanSlugs.delete(link.to);
    }
  }

  return {
    total,
    totalLinks,
    orphanCount: orphanSlugs.size,
    categoryCount: categories.size,
    orphans: Array.from(orphanSlugs),
  };
}

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
  origin: 'body' | 'absorb_log' | 'frontmatter';
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

function dedupeSources(sources: WikiSource[]): WikiSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.path;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const sources = dedupeSources([
    ...extractSourcesFromContent(content),
    ...loadAbsorbLogSources(slug),
    ...sourcesFromFrontmatter(parsed.data.sources),
  ]);
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

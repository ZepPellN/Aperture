import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, basename, extname, dirname } from 'path';
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
  frontmatter: Record<string, any>;
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

const WIKI_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'wiki')
  : join(process.cwd(), '..', 'Obsidian Vault', 'wiki');

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
  let parsed: { data: Record<string, any>; content: string };

  try {
    parsed = matter(raw);
  } catch (err) {
    // Fallback: treat entire file as content if frontmatter parsing fails
    console.warn(`[Aperture] Failed to parse frontmatter for ${slug}, using fallback.`);
    parsed = { data: {}, content: raw };
  }

  const content = parsed.content;
  const html = await compileMarkdown(content);
  const words = content.split(/\s+/).length;
  const category = dirname(slug) || 'uncategorized';

  return {
    slug,
    category,
    title: parsed.data.title || basename(slug).replace(/-/g, ' '),
    content,
    html,
    frontmatter: parsed.data,
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
  const backlinks: WikiLink[] = [];

  for (const article of articles) {
    const { links } = transformWikilinks(article.content);
    for (const link of links) {
      if (link.to === targetSlug.toLowerCase().replace(/\s+/g, '-')) {
        backlinks.push({ from: article.slug, to: targetSlug, label: article.title });
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

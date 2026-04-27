import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const WIKI_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'wiki')
  : join(process.cwd(), 'reference', 'wiki');

const OUTPUT_DIR = process.env.WIKI_ROOT
  ? join(process.env.WIKI_ROOT, 'outputs', 'insights')
  : join(process.cwd(), 'outputs', 'insights');

interface RetrievedDoc {
  slug: string;
  title: string;
  category: string;
  score: number;
  content: string;
  date?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function toDateString(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val);
}

function runQmdQuery(question: string, limit = 20): Array<{ file: string; title: string; score: number }> {
  try {
    const result = execSync(
      `qmd query ${JSON.stringify(question)} -n ${limit} --json -c vault`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    const parsed = JSON.parse(result);
    return parsed.map((r: any) => ({
      file: r.file,
      title: r.title,
      score: r.score,
    }));
  } catch (err) {
    console.warn('[insight] qmd query failed, falling back to empty results:', (err as Error).message);
    return [];
  }
}

function loadWikiArticle(slug: string): RetrievedDoc | null {
  const filePath = join(WIKI_DIR, `${slug}.md`);
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);
    return {
      slug,
      title: parsed.data.title || slug,
      category: parsed.data.section || slug.split('/')[0] || 'uncategorized',
      score: 0,
      content: parsed.content.slice(0, 2000),
      date: toDateString(parsed.data.updated || parsed.data.date || parsed.data.created),
    };
  } catch {
    return null;
  }
}

function extractExcerpt(content: string, maxLen = 400): string {
  const text = content
    .replace(/#+\s+/g, '')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, '$2')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen).trim() + '...' : text;
}

function generateReport(question: string, docs: RetrievedDoc[]): string {
  // Sort by date if available
  const dated = docs.filter((d) => d.date);
  const undated = docs.filter((d) => !d.date);
  dated.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const sorted = [...dated, ...undated];

  // Group by category
  const byCategory: Record<string, RetrievedDoc[]> = {};
  for (const doc of sorted) {
    byCategory[doc.category] = byCategory[doc.category] || [];
    byCategory[doc.category].push(doc);
  }

  const now = new Date().toISOString().split('T')[0];
  const filename = `${now}-${slugify(question)}.md`;

  let report = `---
title: "Insight: ${question.replace(/"/g, '\\"')}"
generated: ${now}
source_count: ${docs.length}
question: "${question.replace(/"/g, '\\"')}"
---

# Insight Report: ${question}

**Generated:** ${now}
**Sources:** ${docs.length} articles
**Question:** ${question}

---

## Executive Summary

> This report synthesizes ${docs.length} relevant notes from your wiki. Review the timeline and themes below, or feed this document to your AI assistant for deeper analysis.

---

`;

  // Timeline section
  if (dated.length > 0) {
    report += `## Timeline\n\n`;
    for (const doc of dated) {
      report += `### ${doc.date} — [${doc.title}](/wiki/${doc.slug})\n\n`;
      report += `${extractExcerpt(doc.content)}\n\n`;
    }
    report += `---\n\n`;
  }

  // Themes by category
  report += `## Themes by Category\n\n`;
  for (const [category, catDocs] of Object.entries(byCategory)) {
    report += `### ${category.replace(/-/g, ' ')}\n\n`;
    for (const doc of catDocs) {
      report += `- **[${doc.title}](/wiki/${doc.slug})**`;
      if (doc.date) report += ` (${doc.date})`;
      report += ` — ${extractExcerpt(doc.content, 200)}\n\n`;
    }
  }

  report += `---\n\n`;

  // Source index
  report += `## Source Index\n\n`;
  for (const doc of sorted) {
    report += `${sorted.indexOf(doc) + 1}. [${doc.title}](/wiki/${doc.slug})`;
    if (doc.date) report += ` — ${doc.date}`;
    report += `\n`;
  }

  report += `\n---\n\n`;

  // LLM prompt section
  report += `## AI Analysis Prompt\n\nCopy the following to your AI assistant for deeper insight generation:\n\n\`\`\`markdown\nI have a personal wiki with ${docs.length} notes relevant to this question:\n\n**Question:** ${question}\n\nBelow are excerpts from my notes organized by theme and timeline. Please analyze:\n1. How my thinking on this topic has evolved over time\n2. Contradictions or tensions between different notes\n3. Gaps in my understanding\n4. A concise synthesis of my current position\n\n`;

  for (const doc of sorted.slice(0, 10)) {
    report += `## ${doc.title}\n${extractExcerpt(doc.content, 600)}\n\n`;
  }

  report += `\`\`\`\n`;

  return report;
}

function main() {
  const question = process.argv[2];
  if (!question) {
    console.log('Usage: npx tsx scripts/insight-report.ts "your question here"');
    process.exit(1);
  }

  console.log(`[insight] Question: ${question}`);
  console.log('[insight] Querying qmd...');

  const qmdResults = runQmdQuery(question, 20);
  console.log(`[insight] qmd returned ${qmdResults.length} results`);

  // Filter to wiki articles only and deduplicate
  const seen = new Set<string>();
  const docs: RetrievedDoc[] = [];

  for (const result of qmdResults) {
    // qmd file paths look like qmd://vault/wiki/... or just wiki/...
    const pathMatch = result.file.match(/wiki\/(.*\.md)$/);
    if (!pathMatch) continue;

    const slug = pathMatch[1].replace(/\.md$/, '');
    if (seen.has(slug)) continue;
    seen.add(slug);

    const article = loadWikiArticle(slug);
    if (article) {
      article.score = result.score;
      docs.push(article);
    }
  }

  console.log(`[insight] Loaded ${docs.length} wiki articles`);

  if (docs.length === 0) {
    console.log('[insight] No relevant articles found.');
    process.exit(0);
  }

  const report = generateReport(question, docs);

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filename = `${new Date().toISOString().split('T')[0]}-${slugify(question)}.md`;
  const outputPath = join(OUTPUT_DIR, filename);
  writeFileSync(outputPath, report);

  console.log(`[insight] Report written to: ${outputPath}`);
  console.log(`[insight] Sources: ${docs.length} articles`);
}

main();

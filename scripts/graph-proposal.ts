import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { buildGraph } from '../lib/graph-builder';
import { getNeighborsFor } from '../lib/semantic-neighbors';
import { loadClusters } from '../lib/semantic-clusters';
import { loadAllArticles, transformWikilinks, type WikiArticle } from '../lib/wiki-loader';

interface CliOptions {
  focus?: string;
  cluster?: number;
  out?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--focus' && argv[i + 1]) {
      options.focus = argv[i + 1];
      i += 1;
    } else if (arg === '--cluster' && argv[i + 1]) {
      options.cluster = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--out' && argv[i + 1]) {
      options.out = argv[i + 1];
      i += 1;
    }
  }

  return options;
}

function slugTitle(articleBySlug: Map<string, WikiArticle>, slug: string): string {
  const article = articleBySlug.get(slug);
  return article ? `${article.title} (${slug})` : slug;
}

function defaultOutputPath(kind: 'focus' | 'cluster', id: string): string {
  const safeId = id.replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '');
  const stamp = new Date().toISOString().slice(0, 10);
  return join(process.cwd(), 'exports', 'graph-research', `${stamp}-${kind}-${safeId}.md`);
}

function outgoingSlugs(article: WikiArticle, articleBySlug: Map<string, WikiArticle>): string[] {
  const { links } = transformWikilinks(article.content);
  const normalized = new Map(
    Array.from(articleBySlug.keys()).map(
      (slug): [string, string] => [slug.toLowerCase().replace(/\s+/g, '-'), slug]
    )
  );

  return Array.from(
    new Set(
      links
        .map((link) => normalized.get(link.to))
        .filter((slug): slug is string => Boolean(slug))
    )
  ).sort();
}

function backlinksFor(slug: string, articles: WikiArticle[], articleBySlug: Map<string, WikiArticle>): string[] {
  return articles
    .filter((article) => outgoingSlugs(article, articleBySlug).includes(slug))
    .map((article) => article.slug)
    .sort();
}

function renderFocusProposal(
  focus: string,
  articles: WikiArticle[],
  articleBySlug: Map<string, WikiArticle>
): string {
  const article = articleBySlug.get(focus);
  if (!article) throw new Error(`Focus article not found: ${focus}`);

  const outgoing = outgoingSlugs(article, articleBySlug);
  const incoming = backlinksFor(focus, articles, articleBySlug);
  const semantic = getNeighborsFor(focus)
    .filter((neighbor) => articleBySlug.has(neighbor.slug))
    .slice(0, 10);

  return [
    '---',
    `title: Graph Research Proposal — ${article.title}`,
    `date: ${new Date().toISOString().slice(0, 10)}`,
    'status: proposal',
    `focus: ${focus}`,
    '---',
    '',
    `# Graph Research Proposal — ${article.title}`,
    '',
    '## Focus',
    '',
    `- Page: [[${focus}|${article.title}]]`,
    `- Category: ${article.category}`,
    `- Sources: ${article.sources.length}`,
    `- Evolution events: ${article.evolution.length}`,
    '',
    '## Graph Evidence',
    '',
    '### Outgoing Links',
    '',
    ...(outgoing.length > 0
      ? outgoing.map((slug) => `- [[${slug}|${slugTitle(articleBySlug, slug)}]]`)
      : ['- None found.']),
    '',
    '### Backlinks',
    '',
    ...(incoming.length > 0
      ? incoming.map((slug) => `- [[${slug}|${slugTitle(articleBySlug, slug)}]]`)
      : ['- None found.']),
    '',
    '### Semantic Neighbors',
    '',
    ...(semantic.length > 0
      ? semantic.map(
          (neighbor) =>
            `- [[${neighbor.slug}|${slugTitle(articleBySlug, neighbor.slug)}]] — score ${neighbor.score.toFixed(3)}`
        )
      : ['- None found.']),
    '',
    '## Suggested Triage Questions',
    '',
    '- Should any backlink become an explicit section in the focus page?',
    '- Do semantic neighbors reveal a missing bridge page or duplicated concept?',
    '- Are there source contributions or evolution events missing from this page?',
    '',
    '## Suggested Write Targets',
    '',
    `- [[${focus}|${article.title}]]`,
    ...semantic.slice(0, 3).map((neighbor) => `- [[${neighbor.slug}|${slugTitle(articleBySlug, neighbor.slug)}]]`),
    '',
  ].join('\n');
}

function renderClusterProposal(
  clusterId: number,
  articles: WikiArticle[],
  articleBySlug: Map<string, WikiArticle>
): string {
  const cluster = loadClusters().clusters.find((item) => item.id === clusterId);
  if (!cluster) throw new Error(`Cluster not found: ${clusterId}`);

  const members = Array.from(new Set(cluster.members))
    .filter((slug) => articleBySlug.has(slug))
    .sort();
  const graph = buildGraph(articles);
  const memberSet = new Set(members);
  const internalEdges = graph.edges.filter((edge) => memberSet.has(edge.source) && memberSet.has(edge.target));
  const bridgeEdges = graph.edges.filter(
    (edge) => memberSet.has(edge.source) !== memberSet.has(edge.target)
  );
  const categories = new Map<string, number>();

  for (const slug of members) {
    const category = articleBySlug.get(slug)?.category || 'uncategorized';
    categories.set(category, (categories.get(category) || 0) + 1);
  }

  const categoryLines = Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `- ${category}: ${count}`);

  return [
    '---',
    `title: Graph Cluster Proposal — ${clusterId}`,
    `date: ${new Date().toISOString().slice(0, 10)}`,
    'status: proposal',
    `cluster: ${clusterId}`,
    '---',
    '',
    `# Graph Cluster Proposal — ${clusterId}`,
    '',
    '## Cluster Shape',
    '',
    `- Members: ${members.length}`,
    `- Internal graph edges: ${internalEdges.length}`,
    `- Bridge edges: ${bridgeEdges.length}`,
    `- Centroid: ${cluster.centroidX.toFixed(2)}, ${cluster.centroidY.toFixed(2)}`,
    '',
    '## Dominant Categories',
    '',
    ...categoryLines,
    '',
    '## Representative Pages',
    '',
    ...members.slice(0, 20).map((slug) => `- [[${slug}|${slugTitle(articleBySlug, slug)}]]`),
    '',
    '## Bridge Candidates',
    '',
    ...bridgeEdges.slice(0, 20).map((edge) => {
      const externalSlug = memberSet.has(edge.source) ? edge.target : edge.source;
      const internalSlug = memberSet.has(edge.source) ? edge.source : edge.target;
      return `- [[${internalSlug}|${slugTitle(articleBySlug, internalSlug)}]] ↔ [[${externalSlug}|${slugTitle(articleBySlug, externalSlug)}]]`;
    }),
    ...(bridgeEdges.length === 0 ? ['- None found.'] : []),
    '',
    '## Suggested Triage Questions',
    '',
    '- Is this cluster a coherent topic, or should it split into smaller pages?',
    '- Which bridge candidate should become an explicit wikilink or overview section?',
    '- Are there duplicate pages that should merge before this cluster grows further?',
    '',
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.focus && options.cluster === undefined) {
    throw new Error('Use --focus <slug> or --cluster <id>.');
  }

  const articles = await loadAllArticles();
  const articleBySlug = new Map(articles.map((article) => [article.slug, article]));
  const body =
    options.focus !== undefined
      ? renderFocusProposal(options.focus, articles, articleBySlug)
      : renderClusterProposal(options.cluster as number, articles, articleBySlug);
  const outputPath = resolve(
    options.out ||
      (options.focus
        ? defaultOutputPath('focus', options.focus)
        : defaultOutputPath('cluster', String(options.cluster)))
  );

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, body);
  console.log(`Wrote graph research proposal to ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

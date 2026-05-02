import type { WikiArticle } from './wiki-loader';
import { transformWikilinks } from './wiki-loader';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
  semanticX: number | null;
  semanticY: number | null;
  size: number;
  color: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  size: number;
  color: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'harness-engineering': '#8c7b6b',
  'claude-code': '#b08968',
  'ai-ecosystem': '#7a8b7a',
  'ai-tools': '#c4a882',
  'product-trends': '#a67c6b',
  'forecasts': '#7a9ca5',
  'mental-models': '#9b8aa5',
  'writing': '#8b9dc3',
  'self': '#9aaa8c',
  uncategorized: '#a8a29e',
};

interface SemanticLayout {
  [slug: string]: { x: number; y: number };
}

function loadSemanticLayout(): SemanticLayout {
  const path = join(process.cwd(), 'lib', 'semantic-layout.json');
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as SemanticLayout;
  } catch {
    return {};
  }
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.uncategorized;
}

export function buildGraph(articles: WikiArticle[]): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeSet = new Set<string>();
  const edgeSet = new Set<string>();
  const linkCounts: Record<string, number> = {};
  const incomingCounts: Record<string, number> = {};
  const semanticLayout = loadSemanticLayout();

  // First pass: count links
  for (const article of articles) {
    const { links } = transformWikilinks(article.content);
    for (const link of links) {
      linkCounts[article.slug] = (linkCounts[article.slug] || 0) + 1;
      incomingCounts[link.to] = (incomingCounts[link.to] || 0) + 1;
    }
  }

  // Create nodes for all articles
  for (const article of articles) {
    nodeSet.add(article.slug);
    const degree = (linkCounts[article.slug] || 0) + (incomingCounts[article.slug] || 0);
    const semantic = semanticLayout[article.slug];
    nodes.push({
      id: article.slug,
      label: article.title,
      category: article.category,
      x: Math.random() * 100,
      y: Math.random() * 100,
      semanticX: semantic?.x ?? null,
      semanticY: semantic?.y ?? null,
      size: Math.max(3, Math.min(12, 3 + degree)),
      color: getCategoryColor(article.category),
    });
  }

  // Create edges
  for (const article of articles) {
    const { links } = transformWikilinks(article.content);
    for (const link of links) {
      // Normalize target: the link.to is already lowercased and hyphenated
      // Try to find an exact article slug match
      const targetArticle = articles.find(
        (a) => a.slug.toLowerCase().replace(/\s+/g, '-') === link.to
      );

      if (targetArticle) {
        const edgeId = `${article.slug}→${targetArticle.slug}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: article.slug,
            target: targetArticle.slug,
            size: 1,
            color: '#d1d5db',
          });
        }
      }
    }
  }

  return { nodes, edges };
}

export function buildLocalGraph(
  articles: WikiArticle[],
  focusSlug: string,
  maxNeighbors = 10
): GraphData {
  const graph = buildGraph(articles);
  const focusNode = graph.nodes.find((node) => node.id === focusSlug);
  if (!focusNode) return { nodes: [], edges: [] };

  const incidentEdges = graph.edges.filter(
    (edge) => edge.source === focusSlug || edge.target === focusSlug
  );
  const neighborIds = Array.from(
    new Set(
      incidentEdges.map((edge) => (edge.source === focusSlug ? edge.target : edge.source))
    )
  ).slice(0, maxNeighbors);
  const localIds = new Set([focusSlug, ...neighborIds]);
  const localNodes = graph.nodes
    .filter((node) => localIds.has(node.id))
    .map((node) => {
      if (node.id === focusSlug) {
        return { ...node, x: 50, y: 50, size: Math.max(node.size, 7) };
      }

      const neighborIndex = Math.max(0, neighborIds.indexOf(node.id));
      const angle = (Math.PI * 2 * neighborIndex) / Math.max(1, neighborIds.length);
      return {
        ...node,
        x: 50 + Math.cos(angle) * 34,
        y: 50 + Math.sin(angle) * 30,
        size: Math.max(4, Math.min(node.size, 7)),
      };
    });
  const localEdges = incidentEdges.filter(
    (edge) => localIds.has(edge.source) && localIds.has(edge.target)
  );

  return { nodes: localNodes, edges: localEdges };
}

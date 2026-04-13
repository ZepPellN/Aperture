import type { WikiArticle, WikiLink } from './wiki-loader';
import { transformWikilinks } from './wiki-loader';

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
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
  'harness-engineering': '#3b82f6',
  'claude-code': '#8b5cf6',
  'ai-ecosystem': '#10b981',
  'ai-tools': '#f59e0b',
  'product-trends': '#ef4444',
  'forecasts': '#06b6d4',
  'mental-models': '#ec4899',
  'writing': '#6366f1',
  'self': '#84cc16',
  uncategorized: '#9ca3af',
};

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
    nodes.push({
      id: article.slug,
      label: article.title,
      category: article.category,
      x: Math.random() * 100,
      y: Math.random() * 100,
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

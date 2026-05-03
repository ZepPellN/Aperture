'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sigma } from 'sigma';
import { UndirectedGraph } from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphData } from '@/lib/graph-builder';
import Link from 'next/link';
import { formatCategory } from '@/lib/utils';

interface GraphViewProps {
  data: GraphData;
  focusSlug?: string;
  clusterId?: number;
}

// Theme-aware palettes
const PALETTE = {
  light: {
    bg: '#faf8f5',
    edge: '#e8e0d6',
    label: '#6b5e50',
    node: '#c4b8a8',
  },
  dark: {
    bg: '#161412',
    edge: '#3d352e',
    label: '#a89b8c',
    node: '#5c534a',
  },
};

function useTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function GraphView({ data, focusSlug, clusterId }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const isDark = useTheme();
  const focusedNode = focusSlug ? data.nodes.find((node) => node.id === focusSlug) : undefined;
  const visibleData = useMemo(() => {
    if (!focusSlug || !focusedNode) return data;

    const incidentEdges = data.edges.filter(
      (edge) => edge.source === focusSlug || edge.target === focusSlug
    );
    const neighborIds = Array.from(
      new Set(
        incidentEdges.map((edge) => (edge.source === focusSlug ? edge.target : edge.source))
      )
    ).slice(0, 18);
    const visibleIds = new Set([focusSlug, ...neighborIds]);
    const visibleEdges = data.edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
    );
    const visibleNodes = data.nodes
      .filter((node) => visibleIds.has(node.id))
      .map((node) => {
        if (node.id === focusSlug) {
          return { ...node, x: 0, y: 0, size: Math.max(node.size, 11) };
        }

        const index = Math.max(0, neighborIds.indexOf(node.id));
        const angle = (Math.PI * 2 * index) / Math.max(1, neighborIds.length);
        const radius = neighborIds.length > 8 ? 18 : 14;
        return {
          ...node,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          size: Math.max(5, Math.min(node.size, 8)),
        };
      });

    return { nodes: visibleNodes, edges: visibleEdges };
  }, [data, focusSlug, focusedNode]);
  const focusNeighborCount = focusSlug ? Math.max(0, visibleData.nodes.length - 1) : 0;

  const selectedNode = data.nodes.find((n) => n.id === selected);
  const hoveredNode = data.nodes.find((n) => n.id === hovered);
  const activeNode = hoveredNode || selectedNode;
  const clusterNodes = useMemo(
    () => (clusterId === undefined ? [] : data.nodes.filter((node) => node.clusterId === clusterId)),
    [clusterId, data.nodes]
  );

  useEffect(() => {
    if (!containerRef.current || visibleData.nodes.length === 0) return;

    const graph = new UndirectedGraph();
    const hasFocusGraph = Boolean(focusSlug && focusedNode);
    const hasClusterFocus = clusterId !== undefined && visibleData.nodes.some((node) => node.clusterId === clusterId);

    for (const node of visibleData.nodes) {
      const isFocused = focusSlug === node.id;
      const isClusterMember = hasClusterFocus && node.clusterId === clusterId;
      graph.addNode(node.id, {
        label: node.label,
        x: node.x,
        y: node.y,
        size: isFocused ? node.size * 1.5 : isClusterMember ? node.size * 1.3 : node.size,
        color: isFocused ? '#b45309' : isClusterMember || !hasClusterFocus ? node.color : '#d6d1ca',
      });
    }

    for (const edge of visibleData.edges) {
      if (!graph.hasEdge(edge.source, edge.target)) {
        const isClusterEdge =
          hasClusterFocus &&
          visibleData.nodes.find((node) => node.id === edge.source)?.clusterId === clusterId &&
          visibleData.nodes.find((node) => node.id === edge.target)?.clusterId === clusterId;
        graph.addEdge(edge.source, edge.target, {
          size: hasFocusGraph ? edge.size * 1.5 : isClusterEdge ? edge.size * 1.8 : edge.size,
          color: hasFocusGraph ? '#c7b7a3' : hasClusterFocus ? (isClusterEdge ? '#b45309' : '#eee7dd') : edge.color,
        });
      }
    }

    if (!hasFocusGraph) {
      const settings = forceAtlas2.inferSettings(graph);
      forceAtlas2.assign(graph, { settings, iterations: 120 });
    }

    const theme = PALETTE[isDark ? 'dark' : 'light'];
    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelSize: 12,
      labelWeight: '500',
      labelColor: { color: theme.label },
      defaultNodeColor: theme.node,
      defaultEdgeColor: theme.edge,
      minCameraRatio: 0.05,
      maxCameraRatio: 2,
    });

    sigma.on('clickNode', (e) => {
      setSelected(e.node);
    });

    sigma.on('enterNode', (e) => {
      setHovered(e.node);
    });

    sigma.on('leaveNode', () => {
      setHovered(null);
    });

    sigmaRef.current = sigma;

    if (focusSlug && graph.hasNode(focusSlug)) {
      requestAnimationFrame(() => {
        setSelected(focusSlug);
        sigma.getCamera().animate(
          { x: 0, y: 0, ratio: hasFocusGraph ? 1.05 : 0.5 },
          { duration: 300 }
        );
      });
    } else if (hasClusterFocus && clusterId !== undefined && clusterNodes.length > 0) {
      const xs = clusterNodes.map((node) => graph.getNodeAttribute(node.id, 'x') as number);
      const ys = clusterNodes.map((node) => graph.getNodeAttribute(node.id, 'y') as number);
      const center = {
        x: xs.reduce((sum, value) => sum + value, 0) / xs.length,
        y: ys.reduce((sum, value) => sum + value, 0) / ys.length,
      };
      requestAnimationFrame(() => {
        sigma.getCamera().animate(
          { x: center.x, y: center.y, ratio: Math.min(0.9, Math.max(0.35, xs.length / 90)) },
          { duration: 600 }
        );
      });
    }

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [visibleData, data, isDark, focusSlug, focusedNode, clusterId, clusterNodes]);

  const theme = PALETTE[isDark ? 'dark' : 'light'];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="relative overflow-hidden rounded-2xl border border-border" style={{ background: theme.bg }}>
        <div ref={containerRef} className="h-[65vh] w-full" />

        {activeNode && (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur sm:right-auto sm:max-w-sm">
            <div
              className="mb-1 inline-block rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: activeNode.color }}
            >
              {formatCategory(activeNode.category)}
            </div>
            <div className="text-lg font-medium text-foreground">{activeNode.label}</div>
            <Link
              href={`/wiki/${activeNode.id}`}
              className="mt-2 inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-accent"
            >
              Open article →
            </Link>
          </div>
        )}

        {focusSlug && focusedNode && (
          <div className="absolute left-4 right-4 top-4 rounded-xl border border-border bg-card/95 px-3 py-2 text-sm shadow-sm backdrop-blur sm:right-auto sm:max-w-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Focus mode
            </div>
            <div className="truncate font-medium text-foreground">{focusedNode.label}</div>
            <div className="text-xs text-muted-foreground">
              {focusNeighborCount} direct neighbor{focusNeighborCount === 1 ? '' : 's'} shown
            </div>
          </div>
        )}

        {!activeNode && clusterId !== undefined && clusterNodes.length > 0 && (
          <div className="absolute bottom-4 left-4 max-w-sm rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur">
            <div className="mb-1 inline-block rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              Cluster {clusterId}
            </div>
            <div className="text-lg font-medium text-foreground">
              {clusterNodes.length} highlighted articles
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Related semantic island from the clusters view.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {Array.from(new Set(visibleData.nodes.map((n) => n.category))).map((cat) => {
          const color = visibleData.nodes.find((n) => n.category === cat)?.color || PALETTE[isDark ? 'dark' : 'light'].node;
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{formatCategory(cat)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

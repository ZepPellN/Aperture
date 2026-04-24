'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { contours } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { UndirectedGraph } from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphData, GraphNode } from '@/lib/graph-builder';
import { formatCategory } from '@/lib/utils';
import Link from 'next/link';

interface KnowledgeMapProps {
  data: GraphData;
  layoutMode?: 'force' | 'semantic';
}

const GRID_W = 220;

const THEME = {
  light: {
    bg: '#fdfcfa',
    bandFills: [
      'rgba(220, 210, 195, 0.05)',
      'rgba(210, 198, 182, 0.06)',
      'rgba(200, 186, 170, 0.07)',
      'rgba(190, 174, 158, 0.08)',
      'rgba(180, 164, 148, 0.09)',
      'rgba(170, 154, 138, 0.10)',
    ],
    strokeColors: [
      'rgba(200, 188, 172, 0.10)',
      'rgba(190, 178, 162, 0.12)',
      'rgba(180, 168, 152, 0.14)',
      'rgba(170, 158, 142, 0.16)',
      'rgba(160, 148, 132, 0.18)',
      'rgba(150, 138, 122, 0.20)',
    ],
    faintEdge: 'rgba(160, 140, 115, 0.05)',
    activeEdge: 'rgba(160, 140, 115, 0.35)',
    dimEdge: 'rgba(160, 140, 115, 0.02)',
    nodeRing: '#fdfcfa',
    pillBg: 'rgba(250, 248, 245, 0.9)',
    pillBorder: 'rgba(160, 140, 115, 0.3)',
    pillText: '#3d3225',
  },
  dark: {
    bg: '#161412',
    bandFills: [
      'rgba(60, 52, 42, 0.05)',
      'rgba(70, 60, 50, 0.06)',
      'rgba(80, 70, 58, 0.07)',
      'rgba(90, 80, 66, 0.08)',
      'rgba(100, 88, 74, 0.09)',
      'rgba(110, 96, 82, 0.10)',
    ],
    strokeColors: [
      'rgba(80, 70, 58, 0.10)',
      'rgba(90, 80, 68, 0.12)',
      'rgba(100, 90, 76, 0.14)',
      'rgba(110, 98, 84, 0.16)',
      'rgba(120, 106, 92, 0.18)',
      'rgba(130, 114, 100, 0.20)',
    ],
    faintEdge: 'rgba(180, 160, 135, 0.06)',
    activeEdge: 'rgba(180, 160, 135, 0.35)',
    dimEdge: 'rgba(180, 160, 135, 0.02)',
    nodeRing: '#161412',
    pillBg: 'rgba(22, 20, 18, 0.9)',
    pillBorder: 'rgba(140, 130, 115, 0.3)',
    pillText: '#c4b8a8',
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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function runLayout(data: GraphData): GraphNode[] {
  if (data.nodes.length === 0) return [];

  const graph = new UndirectedGraph();
  for (const node of data.nodes) {
    graph.addNode(node.id, {
      label: node.label,
      x: node.x,
      y: node.y,
      category: node.category,
      size: node.size,
      color: node.color,
    });
  }
  for (const edge of data.edges) {
    if (!graph.hasEdge(edge.source, edge.target)) {
      graph.addEdge(edge.source, edge.target);
    }
  }

  const settings = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, { settings, iterations: 200 });

  return data.nodes.map((n) => {
    const attrs = graph.getNodeAttributes(n.id);
    return { ...n, x: attrs.x, y: attrs.y };
  });
}

function buildDensityField(
  nodes: GraphNode[],
  gridW: number,
  gridH: number
): number[] {
  const values: number[] = new Array(gridW * gridH).fill(0);

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const pad = 0.08;

  for (const node of nodes) {
    const nx = ((node.x - minX) / rangeX) * (1 - pad * 2) + pad;
    const ny = ((node.y - minY) / rangeY) * (1 - pad * 2) + pad;
    const gx = nx * (gridW - 1);
    const gy = ny * (gridH - 1);
    const radius = Math.max(5, node.size * 1.2);
    const radiusSq = radius * radius;
    const amp = node.size * 0.6;

    const x0 = Math.max(0, Math.floor(gx - radius * 3));
    const x1 = Math.min(gridW - 1, Math.ceil(gx + radius * 3));
    const y0 = Math.max(0, Math.floor(gy - radius * 3));
    const y1 = Math.min(gridH - 1, Math.ceil(gy + radius * 3));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - gx;
        const dy = y - gy;
        const distSq = dx * dx + dy * dy;
        if (distSq < radiusSq * 9) {
          values[y * gridW + x] += amp * Math.exp(-distSq / (2 * radiusSq));
        }
      }
    }
  }

  return values;
}

function quantileThresholds(values: number[], count: number): number[] {
  const nonzero = values.filter((v) => v > 0);
  if (nonzero.length === 0) return [];
  nonzero.sort((a, b) => a - b);

  const thresholds: number[] = [];
  for (let i = 1; i <= count; i++) {
    const idx = Math.floor(nonzero.length * (i / (count + 1)));
    thresholds.push(nonzero[Math.min(idx, nonzero.length - 1)]);
  }
  return thresholds;
}

export default function KnowledgeMap({ data, layoutMode = 'force' }: KnowledgeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const nodesRef = useRef<GraphNode[]>([]);
  const isDark = useTheme();

  const adjacency = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const node of data.nodes) map[node.id] = new Set();
    for (const edge of data.edges) {
      map[edge.source]?.add(edge.target);
      map[edge.target]?.add(edge.source);
    }
    return map;
  }, [data]);

  const nodeStats = useMemo(() => {
    const stats: Record<string, { outgoing: number; incoming: number }> = {};
    for (const node of data.nodes) {
      stats[node.id] = { outgoing: 0, incoming: 0 };
    }
    for (const edge of data.edges) {
      stats[edge.source].outgoing++;
      stats[edge.target].incoming++;
    }
    return stats;
  }, [data]);

  const activeNode = hovered || selected;
  const activeId = activeNode?.id;
  const neighborIds = activeId ? adjacency[activeId] : new Set<string>();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.nodes.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const theme = THEME[isDark ? 'dark' : 'light'];

    // Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    // Choose layout: semantic coordinates or forceAtlas2
    let layoutNodes: GraphNode[];
    if (
      layoutMode === 'semantic' &&
      data.nodes.some((n) => n.semanticX !== null && n.semanticY !== null)
    ) {
      layoutNodes = data.nodes.map((n) => ({
        ...n,
        x: n.semanticX ?? Math.random() * 100,
        y: n.semanticY ?? Math.random() * 100,
      }));
    } else {
      layoutNodes = runLayout(data);
    }
    const gridH = Math.round((height / width) * GRID_W);

    // Build density field
    const values = buildDensityField(layoutNodes, GRID_W, gridH);
    const nonzero = values.filter((v) => v > 0);
    const maxVal = Math.max(...values);

    if (nonzero.length > 0 && maxVal > 0) {
      const thresholds = quantileThresholds(values, theme.bandFills.length);
      if (thresholds.length > 0) {
        const contourGen = contours()
          .size([GRID_W, gridH])
          .thresholds(thresholds);
        const contourData = contourGen(values);
        const scaleX = width / GRID_W;
        const scaleY = height / gridH;
        const pathGen = geoPath();

        // Very subtle contour fills
        contourData.forEach((feature, i) => {
          const d = pathGen(feature);
          if (!d) return;
          const p2d = new Path2D(d);
          ctx.save();
          ctx.scale(scaleX, scaleY);
          ctx.fillStyle = theme.bandFills[i] || theme.bandFills[theme.bandFills.length - 1];
          ctx.fill(p2d);
          ctx.restore();
        });

        // Very subtle contour strokes
        contourData.forEach((feature, i) => {
          const d = pathGen(feature);
          if (!d) return;
          const p2d = new Path2D(d);
          ctx.save();
          ctx.scale(scaleX, scaleY);
          ctx.strokeStyle = theme.strokeColors[i] || theme.strokeColors[theme.strokeColors.length - 1];
          ctx.lineWidth = 0.6;
          if (i % 2 === 1) {
            ctx.setLineDash([2, 2]);
          }
          ctx.stroke(p2d);
          ctx.setLineDash([]);
          ctx.restore();
        });
      }
    }

    // Normalize node positions
    const xs = layoutNodes.map((n) => n.x);
    const ys = layoutNodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 0.08;

    const normalizedNodes = layoutNodes.map((n) => ({
      ...n,
      cx: (((n.x - minX) / rangeX) * (1 - pad * 2) + pad) * width,
      cy: (((n.y - minY) / rangeY) * (1 - pad * 2) + pad) * height,
    }));
    nodesRef.current = normalizedNodes;

    const nodeMap = new Map(normalizedNodes.map((n) => [n.id, n]));

    // Draw category-colored glows behind nodes
    for (const node of normalizedNodes) {
      const rgb = hexToRgb(node.color);
      if (!rgb) continue;
      const glowR = Math.max(30, node.size * 8);
      const grad = ctx.createRadialGradient(node.cx, node.cy, 0, node.cx, node.cy, glowR);
      const alpha = isDark ? 0.10 : 0.08;
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
      grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw edges
    for (const edge of data.edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;

      const isActiveEdge = activeId && (edge.source === activeId || edge.target === activeId);
      const isDimmedEdge = activeId && !isActiveEdge;

      ctx.beginPath();
      ctx.moveTo(s.cx, s.cy);
      ctx.lineTo(t.cx, t.cy);

      if (isActiveEdge) {
        ctx.strokeStyle = theme.activeEdge;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 1;
      } else if (isDimmedEdge) {
        ctx.strokeStyle = theme.dimEdge;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
      } else {
        ctx.strokeStyle = theme.faintEdge;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 1;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw nodes
    for (const node of normalizedNodes) {
      const r = Math.max(2.5, node.size * 0.35);
      const isActive = node.id === activeId;
      const isNeighbor = activeId ? neighborIds.has(node.id) : false;
      const isDimmed = activeId && !isActive && !isNeighbor;

      ctx.globalAlpha = isDimmed ? 0.25 : 1;

      // Outer glow ring for active node
      if (isActive) {
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        ctx.fill();
      }

      // Background ring
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = theme.nodeRing;
      ctx.fill();

      // Node dot
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = isDimmed ? 0.3 : 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Category labels at centroids
    const catCenters: Record<string, { x: number; y: number; count: number }> = {};
    for (const node of normalizedNodes) {
      if (!catCenters[node.category]) {
        catCenters[node.category] = { x: 0, y: 0, count: 0 };
      }
      catCenters[node.category].x += node.cx;
      catCenters[node.category].y += node.cy;
      catCenters[node.category].count += 1;
    }

    ctx.font =
      '500 11px var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const [cat, center] of Object.entries(catCenters)) {
      const cx = center.x / center.count;
      const cy = center.y / center.count;
      const text = formatCategory(cat);

      const metrics = ctx.measureText(text);
      const tw = metrics.width;
      const th = 14;
      const px = 8;
      const py = 4;

      ctx.fillStyle = theme.pillBg;
      ctx.beginPath();
      ctx.roundRect(
        cx - tw / 2 - px,
        cy - th / 2 - py,
        tw + px * 2,
        th + py * 2,
        6
      );
      ctx.fill();

      ctx.strokeStyle = theme.pillBorder;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.fillStyle = theme.pillText;
      ctx.fillText(text, cx, cy + 0.5);
    }
  }, [data, isDark, activeId, neighborIds, layoutMode]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let closest: GraphNode | null = null;
      let minDist = Infinity;

      for (const node of nodesRef.current) {
        const dx = (node as any).cx - x;
        const dy = (node as any).cy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20 && dist < minDist) {
          minDist = dist;
          closest = node;
        }
      }

      setHovered(closest);
      setTooltipPos({ x: x + 14, y: y - 14 });
    },
    []
  );

  const handleClick = useCallback(() => {
    if (hovered) {
      setSelected(hovered);
      window.location.href = `/wiki/${hovered.id}`;
    }
  }, [hovered]);

  const statsFor = (node: GraphNode | null) => {
    if (!node) return null;
    return nodeStats[node.id] || { outgoing: 0, incoming: 0 };
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-border"
        style={{ height: '65vh', background: isDark ? '#161412' : '#fdfcfa' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
          onClick={handleClick}
        />

        {/* Hover tooltip */}
        {hovered && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-border bg-card px-3 py-2 shadow-lg"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="text-xs font-medium text-primary">
              {formatCategory(hovered.category)}
            </div>
            <div className="text-sm font-medium text-foreground">
              {hovered.label}
            </div>
            {(() => {
              const s = statsFor(hovered);
              return s ? (
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{s.outgoing} out</span>
                  <span>{s.incoming} in</span>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Selected node info panel */}
        {selected && !hovered && (
          <div className="absolute bottom-4 left-4 max-w-sm rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur">
            <div
              className="mb-1 inline-block rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: selected.color }}
            >
              {formatCategory(selected.category)}
            </div>
            <div className="text-lg font-medium text-foreground">
              {selected.label}
            </div>
            {(() => {
              const s = statsFor(selected);
              return s ? (
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{s.outgoing} links out</span>
                  <span>{s.incoming} links in</span>
                </div>
              ) : null;
            })()}
            <Link
              href={`/wiki/${selected.id}`}
              className="mt-2 inline-flex items-center text-sm font-medium text-primary transition-colors duration-200 hover:text-accent"
            >
              Open article →
            </Link>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="text-xs font-medium tracking-tight">
          Knowledge Density
        </span>
        <div className="flex items-center gap-0.5">
          {(isDark ? THEME.dark.bandFills : THEME.light.bandFills).map((c, i) => (
            <span
              key={i}
              className="inline-block h-3 w-8 first:rounded-l last:rounded-r"
              style={{
                backgroundColor: c.replace(
                  /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/,
                  'rgba($1, $2, $3, 0.85)'
                ),
              }}
            />
          ))}
        </div>
        <span className="text-xs">Sparse → Dense</span>
      </div>
    </div>
  );
}

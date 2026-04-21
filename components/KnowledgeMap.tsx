'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { contours } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { UndirectedGraph } from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphData, GraphNode } from '@/lib/graph-builder';

interface KnowledgeMapProps {
  data: GraphData;
}

const GRID_W = 220;

// Warm sepia contour bands — lighter, airier palette
const BAND_FILLS = [
  'rgba(242, 232, 215, 0.42)',
  'rgba(230, 215, 192, 0.48)',
  'rgba(212, 192, 165, 0.54)',
  'rgba(192, 168, 140, 0.58)',
  'rgba(172, 148, 120, 0.62)',
  'rgba(152, 130, 105, 0.65)',
];
const STROKE_COLORS = [
  'rgba(185, 165, 140, 0.48)',
  'rgba(168, 148, 122, 0.50)',
  'rgba(152, 132, 108, 0.55)',
  'rgba(138, 118, 92, 0.58)',
  'rgba(122, 102, 78, 0.62)',
  'rgba(108, 90, 68, 0.68)',
];

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

export default function KnowledgeMap({ data }: KnowledgeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const nodesRef = useRef<GraphNode[]>([]);

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

    // Warm cream background
    ctx.fillStyle = '#fdfcfa';
    ctx.fillRect(0, 0, width, height);

    // Run forceAtlas2 layout
    const layoutNodes = runLayout(data);
    const gridH = Math.round((height / width) * GRID_W);

    // Build density field
    const values = buildDensityField(layoutNodes, GRID_W, gridH);
    const nonzero = values.filter((v) => v > 0);
    const maxVal = Math.max(...values);

    if (nonzero.length === 0 || maxVal === 0) return;

    // Quantile-based thresholds
    const thresholds = quantileThresholds(values, BAND_FILLS.length);
    if (thresholds.length === 0) return;

    // Use plain number[] for d3-contour
    const contourGen = contours()
      .size([GRID_W, gridH])
      .thresholds(thresholds);
    const contourData = contourGen(values);

    const scaleX = width / GRID_W;
    const scaleY = height / gridH;

    // Use SVG-string geoPath then Path2D for reliable canvas rendering
    const pathGen = geoPath();

    // Draw filled contour bands
    contourData.forEach((feature, i) => {
      const d = pathGen(feature);
      if (!d) return;
      const p2d = new Path2D(d);
      ctx.save();
      ctx.scale(scaleX, scaleY);
      ctx.fillStyle = BAND_FILLS[i] || BAND_FILLS[BAND_FILLS.length - 1];
      ctx.fill(p2d);
      ctx.restore();
    });

    // Draw contour strokes
    contourData.forEach((feature, i) => {
      const d = pathGen(feature);
      if (!d) return;
      const p2d = new Path2D(d);
      ctx.save();
      ctx.scale(scaleX, scaleY);
      ctx.strokeStyle = STROKE_COLORS[i] || STROKE_COLORS[STROKE_COLORS.length - 1];
      ctx.lineWidth = 0.8;
      if (i % 2 === 1) {
        ctx.setLineDash([2, 2]);
      }
      ctx.stroke(p2d);
      ctx.setLineDash([]);
      ctx.restore();
    });

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

    // Draw faint edges
    ctx.strokeStyle = 'rgba(160, 140, 115, 0.06)';
    ctx.lineWidth = 0.5;
    for (const edge of data.edges) {
      const s = normalizedNodes.find((n) => n.id === edge.source);
      const t = normalizedNodes.find((n) => n.id === edge.target);
      if (s && t) {
        ctx.beginPath();
        ctx.moveTo(s.cx, s.cy);
        ctx.lineTo(t.cx, t.cy);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const node of normalizedNodes) {
      const r = Math.max(2.5, node.size * 0.35);

      // White ring
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fdfcfa';
      ctx.fill();

      // Node dot
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Category labels at centroids
    const catCenters: Record<
      string,
      { x: number; y: number; count: number }
    > = {};
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
      const text = cat.replace(/-/g, ' ');

      const metrics = ctx.measureText(text);
      const tw = metrics.width;
      const th = 14;
      const px = 8;
      const py = 4;

      // Pill background
      ctx.fillStyle = 'rgba(250, 248, 245, 0.9)';
      ctx.beginPath();
      ctx.roundRect(
        cx - tw / 2 - px,
        cy - th / 2 - py,
        tw + px * 2,
        th + py * 2,
        6
      );
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(160, 140, 115, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Text
      ctx.fillStyle = '#3d3225';
      ctx.fillText(text, cx, cy + 0.5);
    }
  }, [data]);

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
        if (dist < 18 && dist < minDist) {
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
      window.location.href = `/wiki/${hovered.id}`;
    }
  }, [hovered]);

  return (
    <div className="mx-auto max-w-7xl">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-border"
        style={{ height: '65vh', background: '#fdfcfa' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
          onClick={handleClick}
        />

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-border bg-card px-3 py-2 shadow-lg"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="text-xs font-medium text-primary capitalize">
              {hovered.category.replace(/-/g, ' ')}
            </div>
            <div className="text-sm font-medium text-foreground">
              {hovered.label}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wider">
          Knowledge Density
        </span>
        <div className="flex items-center gap-0.5">
          {BAND_FILLS.map((c, i) => (
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

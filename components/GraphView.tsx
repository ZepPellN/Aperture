'use client';

import { useEffect, useRef, useState } from 'react';
import { Sigma } from 'sigma';
import { UndirectedGraph } from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphData } from '@/lib/graph-builder';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';

interface GraphViewProps {
  data: GraphData;
}

export default function GraphView({ data }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const selectedNode = data.nodes.find((n) => n.id === selected);
  const hoveredNode = data.nodes.find((n) => n.id === hovered);
  const activeNode = hoveredNode || selectedNode;

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    const graph = new UndirectedGraph();

    for (const node of data.nodes) {
      graph.addNode(node.id, {
        label: node.label,
        x: node.x,
        y: node.y,
        size: node.size,
        color: node.color,
      });
    }

    for (const edge of data.edges) {
      if (!graph.hasEdge(edge.source, edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          size: edge.size,
          color: edge.color,
        });
      }
    }

    const settings = forceAtlas2.inferSettings(graph);
    forceAtlas2.assign(graph, { settings, iterations: 120 });

    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelSize: 12,
      labelWeight: '500',
      labelColor: { color: '#52525b' },
      defaultNodeColor: '#9ca3af',
      defaultEdgeColor: '#d1d5db',
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

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="flex items-center gap-1 hover:text-zinc-800">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Info className="h-4 w-4" />
          <span>Click a node to open the article</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div ref={containerRef} className="h-[60vh] w-full" />

        {activeNode && (
          <div className="absolute bottom-4 left-4 max-w-sm rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div
              className="mb-1 inline-block rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: activeNode.color }}
            >
              {activeNode.category.replace(/-/g, ' ')}
            </div>
            <div className="text-lg font-semibold text-zinc-900">{activeNode.label}</div>
            <Link
              href={`/wiki/${activeNode.id}`}
              className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Open article →
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {Array.from(new Set(data.nodes.map((n) => n.category))).map((cat) => {
          const color = data.nodes.find((n) => n.category === cat)?.color || '#9ca3af';
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-zinc-600">{cat.replace(/-/g, ' ')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

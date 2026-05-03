'use client';

import Link from 'next/link';
import type { GraphData } from '@/lib/graph-builder';
import { GitBranch, X } from 'lucide-react';

interface MiniGraphProps {
  data: GraphData;
  focusSlug: string;
  open: boolean;
  onClose: () => void;
}

export default function MiniGraph({ data, focusSlug, open, onClose }: MiniGraphProps) {
  if (!open) return null;
  if (data.nodes.length === 0) return null;

  const focusNode = data.nodes.find((node) => node.id === focusSlug);
  const neighborCount = Math.max(0, data.nodes.length - 1);

  return (
    <aside
      className="fixed right-4 top-20 z-40 w-[22rem] max-w-[calc(100vw-2rem)] sm:right-6 sm:top-24"
      role="dialog"
      aria-label="Local graph"
    >
      <div className="rounded-2xl border border-border/60 bg-card/75 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-[10px] font-medium tabular-nums text-primary">
              1°
            </span>
            <h2 className="text-sm font-medium text-heading">Local Graph</h2>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/graph?focus=${encodeURIComponent(focusSlug)}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-ring"
              aria-label="View in Graph"
            >
              <GitBranch className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
            <button
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* SVG */}
        <div className="px-3 pt-3">
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label={`Local graph for ${focusNode?.label || focusSlug}`}
            className="aspect-square w-full rounded-lg bg-background/40"
          >
            {data.edges.map((edge) => {
              const source = data.nodes.find((node) => node.id === edge.source);
              const target = data.nodes.find((node) => node.id === edge.target);
              if (!source || !target) return null;

              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="currentColor"
                  strokeWidth="0.75"
                  className="text-border"
                />
              );
            })}
            {data.nodes.map((node) => {
              const isFocus = node.id === focusSlug;
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isFocus ? 5.5 : 3.5}
                    fill={node.color}
                    stroke={isFocus ? 'currentColor' : 'transparent'}
                    strokeWidth={isFocus ? 1.4 : 0}
                    className={isFocus ? 'text-foreground' : ''}
                  />
                  {isFocus && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.7"
                      className="text-primary"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 pt-2">
          <p className="truncate text-sm font-medium text-foreground">
            {focusNode?.label || focusSlug}
          </p>
          <p className="text-xs text-muted-foreground">
            {neighborCount} direct neighbor{neighborCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </aside>
  );
}

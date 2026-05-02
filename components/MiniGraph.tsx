'use client';

import Link from 'next/link';
import type { GraphData } from '@/lib/graph-builder';
import { GitBranch } from 'lucide-react';

interface MiniGraphProps {
  data: GraphData;
  focusSlug: string;
}

export default function MiniGraph({ data, focusSlug }: MiniGraphProps) {
  if (data.nodes.length === 0) return null;

  const focusNode = data.nodes.find((node) => node.id === focusSlug);
  const neighborCount = Math.max(0, data.nodes.length - 1);

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-heading">Local Graph</h2>
          <Link
            href={`/graph?focus=${encodeURIComponent(focusSlug)}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-ring"
            aria-label="View in Graph"
          >
            <GitBranch className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Local graph for ${focusNode?.label || focusSlug}`}
          className="aspect-square w-full rounded-md bg-background"
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
        <div className="mt-2">
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

'use client';

import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';
import { formatCategory } from '@/lib/utils';

interface TrailNode {
  slug: string;
  title: string;
  category: string;
  score: number;
}

interface SemanticTrailProps {
  currentSlug: string;
  trail: TrailNode[];
}

export default function SemanticTrail({ currentSlug, trail }: SemanticTrailProps) {
  if (trail.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Compass className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="text-lg font-medium text-heading">Semantic Trail</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Explore undiscovered paths through your knowledge.
      </p>

      <div className="flex flex-col gap-3">
        {/* Current node */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            A
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground">
            You are here
          </div>
        </div>

        {/* Trail nodes */}
        {trail.map((node, i) => (
          <div key={node.slug} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
              {String.fromCharCode(66 + i)}
            </div>
            <Link
              href={`/wiki/${node.slug}`}
              className="group flex flex-1 items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all duration-200 hover:border-primary/30 hover:shadow-sm focus-ring"
            >
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  {formatCategory(node.category)}
                </div>
                <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {node.title}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {(node.score * 100).toFixed(0)}%
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

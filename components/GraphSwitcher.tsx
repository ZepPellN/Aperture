'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Map, Globe, Compass } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { GraphData } from '@/lib/graph-builder';

const GraphView = dynamic(() => import('@/components/GraphView'), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});
const KnowledgeMap = dynamic(() => import('@/components/KnowledgeMap'), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});
const NestGraph = dynamic(() => import('@/components/NestGraph'), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

interface GraphSwitcherProps {
  data: GraphData;
  focusSlug?: string;
}

function GraphSkeleton() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-[65vh] w-full animate-pulse bg-muted" />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        <div className="h-5 w-28 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export default function GraphSwitcher({ data, focusSlug }: GraphSwitcherProps) {
  const searchParams = useSearchParams();
  const activeFocusSlug = focusSlug ?? searchParams.get('focus') ?? undefined;
  const [view, setView] = useState<'network' | 'topo' | 'semantic' | 'nest'>('network');
  const [bfcacheKey, setBfcacheKey] = useState(0);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Force remount of graph components when restored from bfcache
        // to recreate WebGL/Canvas contexts that browsers may discard.
        setBfcacheKey((k) => k + 1);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-normal tracking-tight text-heading text-balance">
            {view === 'network'
              ? 'Network Graph'
              : view === 'topo'
              ? 'Knowledge Map'
              : view === 'semantic'
              ? 'Cognitive Map'
              : 'Nest Graph'}
          </h1>
          <p className="text-muted-foreground">
            {view === 'network'
              ? 'Interactive connections between articles.'
              : view === 'topo'
              ? 'Topographic view of knowledge density.'
              : view === 'semantic'
              ? 'Semantic landscape of your knowledge.'
              : '3D organic cluster of your knowledge.'}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setView('network')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-ring ${
              view === 'network'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitBranch className="h-4 w-4" strokeWidth={1.5} />
            Network
          </button>
          <button
            onClick={() => setView('topo')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-ring ${
              view === 'topo'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-4 w-4" strokeWidth={1.5} />
            Topo Map
          </button>
          <button
            onClick={() => setView('semantic')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-ring ${
              view === 'semantic'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass className="h-4 w-4" strokeWidth={1.5} />
            Semantic
          </button>
          <button
            onClick={() => setView('nest')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-ring ${
              view === 'nest'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="h-4 w-4" strokeWidth={1.5} />
            Nest
          </button>
        </div>
      </div>

      {view === 'network' ? (
        <GraphView key={bfcacheKey} data={data} focusSlug={activeFocusSlug} />
      ) : view === 'topo' ? (
        <KnowledgeMap key={bfcacheKey} data={data} layoutMode="force" />
      ) : view === 'semantic' ? (
        <KnowledgeMap key={bfcacheKey} data={data} layoutMode="semantic" />
      ) : (
        <NestGraph key={bfcacheKey} data={data} />
      )}
    </>
  );
}

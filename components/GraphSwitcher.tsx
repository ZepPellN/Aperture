'use client';

import { useState } from 'react';
import { GitBranch, Map } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { GraphData } from '@/lib/graph-builder';

const GraphView = dynamic(() => import('@/components/GraphView'), { ssr: false });
const KnowledgeMap = dynamic(() => import('@/components/KnowledgeMap'), { ssr: false });

interface GraphSwitcherProps {
  data: GraphData;
}

export default function GraphSwitcher({ data }: GraphSwitcherProps) {
  const [view, setView] = useState<'network' | 'topo'>('network');

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-normal tracking-tight text-heading">
            {view === 'network' ? 'Network Graph' : 'Knowledge Map'}
          </h1>
          <p className="text-muted-foreground">
            {view === 'network'
              ? 'Interactive connections between articles.'
              : 'Topographic view of knowledge density.'}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setView('network')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              view === 'network'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            Network
          </button>
          <button
            onClick={() => setView('topo')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              view === 'topo'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-4 w-4" />
            Topo Map
          </button>
        </div>
      </div>

      {view === 'network' ? <GraphView data={data} /> : <KnowledgeMap data={data} />}
    </>
  );
}

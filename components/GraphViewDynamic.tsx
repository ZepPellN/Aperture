'use client';

import dynamic from 'next/dynamic';
import type { GraphData } from '@/lib/graph-builder';

const GraphView = dynamic(() => import('@/components/GraphView'), { ssr: false });

interface GraphViewDynamicProps {
  data: GraphData;
}

export default function GraphViewDynamic({ data }: GraphViewDynamicProps) {
  return <GraphView data={data} />;
}

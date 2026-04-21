'use client';

import dynamic from 'next/dynamic';
import type { GraphData } from '@/lib/graph-builder';

const KnowledgeMap = dynamic(() => import('@/components/KnowledgeMap'), {
  ssr: false,
});

interface KnowledgeMapDynamicProps {
  data: GraphData;
}

export default function KnowledgeMapDynamic({ data }: KnowledgeMapDynamicProps) {
  return <KnowledgeMap data={data} />;
}

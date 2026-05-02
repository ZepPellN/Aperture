import WikiLayout from '@/components/WikiLayout';
import GraphSwitcher from '@/components/GraphSwitcher';
import { loadAllArticles } from '@/lib/wiki-loader';
import { buildGraph } from '@/lib/graph-builder';
import { Suspense } from 'react';

export default async function GraphPage() {
  const articles = await loadAllArticles();
  const graphData = buildGraph(articles);

  return (
    <WikiLayout>
      <Suspense fallback={null}>
        <GraphSwitcher data={graphData} />
      </Suspense>
    </WikiLayout>
  );
}

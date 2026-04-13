import WikiLayout from '@/components/WikiLayout';
import GraphViewDynamic from '@/components/GraphViewDynamic';
import { loadAllArticles } from '@/lib/wiki-loader';
import { buildGraph } from '@/lib/graph-builder';

export default async function GraphPage() {
  const articles = await loadAllArticles();
  const graphData = buildGraph(articles);

  return (
    <WikiLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Knowledge Graph</h1>
        <p className="text-zinc-600">Visualize connections across your wiki.</p>
      </div>
      <GraphViewDynamic data={graphData} />
    </WikiLayout>
  );
}

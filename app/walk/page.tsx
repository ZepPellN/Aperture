import WikiLayout from '@/components/WikiLayout';
import WalkView from '@/components/WalkView';
import { loadAllArticles } from '@/lib/wiki-loader';
import { loadSemanticNeighbors } from '@/lib/semantic-neighbors';

export const metadata = {
  title: 'Walk — Aperture',
  description: 'Random walk through your knowledge.',
};

export default async function WalkPage() {
  const [articles, neighborsData] = await Promise.all([
    loadAllArticles(),
    loadSemanticNeighbors(),
  ]);

  const articleMap = new Map(articles.map((a) => [a.slug, a]));

  // Pre-serialize neighbors for client
  const neighborsMap: Record<string, { slug: string; title: string; category: string; score: number }[]> = {};
  for (const [slug, neighbors] of Object.entries(neighborsData)) {
    neighborsMap[slug] = neighbors
      .map((n) => {
        const article = articleMap.get(n.slug);
        if (!article) return null;
        return {
          slug: n.slug,
          title: article.title,
          category: article.category,
          score: n.score,
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);
  }

  return (
    <WikiLayout>
      <WalkView articles={articles} neighborsMap={neighborsMap} />
    </WikiLayout>
  );
}

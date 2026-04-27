import WikiLayout from '@/components/WikiLayout';
import { loadClusters } from '@/lib/semantic-clusters';
import { loadWikiIndex } from '@/lib/wiki-loader';
import Link from 'next/link';
import { Orbit, ArrowRight } from 'lucide-react';
import { formatCategory } from '@/lib/utils';

export const metadata = {
  title: 'Clusters — Aperture',
  description: 'Browse knowledge by semantic clusters.',
};

export default async function ClustersPage() {
  const [clustersData, wikiIndex] = await Promise.all([
    loadClusters(),
    loadWikiIndex(),
  ]);

  const articleMap = new Map(wikiIndex.map((a) => [a.slug, a]));

  const enrichedClusters = clustersData.clusters.map((cluster) => {
    const articles = cluster.members
      .map((slug) => articleMap.get(slug))
      .filter((a): a is NonNullable<typeof a> => !!a);

    // Determine dominant category for label
    const catCounts = new Map<string, number>();
    for (const a of articles) {
      catCounts.set(a.category, (catCounts.get(a.category) || 0) + 1);
    }
    const dominantCategory = Array.from(catCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || 'mixed';

    return {
      ...cluster,
      articles: articles.slice(0, 8),
      totalCount: articles.length,
      dominantCategory,
    };
  });

  const unclusteredArticles = clustersData.unclustered
    .map((slug) => articleMap.get(slug))
    .filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <WikiLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-normal tracking-tight text-heading text-balance">
            Knowledge Clusters
          </h1>
          <p className="text-muted-foreground">
            Semantic islands discovered across your wiki.
          </p>
        </div>

        {enrichedClusters.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            No clusters found. Run <code className="text-sm bg-secondary px-1.5 py-0.5 rounded">npm run build:semantic</code> to generate.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {enrichedClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    <Orbit className="h-3 w-3" />
                    {formatCategory(cluster.dominantCategory)}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {cluster.totalCount} articles
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {cluster.articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/wiki/${article.slug}`}
                      className="group flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm transition-all duration-200 hover:border-primary/30 hover:bg-secondary/50"
                    >
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                          {article.title}
                        </div>
                      </div>
                      <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>

                {cluster.totalCount > cluster.articles.length && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    +{cluster.totalCount - cluster.articles.length} more articles
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {unclusteredArticles.length > 0 && (
          <div className="mt-10 border-t border-border pt-6">
            <h2 className="mb-3 text-lg font-medium text-heading">Unclustered</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Articles that don&apos;t clearly belong to a single semantic island.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {unclusteredArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/wiki/${article.slug}`}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="truncate font-medium">{article.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCategory(article.category)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </WikiLayout>
  );
}

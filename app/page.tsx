import WikiLayout from "@/components/WikiLayout";
import HomeContent from "@/components/HomeContent";
import { loadWikiIndex, loadAllArticles, getStats } from "@/lib/wiki-loader";
import { loadSemanticNeighbors } from "@/lib/semantic-neighbors";

export default async function HomePage() {
  const [index, articles, neighborsData] = await Promise.all([
    loadWikiIndex(),
    loadAllArticles(),
    loadSemanticNeighbors(),
  ]);
  const stats = getStats(articles);

  const byCategory: Record<string, typeof index> = {};
  for (const entry of index) {
    byCategory[entry.category] = byCategory[entry.category] || [];
    byCategory[entry.category].push(entry);
  }

  // Sort each category's entries by updated date, most recent first
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort(
      (a, b) => (b.updated || "").localeCompare(a.updated || "")
    );
  }

  // Build a lightweight neighbor map for the client
  const slugToEntry = new Map(index.map((e) => [e.slug, e]));
  const neighborsMap: Record<string, { slug: string; title: string; category: string; score: number }[]> = {};
  for (const [slug, neighbors] of Object.entries(neighborsData)) {
    neighborsMap[slug] = neighbors
      .map((n) => {
        const entry = slugToEntry.get(n.slug);
        if (!entry) return null;
        return { slug: n.slug, title: entry.title, category: entry.category, score: n.score };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);
  }

  return (
    <WikiLayout>
      <HomeContent
        index={index}
        stats={stats}
        byCategory={byCategory}
        neighborsMap={neighborsMap}
      />
    </WikiLayout>
  );
}

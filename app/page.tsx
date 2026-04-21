import WikiLayout from "@/components/WikiLayout";
import HomeContent from "@/components/HomeContent";
import { loadWikiIndex, loadAllArticles, getStats } from "@/lib/wiki-loader";

export default async function HomePage() {
  const [index, articles] = await Promise.all([
    loadWikiIndex(),
    loadAllArticles(),
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

  return (
    <WikiLayout>
      <HomeContent
        index={index}
        stats={stats}
        byCategory={byCategory}
      />
    </WikiLayout>
  );
}

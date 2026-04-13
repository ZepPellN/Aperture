import WikiLayout from "@/components/WikiLayout";
import { loadWikiIndex, loadAllArticles, getStats } from "@/lib/wiki-loader";
import { GitBranch, FileText, BarChart2, Search } from "lucide-react";
import Link from "next/link";

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

  const recent = [...index]
    .sort((a, b) => (b.updated || "").localeCompare(a.updated || ""))
    .slice(0, 6);

  return (
    <WikiLayout>
      <div className="space-y-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10">
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Welcome to Loom
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            A web reader for LLM-compiled personal wikis. Explore connections,
            search ideas, and navigate your knowledge graph.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/graph"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <GitBranch className="h-4 w-4" />
              Explore Graph
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <FileText className="h-4 w-4" /> Articles
            </div>
            <div className="text-2xl font-semibold text-zinc-900">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <GitBranch className="h-4 w-4" /> Links
            </div>
            <div className="text-2xl font-semibold text-zinc-900">{stats.totalLinks}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <BarChart2 className="h-4 w-4" /> Categories
            </div>
            <div className="text-2xl font-semibold text-zinc-900">{stats.categoryCount}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <Search className="h-4 w-4" /> Orphans
            </div>
            <div className="text-2xl font-semibold text-zinc-900">{stats.orphanCount}</div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">Recently Updated</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((entry) => (
              <Link
                key={entry.slug}
                href={`/wiki/${entry.slug}`}
                className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400"
              >
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {entry.category.replace(/-/g, " ")}
                </div>
                <div className="mb-2 font-medium text-zinc-900 group-hover:text-zinc-700">
                  {entry.title}
                </div>
                {entry.summary && (
                  <p className="line-clamp-2 text-sm text-zinc-600">{entry.summary}</p>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">Browse by Category</h2>
          <div className="space-y-6">
            {Object.entries(byCategory).map(([category, entries]) => (
              <div key={category}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  {category.replace(/-/g, " ")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {entries.map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/wiki/${entry.slug}`}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
                    >
                      {entry.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WikiLayout>
  );
}

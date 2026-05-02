'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { GitBranch, ArrowRight, ChevronRight, Clock } from 'lucide-react';
import Greeting from '@/components/Greeting';
import SearchBar from '@/components/SearchBar';
import CategoryOverlay from '@/components/CategoryOverlay';
import { formatCategory } from '@/lib/utils';

interface Entry {
  slug: string;
  category: string;
  title: string;
  summary?: string;
  updated?: string;
}

interface NeighborNode {
  slug: string;
  title: string;
  category: string;
  score: number;
}

interface HomeContentProps {
  index: Entry[];
  stats: {
    total: number;
    totalLinks: number;
    orphanCount: number;
    categoryCount: number;
  };
  byCategory: Record<string, Entry[]>;
  neighborsMap?: Record<string, NeighborNode[]>;
}

function timeBucket(dateStr: string): string {
  if (!dateStr) return 'Earlier';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  return 'Earlier';
}

function formatUpdatedDate(dateStr?: string): string {
  if (!dateStr) return 'No date';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function HomeContent({
  index,
  stats,
  byCategory,
  neighborsMap,
}: HomeContentProps) {
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const categoryList = Object.keys(byCategory);

  const scrollToCategory = useCallback((category: string) => {
    const el = document.getElementById(`cat-${category}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Recently updated timeline
  const recentEntries = useMemo(() => {
    return [...index]
      .filter((e) => e.updated)
      .sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
      .slice(0, 12);
  }, [index]);

  const groupedByTime = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    for (const entry of recentEntries) {
      const bucket = timeBucket(entry.updated || '');
      groups[bucket] = groups[bucket] || [];
      groups[bucket].push(entry);
    }
    return groups;
  }, [recentEntries]);

  const bucketOrder = ['Today', 'This Week', 'This Month', 'Earlier'];

  return (
    <div className="flex gap-8">
      {/* Left sidebar */}
      <aside className="hidden lg:block w-44 shrink-0">
        <div className="sticky top-20 space-y-1">
          <div className="mb-3 text-[13px] font-medium tracking-tight text-muted-foreground">
            Categories
          </div>
          {categoryList.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className="group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-ring"
            >
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              <span className="truncate">
                {formatCategory(cat)}
              </span>
              <span className="ml-auto text-xs text-muted-foreground/60">
                {byCategory[cat].length}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-10">
        {/* Greeting + Search */}
        <section className="max-w-2xl">
          <Greeting />
          <SearchBar entries={index} neighborsMap={neighborsMap} />
        </section>

        {/* Mobile category pills */}
        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categoryList.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-ring"
              >
                {formatCategory(cat)} ({byCategory[cat].length})
              </button>
            ))}
          </div>
        </div>

        {/* Recently Updated */}
        {recentEntries.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-2xl font-normal tracking-tight text-heading text-balance">
                Recently updated
              </h2>
              <span className="text-sm text-muted-foreground">
                Last {recentEntries.length} changes
              </span>
            </div>

            <div className="space-y-6">
              {bucketOrder.map(
                (bucket) =>
                  groupedByTime[bucket] && (
                    <div key={bucket}>
                      <h3 className="mb-2 text-xs font-semibold tracking-tight text-muted-foreground">
                        {bucket}
                      </h3>
                      <div className="divide-y divide-border/40 rounded-xl border border-border bg-card">
                        {groupedByTime[bucket].map((entry) => (
                          <Link
                            key={entry.slug}
                            href={`/wiki/${entry.slug}`}
                            className="group flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-secondary first:rounded-t-xl last:rounded-b-xl focus-ring rounded-sm"
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-normal text-foreground truncate group-hover:text-primary transition-colors">
                                {entry.title}
                              </div>
                              {entry.summary && (
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                  {entry.summary}
                                </p>
                              )}
                            </div>
                            <span className="hidden sm:block text-xs text-muted-foreground/60 shrink-0">
                              {formatCategory(entry.category)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          </section>
        )}

        {/* Category Cards */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-normal tracking-tight text-heading text-balance">
              Browse by category
            </h2>
            <span className="text-sm text-muted-foreground">
              {stats.categoryCount} categories · {stats.total} articles
            </span>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {Object.entries(byCategory).map(([category, entries]) => (
              <div
                key={category}
                id={`cat-${category}`}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold tracking-tight text-heading">
                      {formatCategory(category)}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Latest {formatUpdatedDate(entries[0]?.updated)}</span>
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {entries.length}
                  </span>
                </div>

                <div className="flex-1 space-y-0.5">
                  {entries.slice(0, 5).map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/wiki/${entry.slug}`}
                      className="block truncate rounded-md px-2 py-1.5 text-sm font-normal text-foreground transition-colors hover:bg-secondary"
                      title={entry.title}
                    >
                      <span className="truncate">{entry.title}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-border/60">
                  <button
                    onClick={() => setActiveOverlay(category)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors duration-200 hover:text-accent focus-ring rounded active:scale-[0.97]"
                  >
                    View all {entries.length} articles
                    <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom bar */}
        <section className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="font-medium text-foreground">{stats.total}</strong>{' '}
              articles
            </span>
            <span>
              <strong className="font-medium text-foreground">{stats.totalLinks}</strong>{' '}
              links
            </span>
            <span>
              <strong className="font-medium text-foreground">{stats.orphanCount}</strong>{' '}
              orphans
            </span>
          </div>

          <Link
            href="/graph"
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-all duration-200 hover:bg-primary hover:text-primary-foreground active:scale-[0.97] focus-ring"
          >
            <GitBranch className="h-4 w-4" />
            Explore Graph
          </Link>
        </section>
      </div>

      {/* Overlay */}
      {activeOverlay && (
        <CategoryOverlay
          category={activeOverlay}
          entries={byCategory[activeOverlay]}
          onClose={() => setActiveOverlay(null)}
        />
      )}
    </div>
  );
}

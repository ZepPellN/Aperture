'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { WikiArticle } from '@/lib/wiki-loader';
import { Shuffle, ArrowRight, ArrowLeft, Compass, RefreshCw } from 'lucide-react';
import { formatCategory } from '@/lib/utils';

interface WalkNode {
  slug: string;
  title: string;
  category: string;
  score: number;
}

interface WalkViewProps {
  articles: WikiArticle[];
  neighborsMap: Record<string, WalkNode[]>;
}

export default function WalkView({ articles, neighborsMap }: WalkViewProps) {
  const articleMap = useMemo(() => new Map(articles.map((a) => [a.slug, a])), [articles]);
  const slugs = useMemo(() => articles.map((a) => a.slug), [articles]);

  const [history, setHistory] = useState<string[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // Pick a random starting article on mount
  useEffect(() => {
    if (slugs.length > 0 && !currentSlug) {
      const random = slugs[Math.floor(Math.random() * slugs.length)];
      setCurrentSlug(random);
      setHistory([random]);
    }
  }, [slugs, currentSlug]);

  const currentArticle = articleMap.get(currentSlug);
  const neighbors = neighborsMap[currentSlug] ?? [];

  const goTo = useCallback(
    (slug: string) => {
      setDirection('forward');
      setCurrentSlug(slug);
      setHistory((prev) => [...prev, slug]);
    },
    []
  );

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      setDirection('back');
      setCurrentSlug(next[next.length - 1]);
      return next;
    });
  }, []);

  const shuffle = useCallback(() => {
    const random = slugs[Math.floor(Math.random() * slugs.length)];
    setDirection('forward');
    setCurrentSlug(random);
    setHistory((prev) => [...prev, random]);
  }, [slugs]);

  if (!currentArticle) {
    return (
      <div className="mx-auto max-w-3xl text-center py-20 text-muted-foreground">
        <Compass className="mx-auto h-8 w-8 mb-3 opacity-50" />
        <p>Loading walk...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          <h1 className="font-serif text-xl font-normal tracking-tight text-heading">
            Random Walk
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            disabled={history.length <= 1}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            onClick={shuffle}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary active:scale-[0.97]"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Shuffle
          </button>
        </div>
      </div>

      {/* Breadcrumb / path indicator */}
      <div className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground overflow-hidden">
        <span className="shrink-0">Path:</span>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {history.slice(-5).map((slug, i) => {
            const article = articleMap.get(slug);
            const isCurrent = slug === currentSlug;
            return (
              <span key={`${slug}-${i}`} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ArrowRight className="h-3 w-3 opacity-40" />}
                <span
                  className={`truncate max-w-[120px] ${
                    isCurrent ? 'text-foreground font-medium' : ''
                  }`}
                >
                  {article?.title ?? slug}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Article card */}
      <article
        className={`wiki-article max-w-none rounded-xl border border-border bg-card p-6 transition-all duration-300 ${
          direction === 'forward' ? 'opacity-100 translate-x-0' : 'opacity-100 translate-x-0'
        }`}
      >
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            {formatCategory(currentArticle.category)}
          </span>
          <span>·</span>
          <span>{currentArticle.readingTime} min read</span>
        </div>

        <h2 className="font-serif mb-4 text-2xl font-normal tracking-tight text-heading text-balance">
          {currentArticle.title}
        </h2>

        <div
          className="wiki-article-content"
          dangerouslySetInnerHTML={{ __html: currentArticle.html }}
        />
      </article>

      {/* Next steps */}
      {neighbors.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-heading">Continue walking</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {neighbors.slice(0, 4).map((neighbor) => (
              <button
                key={neighbor.slug}
                onClick={() => goTo(neighbor.slug)}
                className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-sm active:scale-[0.97]"
              >
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {formatCategory(neighbor.category)}
                  </div>
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {neighbor.title}
                  </div>
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-1.5">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {(neighbor.score * 100).toFixed(0)}%
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View full article link */}
      <div className="mt-6 text-center">
        <Link
          href={`/wiki/${currentArticle.slug}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary"
        >
          Open full article
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

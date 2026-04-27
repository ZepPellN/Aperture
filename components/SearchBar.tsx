'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Sparkles } from 'lucide-react';
import { formatCategory } from '@/lib/utils';

interface SearchEntry {
  slug: string;
  category: string;
  title: string;
  summary?: string;
}

interface NeighborNode {
  slug: string;
  title: string;
  category: string;
  score: number;
}

interface SearchBarProps {
  entries: SearchEntry[];
  neighborsMap?: Record<string, NeighborNode[]>;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/15 text-foreground rounded px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function SearchBar({ entries, neighborsMap }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [semanticMode, setSemanticMode] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    // 1. Keyword matches
    const keywordMatches = entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.summary?.toLowerCase().includes(q) ?? false)
    );

    if (!semanticMode || !neighborsMap) {
      return keywordMatches.slice(0, 10).map((e) => ({ ...e, source: 'keyword' as const }));
    }

    // 2. Semantic expansion
    const seen = new Set<string>(keywordMatches.map((e) => e.slug));
    const expanded: Array<SearchEntry & { source: 'keyword' | 'semantic'; score?: number }> =
      keywordMatches.map((e) => ({ ...e, source: 'keyword' as const }));

    for (const match of keywordMatches.slice(0, 5)) {
      const neighbors = neighborsMap[match.slug];
      if (!neighbors) continue;
      for (const n of neighbors.slice(0, 3)) {
        if (seen.has(n.slug)) continue;
        seen.add(n.slug);
        const entry = entries.find((e) => e.slug === n.slug);
        if (entry) {
          expanded.push({ ...entry, source: 'semantic', score: n.score });
        }
      }
    }

    return expanded.slice(0, 12);
  }, [query, entries, semanticMode, neighborsMap]);

  const showResults = focused && query.trim().length > 0;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all ${
          focused
            ? 'border-primary/50 shadow-sm'
            : 'border-border hover:border-muted-foreground/30'
        }`}
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search articles, categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-muted-foreground/70 placeholder:font-light focus-ring"
        />
        {neighborsMap && (
          <button
            onClick={() => setSemanticMode(!semanticMode)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200 ${
              semanticMode
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            title={semanticMode ? 'Semantic expansion ON' : 'Semantic expansion OFF'}
          >
            <Sparkles className="h-3 w-3" />
            {semanticMode ? 'Semantic' : 'Keyword'}
          </button>
        )}
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto py-2">
              {results.map((entry) => (
                <Link
                  key={`${entry.slug}-${entry.source}`}
                  href={`/wiki/${entry.slug}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-foreground truncate">
                        <Highlight text={entry.title} query={query} />
                      </div>
                      {entry.source === 'semantic' && (
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          semantic
                        </span>
                      )}
                    </div>
                    {entry.summary && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        <Highlight text={entry.summary} query={query} />
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground/70">
                      <span>{formatCategory(entry.category)}</span>
                      {entry.source === 'semantic' && entry.score && (
                        <span className="tabular-nums">{(entry.score * 100).toFixed(0)}% match</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found for &quot;<Highlight text={query} query={query} />&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { formatCategory } from '@/lib/utils';

interface SearchEntry {
  slug: string;
  category: string;
  title: string;
  summary?: string;
}

interface SearchBarProps {
  entries: SearchEntry[];
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

export default function SearchBar({ entries }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return entries
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.summary?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 10);
  }, [query, entries]);

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
                  key={entry.slug}
                  href={`/wiki/${entry.slug}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      <Highlight text={entry.title} query={query} />
                    </div>
                    {entry.summary && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        <Highlight text={entry.summary} query={query} />
                      </p>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground/70">
                      {formatCategory(entry.category)}
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

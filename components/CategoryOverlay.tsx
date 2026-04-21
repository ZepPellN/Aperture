'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowUpRight } from 'lucide-react';

interface OverlayEntry {
  slug: string;
  title: string;
  summary?: string;
  updated?: string;
}

interface CategoryOverlayProps {
  category: string;
  entries: OverlayEntry[];
  onClose: () => void;
}

export default function CategoryOverlay({
  category,
  entries,
  onClose,
}: CategoryOverlayProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const displayName = category.replace(/-/g, ' ');

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-background/80 backdrop-blur-sm p-4 pt-16 sm:pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/95 backdrop-blur px-6 py-4">
          <div>
            <h2 className="font-serif text-xl font-medium text-heading capitalize">
              {displayName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entries.length} articles
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Article list */}
        <div className="divide-y divide-border/40">
          {entries.map((entry) => (
            <Link
              key={entry.slug}
              href={`/wiki/${entry.slug}`}
              className="group flex items-start gap-3 px-6 py-4 transition-colors hover:bg-secondary"
            >
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {entry.title}
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                {entry.summary && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {entry.summary}
                  </p>
                )}
              </div>
              {entry.updated && (
                <span className="hidden sm:block text-xs text-muted-foreground shrink-0">
                  {entry.updated}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

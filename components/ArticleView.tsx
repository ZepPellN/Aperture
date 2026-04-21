'use client';

import Link from 'next/link';
import type { WikiArticle } from '@/lib/wiki-loader';
import { ArrowLeft, Clock, Calendar, Hash, GitBranch } from 'lucide-react';

interface ArticleViewProps {
  article: WikiArticle;
  backlinks: { from: string; label: string }[];
}

export default function ArticleView({ article, backlinks }: ArticleViewProps) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
        <span>/</span>
        <span className="capitalize">{article.category.replace(/-/g, ' ')}</span>
      </div>

      {/* Header */}
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="font-serif mb-3 text-3xl font-normal tracking-tight text-heading sm:text-4xl">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {article.lastModified && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Updated {article.lastModified}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{article.readingTime} min read</span>
          </div>
          <div className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            <span>{article.wordCount.toLocaleString()} words</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <article
        className="wiki-article max-w-none"
        dangerouslySetInnerHTML={{ __html: article.html }}
      />

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="mb-3 text-lg font-medium text-heading">Linked from</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {backlinks.map((link) => (
              <li key={link.from}>
                <Link
                  href={`/wiki/${link.from}`}
                  className="block rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

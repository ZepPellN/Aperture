'use client';

import Link from 'next/link';
import type { WikiArticle } from '@/lib/wiki-loader';
import { ArrowLeft, Clock, Calendar, Hash } from 'lucide-react';

interface ArticleViewProps {
  article: WikiArticle;
  backlinks: { from: string; label: string }[];
}

export default function ArticleView({ article, backlinks }: ArticleViewProps) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="flex items-center gap-1 hover:text-zinc-800">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
        <span>/</span>
        <span className="capitalize">{article.category.replace(/-/g, ' ')}</span>
      </div>

      {/* Header */}
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
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
        className="wiki-article prose prose-zinc max-w-none"
        dangerouslySetInnerHTML={{ __html: article.html }}
      />

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <section className="mt-10 border-t border-zinc-200 pt-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Linked from</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {backlinks.map((link) => (
              <li key={link.from}>
                <Link
                  href={`/wiki/${link.from}`}
                  className="block rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
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

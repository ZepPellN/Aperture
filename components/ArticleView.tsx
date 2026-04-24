'use client';

import Link from 'next/link';
import type { WikiArticle } from '@/lib/wiki-loader';
import { ArrowLeft, Clock, Calendar, Hash, GitBranch } from 'lucide-react';
import { formatCategory } from '@/lib/utils';
import SemanticTrail from '@/components/SemanticTrail';

interface ArticleViewProps {
  article: WikiArticle;
  backlinks: { from: string; label: string }[];
  semanticTrail?: { slug: string; title: string; category: string; score: number }[];
}

export default function ArticleView({ article, backlinks, semanticTrail }: ArticleViewProps) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/"
          className="flex items-center gap-1 transition-colors duration-200 hover:text-foreground rounded focus-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
        <span>/</span>
        <span>{formatCategory(article.category)}</span>
      </div>

      {/* Header */}
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="font-serif mb-3 text-3xl font-normal tracking-tight text-heading text-balance sm:text-4xl">
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

      {/* Semantic Trail — placed before Sources */}
      {semanticTrail && semanticTrail.length > 0 && (
        <SemanticTrail currentSlug={article.slug} trail={semanticTrail} />
      )}

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
                  className="block rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-all duration-200 hover:border-primary/30 hover:shadow-sm focus-ring"
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

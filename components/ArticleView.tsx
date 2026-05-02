'use client';

import Link from 'next/link';
import type { WikiArticle } from '@/lib/wiki-loader';
import { ArrowLeft, Clock, Calendar, Hash, GitBranch, FileText, ExternalLink } from 'lucide-react';
import { formatCategory } from '@/lib/utils';
import SemanticTrail from '@/components/SemanticTrail';

interface ArticleViewProps {
  article: WikiArticle;
  backlinks: { from: string; label: string }[];
  semanticTrail?: { slug: string; title: string; category: string; score: number }[];
}

function formatSourceOrigin(origin: string) {
  return origin === 'absorb_log' ? 'absorb log' : origin;
}

function contributionClass(contribution?: string) {
  if (contribution === 'high') return 'border-primary/20 bg-primary/10 text-primary';
  if (contribution === 'medium') return 'border-border bg-secondary text-foreground';
  if (contribution === 'low') return 'border-border bg-muted text-muted-foreground';
  return 'border-border bg-card text-muted-foreground';
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
        <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-heading text-balance sm:text-4xl">
            {article.title}
          </h1>
          <Link
            href={`/graph?focus=${encodeURIComponent(article.slug)}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-secondary active:scale-[0.98] focus-ring"
          >
            <GitBranch className="h-4 w-4" strokeWidth={1.5} />
            <span>View in Graph</span>
          </Link>
        </div>
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

      {/* Sources */}
      {article.sources.length > 0 && (
        <section className="mt-10 border-t border-border pt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-heading">
              Sources
            </h2>
            <span className="text-xs text-muted-foreground">
              Synthesized from {article.sources.length} source{article.sources.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {article.sources.map((source) => {
              const row = (
                <span className="flex min-w-0 items-start justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="flex min-w-0 items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                    <span className="min-w-0">
                      <span className="block truncate text-foreground">{source.label}</span>
                      {source.summary && (
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {source.summary}
                        </span>
                      )}
                      {source.sections && source.sections.length > 0 && (
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {source.sections.join(' · ')}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {source.contribution && source.contribution !== 'unknown' && (
                      <span className={`rounded-full border px-2 py-0.5 font-medium ${contributionClass(source.contribution)}`}>
                        {source.contribution}
                      </span>
                    )}
                    <span>{formatSourceOrigin(source.origin)}</span>
                    {source.href && <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  </span>
                </span>
              );

              return (
                <li key={`${source.origin}:${source.path}`}>
                  {source.href ? (
                    source.href.startsWith('http') ? (
                      <a
                        href={source.href}
                        target="_blank"
                        rel="noreferrer"
                        className="block transition-colors duration-200 hover:bg-secondary/70 focus-ring"
                      >
                        {row}
                      </a>
                    ) : (
                      <Link
                        href={source.href}
                        className="block transition-colors duration-200 hover:bg-secondary/70 focus-ring"
                      >
                        {row}
                      </Link>
                    )
                  ) : (
                    <span className="block" title={source.path}>
                      {row}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

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

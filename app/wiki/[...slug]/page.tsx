import WikiLayout from '@/components/WikiLayout';
import ArticleView from '@/components/ArticleView';
import { loadArticle, loadAllArticles, getBacklinks, getWikiFiles, filePathToSlug, getWikiDir } from '@/lib/wiki-loader';
import { getNeighborsFor } from '@/lib/semantic-neighbors';
import { buildLocalGraph } from '@/lib/graph-builder';
import { notFound } from 'next/navigation';

interface WikiPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const files = getWikiFiles(getWikiDir());
  return files.map((file) => ({
    slug: filePathToSlug(file).split('/'),
  }));
}

function sanitizeDescription(content: string): string {
  return content
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown links
    .replace(/!?\[\[([^\]]*)\]\]/g, '$1') // wikilinks
    .replace(/[#*_`>\-]/g, '') // markdown syntax chars
    .replace(/\n+/g, ' ') // newlines to spaces
    .trim()
    .slice(0, 160);
}

export async function generateMetadata({ params }: WikiPageProps) {
  const { slug } = await params;
  const article = await loadArticle(slug.join('/'));
  if (!article) return { title: 'Not Found — Aperture' };
  const description = sanitizeDescription(article.content);
  return {
    title: article.title,
    description,
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      authors: ['Aperture'],
      publishedTime: article.lastModified || undefined,
      tags: article.category ? [article.category] : undefined,
    },
    twitter: {
      card: 'summary',
      title: article.title,
      description,
    },
  };
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { slug } = await params;
  const slugStr = slug.join('/');

  const [article, allArticles] = await Promise.all([
    loadArticle(slugStr),
    loadAllArticles(),
  ]);

  if (!article) {
    notFound();
  }

  const backlinks = getBacklinks(allArticles, slugStr).map((b) => ({
    from: b.from,
    label: b.label,
  }));

  // Enrich semantic neighbors with article metadata
  const slugToArticle = new Map(allArticles.map((a) => [a.slug, a]));
  const rawNeighbors = getNeighborsFor(slugStr);
  const semanticTrail = rawNeighbors
    .map((n) => {
      const neighbor = slugToArticle.get(n.slug);
      if (!neighbor) return null;
      return {
        slug: n.slug,
        title: neighbor.title,
        category: neighbor.category,
        score: n.score,
      };
    })
    .filter((n): n is NonNullable<typeof n> => n !== null);
  const miniGraph = buildLocalGraph(allArticles, slugStr);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://github.com/ZepPellN/Aperture';
  const articleUrl = `${baseUrl}/wiki/${article.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: sanitizeDescription(article.content),
    url: articleUrl,
    author: {
      '@type': 'Organization',
      name: 'Aperture',
      url: 'https://github.com/ZepPellN/Aperture',
    },
    datePublished: article.lastModified || undefined,
    dateModified: article.lastModified || undefined,
    articleSection: article.category || undefined,
    wordCount: article.wordCount,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Aperture',
      url: baseUrl,
    },
    about: article.sources.map((s) => ({
      '@type': 'Thing',
      name: s.label,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WikiLayout>
        <ArticleView
          article={article}
          backlinks={backlinks}
          semanticTrail={semanticTrail}
          miniGraph={miniGraph}
        />
      </WikiLayout>
    </>
  );
}

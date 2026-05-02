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

export async function generateMetadata({ params }: WikiPageProps) {
  const { slug } = await params;
  const article = await loadArticle(slug.join('/'));
  if (!article) return { title: 'Not Found — Aperture' };
  return {
    title: `${article.title} — Aperture`,
    description: article.content.slice(0, 160),
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

  return (
    <WikiLayout>
      <ArticleView
        article={article}
        backlinks={backlinks}
        semanticTrail={semanticTrail}
        miniGraph={miniGraph}
      />
    </WikiLayout>
  );
}

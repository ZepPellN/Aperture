import WikiLayout from '@/components/WikiLayout';
import ArticleView from '@/components/ArticleView';
import { loadArticle, loadAllArticles, getBacklinks, getWikiFiles, filePathToSlug, getWikiDir } from '@/lib/wiki-loader';
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
  if (!article) return { title: 'Not Found — Loom' };
  return {
    title: `${article.title} — Loom`,
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

  return (
    <WikiLayout>
      <ArticleView article={article} backlinks={backlinks} />
    </WikiLayout>
  );
}

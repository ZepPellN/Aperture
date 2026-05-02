import {
  filePathToSlug,
  getBacklinks,
  getWikiDir,
  getWikiFiles,
  loadAllArticles,
  loadArticle,
} from '@/lib/wiki-loader';
import { getNeighborsFor } from '@/lib/semantic-neighbors';
import { NextResponse } from 'next/server';

interface WikiApiRouteProps {
  params: Promise<{
    slug: string[];
  }>;
}

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const files = getWikiFiles(getWikiDir());
  return files.map((file) => ({
    slug: filePathToSlug(file).split('/'),
  }));
}

export async function GET(_request: Request, { params }: WikiApiRouteProps) {
  const { slug } = await params;
  const slugStr = slug.join('/');
  const [article, allArticles] = await Promise.all([
    loadArticle(slugStr),
    loadAllArticles(),
  ]);

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const articleBySlug = new Map(allArticles.map((item) => [item.slug, item]));
  const semanticNeighbors = getNeighborsFor(slugStr)
    .map((neighbor) => {
      const neighborArticle = articleBySlug.get(neighbor.slug);
      if (!neighborArticle) return null;
      return {
        slug: neighbor.slug,
        title: neighborArticle.title,
        category: neighborArticle.category,
        score: neighbor.score,
      };
    })
    .filter((neighbor): neighbor is NonNullable<typeof neighbor> => neighbor !== null);

  return NextResponse.json({
    slug: article.slug,
    title: article.title,
    category: article.category,
    content: article.content,
    html: article.html,
    frontmatter: article.frontmatter,
    sources: article.sources,
    evolution: article.evolution,
    backlinks: getBacklinks(allArticles, slugStr).map((backlink) => ({
      slug: backlink.from,
      title: backlink.label,
    })),
    semantic_neighbors: semanticNeighbors,
    reading_time: article.readingTime,
    word_count: article.wordCount,
    last_modified: article.lastModified,
  });
}

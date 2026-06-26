import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, Share2, Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import ContributorCard from '../components/ContributorCard';
import type { Article, Contributor } from '../types/database';

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, contributor:contributors(*)')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setArticle(data);
          if (data.contributor) {
            setContributor(data.contributor as Contributor);
          }

          // Fetch related articles based on tags
          if (data.tags && data.tags.length > 0) {
            const { data: related } = await supabase
              .from('articles')
              .select('*')
              .neq('id', data.id)
              .overlaps('tags', data.tags)
              .limit(3);
            if (related) setRelatedArticles(related);
          }
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6" />
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Article Not Found
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          The article you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
        <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Home
        </Link>
        <span>/</span>
        {article.section && (
          <>
            <Link
              to={`/${article.section.slug}`}
              className="hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              {article.section.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-900 dark:text-white">{article.title}</span>
      </nav>

      {/* Article Header */}
      <article className="prose prose-emerald dark:prose-invert max-w-none">
        <header className="mb-8 not-prose">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            {article.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <div className="flex gap-2">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div
          className="text-slate-600 dark:text-slate-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
        />

        {/* Tags */}
        {article.tags.length > 3 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 not-prose">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Contributor Signature Card */}
      {contributor && (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Written by
          </h2>
          <ContributorCard contributor={contributor} />
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Related Articles
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <ArticleCard key={related.id} article={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

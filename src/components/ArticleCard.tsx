import { Link } from 'react-router-dom';
import { Clock, Tag, ArrowRight } from 'lucide-react';
import type { Article } from '../types/database';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const articlePath = article.section
    ? `/${article.section.slug}/${article.slug}`
    : `/article/${article.slug}`;

  if (featured) {
    return (
      <Link
        to={articlePath}
        className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-sky-400 p-1 shadow-xl shadow-sky-500/10"
      >
        <div className="relative h-full bg-zinc-50 dark:bg-zinc-700 rounded-xl p-6">
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full">
              Featured
            </span>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors pr-20">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-3 text-zinc-600 dark:text-zinc-400 line-clamp-2">{article.excerpt}</p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 text-sm font-medium group-hover:gap-2 transition-all">
              Read more <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={articlePath}
      className="group card p-5 hover:border-sky-400/40 dark:hover:border-sky-500/40"
    >
      <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{article.excerpt}</p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
        {article.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{article.tags[0]}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

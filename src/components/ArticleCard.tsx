import { Link } from 'react-router-dom';
import { Clock, Tag, ArrowRight } from 'lucide-react';
import type { Article } from '../types/database';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (featured) {
    return (
      <Link
        to={`/${article.slug}`}
        className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-xl shadow-emerald-500/10"
      >
        <div className="relative h-full bg-white dark:bg-slate-900 rounded-xl p-6">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
              Featured
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors pr-20">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-3 text-slate-600 dark:text-slate-400 line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
              Read more <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/${article.slug}`}
      className="group card p-5 hover:border-emerald-300 dark:hover:border-emerald-700"
    >
      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {article.excerpt}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
        {article.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {article.tags[0]}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

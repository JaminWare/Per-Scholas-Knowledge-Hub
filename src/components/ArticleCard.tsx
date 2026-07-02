import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, ArrowRight } from 'lucide-react';
import CardZoomOverlay from './CardZoomOverlay';
import type { Article } from '../types/database';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const [zoomed, setZoomed] = useState(false);

  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const articlePath = article.section
    ? `/${article.section.slug}/${article.slug}`
    : `/article/${article.slug}`;

  const cardContent = (
    <>
      {featured && (
        <div className="flex justify-end mb-2">
          <span className="px-2 py-1 text-xs font-medium bg-sky-100/70 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 rounded-full">
            Featured
          </span>
        </div>
      )}
      <h3 className={`font-semibold transition-colors ${
        featured
          ? 'text-xl font-bold text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-800 dark:text-zinc-100'
      }`}>
        {article.title}
      </h3>
      {article.excerpt && (
        <p className={`mt-2 text-zinc-500 dark:text-zinc-400 line-clamp-2 ${featured ? 'mt-3 text-zinc-600 dark:text-zinc-400' : 'text-sm'}`}>
          {article.excerpt}
        </p>
      )}
      <div className={`mt-4 flex items-center justify-between ${featured ? '' : ''}`}>
        <div className={`flex items-center gap-2 text-zinc-400 dark:text-zinc-500 ${featured ? 'text-sm' : 'text-xs'}`}>
          <Clock className={featured ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>{formattedDate}</span>
        </div>
        {!featured && article.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600" />
            <span className="text-xs text-zinc-500 dark:text-zinc-600">{article.tags[0]}</span>
          </div>
        )}
      </div>
    </>
  );

  if (featured) {
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-sky-400 p-1 shadow-xl shadow-sky-500/10">
        <div className="relative h-full bg-white dark:bg-zinc-900 rounded-xl flex flex-col">
          <div
            className="cursor-zoom-in p-6 pb-0"
            onClick={() => setZoomed(true)}
          >
            {cardContent}
          </div>
          <div className="px-6 pb-6 pt-4 mt-auto">
            <Link
              to={articlePath}
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 text-sm font-medium hover:gap-2 transition-all"
            >
              Read more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <CardZoomOverlay open={zoomed} onClose={() => setZoomed(false)}>
          <div className="p-6">{cardContent}</div>
        </CardZoomOverlay>
      </div>
    );
  }

  return (
    <div className="group card flex flex-col hover:border-sky-400/40 dark:hover:border-sky-500/40">
      <div
        className="cursor-zoom-in p-5 pb-0"
        onClick={() => setZoomed(true)}
      >
        {cardContent}
      </div>
      <div className="px-5 pb-5 pt-3 mt-auto">
        <Link
          to={articlePath}
          className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 text-sm font-medium hover:gap-2 transition-all"
        >
          Read more <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <CardZoomOverlay open={zoomed} onClose={() => setZoomed(false)}>
        <div className="p-5">{cardContent}</div>
      </CardZoomOverlay>
    </div>
  );
}

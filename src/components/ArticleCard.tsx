import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, ArrowRight, ExternalLink } from 'lucide-react';
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

  const isExternalLink = article.content?.startsWith('http://') || article.content?.startsWith('https://');

  const articlePath = article.section
    ? `/${article.section.slug}/${article.slug}`
    : `/article/${article.slug}`;

  const cardContent = (
    <>
      {featured && (
        <div className="flex justify-end mb-2">
          <span className="px-2 py-1 text-xs font-medium bg-sky-500/20 text-sky-300 rounded-full">
            Featured
          </span>
        </div>
      )}
      <h3 className={`font-semibold transition-colors ${
        featured
          ? 'text-xl font-bold text-white'
          : 'text-white'
      }`}>
        {article.title}
      </h3>
      {article.excerpt && (
        <p className={`mt-2 text-zinc-400 line-clamp-2 ${featured ? 'mt-3' : 'text-sm'}`}>
          {article.excerpt}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <div className={`flex items-center gap-2 text-zinc-500 ${featured ? 'text-sm' : 'text-xs'}`}>
          <Clock className={featured ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>{formattedDate}</span>
        </div>
        {!featured && article.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">{article.tags[0]}</span>
          </div>
        )}
      </div>
    </>
  );

  const linkElement = isExternalLink ? (
    <a
      href={article.content}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 hover:gap-2.5 transition-all duration-200"
    >
      Open resource <ExternalLink className="w-4 h-4" />
    </a>
  ) : (
    <Link
      to={articlePath}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 hover:gap-2.5 transition-all duration-200"
    >
      Read full article <ArrowRight className="w-4 h-4" />
    </Link>
  );

  const overlayFooter = (
    <div className="mt-4 pt-4 border-t border-zinc-700/60">
      {linkElement}
    </div>
  );

  if (featured) {
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-700/60 flex flex-col">
        <div
          className="cursor-zoom-in p-6 pb-0"
          onClick={() => setZoomed(true)}
        >
          {cardContent}
        </div>
        <div className="px-6 pb-6 pt-4 mt-auto">
          {isExternalLink ? (
            <a
              href={article.content}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 text-sm font-medium hover:gap-2 hover:text-sky-300 transition-all"
            >
              Open resource <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <Link
              to={articlePath}
              className="inline-flex items-center gap-1 text-sky-400 text-sm font-medium hover:gap-2 hover:text-sky-300 transition-all"
            >
              Read more <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <CardZoomOverlay open={zoomed} onClose={() => setZoomed(false)}>
          <div className="p-6">
            {cardContent}
            {overlayFooter}
          </div>
        </CardZoomOverlay>
      </div>
    );
  }

  return (
    <div className="group flex flex-col rounded-xl border overflow-hidden transition-all duration-300 ease-out bg-gradient-to-r from-zinc-900 to-zinc-950 border-zinc-700/60 hover:border-zinc-600">
      <div
        className="cursor-zoom-in p-5 pb-0"
        onClick={() => setZoomed(true)}
      >
        {cardContent}
      </div>
      <div className="px-5 pb-5 pt-3 mt-auto">
        {isExternalLink ? (
          <a
            href={article.content}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-400 text-sm font-medium hover:gap-2 hover:text-sky-300 transition-all"
          >
            Open resource <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <Link
            to={articlePath}
            className="inline-flex items-center gap-1 text-sky-400 text-sm font-medium hover:gap-2 hover:text-sky-300 transition-all"
          >
            Read more <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <CardZoomOverlay open={zoomed} onClose={() => setZoomed(false)}>
        <div className="p-5">
          {cardContent}
          {overlayFooter}
        </div>
      </CardZoomOverlay>
    </div>
  );
}

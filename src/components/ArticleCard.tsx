import { Link } from 'react-router-dom';
import { Clock, Tag, ArrowRight } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
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
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-sky-400 p-1 shadow-xl shadow-sky-500/10">
        <div className="relative h-full bg-white dark:bg-zinc-900 rounded-xl flex flex-col">
          <Zoom>
            <div className="cursor-zoom-in p-6 pb-0">
              <div className="flex justify-end">
                <span className="px-2 py-1 text-xs font-medium bg-sky-100/70 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 rounded-full">
                  Featured
                </span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 group-hover:text-sky-600 dark:group-hover:text-sky-500 transition-colors pr-20">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="mt-3 text-zinc-600 dark:text-zinc-400 line-clamp-2">{article.excerpt}</p>
              )}
              <div className="mt-4 flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </Zoom>
          <div className="px-6 pb-6 pt-4 mt-auto">
            <Link
              to={articlePath}
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 text-sm font-medium hover:gap-2 transition-all"
            >
              Read more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group card flex flex-col hover:border-sky-400/40 dark:hover:border-sky-500/40">
      <Zoom>
        <div className="cursor-zoom-in p-5 pb-0">
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
                <Tag className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600" />
                <span className="text-xs text-zinc-500 dark:text-zinc-600">{article.tags[0]}</span>
              </div>
            )}
          </div>
        </div>
      </Zoom>
      <div className="px-5 pb-5 pt-3 mt-auto">
        <Link
          to={articlePath}
          className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 text-sm font-medium hover:gap-2 transition-all"
        >
          Read more <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

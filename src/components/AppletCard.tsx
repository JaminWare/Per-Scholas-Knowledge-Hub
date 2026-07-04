import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb } from 'lucide-react';
import CardZoomOverlay from './CardZoomOverlay';
import type { ArticleWithContributor } from '../hooks/useArticles';

export const CARD_WIDTH = 'w-[280px] sm:w-[320px] md:w-[350px] shrink-0 snap-start';

export const KNOWN_AUTHORS: Record<string, string> = {
  'core1-networking/firewall-basics':               'Jamin Ware',
  'core1-troubleshooting/command-documentation':    'Jamin Ware',
  'core2-os/snap-in':                              'Jamin Ware',
  'healthcare-hipaa/intro-healthcare-it-security':  'Jamin Ware',
  'healthcare-ehr/cloud-computing-healthcare':      'Jamin Ware',
  'ai-prompt-engineering-healthcare':               'Jamin Ware',
  'core2-os/cli-runbook':                           'Jamin Ware',
  'study-tips/acronyms':                            'Cohort Lead',
  'healthcare-ehr':                                 'Jamin Ware',
  'healthcare-ehr/integration':                     'Jamin Ware',
  'healthcare-clinical/cpoe':                       'Jamin Ware',
  'learner-experience/navigation':                  'Jamin Ware',
  'learner-experience/adding-intel':                'Jamin Ware',
};

export function parseAuthorFromExcerpt(excerpt: string | null | undefined): string | null {
  if (!excerpt?.startsWith('Contributed by ')) return null;
  return excerpt.replace('Contributed by ', '').trim() || null;
}

export function AppletCard({ article, gridMode = false }: { article: ArticleWithContributor; gridMode?: boolean }) {
  const [zoomed, setZoomed] = useState(false);
  const isSample = article.is_sample;
  const authorName = (article.contributor as { name: string } | null)?.name
    ?? KNOWN_AUTHORS[article.slug]
    ?? parseAuthorFromExcerpt(article.excerpt)
    ?? article.author_name
    ?? (isSample ? '[OPEN SLOT]' : 'Jamin Ware');

  const widthClass = gridMode ? 'w-full' : CARD_WIDTH;
  const isExternalLink = article.content?.startsWith('http://') || article.content?.startsWith('https://');

  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const cardContent = (
    <>
      {isSample && (
        <div className="flex justify-end mb-2">
          <span className="px-2 py-1 text-xs font-medium bg-sky-500/20 text-sky-300 rounded-full">
            Open Slot
          </span>
        </div>
      )}
      <h3 className="font-semibold text-white transition-colors">
        {article.title}
      </h3>
      {!isSample && (
        <p className="text-xs text-zinc-400 mt-1">
          by {article.author || authorName}
        </p>
      )}
      {!isSample && article.excerpt && !article.excerpt.startsWith('Contributed by ') && (
        <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{article.excerpt}</p>
      )}
      {isSample && (
        <p className="mt-2 text-sm text-sky-400">
          This curriculum endpoint is open for peer contribution.
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{formattedDate}</span>
        </div>
        {!isSample && article.tags?.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">{article.tags[0]}</span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={`${widthClass} group flex flex-col rounded-xl border overflow-hidden transition-all duration-300 ease-out bg-gradient-to-r from-zinc-800 to-zinc-900 border-zinc-700/60 hover:border-zinc-600`}>
      <div
        className="cursor-zoom-in p-5 pb-0"
        onClick={() => setZoomed(true)}
      >
        {cardContent}
      </div>
      <div className="px-5 pb-5 pt-3 mt-auto">
        {isExternalLink || article.submission_type === 'Resource Link' ? (
          <a
            href={article.content}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-400 text-sm font-medium hover:gap-2 hover:text-sky-300 transition-all"
          >
            Open resource <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <Link
            to={`/article/${article.slug}`}
            className="inline-flex items-center gap-1 text-sky-400 text-sm font-medium hover:gap-2 hover:text-sky-300 transition-all"
          >
            Read more <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <CardZoomOverlay open={zoomed} onClose={() => setZoomed(false)}>
        <div className="p-5">
          {cardContent}
          <div className="mt-4 pt-4 border-t border-zinc-700/60">
            {isExternalLink || article.submission_type === 'Resource Link' ? (
              <a
                href={article.content}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 hover:gap-2.5 transition-all duration-200"
              >
                Open resource <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <Link
                to={`/article/${article.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 hover:gap-2.5 transition-all duration-200"
              >
                Read full article <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </CardZoomOverlay>
    </div>
  );
}

export function AppletSkeleton({ gridMode = false }: { gridMode?: boolean }) {
  const widthClass = gridMode ? 'w-full' : CARD_WIDTH;
  return (
    <div className={`${widthClass} bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 animate-pulse`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
      </div>
      <div className="h-9 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
    </div>
  );
}

export function OpenSlotPlaceholder({
  domain,
  context,
  onContribute,
  gridMode = false,
}: {
  domain: string;
  context: string;
  onContribute: () => void;
  gridMode?: boolean;
}) {
  const widthClass = gridMode ? 'w-full' : CARD_WIDTH;
  return (
    <div className={`${widthClass} group flex flex-col rounded-xl border overflow-hidden bg-slate-50 dark:bg-zinc-900 border-sky-200/60 dark:border-zinc-800`}>
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 dark:bg-zinc-900/80"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse flex-shrink-0" />
          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">open-slot</span>
        </div>
        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wider flex-shrink-0 bg-sky-500/20 text-sky-400 border border-sky-500/20" style={{ textShadow: '0 0 8px rgba(56,189,248,0.8)' }}>
          [OPEN SLOT]
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-sky-400 to-sky-500 shadow-sky-500/20">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
              {domain}{context}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[8px] font-bold">?</span>
              </div>
              <span className="text-[11px] text-slate-900 dark:text-white truncate font-mono font-bold tracking-wider transition-colors duration-200 group-hover:text-sky-600 dark:group-hover:text-sky-400" style={{ textShadow: '0 0 6px rgba(56,189,248,0.6)' }}>[OPEN SLOT]</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 bg-slate-100/60 dark:bg-sky-500/10 rounded-lg px-2.5 py-2 border border-sky-200/60 dark:border-sky-500/20" style={{ textShadow: '0 0 6px rgba(56,189,248,0.4)' }}>
          This curriculum endpoint is currently open for peer review and documentation.
        </p>
        <button
          type="button"
          onClick={onContribute}
          className="mt-auto inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border bg-sky-500/10 hover:bg-sky-500 text-sky-700 dark:text-sky-400 hover:text-white border-sky-500/20 hover:border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]"
        >
          Add Intel
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

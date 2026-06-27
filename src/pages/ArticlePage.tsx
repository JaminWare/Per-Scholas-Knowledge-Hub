import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Bookmark, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { articleContentMap } from '../data/articles';
import type { Article, Contributor } from '../types/database';

// Section titles used in banner track labels
const sectionTrackLabels: Record<string, string> = {
  'core1-networking':      'COMPTIA A+ CORE 1 — NETWORKING',
  'core1-troubleshooting': 'COMPTIA A+ CORE 1 — TROUBLESHOOTING',
  'core1-mobile':          'COMPTIA A+ CORE 1 — MOBILE DEVICES',
  'core1-hardware':        'COMPTIA A+ CORE 1 — HARDWARE',
  'core1-cloud':           'COMPTIA A+ CORE 1 — CLOUD',
  'core2-os':              'COMPTIA A+ CORE 2 — OPERATING SYSTEMS',
  'core2-security':        'COMPTIA A+ CORE 2 — SECURITY',
  'core2-software':        'COMPTIA A+ CORE 2 — SOFTWARE TROUBLESHOOTING',
  'core2-operations':      'COMPTIA A+ CORE 2 — OPERATIONS',
  'healthcare-hipaa':      'ADVANCED HEALTHCARE IT — HIPAA SECURITY',
  'healthcare-ehr':        'ADVANCED HEALTHCARE IT — EHR ARCHITECTURE',
  'healthcare-clinical':   'ADVANCED HEALTHCARE IT — CLINICAL WORKFLOWS',
  'azari-prompt-playbook': 'AI PROMPT PLAYBOOK',
  'study-tips':            'STUDY TIPS',
  'quick-references':      'QUICK REFERENCES',
  'diagrams':              'DIAGRAMS',
};

// Role badge styles
const roleBadgeStyles: Record<string, string> = {
  'Founder':             'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
  'HealthIT Specialist': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Reference Author':    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Core 1 Expert':       'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'Core 2 Expert':       'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  'Playbook Engineer':   'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

function deriveTrackLabel(article: Article): string {
  if (article.section) {
    const key = article.section.slug;
    return sectionTrackLabels[key] ?? article.section.title.toUpperCase();
  }
  // Derive from slug prefix when section join is unavailable
  const prefix = article.slug.split('/')[0];
  return sectionTrackLabels[prefix] ?? 'LEARNERS KNOWLEDGE BASE';
}

function deriveAuthorName(contributor: Contributor | null, article: Article): string {
  if (contributor?.name) return contributor.name;
  // Featured research articles default to Jamin Ware
  const featuredSlugs = ['firewall-basics', 'command-documentation', 'snap-in', 'intro-healthcare-it-security', 'cloud-computing-healthcare', 'ai-prompt-engineering-healthcare'];
  if (featuredSlugs.includes(article.slug)) return 'Jamin Ware';
  return 'Knowledge Base';
}

export default function ArticlePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.split('/').filter(Boolean).pop() ?? '';
  const [article, setArticle] = useState<Article | null>(null);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      if (!slug) { setIsLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, contributor:contributors(*), section:sections(*)')
          .eq('slug', slug)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setArticle(data);
          if (data.contributor) setContributor(data.contributor as Contributor);
          if (data.tags && data.tags.length > 0) {
            const { data: related } = await supabase
              .from('articles')
              .select('*')
              .neq('id', data.id)
              .overlaps('tags', data.tags)
              .limit(3);
            if (related) setRelatedArticles(related);
          }
        } else if (articleContentMap[slug]) {
          setArticle({
            id: slug,
            slug,
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            content: articleContentMap[slug],
            excerpt: null,
            section_id: null,
            contributor_id: null,
            tags: [],
            is_featured: false,
            source_file: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        if (articleContentMap[slug]) {
          setArticle({
            id: slug,
            slug,
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            content: articleContentMap[slug],
            excerpt: null,
            section_id: null,
            contributor_id: null,
            tags: [],
            is_featured: false,
            source_file: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-6" />
        <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">Article Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          The article you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const markdownContent = articleContentMap[article.slug] ?? article.content;
  const authorName = deriveAuthorName(contributor, article);
  const trackLabel = deriveTrackLabel(article);
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Previous Page
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-5">
        <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Home</Link>
        <span>/</span>
        {article.section && (
          <>
            <Link
              to={`/${article.section.slug}`}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              {article.section.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-800 dark:text-zinc-100 truncate max-w-xs">{article.title}</span>
      </nav>

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-sky-950 border border-zinc-700/50 p-8 mb-8">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Track label row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30">
              <BookOpen className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
              {trackLabel}
            </span>
          </div>

          {/* Article title */}
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-5 leading-tight">
            {article.title}
          </h1>

          {/* Contributor row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-sky-500/20">
                {authorInitial}
              </div>
              <span className="text-sm font-medium text-zinc-200">{authorName}</span>
            </div>

            {/* Role badge */}
            {authorName === 'Jamin Ware' && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeStyles['Founder']}`}>
                [Founder]
              </span>
            )}
            {contributor?.name && contributor.name !== 'Jamin Ware' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400">
                [Contributor]
              </span>
            )}

            {/* Tags */}
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs bg-zinc-700/60 text-zinc-300 border border-zinc-600/40"
              >
                {tag}
              </span>
            ))}

            {/* Actions */}
            <div className="ml-auto flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Article body ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 md:p-8">
        <MarkdownRenderer content={markdownContent} />
      </div>

      {/* All tags */}
      {article.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Related Articles</h2>
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

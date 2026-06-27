import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Bookmark, BookOpen, ExternalLink, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { articleContentMap } from '../data/articles';
import type { Article, Contributor } from '../types/database';

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

const roleBadgeStyles: Record<string, string> = {
  'Founder':             'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
  'HealthIT Specialist': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Reference Author':    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Core 1 Expert':       'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'Core 2 Expert':       'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  'Playbook Engineer':   'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

const BLUEPRINT_OUTLINE = `### 1. Architectural Overview
*Provide a high-level summary of the protocol, system component, or administrative tool.*

### 2. Core Technical Requirements & Configurations
*Detail step-by-step terminal commands, registry paths, or network ports crucial to this domain.*

### 3. Real-World Troubleshooting Scenario
*Map out a common failure state (e.g., device enrollment failure, boot loops, or network configuration errors) and the direct mitigation steps.*

### 4. References & Peer Citations
*List official documentation links (e.g., Microsoft Learn, AWS Architecture Whitepapers, or HHS/NIST guidelines).*`;

function deriveTrackLabel(article: Article): string {
  if (article.section) {
    const key = article.section.slug;
    return sectionTrackLabels[key] ?? article.section.title.toUpperCase();
  }
  const prefix = article.slug.split('/')[0];
  return sectionTrackLabels[prefix] ?? 'LEARNERS KNOWLEDGE BASE';
}

function deriveAuthorName(contributor: Contributor | null, article: Article): string {
  if (contributor?.name) return contributor.name;
  const featuredSlugs = ['firewall-basics', 'command-documentation', 'snap-in', 'intro-healthcare-it-security', 'cloud-computing-healthcare', 'ai-prompt-engineering-healthcare'];
  if (featuredSlugs.includes(article.slug)) return 'Jamin Ware';
  return 'Knowledge Base';
}

function makeLocalArticle(slug: string): Article {
  return {
    id: slug,
    slug,
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    content: articleContentMap[slug],
    excerpt: null,
    section_id: null,
    contributor_id: null,
    tags: [],
    is_featured: false,
    is_sample: false,
    study_category: null,
    source_file: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
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
          setArticle(makeLocalArticle(slug));
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        if (articleContentMap[slug]) setArticle(makeLocalArticle(slug));
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

  const isSample = article.is_sample === true || article.title.includes('[Sample]');
  const markdownContent = articleContentMap[article.slug] ?? article.content;
  const authorName = deriveAuthorName(contributor, article);
  const trackLabel = deriveTrackLabel(article);
  const authorInitial = authorName.charAt(0).toUpperCase();

  function handleBack() {
    if (article?.section?.slug) {
      navigate('/' + article.section.slug);
    } else {
      navigate(-1);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {article.section ? `Back to ${article.section.title}` : 'Back'}
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
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Track label */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30">
              <BookOpen className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">{trackLabel}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-5 leading-tight">
            {article.title}
          </h1>

          {/* Author row */}
          <div className="flex flex-wrap items-center gap-3">
            {isSample ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-dashed border-zinc-500/60 text-xs font-semibold text-zinc-400 bg-zinc-800/40">
                [Sample Learner — Open Slot]
              </span>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-sky-500/20">
                    {authorInitial}
                  </div>
                  <span className="text-sm font-medium text-zinc-200">{authorName}</span>
                </div>
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
              </>
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
        {isSample ? (
          <div className="space-y-6">
            {/* Call-out block */}
            <div className="rounded-lg border border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/8 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-500/20 flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest mb-1">Context Blueprint — Active Template Slot</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    This is an open slot in the Cohort Knowledge Base awaiting a peer contribution. Research the topic, follow the structural outline below, then use the submission panel to claim this applet.
                  </p>
                </div>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
              >
                Submit Your Contribution
              </Link>
            </div>

            {/* Blueprint outline via MarkdownRenderer */}
            <MarkdownRenderer content={BLUEPRINT_OUTLINE} />
          </div>
        ) : (
          <MarkdownRenderer content={markdownContent} />
        )}
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

      {/* References & Citations — only for live articles */}
      {!isSample && (
        <div className="mt-8 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-200 dark:border-amber-500/20">
            <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">References &amp; Citations</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Contributors: add your references and citations using standard format (APA, MLA, or URL) in your submission via the portal below. External links will open in a new tab.
            </p>
          </div>
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

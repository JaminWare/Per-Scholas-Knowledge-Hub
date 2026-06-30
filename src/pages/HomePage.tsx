import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import UniqueHacksGrid from '../components/UniqueHacksGrid';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';
import { type NewSubmission } from '../utils/submissions';
import { normalizeCategory } from '../utils/normalizeCategory';
import SuccessToast from '../components/SuccessToast';
import type { Article } from '../types/database';
import {
  TrendingUp, ArrowRight, ArrowDown, Users, UploadCloud,
  Shield, Terminal, Monitor, ChevronRight, Award,
} from 'lucide-react';

const researchArticles = [
  {
    slug: 'firewall-basics',
    title: 'The Role of Firewalls in Modern Network Security',
    excerpt: 'A comprehensive breakdown of Windows Defender Firewall, inbound/outbound rule strategies, and defense-in-depth posture.',
    icon: Shield,
    color: 'from-sky-500 to-cyan-400',
    tag: 'Network Security',
  },
  {
    slug: 'command-documentation',
    title: 'Command-Line Interface (CLI) Research',
    excerpt: 'Analytical reference of essential CLI tools for systems administration, networking, and cloud environments.',
    icon: Terminal,
    color: 'from-zinc-600 to-zinc-500',
    tag: 'Systems Admin',
  },
  {
    slug: 'snap-in',
    title: 'Microsoft Management Console (MMC) Snap-ins',
    excerpt: 'Deep-dive into Task Scheduler, Performance Monitor, and Group Policy Editor — with real-world administrative use cases.',
    icon: Monitor,
    color: 'from-blue-500 to-sky-400',
    tag: 'Windows Administration',
  },
];

export default function HomePage({ onRefresh }: { onRefresh?: () => void }) {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [recentArticles,   setRecentArticles]   = useState<Article[]>([]);
  const [isLoading,        setIsLoading]         = useState(true);
  const [modalOpen,        setModalOpen]         = useState(false);
  const [toastVisible,     setToastVisible]      = useState(false);
  const [toastMessage,     setToastMessage]      = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, recentRes, approvedSubsRes] = await Promise.all([
          supabase.from('articles').select('*, contributor:contributors(*)').eq('is_featured', true).limit(3),
          supabase.from('articles').select('*, contributor:contributors(*)').eq('is_sample', false).order('created_at', { ascending: false }).limit(6),
          supabase.from('submissions').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(6),
        ]);
        if (featuredRes.data) setFeaturedArticles(featuredRes.data);

        const dbArticles = (recentRes.data ?? []).map((a: any) => ({
          ...a,
          study_category: normalizeCategory(a.study_category ?? '', a.title ?? ''),
        }));
        const approvedSubs = (approvedSubsRes.data ?? []).map((s: any) => ({
          id: s.id,
          title: s.title,
          slug: s.title
            ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            : `submission-${s.id}`,
          section_id: null,
          content: s.content ?? '',
          formatted_content: s.formatted_content ?? null,
          excerpt: `Contributed by ${s.full_name}`,
          contributor_id: null,
          tags: s.badge ? [s.badge] : [],
          is_featured: false,
          is_sample: false,
          study_category: normalizeCategory(s.track ?? '', s.title ?? ''),
          source_file: null,
          author_name: s.full_name ?? null,
          submission_type: s.submission_type ?? null,
          created_at: s.created_at,
          updated_at: s.created_at,
        })) as Article[];

        const existingTitles = new Set(dbArticles.map((a) => (a.title ?? '').toLowerCase().trim()));
        const merged = [...dbArticles, ...approvedSubs.filter((s) => !existingTitles.has((s.title ?? '').toLowerCase().trim()))];
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentArticles(merged.slice(0, 8));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmitted = (submission: NewSubmission) => {
    setToastMessage(`${submission.full_name} — "${submission.title}" added to the wall!`);
    setToastVisible(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">

        {/* ── Main content column (3/4 width) ───────────────── */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-10">

          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-sky-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-sky-950 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4" />
                <span>Pioneering Cohort</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Per Scholas — Learners Knowledge Base
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-300 mt-1">
                  AI-Enabled Healthcare IT
                </span>
              </h1>
              <p className="text-lg text-zinc-300 max-w-2xl">
                Welcome to the collaborative resource hub for the{' '}
                <strong className="text-sky-400">2026-RTT-23 cohort</strong> of AI-Enabled Healthcare IT
                students. Find CompTIA A+ guides, EHR integration blueprints, and community hacks — all in
                one place.
              </p>
            </div>
          </section>

          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-6">Featured Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} featured />
                ))}
              </div>
            </section>
          )}

          {/* Unique Hacks Quick-Reference Grid */}
          <UniqueHacksGrid />

          {/* Research Articles */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Research Articles</h2>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700">
                Cohort 2026-RTT-23
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {researchArticles.map((r) => {
                const Icon = r.icon;
                return (
                  <Link
                    key={r.slug}
                    to={`/article/${r.slug}`}
                    className="group block card p-5 hover:border-sky-400/40 dark:hover:border-sky-500/40 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{r.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                        {r.tag}
                      </span>
                      <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Articles */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Recent Articles</h2>
            </div>
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-200 rounded w-3/4" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-200 rounded w-full mt-3" />
                  </div>
                ))}
              </div>
            ) : recentArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentArticles.filter((a) => a.title !== '[OPEN SLOT]').map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Award className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-500">No articles yet. Check back soon!</p>
              </div>
            )}
          </section>

        </div>{/* end main column */}

        {/* ── Right sidebar control console ─────────────────── */}
        <aside className="lg:col-span-1 space-y-4 mt-6 lg:mt-28">

          {/* Pulsing arrow drawing attention to submission CTA */}
          <div className="flex justify-center py-2">
            <ArrowDown className="animate-bounce text-blue-400 w-10 h-10 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
          </div>

          {/* Widget 1 — Contribute Placard (opens modal) */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-full min-w-[260px] flex flex-row items-center justify-start text-left p-6 min-h-[160px] h-auto bg-gradient-to-r from-blue-50 to-sky-50 dark:from-zinc-800 dark:to-zinc-900 border border-blue-200 dark:border-zinc-700/60 rounded-xl cursor-pointer shadow-[0_0_15px_rgba(96,165,250,0.3)] hover:shadow-[0_0_25px_rgba(96,165,250,0.5)] hover:border-blue-300 dark:hover:border-blue-700/50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/25 transition-colors">
                <UploadCloud className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold whitespace-normal break-words tracking-normal leading-relaxed text-zinc-800 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-200">
                  Contribute to the Hub
                </p>
                <p className="text-xs whitespace-normal break-words leading-relaxed text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Submit new articles, references, or lab notes
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </div>
          </button>

          {/* Widget 2 — View Detailed Portfolios emblem */}
          <Link
            to="/recognition"
            className="block w-full min-w-[260px] flex flex-row items-center justify-start text-left p-6 min-h-[160px] h-auto bg-gradient-to-r from-sky-50 to-slate-50 dark:from-zinc-800 dark:to-zinc-900 border border-sky-200 dark:border-zinc-700/60 rounded-xl hover:shadow-lg hover:shadow-sky-500/10 hover:border-sky-300 dark:hover:border-sky-700/60 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-500/15 flex-shrink-0">
                <Users className="w-7 h-7 text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold whitespace-normal break-words tracking-normal leading-relaxed text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-200">
                  View Detailed Portfolios →
                </p>
                <p className="text-xs whitespace-normal break-words leading-relaxed text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Explore full contributor portfolios
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-sky-400 transition-colors flex-shrink-0" />
            </div>
          </Link>

        </aside>

      </div>{/* end grid */}

      <ContributorSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={handleSubmitted}
        onRefresh={onRefresh}
      />

      <SuccessToast
        message={toastMessage}
        isVisible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </>
  );
}

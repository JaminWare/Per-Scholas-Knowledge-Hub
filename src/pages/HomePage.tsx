import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import UniqueHacksGrid from '../components/UniqueHacksGrid';
import ContributorSubmissionModal, { type NewSubmission } from '../components/ContributorSubmissionModal';
import SuccessToast from '../components/SuccessToast';
import type { Article } from '../types/database';
import {
  TrendingUp, ArrowRight, Users, UploadCloud, X,
  Shield, Terminal, Monitor, ChevronRight, Award, Send, Loader2, CheckCircle,
} from 'lucide-react';

const LS_KEY = 'lkb_submissions';

type QuickType = 'Article' | 'Resource Link' | 'Support Ticket';

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

export default function HomePage() {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [recentArticles,   setRecentArticles]   = useState<Article[]>([]);
  const [isLoading,        setIsLoading]         = useState(true);
  const [modalOpen,        setModalOpen]         = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [latestSubmission, setLatestSubmission]  = useState<NewSubmission | null>(null);
  const [toastVisible,     setToastVisible]      = useState(false);
  const [toastMessage,     setToastMessage]      = useState('');

  // Quick Submission Portal form state
  const [quickName,        setQuickName]         = useState('');
  const [quickType,        setQuickType]         = useState<QuickType>('Article');
  const [quickTitle,       setQuickTitle]        = useState('');
  const [quickExcerpt,     setQuickExcerpt]      = useState('');
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [quickSubmitDone,  setQuickSubmitDone]   = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          supabase.from('articles').select('*, contributor:contributors(*)').eq('is_featured', true).limit(3),
          supabase.from('articles').select('*, contributor:contributors(*)').order('created_at', { ascending: false }).limit(6),
        ]);
        if (featuredRes.data) setFeaturedArticles(featuredRes.data);
        if (recentRes.data)   setRecentArticles(recentRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmitted = (submission: NewSubmission) => {
    setLatestSubmission(submission);
    setToastMessage(`${submission.full_name} — "${submission.title}" added to the wall!`);
    setToastVisible(true);
  };

  const handleQuickSubmit = async () => {
    if (!quickName.trim() || !quickTitle.trim() || isQuickSubmitting) return;
    setIsQuickSubmitting(true);
    try {
      const badge = quickType === 'Resource Link' ? 'Reference Author' : 'Cohort Contributor';
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          full_name: quickName.trim(),
          title: quickTitle.trim(),
          content: quickExcerpt.trim(),
          track: 'General',
          badge,
          submission_type: quickType,
        })
        .select()
        .single();

      if (!error && data) {
        const submission: NewSubmission = {
          id: data.id,
          full_name: data.full_name,
          track: data.track,
          badge: data.badge,
          title: data.title,
          content: data.content,
          submission_type: data.submission_type,
          created_at: data.created_at,
        };
        // Persist to localStorage so RecognitionPage can read it
        try {
          const existing: NewSubmission[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
          localStorage.setItem(LS_KEY, JSON.stringify([submission, ...existing]));
        } catch { /* ignore */ }
        handleSubmitted(submission);
        setQuickSubmitDone(true);
        setQuickName('');
        setQuickType('Article');
        setQuickTitle('');
        setQuickExcerpt('');
        setTimeout(() => {
          setQuickSubmitDone(false);
          setIsSubmitModalOpen(false);
        }, 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* ── Main content column (3/4 width) ───────────────── */}
        <div className="lg:col-span-3 space-y-10">

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
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">Featured Articles</h2>
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
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Research Articles</h2>
              <span className="text-xs text-zinc-600 dark:text-zinc-500 font-medium px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
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
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
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
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Recent Articles</h2>
            </div>
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mt-3" />
                  </div>
                ))}
              </div>
            ) : recentArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentArticles.map((article) => (
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
        <aside className="lg:col-span-1 space-y-3">

          {/* Widget 1 — Contribute Placard (opens modal) */}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="w-full text-left bg-gradient-to-r from-amber-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 border border-amber-200 dark:border-zinc-700/60 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-300 dark:hover:border-amber-700/50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex-shrink-0 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/25 transition-colors">
                <UploadCloud className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-200">
                  Contribute to the Hub
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Submit new articles, references, or lab notes
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-amber-400 transition-colors flex-shrink-0" />
            </div>
          </button>

          {/* Widget 2 — View Detailed Portfolios emblem */}
          <Link
            to="/recognition"
            className="block w-full bg-gradient-to-r from-sky-50 to-slate-50 dark:from-zinc-800 dark:to-zinc-900 border border-sky-200 dark:border-zinc-700/60 rounded-xl p-4 hover:shadow-lg hover:shadow-sky-500/10 hover:border-sky-300 dark:hover:border-sky-700/60 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex-shrink-0">
                <Users className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-200">
                  View Detailed Portfolios →
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Explore full contributor portfolios
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-sky-400 transition-colors flex-shrink-0" />
            </div>
          </Link>

        </aside>

      </div>{/* end grid */}

      <ContributorSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={handleSubmitted}
      />

      {/* ── Quick-submit modal overlay ─────────────────── */}
      {isSubmitModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsSubmitModalOpen(false); }}
        >
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-md p-6 space-y-4">

            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/15">
                  <UploadCloud className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-none">Contribute to the Hub</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Cohort 2026-RTT-23</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Full Name */}
            <input
              type="text"
              placeholder="Your Full Name"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all"
            />

            {/* Submission Type */}
            <select
              value={quickType}
              onChange={(e) => setQuickType(e.target.value as QuickType)}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all cursor-pointer"
            >
              <option value="Article">Article</option>
              <option value="Resource Link">Resource Link</option>
              <option value="Support Ticket">Support Ticket</option>
            </select>

            {/* Title */}
            <input
              type="text"
              placeholder="Title of your contribution"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all"
            />

            {/* Description / Excerpt */}
            <textarea
              rows={3}
              placeholder="Brief description or excerpt…"
              value={quickExcerpt}
              onChange={(e) => setQuickExcerpt(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all resize-none"
            />

            {/* Primary action */}
            <button
              onClick={handleQuickSubmit}
              disabled={isQuickSubmitting || !quickName.trim() || !quickTitle.trim()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                quickSubmitDone
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isQuickSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : quickSubmitDone ? (
                <><CheckCircle className="w-4 h-4" /> Submitted!</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Your Contribution</>
              )}
            </button>

          </div>
        </div>
      )}

      <SuccessToast
        message={toastMessage}
        isVisible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </>
  );
}

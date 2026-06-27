import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import CohortRecognitionWall from '../components/CohortRecognitionWall';
import UniqueHacksGrid from '../components/UniqueHacksGrid';
import ContributorSubmissionModal, { type NewSubmission } from '../components/ContributorSubmissionModal';
import SuccessToast from '../components/SuccessToast';
import type { Article } from '../types/database';
import {
  BookOpen, Eye, Users, Target, TrendingUp, ArrowRight,
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

const stats = [
  { label: 'Total Collective Insights', value: '148 Articles', icon: BookOpen },
  { label: 'Total Resource Views',      value: '2,450',        icon: Eye },
  { label: 'Active Contributors',       value: '25', subtext: 'Cohort 2026-RTT-23', icon: Users },
  { label: 'Hand-Off Readiness',        value: '85%', subtext: 'Completed', icon: Target },
];

export default function HomePage() {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [recentArticles,   setRecentArticles]   = useState<Article[]>([]);
  const [isLoading,        setIsLoading]         = useState(true);
  const [modalOpen,        setModalOpen]         = useState(false);
  const [latestSubmission, setLatestSubmission]  = useState<NewSubmission | null>(null);
  const [toastVisible,     setToastVisible]      = useState(false);
  const [toastMessage,     setToastMessage]      = useState('');

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

          {/* Hub Activity Overview */}
          <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{stat.value}</p>
                      {stat.subtext && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{stat.subtext}</p>
                      )}
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-500/10">
                      <Icon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                  </div>
                </div>
              );
            })}
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
              <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
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
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
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
                <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-500">No articles yet. Check back soon!</p>
              </div>
            )}
          </section>

        </div>{/* end main column */}

        {/* ── Right sidebar — Recognition Wall widget ────────── */}
        <aside className="lg:col-span-1 lg:sticky lg:top-6 space-y-3">
          <CohortRecognitionWall
            newSubmission={latestSubmission}
            onClaimBadge={() => setModalOpen(true)}
          />

          {/* View Detailed Portfolios CTA */}
          <Link
            to="/recognition"
            className="flex items-center justify-between gap-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-400/50 dark:hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                View Detailed Portfolios
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-amber-500 transition-colors flex-shrink-0" />
          </Link>
        </aside>

      </div>{/* end grid */}

      <ContributorSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={handleSubmitted}
      />

      <SuccessToast
        message={toastMessage}
        isVisible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </>
  );
}

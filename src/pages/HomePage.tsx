import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';
import { type NewSubmission } from '../utils/submissions';
import { useArticles } from '../hooks/useArticles';
import SuccessToast from '../components/SuccessToast';
import contentMap from '../data/contentMap';
import {
  TrendingUp, ArrowDown, Users, UploadCloud,
  Compass, BookOpen, Flame, Briefcase, ChevronRight, Award, LifeBuoy,
} from 'lucide-react';

const PINNED_SLUGS = ['learner-experience/navigation', 'learner-experience/adding-intel'] as const;

function buildPinnedArticles() {
  return PINNED_SLUGS.map((slug) => {
    const entry = contentMap[slug];
    const introBlock = entry?.content.find((b) => b.type === 'intro');
    return {
      id: `local-${slug}`,
      title: entry?.title ?? slug,
      slug,
      section_id: null,
      content: '',
      formatted_content: null,
      excerpt: introBlock && 'text' in introBlock ? introBlock.text.slice(0, 160) : null,
      contributor_id: null,
      tags: entry?.tags ?? [],
      is_featured: true,
      is_sample: false,
      study_category: null,
      source_file: null,
      author_name: entry?.contributor ?? null,
      submission_type: 'Quick Reference',
      comp_objective: null,
      created_at: entry?.date || new Date().toISOString(),
      updated_at: entry?.date || new Date().toISOString(),
    };
  });
}

const survivalGuideCards = [
  {
    id: 'onboarding',
    title: 'Onboarding Hurdles',
    description: 'Canvas workflows, VM setups, and tool access.',
    icon: Compass,
    accentClass: 'hover:border-sky-400/50 dark:hover:border-sky-500/40',
    iconBg: 'bg-gradient-to-br from-sky-500 to-sky-400 shadow-sky-500/20',
    tab: 'onboarding',
  },
  {
    id: 'lab-survival',
    title: 'Lab Survival Guides',
    description: 'EHR sandboxes, Active Directory, and infrastructure.',
    icon: BookOpen,
    accentClass: 'hover:border-sky-400/50 dark:hover:border-sky-500/40',
    iconBg: 'bg-gradient-to-br from-sky-500 to-sky-400 shadow-sky-500/20',
    tab: 'labs',
  },
  {
    id: 'mid-program',
    title: 'The Mid-Program Slump',
    description: 'Mental endurance, imposter syndrome, and time management.',
    icon: Flame,
    accentClass: 'hover:border-amber-400/50 dark:hover:border-amber-500/40',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-400 shadow-amber-500/20',
    tab: 'slump',
  },
  {
    id: 'job-hunt',
    title: 'Job Hunt & Certs',
    description: 'Test-day strategies, resume reality checks, and interviews.',
    icon: Briefcase,
    accentClass: 'hover:border-sky-400/50 dark:hover:border-sky-500/40',
    iconBg: 'bg-gradient-to-br from-zinc-600 to-zinc-500 shadow-zinc-500/20',
    tab: 'job',
  },
];

export default function HomePage({ onRefresh }: { onRefresh?: () => void }) {
  const { articles: allArticles, isLoading } = useArticles();
  const [modalOpen,    setModalOpen]    = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const sortedData = useMemo(() => {
    return [...allArticles]
      .filter((a) => !a.is_sample && a.title !== '[OPEN SLOT]')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allArticles]);

  const featuredArticles = useMemo(() => {
    const pinned = buildPinnedArticles();
    const pinnedSlugs = new Set(PINNED_SLUGS as readonly string[]);
    const organic = sortedData
      .filter((a) => a.is_featured === true && !pinnedSlugs.has(a.slug))
      .slice(0, 3);
    return [...pinned, ...organic];
  }, [sortedData]);
  const recentArticles   = useMemo(() => sortedData.slice(0, 6), [sortedData]);

  const handleSubmitted = (submission: NewSubmission) => {
    setToastMessage(`${submission.full_name}"${submission.title}" added to the wall!`);
    setToastVisible(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">

        {/* ── Main content column (3/4 width) ───────────────── */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-10">

          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-r from-zinc-900 to-zinc-950">
            <div className="relative px-6 py-8 md:px-8 md:py-10">
              <div className="max-w-2xl flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Per Scholas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                    </span>
                    <span className="font-mono text-[11px] tracking-wider text-emerald-400/90">2026-RTT-23 | STATUS: ACTIVE</span>
                  </div>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                  Learners Hub
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-300 text-base md:text-lg font-semibold mt-0.5">
                    AI Enabled Healthcare IT
                  </span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-zinc-400">Welcome to the collaborative resource hub!</p>
                  <Link
                    to="/learner-experience?tab=onboarding"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/30 hover:shadow-sky-400/40 hover:scale-[1.02] whitespace-nowrap flex-shrink-0"
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Start Here
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* The Cohort Survival Guide */}
          <section>
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-700/60 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Cohort Survival Guide</h2>
                  <p className="text-sm text-zinc-400">Real talk from learners who've been there</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {survivalGuideCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Link
                      key={card.id}
                      to={`/learner-experience?tab=${card.tab}`}
                      className="group flex items-start gap-4 p-4 text-left bg-zinc-900/80 border border-zinc-800 rounded-xl transition-all hover:border-zinc-700/60 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform ${card.iconBg}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-white">
                            {card.title}
                          </p>
                          <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{card.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-700/60">
                <Link
                  to="/learner-experience"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Explore the full Learner Experience Hub &rarr;
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
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

          {/* Recent Articles */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Recent Field Notes</h2>
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
        <aside className="lg:col-span-1 space-y-4 mt-6 lg:mt-28">

          {/* Pulsing arrow drawing attention to submission CTA */}
          <div className="flex justify-center py-2">
            <ArrowDown className="animate-bounce text-sky-400 w-10 h-10 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
          </div>

          {/* Widget 1Contribute Placard (opens modal) */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-full min-w-[260px] flex flex-row items-center justify-start text-left p-6 min-h-[160px] h-auto bg-gradient-to-r from-sky-50 to-sky-50 dark:from-zinc-800 dark:to-zinc-900 border border-sky-200 dark:border-zinc-700/60 rounded-xl cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:border-sky-300 dark:hover:border-sky-700/50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-500/15 flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-sky-500/25 transition-colors">
                <UploadCloud className="w-7 h-7 text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold whitespace-normal break-words tracking-normal leading-relaxed text-zinc-800 dark:text-zinc-100 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors duration-200">
                  Add Intel
                </p>
                <p className="text-xs whitespace-normal break-words leading-relaxed text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Submit field notes, workflow hacks, or study intel
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-sky-400 transition-colors flex-shrink-0" />
            </div>
          </button>

          {/* Widget 2View Detailed Portfolios emblem */}
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
                  View Detailed Portfolios &rarr;
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

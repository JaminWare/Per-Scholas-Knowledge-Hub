import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';
import { type NewSubmission } from '../utils/submissions';
import { useArticles } from '../hooks/useArticles';
import SuccessToast from '../components/SuccessToast';
import contentMap from '../data/contentMap';
import {
  TrendingUp, Users, UploadCloud,
  Compass, BookOpen, Flame, Briefcase, ChevronRight, Award, LifeBuoy, ChevronDown,
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
    accentClass: 'hover:border-zinc-700',
    iconBg: 'bg-sky-500',
    tab: 'onboarding',
  },
  {
    id: 'lab-survival',
    title: 'Lab Survival Guides',
    description: 'EHR sandboxes, Active Directory, and infrastructure.',
    icon: BookOpen,
    accentClass: 'hover:border-zinc-700',
    iconBg: 'bg-sky-500',
    tab: 'labs',
  },
  {
    id: 'mid-program',
    title: 'The Mid Program Slump',
    description: 'Mental endurance, imposter syndrome, and time management.',
    icon: Flame,
    accentClass: 'hover:border-zinc-700',
    iconBg: 'bg-amber-500',
    tab: 'slump',
  },
  {
    id: 'job-hunt',
    title: 'Job Hunt & Certs',
    description: 'Test day strategies, resume reality checks, and interviews.',
    icon: Briefcase,
    accentClass: 'hover:border-zinc-700',
    iconBg: 'bg-zinc-600',
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-start">

        {/* ── Main content column (3/4 width) ───────────────── */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-8">

          {/* Hero - Floating Pane */}
          <section className="relative overflow-hidden rounded-[24px] border border-zinc-800/40 bg-zinc-900 shadow-xl shadow-black/20">
            <div className="relative px-6 py-8 md:px-8 md:py-10">
              <div className="max-w-2xl flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Per Scholas</span>
                  </div>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                  Learners Hub
                  <span className="block text-sky-400 text-base md:text-lg font-semibold mt-0.5">
                    AI Enabled Healthcare IT
                  </span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-zinc-400">Welcome to the collaborative resource hub!</p>
                  <Link
                    to="/learner-experience"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-colors whitespace-nowrap flex-shrink-0 outline-none select-none"
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Start Here
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Cohort Survival Guide - Collapsible Floating Pane */}
          <section className="bg-zinc-900 rounded-[24px] border border-zinc-800/40 shadow-xl shadow-black/20 p-6 md:p-8">
            <details open>
              <summary className="flex items-center gap-3 cursor-pointer select-none outline-none group">
                <div className="p-2 rounded-lg bg-sky-500">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-zinc-100 font-medium text-lg md:text-xl tracking-tight">Cohort Survival Guide</h2>
                  <p className="text-sm text-zinc-500">Real talk from learners who've been there</p>
                </div>
                <ChevronDown className="w-5 h-5 text-zinc-500 details-chevron flex-shrink-0 group-hover:text-zinc-300 transition-colors" />
              </summary>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {survivalGuideCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Link
                      key={card.id}
                      to={`/learner-experience?tab=${card.tab}`}
                      className="group/card flex items-start gap-4 p-4 text-left bg-zinc-950/50 rounded-xl border border-zinc-800/50 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 outline-none select-none"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/card:scale-105 transition-transform ${card.iconBg}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-white">
                            {card.title}
                          </p>
                          <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover/card:text-sky-400 group-hover/card:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{card.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <Link
                  to="/learner-experience"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Explore the full Learner Experience Hub &rarr;
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </details>
          </section>

          {/* Featured Articles - Floating Pane */}
          {featuredArticles.length > 0 && (
            <section className="bg-zinc-900 rounded-[24px] border border-zinc-800/40 shadow-xl shadow-black/20 p-6 md:p-8">
              <h2 className="text-zinc-100 font-medium text-lg md:text-xl tracking-tight mb-6">Featured Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} featured />
                ))}
              </div>
            </section>
          )}

          {/* Recent Articles - Collapsible Floating Pane */}
          <section className="bg-zinc-900 rounded-[24px] border border-zinc-800/40 shadow-xl shadow-black/20 p-6 md:p-8">
            <details open>
              <summary className="flex items-center justify-between cursor-pointer select-none outline-none group">
                <h2 className="text-zinc-100 font-medium text-lg md:text-xl tracking-tight">Recent Field Notes</h2>
                <ChevronDown className="w-5 h-5 text-zinc-500 details-chevron flex-shrink-0 group-hover:text-zinc-300 transition-colors" />
              </summary>

              <div className="mt-6">
                {isLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="card p-5 animate-pulse">
                        <div className="h-5 bg-zinc-800 rounded w-3/4" />
                        <div className="h-4 bg-zinc-800 rounded w-full mt-3" />
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
                    <Award className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-500">No articles yet. Check back soon!</p>
                  </div>
                )}
              </div>
            </details>
          </section>

        </div>{/* end main column */}

        {/* ── Right sidebar control console ─────────────────── */}
        <aside className="lg:col-span-1 space-y-4 mt-6 lg:mt-10">

          {/* Widget 1 - Contribute */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-full min-w-[260px] flex flex-row items-center justify-start text-left px-5 py-4 bg-zinc-900 border border-zinc-800/40 rounded-[20px] shadow-xl shadow-black/20 cursor-pointer hover:border-zinc-700 transition-all duration-200 group outline-none select-none"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2.5 rounded-xl bg-sky-500/15 flex-shrink-0 group-hover:bg-sky-500/25 transition-colors">
                <UploadCloud className="w-6 h-6 text-sky-500" />
              </div>
              <p className="text-base font-bold text-zinc-100 group-hover:text-sky-400 transition-colors duration-200">
                Add Intel
              </p>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-sky-400 transition-colors flex-shrink-0 ml-auto" />
            </div>
          </button>

          {/* Widget 2 - View Portfolios */}
          <Link
            to="/recognition"
            className="block w-full min-w-[260px] flex flex-row items-center justify-start text-left px-5 py-4 bg-zinc-900 border border-zinc-800/40 rounded-[20px] shadow-xl shadow-black/20 hover:border-zinc-700 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2.5 rounded-xl bg-sky-500/15 flex-shrink-0">
                <Users className="w-6 h-6 text-sky-500" />
              </div>
              <p className="text-base font-bold text-zinc-100 group-hover:text-sky-400 transition-colors duration-200">
                View Portfolios &rarr;
              </p>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-sky-400 transition-colors flex-shrink-0 ml-auto" />
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

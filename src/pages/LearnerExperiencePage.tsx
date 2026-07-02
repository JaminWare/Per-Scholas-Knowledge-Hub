import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy, Lightbulb, BookOpen, Flame, Shield, Briefcase, Compass, Plus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';

// ─── Onboarding sub-categories (keyword-based) ──────────────

interface OnboardingSubTab {
  id: string;
  label: string;
  keywords: string[];
}

const ONBOARDING_SUB_TABS: OnboardingSubTab[] = [
  { id: 'all-onboarding', label: 'All Onboarding', keywords: [] },
  { id: 'workspace-comms', label: 'Workspace & Comms', keywords: ['zoom', 'slack', 'deskolas', 'audio', 'mic', 'access', 'login'] },
  { id: 'virtual-environments', label: 'Virtual Environments', keywords: ['vm', 'virtualbox', 'hypervisor', 'sandbox', 'ram'] },
  { id: 'healthcare-baselines', label: 'Healthcare Baselines', keywords: ['ehr', 'hipaa', 'compliance', 'portal'] },
];

// ─── Tab definitions ─────────────────────────────────────────

interface JourneyTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  trackSuffix?: string;
  emptyPrompt: string;
}

const JOURNEY_TABS: JourneyTab[] = [
  { id: 'all', label: 'All', icon: Compass, emptyPrompt: 'Be the first to share a peer survival tip. Your cohort is waiting.' },
  { id: 'onboarding', label: 'Onboarding Hurdles', icon: Lightbulb, trackSuffix: 'Onboarding Hurdles', emptyPrompt: 'Did you survive the first-week setup chaos? Click here to drop a tip for the next cohort.' },
  { id: 'labs', label: 'Lab Survival Guides', icon: BookOpen, trackSuffix: 'Lab Survival Guides', emptyPrompt: 'Conquered a complex lab that almost broke you? Share your survival guide here.' },
  { id: 'slump', label: 'The Mid-Program Slump', icon: Flame, trackSuffix: 'The Mid-Program Slump', emptyPrompt: 'Hit a wall mid-way through and broken through it? Share your strategy here.' },
  { id: 'cert', label: 'Certification Prep', icon: Shield, trackSuffix: 'Certification Prep', emptyPrompt: 'Have a test-day hack or anxiety management trick? The cohort needs it.' },
  { id: 'job', label: 'Job Hunt Triage', icon: Briefcase, trackSuffix: 'Job Hunt Triage', emptyPrompt: 'Landed an interview or fixed your resume? Drop your advice for the next wave.' },
];

// ─── Unified entry shape ─────────────────────────────────────

interface LearnerEntry {
  id: string;
  title: string;
  content: string;
  author: string;
  track: string;
  slug: string;
  created_at: string;
}

// ─── Content parser ──────────────────────────────────────────

function parseHardshipBreakthrough(content: string): { hardship: string; breakthrough: string | null } {
  const separators = ['---', '## Breakthrough', '## The Breakthrough', '**Breakthrough:**', '**The Breakthrough:**'];
  for (const sep of separators) {
    const idx = content.indexOf(sep);
    if (idx > 0) {
      return {
        hardship: content.slice(0, idx).trim(),
        breakthrough: content.slice(idx + sep.length).trim() || null,
      };
    }
  }
  return { hardship: content.trim(), breakthrough: null };
}

// ─── Main page component ─────────────────────────────────────

export default function LearnerExperiencePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [onboardingSubTab, setOnboardingSubTab] = useState('All Onboarding');
  const [entries, setEntries] = useState<LearnerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchEntries() {
      try {
        const [subsRes, articlesRes] = await Promise.all([
          supabase
            .from('submissions')
            .select('*')
            .eq('is_approved', true)
            .ilike('track', 'Learner Experience%'),
          supabase
            .from('articles')
            .select('*')
            .ilike('study_category', 'Learner Experience%'),
        ]);

        const fromSubs: LearnerEntry[] = (subsRes.data ?? []).map((s: any) => ({
          id: s.id,
          title: s.title ?? 'Untitled',
          content: s.formatted_content ?? s.content ?? '',
          author: s.full_name ?? 'Anonymous',
          track: s.track ?? '',
          slug: (s.title ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `entry-${s.id}`,
          created_at: s.created_at,
        }));

        const fromArticles: LearnerEntry[] = (articlesRes.data ?? []).map((a: any) => ({
          id: a.id,
          title: a.title ?? 'Untitled',
          content: a.formatted_content ?? a.content ?? '',
          author: a.author_name ?? 'Knowledge Base',
          track: a.study_category ?? '',
          slug: a.slug ?? `article-${a.id}`,
          created_at: a.created_at,
        }));

        const existingTitles = new Set(fromArticles.map((a) => a.title.toLowerCase()));
        const merged = [
          ...fromArticles,
          ...fromSubs.filter((s) => !existingTitles.has(s.title.toLowerCase())),
        ];
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setEntries(merged);
      } catch (e) {
        console.error('LearnerExperiencePage fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEntries();
  }, []);

  const currentTab = JOURNEY_TABS.find((t) => t.id === activeTab) ?? JOURNEY_TABS[0];

  const filteredEntries = useMemo(() => {
    let result: LearnerEntry[];
    if (activeTab === 'all') {
      result = entries;
    } else {
      const suffix = currentTab.trackSuffix;
      if (!suffix) {
        result = entries;
      } else {
        const target = `Learner Experience \u2014 ${suffix}`.toLowerCase();
        result = entries.filter((e) => e.track.toLowerCase().includes(target) || e.track.toLowerCase().includes(suffix.toLowerCase()));
      }
    }

    if (activeTab === 'onboarding' && onboardingSubTab !== 'All Onboarding') {
      const sub = ONBOARDING_SUB_TABS.find((s) => s.label === onboardingSubTab);
      if (sub && sub.keywords.length > 0) {
        result = result.filter((e) => {
          const haystack = `${e.title} ${e.content}`.toLowerCase();
          return sub.keywords.some((kw) => haystack.includes(kw));
        });
      }
    }

    return result;
  }, [entries, activeTab, currentTab, onboardingSubTab]);

  return (
    <div className="space-y-8">
      {/* ─── Visual Metaphor Banner ─── */}
      <div className="relative rounded-2xl border border-zinc-800 overflow-hidden bg-gradient-to-br from-zinc-900 via-slate-900 to-emerald-950">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <div className="flex items-start gap-5 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
              <LifeBuoy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Learner Experience & FAQs</h1>
              <p className="text-sm md:text-base text-zinc-400 mt-1 leading-relaxed">The cohort survival guide&mdash;built by peers who figured it out the hard way.</p>
            </div>
          </div>

          {/* ─── Journey Tabs ─── */}
          <div className="flex flex-wrap gap-2">
            {JOURNEY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'onboarding') setOnboardingSubTab('All Onboarding');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm border-transparent dark:bg-sky-500/30 dark:text-sky-300 dark:border-sky-400/50'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-transparent dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white dark:border-zinc-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Onboarding Sub-Tabs (conditional) ─── */}
      {activeTab === 'onboarding' && (
        <div className="flex flex-wrap gap-2">
          {ONBOARDING_SUB_TABS.map((sub) => {
            const isActive = onboardingSubTab === sub.label;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setOnboardingSubTab(sub.label)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                    : 'bg-zinc-800/30 text-zinc-500 hover:text-zinc-300 border-transparent'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Content Grid ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden animate-pulse">
              <div className="h-8 bg-zinc-800" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => (
            <BreakthroughCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyStateInvite tab={currentTab} onContribute={() => setIsModalOpen(true)} />
      )}

      {/* ─── Submission Modal ─── */}
      <ContributorSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitted={() => {}}
      />
    </div>
  );
}

// ─── Breakthrough Card ───────────────────────────────────────

function BreakthroughCard({ entry }: { entry: LearnerEntry }) {
  const { hardship, breakthrough } = parseHardshipBreakthrough(entry.content);

  return (
    <Link
      to={`/article/${entry.slug}`}
      className="group flex flex-col rounded-xl border overflow-hidden transition-all duration-300 ease-out bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-sky-400/50 dark:hover:border-sky-500/50 hover:shadow-[0_0_0_1.5px_rgba(56,189,248,0.45),0_4px_16px_rgba(56,189,248,0.08)]"
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 dark:bg-zinc-900"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-sky-400 select-none">{`</>`}</span>
          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">
            {entry.slug.split('/').pop()}
          </span>
        </div>
        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wide flex-shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          [Peer Wisdom]
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-zinc-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-200">
          {entry.title}
        </h3>

        {/* Hardship section */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">The Hardship</span>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
            {hardship.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').slice(0, 180)}
          </p>
        </div>

        {/* Breakthrough section */}
        {breakthrough && (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <Lightbulb className="w-2.5 h-2.5" />
              The Breakthrough
            </span>
            <p className="text-xs text-sky-700 dark:text-sky-300 line-clamp-3 leading-relaxed">
              {breakthrough.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').slice(0, 180)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/15">
            {entry.author}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Targeted Empty State ────────────────────────────────────

function EmptyStateInvite({ tab, onContribute }: { tab: JourneyTab; onContribute: () => void }) {
  const Icon = tab.icon;
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center">
        <Icon className="w-8 h-8 text-sky-500 dark:text-sky-400" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">No entries yet</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {tab.emptyPrompt}
        </p>
      </div>
      <button
        type="button"
        onClick={onContribute}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30"
      >
        <Plus className="w-4 h-4" />
        Share Your Experience
      </button>
    </div>
  );
}

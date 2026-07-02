import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy, Lightbulb, BookOpen, Flame, Shield, Briefcase, Compass, Plus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';

// ─── 3-tier category filter system ─────────────────────────────

export interface NestedFilter {
  label: string;
  keywords: string[];
}

export interface CategoryFilter {
  id: string;
  label: string;
  keywords: string[];
  nested: NestedFilter[];
}

export const CATEGORY_FILTERS: Record<string, CategoryFilter[]> = {
  onboarding: [
    { id: 'all-onboarding', label: 'All Onboarding', keywords: [], nested: [] },
    { id: 'canvas-workflows', label: 'Canvas Workflows', keywords: ['canvas', 'lms', 'assignment', 'calendar', 'module', 'syllabus', 'grades'], nested: [
      { label: 'All Canvas', keywords: [] },
      { label: 'Assignments & Grades', keywords: ['assignment', 'rubric', 'grade', 'submission'] },
      { label: 'Schedules & Sync', keywords: ['calendar', 'sync', 'schedule', 'dates'] },
      { label: 'Module Navigation', keywords: ['module', 'syllabus', 'lock'] },
    ]},
    { id: 'google-cert', label: 'Google Cert', keywords: ['google', 'coursera', 'cert', 'sync', 'qwiklabs'], nested: [
      { label: 'All Google Certs', keywords: [] },
      { label: 'Google IT', keywords: ['google it', 'it support', 'qwiklabs'] },
      { label: 'Google AI', keywords: ['google ai', 'ai cert', 'prompting'] },
    ]},
    { id: 'curriculum-pacing', label: 'Curriculum & Pacing', keywords: ['comptia', 'healthcare', 'pacing', 'schedule', 'master pbq'], nested: [
      { label: 'All Curriculum', keywords: [] },
      { label: 'CompTIA Mastery', keywords: ['comptia', 'core 1', 'core 2', 'exam'] },
      { label: 'Healthcare IT Balance', keywords: ['healthcare', 'ehr', 'hipaa', 'clinical'] },
      { label: 'Study & PBQ Tools', keywords: ['master pbq', 'study guide', 'notes'] },
    ]},
  ],
  labs: [
    { id: 'all-labs', label: 'All Labs', keywords: [], nested: [] },
    { id: 'infrastructure', label: 'Infrastructure & OS', keywords: ['comptia', 'vm', 'virtualbox', 'active directory', 'powershell', 'cli', 'packet tracer'], nested: [
      { label: 'All Infrastructure', keywords: [] },
      { label: 'Hardware & Networking', keywords: ['packet tracer', 'switch', 'router', 'hardware', 'ip'] },
      { label: 'Active Directory & VMs', keywords: ['vm', 'virtualbox', 'hypervisor', 'active directory', 'domain'] },
      { label: 'CLI & Scripting', keywords: ['powershell', 'bash', 'cmd', 'cli', 'linux'] },
    ]},
    { id: 'healthcare', label: 'Healthcare IT & Clinical', keywords: ['ehr', 'emr', 'hipaa', 'phi', 'iot', 'biomedical'], nested: [
      { label: 'All Healthcare IT', keywords: [] },
      { label: 'EHR Sandboxes', keywords: ['ehr', 'emr', 'chart', 'patient', 'epic', 'cerner'] },
      { label: 'Compliance & Security', keywords: ['hipaa', 'phi', 'audit', 'access'] },
      { label: 'Medical IoT', keywords: ['iot', 'biomedical', 'device', 'network'] },
    ]},
    { id: 'qwiklabs', label: 'Qwiklabs & Certs', keywords: ['qwiklabs', 'google', 'coursera', 'ai', 'prompt'], nested: [
      { label: 'All Qwiklabs', keywords: [] },
      { label: 'Google IT Support', keywords: ['qwiklabs', 'google it', 'timeout', 'instance'] },
      { label: 'Applied AI Labs', keywords: ['ai', 'prompt', 'gemini', 'chatgpt'] },
    ]},
  ],
  slump: [
    { id: 'all-slump', label: 'All Slump Advice', keywords: [], nested: [] },
    { id: 'mental-endurance', label: 'Mental Endurance', keywords: ['imposter', 'confidence', 'doubt', 'overwhelm', 'compare', 'burnout', 'exhaustion', 'mental', 'stress', 'break'], nested: [
      { label: 'All Mental Endurance', keywords: [] },
      { label: 'Imposter Syndrome', keywords: ['imposter', 'confidence', 'doubt', 'overwhelm', 'compare'] },
      { label: 'Burnout Recovery', keywords: ['burnout', 'exhaustion', 'mental', 'stress', 'break'] },
    ]},
    { id: 'life-balance', label: 'Time Management', keywords: ['balance', 'family', 'work', 'life', 'distraction', 'behind', 'catch up', 'late', 'schedule', 'time'], nested: [
      { label: 'All Time Management', keywords: [] },
      { label: 'Juggling Responsibilities', keywords: ['balance', 'family', 'work', 'life', 'kids', 'distraction'] },
      { label: 'Catching Up', keywords: ['behind', 'catch up', 'late', 'schedule', 'time'] },
    ]},
    { id: 'motivation', label: 'Motivation & Focus', keywords: ['motivation', 'focus', 'discipline', 'routine', 'habit', 'milestone', 'win', 'progress', 'goal'], nested: [
      { label: 'All Motivation', keywords: [] },
      { label: 'Staying Focused', keywords: ['motivation', 'focus', 'discipline', 'routine', 'habit'] },
      { label: 'Celebrating Small Wins', keywords: ['milestone', 'win', 'progress', 'small step', 'goal'] },
    ]},
  ],
  cert: [
    { id: 'all-cert', label: 'All Cert Advice', keywords: [], nested: [] },
    { id: 'test-strategies', label: 'Test-Day Strategies', keywords: ['anxiety', 'stress', 'time', 'flag', 'pearson', 'proctor', 'pace', 'home', 'center'], nested: [
      { label: 'All Test Strategies', keywords: [] },
      { label: 'Anxiety Management', keywords: ['anxiety', 'stress', 'panic', 'breathe', 'calm'] },
      { label: 'Time Management', keywords: ['time', 'flag', 'skip', 'pace', 'clock'] },
      { label: 'Testing Environment', keywords: ['pearson', 'center', 'home', 'proctor', 'camera'] },
    ]},
    { id: 'comptia-tactics', label: 'CompTIA Tactics', keywords: ['pbq', 'simulation', 'port', 'mnemonic', 'methodology', 'troubleshoot', '802.11', 'flashcard'], nested: [
      { label: 'All CompTIA Tactics', keywords: [] },
      { label: 'PBQ Strategies', keywords: ['pbq', 'performance', 'drag', 'drop', 'simulation'] },
      { label: 'Memorization Hacks', keywords: ['port', '802.11', 'flashcard', 'acronym', 'mnemonic'] },
      { label: 'Troubleshooting Steps', keywords: ['methodology', 'step', 'troubleshoot', 'isolate'] },
    ]},
    { id: 'study-benchmarks', label: 'Practice & Benchmarks', keywords: ['score', 'benchmark', 'practice', 'ready', 'dion', 'messer', 'cram', 'review', 'cheat sheet'], nested: [
      { label: 'All Practice & Benchmarks', keywords: [] },
      { label: 'Readiness Benchmarks', keywords: ['score', 'benchmark', 'practice', 'ready', 'dion', 'messer'] },
      { label: 'Last-Minute Review', keywords: ['cram', 'day before', 'review', 'cheat sheet'] },
    ]},
  ],
  job: [
    { id: 'all-job', label: 'All Job Advice', keywords: [], nested: [] },
    { id: 'resume-portfolio', label: 'Resume & LinkedIn', keywords: ['resume', 'linkedin', 'cv', 'portfolio', 'bullet', 'ats', 'profile', 'cover letter'], nested: [
      { label: 'All Resume & LinkedIn', keywords: [] },
      { label: 'Resume Reality Checks', keywords: ['resume', 'cv', 'bullet', 'ats', 'cover letter'] },
      { label: 'LinkedIn Optimization', keywords: ['linkedin', 'profile', 'network', 'connection'] },
    ]},
    { id: 'interview-prep', label: 'Interview Preparation', keywords: ['interview', 'behavioral', 'technical', 'star', 'whiteboard', 'question', 'answer'], nested: [
      { label: 'All Interview Prep', keywords: [] },
      { label: 'Behavioral Questions', keywords: ['behavioral', 'star', 'scenario', 'soft skill', 'conflict'] },
      { label: 'Technical Interviews', keywords: ['technical', 'whiteboard', 'quiz', 'troubleshoot', 'scenario'] },
    ]},
    { id: 'field-transition', label: 'Field Transition', keywords: ['offer', 'negotiate', 'salary', 'helpdesk', 'hospital', 'clinical', 'onboarding', 'first day'], nested: [
      { label: 'All Field Transition', keywords: [] },
      { label: 'Offers & Negotiation', keywords: ['offer', 'negotiate', 'salary', 'benefits', 'accept'] },
      { label: 'Surviving the Helpdesk', keywords: ['helpdesk', 'ticket', 'hospital', 'clinical', 'first day', 'onboarding'] },
    ]},
  ],
};

// ─── Tab definitions ─────────────────────────────────────────

export interface JourneyTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  trackSuffix?: string;
  emptyPrompt: string;
}

export const JOURNEY_TABS: JourneyTab[] = [
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
  const [activeLevel2, setActiveLevel2] = useState('');
  const [activeLevel3, setActiveLevel3] = useState('');
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
  const filters = CATEGORY_FILTERS[activeTab];

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

    if (filters && activeLevel2) {
      const sub = filters.find((s) => s.label === activeLevel2);
      if (sub && sub.keywords.length > 0) {
        result = result.filter((e) => {
          const haystack = `${e.title} ${e.content}`.toLowerCase();
          return sub.keywords.some((kw) => haystack.includes(kw));
        });
      }

      if (sub && activeLevel3) {
        const nested = sub.nested.find((n) => n.label === activeLevel3);
        if (nested && nested.keywords.length > 0) {
          result = result.filter((e) => {
            const haystack = `${e.title} ${e.content}`.toLowerCase();
            return nested.keywords.some((kw) => haystack.includes(kw));
          });
        }
      }
    }

    return result;
  }, [entries, activeTab, currentTab, filters, activeLevel2, activeLevel3]);

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
                    setActiveLevel2('');
                    setActiveLevel3('');
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

      {/* ─── Category Sub-Navigation (conditional on tab having filters) ─── */}
      {filters && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-4 space-y-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Filter by focus area</span>
          <div className="flex flex-wrap gap-2">
            {filters.map((sub) => {
              const isAll = sub.keywords.length === 0;
              const isActive = isAll ? activeLevel2 === '' : activeLevel2 === sub.label;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setActiveLevel2(isAll ? '' : sub.label);
                    setActiveLevel3('');
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm shadow-teal-500/10'
                      : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 border-zinc-700/50'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>

          {/* ─── 3rd-Level Nested Pills ─── */}
          {(() => {
            const activeSub = filters.find((s) => s.label === activeLevel2);
            if (!activeSub || activeSub.nested.length === 0) return null;
            return (
              <div className="pl-3 border-l-2 border-sky-500/30 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-500/70">Narrow further</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSub.nested.map((n) => {
                    const isAll = n.keywords.length === 0;
                    const isNested = isAll ? activeLevel3 === '' : activeLevel3 === n.label;
                    return (
                      <button
                        key={n.label}
                        type="button"
                        onClick={() => setActiveLevel3(isAll ? '' : (isNested ? '' : n.label))}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200 ${
                          isNested
                            ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                            : 'bg-zinc-800/30 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border-transparent'
                        }`}
                      >
                        {n.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
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

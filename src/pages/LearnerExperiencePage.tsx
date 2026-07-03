import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LifeBuoy, Lightbulb, BookOpen, Flame, Shield, Briefcase, Compass, Plus, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseTicketContent } from '../utils/normalizeDeskolas';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';
import CardZoomOverlay from '../components/CardZoomOverlay';

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
    { id: 'all-labs', label: 'All Tech Solutions', keywords: [], nested: [] },
    { id: 'hardware-av', label: 'Hardware & AV Setup', keywords: ['hardware', 'av', 'audio', 'video', 'monitor', 'webcam', 'mic', 'headset', 'display', 'usb', 'peripheral', 'cable'], nested: [
      { label: 'All Hardware & AV', keywords: [] },
      { label: 'Display & Video', keywords: ['monitor', 'display', 'hdmi', 'webcam', 'video', 'screen'] },
      { label: 'Audio & Peripherals', keywords: ['mic', 'headset', 'audio', 'speaker', 'usb', 'keyboard', 'mouse'] },
    ]},
    { id: 'network-access', label: 'Network & Access', keywords: ['network', 'wifi', 'vpn', 'internet', 'connection', 'proxy', 'firewall', 'dns', 'ip'], nested: [
      { label: 'All Network', keywords: [] },
      { label: 'WiFi & Connectivity', keywords: ['wifi', 'internet', 'connection', 'disconnect', 'slow'] },
      { label: 'VPN & Proxy', keywords: ['vpn', 'proxy', 'firewall', 'blocked', 'access'] },
    ]},
    { id: 'software-ides', label: 'Software & IDEs', keywords: ['software', 'ide', 'vscode', 'install', 'update', 'crash', 'extension', 'plugin', 'virtualbox', 'vm'], nested: [
      { label: 'All Software', keywords: [] },
      { label: 'VS Code & Extensions', keywords: ['vscode', 'extension', 'plugin', 'editor', 'terminal'] },
      { label: 'VMs & Environments', keywords: ['virtualbox', 'vm', 'docker', 'environment', 'install'] },
    ]},
    { id: 'git-github', label: 'Git & GitHub', keywords: ['git', 'github', 'push', 'pull', 'merge', 'branch', 'commit', 'clone', 'repository', 'conflict'], nested: [
      { label: 'All Git', keywords: [] },
      { label: 'Push & Pull Issues', keywords: ['push', 'pull', 'remote', 'origin', 'reject', 'fetch'] },
      { label: 'Merge & Conflicts', keywords: ['merge', 'conflict', 'branch', 'rebase', 'reset'] },
    ]},
    { id: 'accounts-lms', label: 'Accounts & LMS', keywords: ['account', 'login', 'password', 'canvas', 'lms', 'coursera', 'email', 'access', 'locked', 'reset'], nested: [
      { label: 'All Accounts', keywords: [] },
      { label: 'Login & Password', keywords: ['login', 'password', 'locked', 'reset', 'mfa', '2fa'] },
      { label: 'Canvas & Coursera', keywords: ['canvas', 'coursera', 'lms', 'enrollment', 'module'] },
    ]},
    { id: 'general-troubleshooting', label: 'General Troubleshooting', keywords: ['troubleshoot', 'error', 'issue', 'problem', 'help', 'fix', 'broken', 'other'], nested: [] },
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
  { id: 'labs', label: 'Tech Solutions', icon: BookOpen, trackSuffix: 'Tech Solutions', emptyPrompt: 'Have a fix for a common tech issue? Share your solution here to help the next learner.' },
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
  lx_stage: string | null;
  lx_topic: string | null;
  lx_focus: string | null;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [activeLevel2, setActiveLevel2] = useState('');
  const [activeLevel3, setActiveLevel3] = useState('');
  const [entries, setEntries] = useState<LearnerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'all') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab: tabId });
    }
    setActiveLevel2('');
    setActiveLevel3('');
  };

  useEffect(() => {
    const paramTab = searchParams.get('tab') || 'all';
    if (paramTab !== activeTab) {
      setActiveTab(paramTab);
      setActiveLevel2('');
      setActiveLevel3('');
    }
  }, [searchParams]);

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
          lx_stage: s.lx_stage ?? null,
          lx_topic: s.lx_topic ?? null,
          lx_focus: s.lx_focus ?? null,
        }));

        const fromArticles: LearnerEntry[] = (articlesRes.data ?? []).map((a: any) => ({
          id: a.id,
          title: a.title ?? 'Untitled',
          content: a.formatted_content ?? a.content ?? '',
          author: a.author_name ?? 'Knowledge Base',
          track: a.study_category ?? '',
          slug: a.slug ?? `article-${a.id}`,
          created_at: a.created_at,
          lx_stage: a.lx_stage ?? null,
          lx_topic: a.lx_topic ?? null,
          lx_focus: a.lx_focus ?? null,
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
      result = entries.filter((e) => {
        if (e.lx_stage) return e.lx_stage === activeTab;
        // Fallback for legacy entries without lx_stage
        const suffix = currentTab.trackSuffix;
        if (!suffix) return true;
        const target = `Learner Experience - ${suffix}`.toLowerCase();
        return e.track.toLowerCase().includes(target) || e.track.toLowerCase().includes(suffix.toLowerCase());
      });
    }

    if (filters && activeLevel2) {
      const sub = filters.find((s) => s.label === activeLevel2);
      if (sub && sub.keywords.length > 0) {
        result = result.filter((e) => {
          if (e.lx_topic) return e.lx_topic === activeLevel2;
          // Fallback: keyword scan for legacy entries
          const haystack = `${e.title} ${e.content}`.toLowerCase();
          return sub.keywords.some((kw) => haystack.includes(kw));
        });
      }

      if (sub && activeLevel3) {
        const nested = sub.nested.find((n) => n.label === activeLevel3);
        if (nested && nested.keywords.length > 0) {
          result = result.filter((e) => {
            if (e.lx_focus) return e.lx_focus === activeLevel3;
            // Fallback: keyword scan for legacy entries
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
                  onClick={() => handleTabChange(tab.id)}
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
  const [zoomed, setZoomed] = useState(false);
  const hasTicketFormat = /Problem:/i.test(entry.content) && /Solution:/i.test(entry.content);
  const ticket = hasTicketFormat ? parseTicketContent(entry.content) : null;
  const { hardship, breakthrough } = !hasTicketFormat ? parseHardshipBreakthrough(entry.content) : { hardship: '', breakthrough: null };

  const cardInner = (expanded = false) => (
    <>
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
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-500 font-mono">{formatRelativeTime(entry.created_at)}</span>
          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wide flex-shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            {hasTicketFormat ? '[Resolved]' : '[Peer Wisdom]'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <h3 className="font-semibold text-sm leading-snug text-zinc-800 dark:text-white transition-colors duration-200" style={{ WebkitLineClamp: expanded ? undefined : 2, display: expanded ? undefined : '-webkit-box', WebkitBoxOrient: expanded ? undefined : 'vertical', overflow: expanded ? undefined : 'hidden' }}>
          {entry.title}
        </h3>

        {ticket ? (
          <>
            {/* Solution snippet (card face) */}
            {!expanded && (
              <p className="text-xs text-zinc-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                {ticket.solution.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').slice(0, 180)}
              </p>
            )}

            {/* Expanded: structured Problem/Solution blocks */}
            {expanded && (
              <>
                <div className="rounded-lg border-l-4 border-amber-400/70 bg-amber-50 dark:bg-amber-500/5 px-3 py-2.5 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Problem</h3>
                  <p className="text-xs text-amber-900 dark:text-amber-200/80 leading-relaxed whitespace-pre-wrap">
                    {ticket.problem.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}
                  </p>
                </div>
                <div className="rounded-lg border-l-4 border-emerald-400/70 bg-emerald-50 dark:bg-emerald-500/5 px-3 py-2.5 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Solution</h3>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200/80 leading-relaxed whitespace-pre-wrap">
                    {ticket.solution.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">The Breakthrough</span>
              <p className={`text-xs text-zinc-600 dark:text-slate-400 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                {hardship.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').slice(0, expanded ? undefined : 180)}
              </p>
            </div>

            {breakthrough && (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  <Lightbulb className="w-2.5 h-2.5" />
                  The Breakthrough
                </span>
                <p className={`text-xs text-sky-700 dark:text-sky-300 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                  {breakthrough.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').slice(0, expanded ? undefined : 180)}
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/15">
            {entry.author}
          </span>
          {expanded && (
            <Link
              to={`/article/${entry.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors"
            >
              Read full article <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div
        onClick={() => setZoomed(true)}
        className="group flex flex-col rounded-xl border overflow-hidden cursor-zoom-in transition-all duration-300 ease-out bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10"
      >
        {cardInner(false)}
      </div>

      <CardZoomOverlay open={zoomed} onClose={() => setZoomed(false)}>
        <div className="flex flex-col rounded-xl overflow-hidden">
          {cardInner(true)}
        </div>
      </CardZoomOverlay>
    </>
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

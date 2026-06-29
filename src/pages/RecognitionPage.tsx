import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, ChevronDown, ChevronRight, ArrowLeft, BookOpen,
  Zap, Star, Ticket, Home, Crown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadLocalSubmissions, type NewSubmission } from '../components/ContributorSubmissionModal';

// ── Static Founder data ───────────────────────────────────

interface ArticleEntry { title: string; slug: string }

const JAMIN_ARTICLES: ArticleEntry[] = [
  { title: 'Introduction to Healthcare IT Security',                                slug: 'intro-healthcare-it-security' },
  { title: 'Cloud Computing in Healthcare',                                         slug: 'cloud-computing-healthcare' },
  { title: 'AI Prompt Engineering for Healthcare',                                  slug: 'ai-prompt-engineering-healthcare' },
  { title: 'The Role of Firewalls in Modern Network Security',                      slug: 'firewall-basics' },
  { title: 'Command-Line Interface (CLI) Research',                                 slug: 'command-documentation' },
  { title: 'Microsoft Management Console (MMC) Snap-ins',                           slug: 'snap-in' },
  { title: 'Enterprise Three-Tier Network Topology Architecture',                   slug: 'diagrams/network-topology-architecture' },
  { title: 'OSI Model Data Encapsulation & PDU Flow',                               slug: 'diagrams/osi-pdu-flow' },
  { title: 'TCP/IP Protocol Suite — Four-Layer Model, IPv4 vs. IPv6 & Packet Transmission', slug: 'core1-networking/sample-protocols' },
];

// ── Badge colour map ──────────────────────────────────────

const badgeColors: Record<string, string> = {
  'Founder':             'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
  'Core 1 Expert':       'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'Core 2 Expert':       'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  'HealthIT Specialist': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Diagram Architect':   'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'Reference Author':    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Playbook Engineer':   'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'Cohort Contributor':  'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
};

function BadgeTag({ badge }: { badge: string }) {
  const cls = badgeColors[badge] ?? badgeColors['Cohort Contributor'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      [{badge}]
    </span>
  );
}

// ── Categorise a community submission ─────────────────────

function categoryLabel(s: NewSubmission): string {
  if (s.submission_type === 'Article')        return 'Authored Articles';
  if (s.submission_type === 'Resource Link')  return 'Resource Links';
  if (s.submission_type === 'Support Ticket') return 'Support Tickets';
  if (s.badge === 'Diagram Architect')        return 'Diagrams';
  if (s.badge === 'Reference Author')         return 'Quick References';
  if (s.badge === 'Playbook Engineer')        return 'Prompt Playbooks';
  return 'Shared Tips';
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  'Authored Articles': <BookOpen className="w-3.5 h-3.5" />,
  'Resource Links':    <Zap className="w-3.5 h-3.5" />,
  'Support Tickets':   <Ticket className="w-3.5 h-3.5" />,
  'Diagrams':          <Zap className="w-3.5 h-3.5" />,
  'Quick References':  <Zap className="w-3.5 h-3.5" />,
  'Prompt Playbooks':  <Zap className="w-3.5 h-3.5" />,
  'Shared Tips':       <Zap className="w-3.5 h-3.5" />,
};

// ── Community contributor card (accordion + dropdown) ─────

type ViewMode = 'accordion' | 'dropdown';

interface ContributorGroup {
  name: string;
  topBadge: string;
  submissions: NewSubmission[];
}

function buildSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function CommunityCard({ group, isNew, isOpen, onToggle, viewMode }: {
  group: ContributorGroup;
  isNew: boolean;
  isOpen: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
}) {
  const initial = group.name.charAt(0).toUpperCase();
  const byCategory = group.submissions.reduce<Record<string, NewSubmission[]>>((acc, s) => {
    const cat = categoryLabel(s);
    (acc[cat] = acc[cat] ?? []).push(s);
    return acc;
  }, {});
  const totalCount = group.submissions.length;
  const articleSubmissions = group.submissions.filter((s) => s.submission_type === 'Article');

  // Dropdown panel local state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  // Close dropdown when card collapses
  useEffect(() => {
    if (!isOpen) setDropdownOpen(false);
  }, [isOpen]);

  return (
    <div className={`rounded-xl border overflow-visible transition-all ${
      isOpen
        ? 'border-sky-400/40 dark:border-sky-500/30 shadow-md shadow-sky-500/5'
        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
    } bg-white dark:bg-zinc-700`}>

      {/* Header — click to toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${
          isNew
            ? 'bg-gradient-to-br from-sky-500 to-sky-400 shadow-md shadow-sky-500/20'
            : 'bg-gradient-to-br from-zinc-500 to-zinc-400'
        }`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{group.name}</span>
            <BadgeTag badge={group.topBadge} />
            {isNew && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-sky-500 text-white rounded-full">
                <Star className="w-2 h-2" /> NEW
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-100/70 text-sky-900 dark:bg-zinc-800/80 dark:text-zinc-100">
              {totalCount} contribution{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {isOpen
          ? <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        }
      </button>

      {/* Expanded portfolio */}
      {isOpen && viewMode === 'accordion' && (
        <div className="border-t border-zinc-100 dark:border-zinc-600 px-5 py-4 space-y-4">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-zinc-400 dark:text-zinc-500">{CATEGORY_ICON[cat] ?? <Zap className="w-3.5 h-3.5" />}</span>
                <h4 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{cat}</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-600 text-zinc-500">{items.length}</span>
              </div>
              <ul className="space-y-1.5">
                {items.map((s) => {
                  const slug = buildSlugFromTitle(s.title);
                  if (s.submission_type === 'Article') {
                    return (
                      <li key={s.id}>
                        <Link
                          to={`/article/${slug}`}
                          className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 hover:underline underline-offset-2 group"
                        >
                          <span className="w-1 h-1 rounded-full bg-sky-400 flex-shrink-0" />
                          <span className="truncate text-zinc-900 dark:text-zinc-100 group-hover:text-sky-500">{s.title}</span>
                          <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <span className="w-1 h-1 rounded-full bg-zinc-400 flex-shrink-0" />
                      <span className="truncate text-zinc-900 dark:text-zinc-100">{s.title}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown view mode */}
      {isOpen && viewMode === 'dropdown' && (
        <div className="border-t border-zinc-100 dark:border-zinc-600 px-5 py-4 overflow-visible">
          <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Navigate to Article</p>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen((p) => !p); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:border-sky-400/50 dark:hover:border-sky-500/40 transition-all"
            >
              <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                {articleSubmissions.length > 0
                  ? `${articleSubmissions.length} article${articleSubmissions.length !== 1 ? 's' : ''} — select to navigate`
                  : `${totalCount} contribution${totalCount !== 1 ? 's' : ''}`}
              </span>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-[60] rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 shadow-xl shadow-zinc-900/10 overflow-hidden">
                {group.submissions.map((s) => {
                  const slug = buildSlugFromTitle(s.title);
                  const isArticle = s.submission_type === 'Article';
                  return isArticle ? (
                    <Link
                      key={s.id}
                      to={`/article/${slug}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors group border-b border-zinc-100 dark:border-zinc-700 last:border-0"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                      <span className="text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate">{s.title}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover:text-sky-400 flex-shrink-0 ml-auto" />
                    </Link>
                  ) : (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-700 last:border-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{s.title}</span>
                      <span className="ml-auto text-[10px] font-mono text-zinc-400 dark:text-zinc-500 flex-shrink-0">{categoryLabel(s)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Founder card (always expanded) ───────────────────────

function FounderCard() {
  return (
    <div className="rounded-xl border border-sky-300/60 dark:border-amber-500/30 overflow-hidden bg-sky-50/90 dark:bg-zinc-700/80 shadow-sm shadow-amber-500/5">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-sky-100 dark:border-amber-500/15">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-white text-lg shadow-md shadow-amber-500/20">
          J
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-zinc-800 dark:text-zinc-100">Jamin Ware</span>
            <BadgeTag badge="Founder" />
            <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100/60 text-amber-950 dark:bg-zinc-800/80 dark:text-zinc-100">
              {JAMIN_ARTICLES.length} Authored Articles
            </span>
          </div>
        </div>
      </div>

      {/* Authored Articles */}
      <div className="px-5 py-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Authored Articles</h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {JAMIN_ARTICLES.length}
            </span>
          </div>
          <ul className="space-y-2">
            {JAMIN_ARTICLES.map((a) => (
              <li key={a.slug}>
                <Link
                  to={`/article/${a.slug}`}
                  className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 hover:underline underline-offset-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-sky-400 flex-shrink-0" />
                  <span className="truncate group-hover:text-sky-500">{a.title}</span>
                  <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function RecognitionPage() {
  const navigate = useNavigate();
  const [submissions,      setSubmissions]      = useState<NewSubmission[]>([]);
  const [openContributor,  setOpenContributor]  = useState<string | null>(null);
  const [viewMode,         setViewMode]         = useState<ViewMode>('accordion');

  useEffect(() => {
    const local = loadLocalSubmissions();
    if (local.length > 0) setSubmissions(local);

    async function fetchFromSupabase() {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (data && data.length > 0) {
        setSubmissions((prev) => {
          const localOnly = prev.filter((s) => s.id.startsWith('local-'));
          const merged = [...localOnly, ...(data as NewSubmission[])];
          const seen = new Set<string>();
          return merged.filter((s) => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          });
        });
      }
    }
    fetchFromSupabase();
  }, []);

  // Group community submissions by contributor name
  const groupMap = new Map<string, ContributorGroup>();
  for (const s of submissions) {
    const key = s.full_name.trim().toLowerCase();
    if (key === 'jamin ware') continue;
    if (!groupMap.has(key)) {
      groupMap.set(key, { name: s.full_name.trim(), topBadge: s.badge || 'Cohort Contributor', submissions: [] });
    }
    const g = groupMap.get(key)!;
    if (s.badge && s.badge !== 'Cohort Contributor') g.topBadge = s.badge;
    g.submissions.push(s);
  }
  const communityGroups = Array.from(groupMap.values());
  const newestName = submissions.find((s) => s.full_name.toLowerCase() !== 'jamin ware')?.full_name.trim() ?? null;
  const totalContributors = 1 + communityGroups.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Previous Page
      </button>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-amber-950 border border-zinc-700/50 p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Per Scholas — 2026-RTT-23
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-3">
            Cohort 2026-RTT-23 Wall of Fame
          </h1>
          <p className="text-zinc-300 max-w-xl leading-relaxed text-sm">
            Celebrating every learner who has contributed research, documentation, and knowledge to the
            AI-Enabled Healthcare IT collective. Click any profile to explore their full portfolio.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-xs font-semibold text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {totalContributors} contributor{totalContributors !== 1 ? 's' : ''} recognized
          </div>
        </div>
      </div>

      {/* Founder section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Founder</h2>
        </div>
        <FounderCard />
      </section>

      {/* Community section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-sky-500" />
          <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Community Contributors
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
            {communityGroups.length}
          </span>
          {communityGroups.length > 0 && (
            <div className="ml-auto flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-600 p-0.5 bg-zinc-50 dark:bg-zinc-800">
              <button
                onClick={() => setViewMode('accordion')}
                className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'accordion'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                LIST
              </button>
              <button
                onClick={() => setViewMode('dropdown')}
                className={`font-mono text-xs px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'dropdown'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                SELECT
              </button>
            </div>
          )}
        </div>

        {communityGroups.length > 0 ? (
          <div className="space-y-3">
            {communityGroups.map((g) => (
              <CommunityCard
                key={g.name}
                group={g}
                isNew={g.name === newestName}
                isOpen={openContributor === g.name}
                onToggle={() => setOpenContributor((prev) => prev === g.name ? null : g.name)}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
            <Award className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No community submissions yet. Be the first to contribute!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Submit Your Contribution
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}

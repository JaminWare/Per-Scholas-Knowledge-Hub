import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, ChevronDown, ChevronRight, ArrowLeft, BookOpen,
  Zap, Star, Crown, Link2, UploadCloud,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadLocalSubmissions, type NewSubmission } from '../utils/submissions';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';

// ── Static Founder data ───────────────────────────────────

interface ArticleEntry { title: string; slug: string; track: string }

const JAMIN_ARTICLES: ArticleEntry[] = [
  { title: 'Introduction to Healthcare IT Security',                                slug: 'intro-healthcare-it-security',              track: 'Advanced Healthcare IT' },
  { title: 'Cloud Computing in Healthcare',                                         slug: 'cloud-computing-healthcare',                track: 'Advanced Healthcare IT' },
  { title: 'AI Prompt Engineering for Healthcare',                                  slug: 'ai-prompt-engineering-healthcare',          track: 'Advanced Healthcare IT' },
  { title: 'The Role of Firewalls in Modern Network Security',                      slug: 'firewall-basics',                           track: 'CompTIA A+ Core 2' },
  { title: 'Command-Line Interface (CLI) Research',                                 slug: 'command-documentation',                    track: 'CompTIA A+ Core 2' },
  { title: 'Microsoft Management Console (MMC) Snap-ins',                           slug: 'snap-in',                                  track: 'CompTIA A+ Core 2' },
  { title: 'Enterprise Three-Tier Network Topology Architecture',                   slug: 'diagrams/network-topology-architecture',   track: 'CompTIA A+ Core 1' },
  { title: 'OSI Model Data Encapsulation & PDU Flow',                               slug: 'diagrams/osi-pdu-flow',                    track: 'CompTIA A+ Core 1' },
  { title: 'TCP/IP Protocol Suite — Four-Layer Model, IPv4 vs. IPv6 & Packet Transmission', slug: 'core1-networking/sample-protocols', track: 'CompTIA A+ Core 1' },
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
  'Domain Expert':       'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-400/30',
  'Master Architect':    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30',
};

function BadgeTag({ badge }: { badge: string }) {
  const cls = badgeColors[badge] ?? badgeColors['Cohort Contributor'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      [{badge}]
    </span>
  );
}

function deriveTierBadge(count: number): string {
  if (count >= 5) return 'Master Architect';
  if (count >= 3) return 'Domain Expert';
  return 'Cohort Contributor';
}

interface CategoryBreakdown {
  articles: number;
  links: number;
  refs: number;
  diagrams: number;
  tips: number;
}

function countByCategory(submissions: NewSubmission[]): CategoryBreakdown {
  let articles = 0, links = 0, refs = 0, diagrams = 0, tips = 0;
  for (const s of submissions) {
    if (s.submission_type === 'Article') articles++;
    else if (s.submission_type === 'Resource Link') links++;
    else if (s.badge === 'Reference Author') refs++;
    else if (s.badge === 'Diagram Architect') diagrams++;
    else tips++;
  }
  return { articles, links, refs, diagrams, tips };
}

// ── Categorise a community submission ─────────────────────

function categoryLabel(s: NewSubmission): string {
  if (s.submission_type === 'Article')        return 'Authored Articles';
  if (s.submission_type === 'Resource Link')  return 'Resource Links';
  if (s.badge === 'Diagram Architect')        return 'Diagrams';
  if (s.badge === 'Reference Author')         return 'Quick References';
  if (s.badge === 'Playbook Engineer')        return 'Prompt Playbooks';
  return 'Shared Tips';
}

// ── Track grouping ────────────────────────────────────────

const TRACK_ORDER = [
  'CompTIA A+ Core 1',
  'CompTIA A+ Core 2',
  'Advanced Healthcare IT',
  'Other Contributions',
] as const;

function resolveTrack(track: string): string {
  if (track.includes('Core 1')) return 'CompTIA A+ Core 1';
  if (track.includes('Core 2')) return 'CompTIA A+ Core 2';
  if (track.toLowerCase().includes('healthcare')) return 'Advanced Healthcare IT';
  return 'Other Contributions';
}

function groupSubmissionsByTrack(submissions: NewSubmission[]): Map<string, NewSubmission[]> {
  const map = new Map<string, NewSubmission[]>(TRACK_ORDER.map((t) => [t, []]));
  for (const s of submissions) {
    const bucket = resolveTrack(s.track ?? '');
    map.get(bucket)!.push(s);
  }
  // Drop empty buckets
  for (const [key, val] of map) { if (val.length === 0) map.delete(key); }
  return map;
}

function groupArticlesByTrack(articles: ArticleEntry[]): Map<string, ArticleEntry[]> {
  const map = new Map<string, ArticleEntry[]>(TRACK_ORDER.map((t) => [t, []]));
  for (const a of articles) {
    const bucket = resolveTrack(a.track);
    map.get(bucket)!.push(a);
  }
  for (const [key, val] of map) { if (val.length === 0) map.delete(key); }
  return map;
}

const SECTION_HDR = 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] uppercase tracking-wider border-y border-zinc-200 dark:border-zinc-800 px-3 py-1 block first:border-t-0';

// ── Community contributor card (dropdown only) ────────────

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

function CommunityCard({ group, isNew, isOpen, onToggle }: {
  group: ContributorGroup;
  isNew: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const initial = group.name.charAt(0).toUpperCase();
  const totalCount = group.submissions.length;
  const articleSubmissions = group.submissions.filter((s) => s.submission_type === 'Article');
  const tierBadge = deriveTierBadge(totalCount);
  const breakdown = countByCategory(group.submissions);

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
            {tierBadge !== group.topBadge && <BadgeTag badge={tierBadge} />}
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
            {breakdown.articles > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-700 dark:text-sky-400">
                {breakdown.articles} Article{breakdown.articles !== 1 ? 's' : ''}
              </span>
            )}
            {breakdown.links > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                {breakdown.links} Link{breakdown.links !== 1 ? 's' : ''}
              </span>
            )}
            {breakdown.refs > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
                {breakdown.refs} Ref{breakdown.refs !== 1 ? 's' : ''}
              </span>
            )}
            {breakdown.diagrams > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400">
                {breakdown.diagrams} Diagram{breakdown.diagrams !== 1 ? 's' : ''}
              </span>
            )}
            {breakdown.tips > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700/80 dark:text-zinc-400">
                {breakdown.tips} Tip{breakdown.tips !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {isOpen
          ? <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        }
      </button>

      {/* Dropdown view mode */}
      {isOpen && (
        <div className="border-t border-sky-100 dark:border-zinc-600 px-5 py-4 overflow-visible">
          <p className="font-mono text-[9px] uppercase tracking-widest text-sky-400 dark:text-sky-600 mb-2">Navigate to Article</p>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen((p) => !p); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:border-sky-400 dark:hover:border-sky-600 transition-all"
            >
              <span className="font-mono text-xs text-sky-700 dark:text-sky-400">
                {articleSubmissions.length > 0
                  ? `${articleSubmissions.length} article${articleSubmissions.length !== 1 ? 's' : ''} — select to navigate`
                  : `${totalCount} contribution${totalCount !== 1 ? 's' : ''}`}
              </span>
              <ChevronDown className={`w-4 h-4 text-sky-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-[60] rounded-xl bg-[#f0f4f8]/95 dark:bg-slate-300/15 border border-sky-200/60 dark:border-slate-500/20 shadow-lg dark:shadow-2xl backdrop-blur-md overflow-hidden max-h-64 overflow-y-auto">
                {Array.from(groupSubmissionsByTrack(group.submissions).entries()).map(([bucket, items]) => {
                  const articles = items.filter((s) => s.submission_type === 'Article');
                  const resourceLinks = items.filter((s) => s.submission_type === 'Resource Link');
                  const others = items.filter((s) => s.submission_type !== 'Article' && s.submission_type !== 'Resource Link');
                  return (
                  <div key={bucket}>
                    <span className={SECTION_HDR}>{bucket}</span>
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {articles.map((s) => {
                        const slug = buildSlugFromTitle(s.title);
                        return (
                          <Link
                            key={s.id}
                            to={`/article/${slug}`}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent hover:border-sky-500 hover:bg-sky-500/15 transition-all group"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                            <span className="text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-300 truncate">{s.title}</span>
                            <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:text-sky-500 flex-shrink-0 ml-auto" />
                          </Link>
                        );
                      })}
                      {others.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent"
                        >
                          <Zap className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{s.title}</span>
                          <span className="ml-auto text-[10px] font-mono text-sky-500 flex-shrink-0">{categoryLabel(s)}</span>
                        </div>
                      ))}
                    </div>
                    {resourceLinks.length > 0 && (
                      <div className="mx-2 my-2">
                        <span className="block px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400">Resource Library</span>
                        <div className="grid gap-1.5 mt-1">
                          {resourceLinks.map((s) => (
                            <a
                              key={s.id}
                              href={s.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400/40 hover:bg-emerald-500/15 transition-all group"
                            >
                              <Link2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="text-xs text-emerald-100 group-hover:text-emerald-300 truncate font-medium">{s.title}</span>
                              <ChevronRight className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400 flex-shrink-0 ml-auto" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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

// ── Founder card (accordion + dropdown) ──────────────────

function FounderCard({ resourceLinks }: { resourceLinks: { title: string; slug: string; url: string }[] }) {
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

  return (
    <div className="founder-glow rounded-xl border border-amber-400/50 dark:border-amber-400/40 overflow-visible bg-sky-50/90 dark:bg-zinc-700/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] dark:hover:shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-shadow duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-sky-100 dark:border-amber-500/15">
        <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-white text-lg shadow-md shadow-amber-500/20">
          J
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-zinc-800 dark:text-zinc-100">Jamin Ware</span>
            <BadgeTag badge="Founder" />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100/60 text-amber-950 dark:bg-zinc-800/80 dark:text-zinc-100">
              {JAMIN_ARTICLES.length} Authored Articles
            </span>
            {resourceLinks.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                {resourceLinks.length} Resource Link{resourceLinks.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body — dropdown navigation */}
      <div className="px-5 py-4 overflow-visible">
        <p className="font-mono text-[9px] uppercase tracking-widest text-amber-500/70 dark:text-amber-600 mb-2">Navigate to Content</p>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setDropdownOpen((p) => !p); }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-sky-950/30 border border-amber-200 dark:border-sky-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:border-amber-400/60 dark:hover:border-amber-500/40 transition-all"
          >
            <span className="font-mono text-xs text-amber-700 dark:text-amber-400">
              {JAMIN_ARTICLES.length + resourceLinks.length} items — select to navigate
            </span>
            <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-[60] rounded-xl bg-[#f0f4f8]/95 dark:bg-slate-300/15 border border-sky-200/60 dark:border-slate-500/20 shadow-lg dark:shadow-2xl backdrop-blur-md overflow-hidden max-h-64 overflow-y-auto">
              {Array.from(groupArticlesByTrack(JAMIN_ARTICLES).entries()).map(([bucket, items]) => (
                <div key={bucket}>
                  <span className={SECTION_HDR}>{bucket}</span>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {items.map((a) => (
                      <Link
                        key={a.slug}
                        to={`/article/${a.slug}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent hover:border-amber-400 hover:bg-sky-500/15 transition-all group"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-300 truncate">{a.title}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:text-amber-400 flex-shrink-0 ml-auto" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {resourceLinks.length > 0 && (
                <div>
                  <span className={SECTION_HDR}>Resource Links</span>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {resourceLinks.map((rl) => (
                      <Link
                        key={rl.slug}
                        to={`/article/${rl.slug}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent hover:border-emerald-400 hover:bg-emerald-500/10 transition-all group"
                      >
                        <Link2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 truncate">{rl.title}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:text-emerald-400 flex-shrink-0 ml-auto" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function RecognitionPage() {
  const navigate = useNavigate();
  const [submissions,     setSubmissions]     = useState<NewSubmission[]>([]);
  const [openContributor, setOpenContributor] = useState<string | null>(null);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [founderLinks,    setFounderLinks]    = useState<{ title: string; slug: string; url: string }[]>([]);

  useEffect(() => {
    const local = loadLocalSubmissions();
    if (local.length > 0) setSubmissions(local);

    async function fetchFromSupabase() {
      // Fetch approved submissions
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(200);

      // Fetch published articles with an author_name (dynamically synced)
      const { data: articleData } = await supabase
        .from('articles')
        .select('id, title, slug, author_name, study_category, submission_type')
        .eq('is_sample', false)
        .not('author_name', 'is', null)
        .limit(200);

      // Convert articles into submission-compatible shapes
      const articleEntries: NewSubmission[] = (articleData ?? []).map((a: any) => ({
        id: `art-${a.id}`,
        full_name: a.author_name,
        track: a.study_category ?? '',
        badge: 'Cohort Contributor',
        title: a.title,
        content: '',
        submission_type: a.submission_type ?? 'Article',
        created_at: '',
      }));

      // Extract Jamin Ware's Resource Links for Founder dropdown
      const jaminLinks = (articleData ?? [])
        .filter((a: any) => a.author_name?.toLowerCase() === 'jamin ware' && a.submission_type === 'Resource Link')
        .map((a: any) => ({ title: a.title, slug: a.slug, url: '' }));
      setFounderLinks(jaminLinks);

      // Merge local + submissions + articles, deduplicate by title
      const allEntries: NewSubmission[] = [];
      const seenTitles = new Set<string>();

      // Articles take priority (these are the published source of truth)
      for (const entry of articleEntries) {
        const titleKey = entry.title.trim().toLowerCase();
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          allEntries.push(entry);
        }
      }

      // Then approved submissions (for items not yet reflected in articles)
      for (const entry of (subData as NewSubmission[]) ?? []) {
        const titleKey = entry.title.trim().toLowerCase();
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          allEntries.push(entry);
        }
      }

      // Finally merge with local-only entries
      const localOnly = local.filter((s) => s.id.startsWith('local-'));
      const merged = [...localOnly, ...allEntries];
      const seen = new Set<string>();
      setSubmissions(merged.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      }));
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
      <div className="rounded-2xl border p-6 bg-zinc-800 border-zinc-700/50 dark:bg-white/10 dark:backdrop-blur-lg dark:border-white/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30">
            <Award className="w-6 h-6 text-sky-400" />
          </div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
            Per Scholas — 2026-RTT-23
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.75)] mb-2">
          Cohort 2026-RTT-23 Wall of Fame
        </h1>
        <p className="text-zinc-300 dark:text-sky-200/70 max-w-xl leading-relaxed text-sm">
          Celebrating every learner who has contributed research, documentation, and knowledge to the
          AI-Enabled Healthcare IT collective. Click any profile to explore their full portfolio.
        </p>
      </div>

      {/* Founder section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Founder</h2>
        </div>
        <FounderCard resourceLinks={founderLinks} />
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
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
            <Award className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No community submissions yet. Be the first to contribute!
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Submit Your Contribution
            </button>
          </div>
        )}
      </section>

      <ContributorSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={() => setModalOpen(false)}
      />

    </div>
  );
}

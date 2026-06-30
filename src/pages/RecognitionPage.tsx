import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, ChevronDown, ChevronRight, ArrowLeft, BookOpen,
  Zap, Star, Crown, Link2, UploadCloud,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadLocalSubmissions, type NewSubmission } from '../utils/submissions';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';

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

// ── Dynamic pluralization ────────────────────────────────

const PLURAL_MAP: Record<string, string> = {
  'Article': 'Articles',
  'Resource Link': 'Resource Links',
  'Diagram': 'Diagrams',
  'Study Tip': 'Study Tips',
  'Quick Ref': 'Quick Refs',
  'Quick Reference': 'Quick References',
  'Prompt Playbook': 'Prompt Playbooks',
};

function pluralizeType(type: string, count: number): string {
  if (count === 1) return type;
  return PLURAL_MAP[type] ?? `${type}s`;
}

// ── Type pill colour map ─────────────────────────────────

const TYPE_PILL_COLORS: Record<string, { base: string; founder: string }> = {
  'Article':        { base: 'bg-sky-500/10 text-sky-700 dark:text-sky-400', founder: 'bg-amber-100/60 text-amber-950 dark:bg-zinc-800/80 dark:text-zinc-100' },
  'Resource Link':  { base: 'bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', founder: 'bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'Diagram':        { base: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', founder: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  'Study Tip':      { base: 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700/80 dark:text-zinc-400', founder: 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700/80 dark:text-zinc-400' },
  'Quick Reference': { base: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', founder: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  'Prompt Playbook': { base: 'bg-teal-500/10 text-teal-700 dark:text-teal-400', founder: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },
};

const DEFAULT_PILL_COLOR = { base: 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700/80 dark:text-zinc-400', founder: 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700/80 dark:text-zinc-400' };

// ── Track resolution (single source of truth) ────────────

const KNOWN_TRACK_ORDER = ['CompTIA A+ Core 1', 'CompTIA A+ Core 2', 'Advanced Healthcare IT'];

function resolveTrack(track: string, slug?: string): string {
  if (!track && slug) {
    if (slug.includes('diagrams/') || slug.startsWith('core1-') || slug.includes('networking')) return 'CompTIA A+ Core 1';
    if (slug === 'snap-in' || slug === 'command-documentation' || slug.includes('firewall')) return 'CompTIA A+ Core 2';
    if (slug.includes('healthcare') || slug.includes('cloud-computing') || slug.includes('ai-prompt')) return 'Advanced Healthcare IT';
    if (slug.includes('quick-references/')) return 'CompTIA A+ Core 1';
    return 'Other Contributions';
  }
  if (track.includes('Core 1')) return 'CompTIA A+ Core 1';
  if (track.includes('Core 2')) return 'CompTIA A+ Core 2';
  if (track.toLowerCase().includes('healthcare')) return 'Advanced Healthcare IT';
  if (/Domain\s+[1-3]\.0/i.test(track)) return 'CompTIA A+ Core 1';
  if (/Domain\s+[4-5]\.0/i.test(track)) return 'CompTIA A+ Core 2';
  if (track.toLowerCase().includes('networking') || track.toLowerCase().includes('diagram')) return 'CompTIA A+ Core 1';
  if (track.toLowerCase().includes('administration')) return 'CompTIA A+ Core 2';
  if (track.toLowerCase().includes('prompt') || track.toLowerCase().includes('ai')) return 'Advanced Healthcare IT';
  if (track.toLowerCase().includes('quick reference')) return 'CompTIA A+ Core 1';
  if (!track) return 'Other Contributions';
  return 'Other Contributions';
}

// ── Portfolio item (enriched submission shape) ────────────

interface PortfolioItem extends NewSubmission {
  slug?: string;
}

// ── Contributor group with dynamic typeCounts ────────────

interface ContributorGroup {
  name: string;
  topBadge: string;
  items: PortfolioItem[];
  typeCounts: Record<string, number>;
}

// ── Dynamic track grouping (no hardcoded track list) ─────

function groupItemsByTrack(items: PortfolioItem[]): Map<string, PortfolioItem[]> {
  const map = new Map<string, PortfolioItem[]>();
  for (const s of items) {
    const bucket = resolveTrack(s.track ?? '', s.slug);
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(s);
  }
  // Sort each bucket by created_at ascending (FIFO — oldest first)
  for (const [, val] of map) {
    val.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  }
  // Sort map keys: known tracks first in order, then alphabetical, "Other" last
  const sorted = new Map<string, PortfolioItem[]>();
  for (const known of KNOWN_TRACK_ORDER) {
    if (map.has(known)) { sorted.set(known, map.get(known)!); map.delete(known); }
  }
  const otherBucket = map.get('Other Contributions');
  map.delete('Other Contributions');
  for (const [key, val] of [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    sorted.set(key, val);
  }
  if (otherBucket) sorted.set('Other Contributions', otherBucket);
  return sorted;
}

const SECTION_HDR = 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] uppercase tracking-wider border-y border-zinc-200 dark:border-zinc-800 px-3 py-1 block first:border-t-0';

// ── Unified Contributor Card ─────────────────────────────

function ContributorCard({ group, isNew, isOpen, onToggle }: {
  group: ContributorGroup;
  isNew: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isFounder = group.topBadge === 'Founder';
  const initial = group.name.charAt(0).toUpperCase();
  const totalCount = group.items.length;
  const tierBadge = deriveTierBadge(totalCount);

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

  useEffect(() => {
    if (!isOpen) setDropdownOpen(false);
  }, [isOpen]);

  return (
    <div className={`rounded-xl border overflow-visible transition-all ${
      isFounder
        ? 'border-amber-400/50 dark:border-amber-400/40 bg-sky-50/90 dark:bg-zinc-700/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] dark:hover:shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-shadow duration-500'
        : isOpen
          ? 'border-sky-400/40 dark:border-sky-500/30 shadow-md shadow-sky-500/5 bg-white dark:bg-zinc-700'
          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-700'
    }`}>

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        {isFounder && <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />}
        <div className={`${isFounder ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white ${isFounder ? 'text-lg' : 'text-sm'} ${
          isFounder
            ? 'bg-gradient-to-br from-amber-500 to-amber-400 shadow-md shadow-amber-500/20'
            : isNew
              ? 'bg-gradient-to-br from-sky-500 to-sky-400 shadow-md shadow-sky-500/20'
              : 'bg-gradient-to-br from-zinc-500 to-zinc-400'
        }`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`${isFounder ? 'font-bold' : 'font-semibold'} text-zinc-900 dark:text-zinc-100 text-sm`}>{group.name}</span>
            {!isFounder && tierBadge !== group.topBadge && <BadgeTag badge={tierBadge} />}
            <BadgeTag badge={group.topBadge} />
            {isNew && !isFounder && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-sky-500 text-white rounded-full">
                <Star className="w-2 h-2" /> NEW
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(group.typeCounts).map(([type, count]) => {
              const colors = TYPE_PILL_COLORS[type] ?? DEFAULT_PILL_COLOR;
              const pillCls = isFounder ? colors.founder : colors.base;
              return (
                <span key={type} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${pillCls}`}>
                  {count} {pluralizeType(type, count)}
                </span>
              );
            })}
          </div>
        </div>
        {isOpen
          ? <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        }
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className={`border-t ${isFounder ? 'border-sky-100 dark:border-amber-500/15' : 'border-sky-100 dark:border-zinc-600'} px-5 py-4 overflow-visible`}>
          <p className={`font-mono text-[9px] uppercase tracking-widest mb-2 ${
            isFounder ? 'text-amber-500/70 dark:text-amber-600' : 'text-sky-400 dark:text-sky-600'
          }`}>Navigate to Content</p>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen((p) => !p); }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 transition-all ${
                isFounder
                  ? 'bg-amber-50 dark:bg-sky-950/30 border border-amber-200 dark:border-sky-800/60 hover:border-amber-400/60 dark:hover:border-amber-500/40'
                  : 'bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 hover:border-sky-400 dark:hover:border-sky-600'
              }`}
            >
              <span className={`font-mono text-xs ${isFounder ? 'text-amber-700 dark:text-amber-400' : 'text-sky-700 dark:text-sky-400'}`}>
                {totalCount} item{totalCount !== 1 ? 's' : ''} — select to navigate
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFounder ? 'text-amber-400' : 'text-sky-400'} ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-[60] rounded-xl bg-[#f0f4f8]/95 dark:bg-slate-300/15 border border-sky-200/60 dark:border-slate-500/20 shadow-lg dark:shadow-2xl backdrop-blur-md overflow-hidden max-h-64 overflow-y-auto">
                {Array.from(groupItemsByTrack(group.items).entries()).map(([bucket, items]) => (
                  <div key={bucket}>
                    <span className={SECTION_HDR}>{bucket}</span>
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {items.map((s) => {
                        const itemType = s.submission_type ?? 'Article';
                        const isResourceLink = itemType === 'Resource Link';
                        const isInternalNav = itemType === 'Article' || itemType === 'Study Tip' || itemType === 'Quick Reference' || itemType === 'Diagram' || itemType === 'Prompt Playbook';
                        const icon = isResourceLink
                          ? <Link2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          : itemType === 'Article'
                            ? <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 ${isFounder ? 'text-amber-500' : 'text-sky-500'}`} />
                            : <Zap className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;

                        if (isResourceLink) {
                          return (
                            <a
                              key={s.id}
                              href={s.content || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent hover:bg-emerald-500/10 hover:border-emerald-400 transition-all group"
                            >
                              {icon}
                              <span className="text-sm text-zinc-800 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300">{s.title}</span>
                              <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{itemType}</span>
                                <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:text-emerald-400" />
                              </span>
                            </a>
                          );
                        }

                        if (isInternalNav) {
                          return (
                            <Link
                              key={s.id}
                              to={`/article/${s.slug || buildSlugFromTitle(s.title)}`}
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent hover:bg-sky-500/15 transition-all group ${
                                isFounder ? 'hover:border-amber-400' : 'hover:border-sky-500'
                              }`}
                            >
                              {icon}
                              <span className={`text-sm text-zinc-800 dark:text-zinc-100 truncate ${
                                isFounder ? 'group-hover:text-amber-600 dark:group-hover:text-amber-300' : 'group-hover:text-sky-600 dark:group-hover:text-sky-300'
                              }`}>{s.title}</span>
                              <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500">{itemType}</span>
                                <ChevronRight className={`w-3 h-3 text-zinc-400 dark:text-zinc-600 ${
                                  isFounder ? 'group-hover:text-amber-400' : 'group-hover:text-sky-400'
                                }`} />
                              </span>
                            </Link>
                          );
                        }

                        return (
                          <div
                            key={s.id}
                            className="flex items-center gap-3 px-4 py-2.5 border-l-4 border-transparent"
                          >
                            {icon}
                            <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{s.title}</span>
                            <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800/60 text-zinc-500 flex-shrink-0">{itemType}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Main page ─────────────────────────────────────────────

export default function RecognitionPage() {
  const navigate = useNavigate();
  const [contributors, setContributors] = useState<ContributorGroup[]>([]);
  const [openContributor, setOpenContributor] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newestName, setNewestName] = useState<string | null>(null);

  useEffect(() => {
    const local = loadLocalSubmissions();

    async function fetchFromSupabase() {
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(200);

      const { data: articleData } = await supabase
        .from('articles')
        .select('id, title, slug, author_name, study_category, submission_type, created_at')
        .eq('is_sample', false)
        .not('author_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      const articleEntries: PortfolioItem[] = (articleData ?? []).map((a: any) => ({
        id: `art-${a.id}`,
        full_name: a.author_name,
        track: a.study_category ?? '',
        badge: 'Cohort Contributor',
        title: a.title,
        content: '',
        submission_type: a.submission_type ?? 'Article',
        created_at: a.created_at ?? '',
        slug: a.slug,
      }));

      const submissionEntries: PortfolioItem[] = ((subData as any[]) ?? []).map((s: any) => ({
        ...s,
        slug: undefined,
      }));

      // Merge and deduplicate by title
      const allEntries: PortfolioItem[] = [];
      const seenTitles = new Set<string>();

      for (const entry of articleEntries) {
        const key = entry.title.trim().toLowerCase();
        if (!seenTitles.has(key)) { seenTitles.add(key); allEntries.push(entry); }
      }
      for (const entry of submissionEntries) {
        const key = entry.title.trim().toLowerCase();
        if (!seenTitles.has(key)) { seenTitles.add(key); allEntries.push(entry); }
      }

      // Add local-only submissions
      const localOnly = local.filter((s) => s.id.startsWith('local-'));
      for (const entry of localOnly) {
        const key = entry.title.trim().toLowerCase();
        if (!seenTitles.has(key)) { seenTitles.add(key); allEntries.push(entry); }
      }

      // Group by author using reduce — build dynamic typeCounts
      const grouped = allEntries.reduce<Record<string, ContributorGroup>>((acc, item) => {
        const key = item.full_name.trim().toLowerCase();
        if (!acc[key]) {
          acc[key] = { name: item.full_name.trim(), topBadge: 'Cohort Contributor', items: [], typeCounts: {} };
        }
        const group = acc[key];
        if (item.badge && item.badge !== 'Cohort Contributor') group.topBadge = item.badge;
        group.items.push(item);
        const effectiveType = item.submission_type ?? 'Article';
        group.typeCounts[effectiveType] = (group.typeCounts[effectiveType] ?? 0) + 1;
        return acc;
      }, {});

      // Override Jamin Ware's badge to Founder
      const jaminKey = 'jamin ware';
      if (grouped[jaminKey]) {
        grouped[jaminKey].topBadge = 'Founder';
      }

      // Sort by total contribution count descending
      const sorted = Object.values(grouped).sort((a, b) => b.items.length - a.items.length);

      setContributors(sorted);

      // Determine newest non-founder contributor
      const firstNonFounder = allEntries.find((s) => s.full_name.trim().toLowerCase() !== 'jamin ware');
      setNewestName(firstNonFounder?.full_name.trim() ?? null);
    }
    fetchFromSupabase();
  }, []);

  const totalContributors = contributors.length;

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
      <div className="rounded-2xl border p-6 bg-zinc-800 border-zinc-700/50 dark:bg-black dark:border-zinc-800">
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
        <p className="text-zinc-300 dark:text-zinc-300 max-w-xl leading-relaxed text-sm">
          Celebrating every learner who has contributed research, documentation, and knowledge to the
          AI-Enabled Healthcare IT collective. Click any profile to explore their full portfolio.
        </p>
      </div>

      {/* Contributors section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-sky-500" />
          <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Cohort Contributors
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
            {totalContributors}
          </span>
        </div>

        {contributors.length > 0 ? (
          <div className="space-y-3">
            {contributors.map((g) => (
              <ContributorCard
                key={g.name}
                group={g}
                isNew={g.name === newestName && g.topBadge !== 'Founder'}
                isOpen={openContributor === g.name}
                onToggle={() => setOpenContributor((prev) => prev === g.name ? null : g.name)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
            <Award className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No contributions yet. Be the first to contribute!
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

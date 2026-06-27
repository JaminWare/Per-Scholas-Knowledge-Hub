import { useState, useEffect } from 'react';
import { Award, Plus, ChevronDown, Star, BookOpen, Zap, Ticket, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadLocalSubmissions, type NewSubmission } from './ContributorSubmissionModal';

interface Props {
  newSubmission: NewSubmission | null;
  onClaimBadge: () => void;
}

const badgeColors: Record<string, string> = {
  'Founder':             'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
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

interface ContributionItem {
  id: string;
  title: string;
  track: string;
  badge: string;
  submission_type?: string;
  article_type?: string;
}

interface ContributorGroup {
  name: string;
  topBadge: string;
  contributions: ContributionItem[];
  isPinned?: boolean;
}

type CategoryMeta = { icon: React.ReactNode; label: string };

function categorize(item: ContributionItem): CategoryMeta {
  const type = item.submission_type;
  if (type === 'Support Ticket') return { icon: <Ticket className="w-3.5 h-3.5" />, label: 'Logged Support Tickets' };
  if (type === 'Article')        return { icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Authored Articles' };
  if (type === 'Resource Link')  return { icon: <Link2 className="w-3.5 h-3.5" />, label: 'Resource Links' };
  if (item.badge === 'Diagram Architect')
    return { icon: <Zap className="w-3.5 h-3.5" />, label: 'Diagrams' };
  if (item.track?.startsWith('Quick References') || item.badge === 'Reference Author')
    return { icon: <Zap className="w-3.5 h-3.5" />, label: 'Quick References' };
  if (item.badge === 'Playbook Engineer')
    return { icon: <Zap className="w-3.5 h-3.5" />, label: 'Prompt Playbooks' };
  return { icon: <Zap className="w-3.5 h-3.5" />, label: 'Shared Tips' };
}

const ICON_BY_LABEL: Record<string, React.ReactNode> = {
  'Authored Articles':      <BookOpen className="w-3.5 h-3.5 text-sky-500" />,
  'Quick References':       <Zap className="w-3.5 h-3.5 text-amber-500" />,
  'Shared Tips':            <Zap className="w-3.5 h-3.5 text-green-500" />,
  'Diagrams':               <Zap className="w-3.5 h-3.5 text-blue-500" />,
  'Prompt Playbooks':       <Zap className="w-3.5 h-3.5 text-violet-500" />,
  'Resource Links':         <Link2 className="w-3.5 h-3.5 text-teal-500" />,
  'Logged Support Tickets': <Ticket className="w-3.5 h-3.5 text-amber-600" />,
};

// Contributions ordered verbatim as requested, with article_type labels.
const JAMIN_WARE: ContributorGroup = {
  name: 'Jamin Ware',
  topBadge: 'Founder',
  isPinned: true,
  contributions: [
    {
      id: 'jw-5',
      title: 'Introduction to Healthcare IT Security',
      track: 'Advanced Healthcare IT',
      badge: 'Founder',
      submission_type: 'Article',
      article_type: 'Featured Article',
    },
    {
      id: 'jw-6',
      title: 'Cloud Computing in Healthcare',
      track: 'Advanced Healthcare IT',
      badge: 'Founder',
      submission_type: 'Article',
      article_type: 'Featured Article',
    },
    {
      id: 'jw-7',
      title: 'AI Prompt Engineering for Healthcare',
      track: 'AI Prompt Playbook',
      badge: 'Founder',
      submission_type: 'Article',
      article_type: 'Featured Article',
    },
    {
      id: 'jw-2',
      title: 'The Role of Firewalls in Modern Network Security',
      track: 'Networking & Security',
      badge: 'Founder',
      submission_type: 'Article',
      article_type: 'Research Article',
    },
    {
      id: 'jw-3',
      title: 'Command-Line Interface (CLI) Research',
      track: 'Systems Administration',
      badge: 'Founder',
      submission_type: 'Article',
      article_type: 'Technical Guide',
    },
    {
      id: 'jw-4',
      title: 'Microsoft Management Console (MMC) Snap-ins',
      track: 'Systems Administration',
      badge: 'Founder',
      submission_type: 'Article',
      article_type: 'Technical Guide',
    },
    {
      id: 'jw-1',
      title: 'Essential Port Numbers & Protocols — Quick References',
      track: 'Quick References — Port Numbers & Protocols',
      badge: 'Founder',
      submission_type: 'Resource Link',
      article_type: 'Quick Reference',
    },
  ],
};

// Metadata chips summarising contribution totals for compact cards
function metaChips(contributions: ContributionItem[]) {
  const counts: Record<string, number> = {};
  for (const c of contributions) {
    const { label } = categorize(c);
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts);
}

function groupByName(submissions: NewSubmission[]): ContributorGroup[] {
  const map = new Map<string, ContributorGroup>();
  for (const s of submissions) {
    const key = s.full_name.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name: s.full_name.trim(), topBadge: s.badge || 'Cohort Contributor', contributions: [] });
    }
    const group = map.get(key)!;
    if (s.badge && s.badge !== 'Cohort Contributor') group.topBadge = s.badge;
    group.contributions.push({
      id: s.id,
      title: s.title,
      track: s.track,
      badge: s.badge || 'Cohort Contributor',
      submission_type: s.submission_type,
    });
  }
  return Array.from(map.values());
}

// ── Founder full accordion ────────────────────────────────
function FounderCard({
  group,
  isExpanded,
  onToggle,
}: {
  group: ContributorGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const articleTypeColors: Record<string, string> = {
    'Featured Article': 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    'Research Article': 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    'Technical Guide':  'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    'Quick Reference':  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-300/60 dark:border-amber-500/30 shadow-sm shadow-amber-500/5 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-colors"
        aria-expanded={isExpanded}
      >
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-white text-xl shadow-lg shadow-amber-500/20">
          J
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-zinc-800 dark:text-zinc-100 text-base">{group.name}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-500/20">
              <Star className="w-2.5 h-2.5" /> FOUNDER
            </span>
            <BadgeTag badge={group.topBadge} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metaChips(group.contributions).map(([label, count]) => (
              <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {ICON_BY_LABEL[label] ?? <Zap className="w-3 h-3" />}
                {count} {label}
              </span>
            ))}
          </div>
        </div>

        <ChevronDown className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-amber-100 dark:border-amber-500/10">
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
            Cohort 2026-RTT-23 · {group.contributions.length} verified contributions
          </p>
          <ul className="space-y-2.5">
            {group.contributions.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{item.title}</span>
                  {item.article_type && (
                    <span className={`ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${articleTypeColors[item.article_type] ?? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                      {item.article_type}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Compact member card (grid) ────────────────────────────
function CompactMemberCard({
  group,
  isExpanded,
  onToggle,
  isNew,
}: {
  group: ContributorGroup;
  isExpanded: boolean;
  onToggle: () => void;
  isNew?: boolean;
}) {
  const initial = group.name.charAt(0).toUpperCase();
  const chips = metaChips(group.contributions);

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden transition-all ${
      isNew
        ? 'border-sky-400/40 dark:border-sky-500/30'
        : 'border-zinc-200 dark:border-zinc-800'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${
          isNew ? 'from-sky-500 to-sky-400' : 'from-zinc-500 to-zinc-400'
        }`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm truncate">{group.name}</span>
            {isNew && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-sky-500 text-white rounded-full flex-shrink-0">
                <Star className="w-2 h-2" /> NEW
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <BadgeTag badge={group.topBadge} />
            {chips.slice(0, 2).map(([label, count]) => (
              <span key={label} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                {count} {label.replace('Authored ', '').replace('Logged ', '')}
              </span>
            ))}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          {(() => {
            const categories = new Map<string, ContributionItem[]>();
            for (const c of group.contributions) {
              const { label } = categorize(c);
              if (!categories.has(label)) categories.set(label, []);
              categories.get(label)!.push(c);
            }
            return Array.from(categories.entries()).map(([label, items]) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  {ICON_BY_LABEL[label] ?? <Zap className="w-3.5 h-3.5 text-zinc-400" />}
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{label}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{items.length}</span>
                </div>
                <ul className="space-y-1 pl-5">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 flex-shrink-0" />
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function CohortRecognitionWall({ newSubmission, onClaimBadge }: Props) {
  const [submissions, setSubmissions]     = useState<NewSubmission[]>([]);
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set(['Jamin Ware']));

  useEffect(() => {
    const local = loadLocalSubmissions();
    if (local.length > 0) setSubmissions(local);

    async function loadFromSupabase() {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data && data.length > 0) {
        setSubmissions((prev) => {
          const localOnly = prev.filter((s) => s.id.startsWith('local-'));
          const merged = [...localOnly, ...(data as NewSubmission[])];
          const seen = new Set<string>();
          return merged.filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
        });
      }
    }
    loadFromSupabase();
  }, []);

  useEffect(() => {
    if (!newSubmission) return;
    setSubmissions((prev) => {
      const already = prev.some((s) => s.id === newSubmission.id);
      return already ? prev : [newSubmission, ...prev];
    });
  }, [newSubmission]);

  const dynamicGroups = groupByName(submissions);
  const newestName    = submissions[0]?.full_name?.trim() ?? null;
  const communityGroups = dynamicGroups.filter((g) => g.name.toLowerCase() !== 'jamin ware');

  const uniqueCount = new Set([
    'jamin ware',
    ...dynamicGroups.map((g) => g.name.toLowerCase()),
  ]).size;

  function toggle(name: string) {
    setExpandedNames((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <section className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Cohort Recognition Wall</h2>
            <p className="text-sm text-zinc-500">Pioneering Cohort 2026-RTT-23</p>
          </div>
        </div>
        <span className="px-3 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full">
          {uniqueCount} contributor{uniqueCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tier 1: Pinned Founder — full-width accordion */}
      <div className="mb-5">
        <FounderCard
          group={JAMIN_WARE}
          isExpanded={expandedNames.has('Jamin Ware')}
          onToggle={() => toggle('Jamin Ware')}
        />
      </div>

      {/* Tier 2: Community members — compact 2-col grid */}
      {communityGroups.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-3">
            Community Contributors
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {communityGroups.map((group) => (
              <CompactMemberCard
                key={group.name}
                group={group}
                isExpanded={expandedNames.has(group.name)}
                onToggle={() => toggle(group.name)}
                isNew={group.name.trim() === newestName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Claim your spot CTA */}
      <button
        onClick={onClaimBadge}
        className="w-full flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-sky-400 dark:hover:border-sky-500/50 hover:bg-sky-50 dark:hover:bg-sky-500/5 rounded-xl transition-all group text-left"
      >
        <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-200 dark:group-hover:bg-sky-500/20 transition-colors flex-shrink-0">
          <Plus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <p className="font-semibold text-sky-600 dark:text-sky-400 text-sm">Your Name Here</p>
          <p className="text-xs text-zinc-500 mt-0.5">Submit a contribution to claim your spot on the wall!</p>
        </div>
      </button>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { Award, Plus, BookOpen, Zap, Ticket, Link2, Star } from 'lucide-react';
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
}

interface ContributorGroup {
  name: string;
  topBadge: string;
  contributions: ContributionItem[];
  isPinned?: boolean;
}

function categorizeLabel(item: ContributionItem): string {
  const type = item.submission_type;
  if (type === 'Support Ticket') return 'Logged Support Tickets';
  if (type === 'Article')        return 'Authored Articles';
  if (type === 'Resource Link')  return 'Resource Links';
  if (item.badge === 'Diagram Architect') return 'Diagrams';
  if (item.track?.startsWith('Quick References') || item.badge === 'Reference Author') return 'Quick References';
  if (item.badge === 'Playbook Engineer') return 'Prompt Playbooks';
  return 'Shared Tips';
}

const LABEL_ICON: Record<string, React.ReactNode> = {
  'Authored Articles':      <BookOpen className="w-3 h-3" />,
  'Quick References':       <Zap className="w-3 h-3" />,
  'Shared Tips':            <Zap className="w-3 h-3" />,
  'Diagrams':               <Zap className="w-3 h-3" />,
  'Prompt Playbooks':       <Zap className="w-3 h-3" />,
  'Resource Links':         <Link2 className="w-3 h-3" />,
  'Logged Support Tickets': <Ticket className="w-3 h-3" />,
};

function buildStatLine(contributions: ContributionItem[]): string {
  const counts: Record<string, number> = {};
  for (const c of contributions) {
    const label = categorizeLabel(c);
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, n]) => `${n} ${label}`)
    .join(' • ');
}

const JAMIN_CONTRIBUTIONS: ContributionItem[] = [
  { id: 'jw-5',  title: 'Introduction to Healthcare IT Security',              track: 'Advanced Healthcare IT',      badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-6',  title: 'Cloud Computing in Healthcare',                       track: 'Advanced Healthcare IT',      badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-7',  title: 'AI Prompt Engineering for Healthcare',                track: 'AI Prompt Playbook',          badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-2',  title: 'The Role of Firewalls in Modern Network Security',    track: 'Networking & Security',       badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-3',  title: 'Command-Line Interface (CLI) Research',               track: 'Systems Administration',      badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-4',  title: 'Microsoft Management Console (MMC) Snap-ins',         track: 'Systems Administration',      badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-8',  title: 'Enterprise Three-Tier Network Topology Architecture', track: 'Diagrams',                    badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-9',  title: 'OSI Model Data Encapsulation & PDU Flow',             track: 'Diagrams',                    badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-10', title: 'TCP/IP Protocol Suite — Four-Layer Model, IPv4 vs. IPv6 & Packet Transmission', track: 'CompTIA A+ Core 1 — Networking', badge: 'Founder', submission_type: 'Article' },
  { id: 'jw-1',  title: 'Essential Port Numbers & Protocols — Quick References', track: 'Quick References — Port Numbers & Protocols', badge: 'Founder', submission_type: 'Resource Link' },
];

const JAMIN_WARE: ContributorGroup = {
  name: 'Jamin Ware',
  topBadge: 'Founder',
  isPinned: true,
  contributions: JAMIN_CONTRIBUTIONS,
};

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

// ── Static Founder Row (pinned, amber-framed, no expand) ──
function FounderRow({ group }: { group: ContributorGroup }) {
  const statLine = buildStatLine(group.contributions);
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-zinc-600 rounded-xl border border-amber-300/60 dark:border-amber-500/30 shadow-sm shadow-amber-500/5">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-white text-base shadow-md shadow-amber-500/20">
        J
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">{group.name}</span>
          <BadgeTag badge="Founder" />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-500/20">
            <Star className="w-2.5 h-2.5" /> PINNED
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{statLine}</p>
      </div>
    </div>
  );
}

// ── Static Member Row (flat, no expand) ──────────────────
function MemberRow({ group, isNew }: { group: ContributorGroup; isNew?: boolean }) {
  const initial = group.name.charAt(0).toUpperCase();
  const statLine = buildStatLine(group.contributions);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-600 rounded-xl border ${
      isNew ? 'border-sky-400/40 dark:border-sky-500/30' : 'border-zinc-200 dark:border-zinc-600'
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${
        isNew ? 'bg-gradient-to-br from-sky-500 to-sky-400' : 'bg-gradient-to-br from-zinc-500 to-zinc-400'
      }`}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm">{group.name}</span>
          <BadgeTag badge={group.topBadge} />
          {isNew && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-sky-500 text-white rounded-full">
              <Star className="w-2 h-2" /> NEW
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{statLine}</p>
      </div>
      {/* Per-category mini icons */}
      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
        {Array.from(new Set(group.contributions.map(categorizeLabel))).map((label) => (
          <span key={label} className="text-zinc-400 dark:text-zinc-600" title={label}>
            {LABEL_ICON[label] ?? <Zap className="w-3 h-3" />}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function CohortRecognitionWall({ newSubmission, onClaimBadge }: Props) {
  const [submissions, setSubmissions] = useState<NewSubmission[]>([]);

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

  return (
    <section className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
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

      {/* Pinned founder */}
      <div className="mb-3">
        <FounderRow group={JAMIN_WARE} />
      </div>

      {/* Community contributors */}
      {communityGroups.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2 px-1">
            Community Contributors
          </p>
          <div className="space-y-2">
            {communityGroups.map((group) => (
              <MemberRow
                key={group.name}
                group={group}
                isNew={group.name.trim() === newestName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Claim your spot CTA */}
      <button
        onClick={onClaimBadge}
        className="w-full flex items-center gap-3 p-4 bg-white dark:bg-zinc-600 border-2 border-dashed border-zinc-300 dark:border-zinc-500 hover:border-sky-400 dark:hover:border-sky-500/50 hover:bg-sky-50 dark:hover:bg-sky-500/5 rounded-xl transition-all group text-left"
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

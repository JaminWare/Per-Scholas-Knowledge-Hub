import { useState, useEffect } from 'react';
import { Award, Plus, BookOpen, Zap, Link2, Star, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadLocalSubmissions, type NewSubmission } from '../utils/submissions';

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

// ── Type pill colours (homepage variant) ─────────────────

const TYPE_PILL_COLORS: Record<string, { base: string; founder: string }> = {
  'Article':         { base: 'bg-sky-100/70 text-sky-900 dark:bg-zinc-800/80 dark:text-zinc-100', founder: 'bg-amber-100/60 text-amber-950 dark:bg-zinc-800/80 dark:text-zinc-100' },
  'Resource Link':   { base: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', founder: 'bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  'Diagram':         { base: 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', founder: 'bg-blue-100/60 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
};

const DEFAULT_PILL = { base: 'bg-zinc-100/80 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300', founder: 'bg-zinc-100/80 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300' };

// ── Type icons for the mini icon row ─────────────────────

const TYPE_ICON: Record<string, React.ReactNode> = {
  'Article':        <BookOpen className="w-3 h-3" />,
  'Resource Link':  <Link2 className="w-3 h-3" />,
};

interface ContributorGroup {
  name: string;
  topBadge: string;
  typeCounts: Record<string, number>;
  totalCount: number;
}

function groupByName(submissions: NewSubmission[]): ContributorGroup[] {
  const map = new Map<string, ContributorGroup>();
  for (const s of submissions) {
    const key = s.full_name.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name: s.full_name.trim(), topBadge: s.badge || 'Cohort Contributor', typeCounts: {}, totalCount: 0 });
    }
    const group = map.get(key)!;
    if (s.badge && s.badge !== 'Cohort Contributor') group.topBadge = s.badge;
    const effectiveType = s.submission_type ?? 'Article';
    group.typeCounts[effectiveType] = (group.typeCounts[effectiveType] ?? 0) + 1;
    group.totalCount++;
  }

  // Override Jamin Ware's badge to Founder
  const jamin = map.get('jamin ware');
  if (jamin) jamin.topBadge = 'Founder';

  // Sort by contribution count descending
  return Array.from(map.values()).sort((a, b) => b.totalCount - a.totalCount);
}

// ── Contributor Row ──────────────────────────────────────

function ContributorRow({ group, isNew }: { group: ContributorGroup; isNew?: boolean }) {
  const isFounder = group.topBadge === 'Founder';
  const initial = group.name.charAt(0).toUpperCase();

  if (isFounder) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 bg-sky-50/90 dark:bg-zinc-700/80 rounded-xl border border-sky-300/60 dark:border-amber-500/30 shadow-sm shadow-amber-500/5">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Crown className="w-4 h-4 text-amber-500" />
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center font-bold text-white text-base shadow-md shadow-amber-500/20">
            {initial}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">{group.name}</span>
            <BadgeTag badge="Founder" />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(group.typeCounts).map(([type, count]) => {
              const colors = TYPE_PILL_COLORS[type] ?? DEFAULT_PILL;
              return (
                <span key={type} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${colors.founder}`}>
                  {count} {pluralizeType(type, count)}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(group.typeCounts).map(([type, count]) => {
            const colors = TYPE_PILL_COLORS[type] ?? DEFAULT_PILL;
            return (
              <span key={type} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${colors.base}`}>
                {count} {pluralizeType(type, count)}
              </span>
            );
          })}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
        {Object.keys(group.typeCounts).map((type) => (
          <span key={type} className="text-zinc-400 dark:text-zinc-600" title={type}>
            {TYPE_ICON[type] ?? <Zap className="w-3 h-3" />}
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
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: articleData } = await supabase
        .from('articles')
        .select('id, title, slug, author_name, study_category, submission_type, created_at')
        .eq('is_sample', false)
        .not('author_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      const articleEntries: NewSubmission[] = (articleData ?? []).map((a: any) => ({
        id: `art-${a.id}`,
        full_name: a.author_name,
        track: a.study_category ?? '',
        badge: 'Cohort Contributor',
        title: a.title,
        content: '',
        submission_type: a.submission_type ?? 'Article',
        created_at: a.created_at ?? '',
      }));

      const allEntries: NewSubmission[] = [];
      const seenTitles = new Set<string>();

      for (const entry of articleEntries) {
        const key = entry.title.trim().toLowerCase();
        if (!seenTitles.has(key)) { seenTitles.add(key); allEntries.push(entry); }
      }
      for (const entry of (subData as NewSubmission[]) ?? []) {
        const key = entry.title.trim().toLowerCase();
        if (!seenTitles.has(key)) { seenTitles.add(key); allEntries.push(entry); }
      }

      const localOnly = local.filter((s) => s.id.startsWith('local-'));
      const merged = [...localOnly, ...allEntries];
      const seen = new Set<string>();
      setSubmissions(merged.filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; }));
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

  const allGroups = groupByName(submissions);
  const newestName = submissions.find((s) => s.full_name?.trim().toLowerCase() !== 'jamin ware')?.full_name?.trim() ?? null;

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
          {allGroups.length} contributor{allGroups.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* All contributors sorted by contribution count */}
      {allGroups.length > 0 && (
        <div className="space-y-2 mb-3">
          {allGroups.map((group) => (
            <ContributorRow
              key={group.name}
              group={group}
              isNew={group.name.trim() === newestName && group.topBadge !== 'Founder'}
            />
          ))}
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

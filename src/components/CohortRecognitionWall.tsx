import { useState, useEffect } from 'react';
import { Award, Plus, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadLocalSubmissions, type NewSubmission } from './ContributorSubmissionModal';

interface Props {
  newSubmission: NewSubmission | null;
  onClaimBadge: () => void;
}

const badgeColors: Record<string, string> = {
  'Core 1 Expert':       'bg-emerald-500/10 text-emerald-400',
  'Core 2 Expert':       'bg-teal-500/10 text-teal-400',
  'HealthIT Specialist': 'bg-cyan-500/10 text-cyan-400',
  'Diagram Architect':   'bg-blue-500/10 text-blue-400',
  'Reference Author':    'bg-amber-500/10 text-amber-400',
  'Playbook Engineer':   'bg-purple-500/10 text-purple-400',
  'Cohort Contributor':  'bg-zinc-700 text-zinc-400',
};

function BadgeTag({ badge }: { badge: string }) {
  const cls = badgeColors[badge] ?? badgeColors['Cohort Contributor'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      [{badge}]
    </span>
  );
}

export default function CohortRecognitionWall({ newSubmission, onClaimBadge }: Props) {
  const [submissions, setSubmissions] = useState<NewSubmission[]>([]);

  useEffect(() => {
    const local = loadLocalSubmissions();
    if (local.length > 0) setSubmissions(local);

    async function loadFromSupabase() {
      const { data } = await supabase
        .from('submissions').select('*').order('created_at', { ascending: false }).limit(20);
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

  const staticBadges = [
    { id: 's1', name: 'Sample Contributor', role: 'Cohort Member', badge: 'Cohort Contributor' },
    { id: 's2', name: '[Sample]', role: 'Technical Architecture Lead', badge: 'Core 1 Expert' },
    { id: 's3', name: '[Learner Name]', role: 'Healthcare IT Specialist', badge: 'HealthIT Specialist' },
  ];

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-emerald-500" />
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Cohort Recognition Wall</h2>
            <p className="text-sm text-zinc-500">Pioneering Cohort 2026-RTT-23</p>
          </div>
        </div>
        {submissions.length > 0 && (
          <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full">
            {submissions.length} contributor{submissions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Recent Community Contributions feed */}
      {submissions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Recent Community Contributions
          </h3>
          <div className="space-y-2">
            {submissions.slice(0, 8).map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  i === 0
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${
                  i === 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-zinc-700'
                }`}>
                  {s.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-100 text-sm">{s.full_name}</span>
                    {i === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-emerald-500 text-white rounded-full">
                        <Star className="w-3 h-3" /> NEW
                      </span>
                    )}
                    <BadgeTag badge={s.badge || 'Cohort Contributor'} />
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {s.title} — <span className="text-emerald-400">{s.track.split('—')[0].trim()}</span>
                  </p>
                </div>
                <span className="text-xs text-zinc-600 whitespace-nowrap hidden sm:block">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {staticBadges.map((b) => (
          <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                <Award className="w-5 h-5 text-zinc-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-100 truncate text-sm">{b.name}</p>
                <p className="text-xs text-zinc-500 truncate">{b.role}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap gap-1.5">
              <BadgeTag badge={b.badge} />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 2026-RTT-23
              </span>
            </div>
          </div>
        ))}

        {/* Claim card */}
        <button
          onClick={onClaimBadge}
          className="bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-xl p-4 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Plus className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-emerald-400 text-sm">Your Name Here</p>
              <p className="text-xs text-zinc-500 leading-tight">Submit a tip to claim your badge!</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium bg-zinc-800 text-zinc-500 rounded-full group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-emerald-500 transition-colors" />
              Claim Your Spot
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}

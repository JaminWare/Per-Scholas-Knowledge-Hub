import { useState, useEffect } from 'react';
import { Award, Plus, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { NewSubmission } from './ContributorSubmissionModal';

interface Props {
  newSubmission: NewSubmission | null;
  onClaimBadge: () => void;
}

export default function CohortRecognitionWall({ newSubmission, onClaimBadge }: Props) {
  const [submissions, setSubmissions] = useState<NewSubmission[]>([]);

  useEffect(() => {
    async function loadSubmissions() {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);
      if (data) setSubmissions(data as NewSubmission[]);
    }
    loadSubmissions();
  }, []);

  // Prepend new submission instantly when it arrives
  useEffect(() => {
    if (!newSubmission) return;
    setSubmissions((prev) => {
      const already = prev.some((s) => s.id === newSubmission.id);
      return already ? prev : [newSubmission, ...prev];
    });
  }, [newSubmission]);

  const staticBadges = [
    { id: 'static-1', name: 'Sample', role: 'Cohort Member', cohort: '2026-RTT-23' },
    { id: 'static-2', name: '[Sample]', role: 'Technical Architecture Lead', cohort: '2026-RTT-23' },
    { id: 'static-3', name: '[Learner Name]', role: 'Technical Contributor', cohort: '2026-RTT-23' },
  ];

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-emerald-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Cohort Recognition Wall
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pioneering Cohort 2026-RTT-23
            </p>
          </div>
        </div>
        {submissions.length > 0 && (
          <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
            {submissions.length} recent submission{submissions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Live submissions ticker — shown at top when submissions exist */}
      {submissions.length > 0 && (
        <div className="mb-6 space-y-2">
          {submissions.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                i === 0
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
              } transition-all`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                i === 0
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-slate-400 to-slate-500'
              }`}>
                <span className="text-white text-sm font-bold">
                  {s.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {s.full_name}
                  </span>
                  {i === 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-emerald-500 text-white rounded-full">
                      <Star className="w-3 h-3" /> NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {s.title} — <span className="text-emerald-600 dark:text-emerald-400">{s.track.split('—')[0].trim()}</span>
                </p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap hidden sm:block">
                {new Date(s.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Badge grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {staticBadges.map((badge) => (
          <div key={badge.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                <Award className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{badge.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{badge.role}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {badge.cohort}
              </span>
            </div>
          </div>
        ))}

        {/* Clickable claim card */}
        <button
          onClick={onClaimBadge}
          className="card p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <Plus className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-emerald-600 dark:text-emerald-400">Your Name Here</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                Submit a unique tip to claim your badge!
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-emerald-500 transition-colors" />
              Claim Your Spot
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}

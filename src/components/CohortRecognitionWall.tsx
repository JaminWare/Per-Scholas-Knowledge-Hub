import { Award, Plus } from 'lucide-react';

interface ContributorBadge {
  id: string;
  name: string;
  role: string;
  cohortId: string;
  hasProfile?: boolean;
}

const sampleBadges: ContributorBadge[] = [
  { id: '1', name: 'Sample', role: 'Cohort Member', cohortId: '2026-RTT-23', hasProfile: false },
  { id: '2', name: '[Sample]', role: 'Technical Architecture Lead', cohortId: '2026-RTT-23', hasProfile: false },
  { id: '3', name: '[Learner Name]', role: 'Technical Contributor', cohortId: '2026-RTT-23', hasProfile: false },
];

export default function CohortRecognitionWall() {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Cohort Recognition Wall
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sampleBadges.map((badge) => (
          <div
            key={badge.id}
            className="card p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                <Award className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {badge.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {badge.role}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {badge.cohortId}
              </span>
            </div>
          </div>
        ))}

        {/* Placeholder card for new contributors */}
        <div className="card p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <Plus className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                Your Name Here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit a unique tip to claim your badge!
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Claim Your Spot
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

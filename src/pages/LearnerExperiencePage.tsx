import { LifeBuoy, Construction } from 'lucide-react';

export default function LearnerExperiencePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4 pb-6 border-b border-zinc-300 dark:border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
          <LifeBuoy className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Learner Experience & FAQs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Cohort onboarding, troubleshooting, and common questions</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
          <Construction className="w-8 h-8 text-amber-500 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Coming Soon</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
            Cohort Onboarding & Troubleshooting FAQs are being curated by your Cohort Leaders. This space will house quickstart guides, platform walkthroughs, and answers to the most common questions.
          </p>
        </div>
      </div>
    </div>
  );
}

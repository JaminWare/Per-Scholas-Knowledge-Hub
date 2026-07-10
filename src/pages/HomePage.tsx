import { Link } from 'react-router-dom';
import {
  TrendingUp, ChevronRight, Compass, Lightbulb, Flame, Shield, Briefcase,
} from 'lucide-react';

const SURVIVAL_CARDS = [
  {
    icon: Lightbulb,
    title: 'Onboarding Hurdles',
    description: 'Canvas workflows, Google Cert sync, and pacing strategies from alumni who made it.',
    tab: 'onboarding',
    color: 'text-blue-400',
  },
  {
    icon: Flame,
    title: 'The Mid Program Slump',
    description: 'Mental endurance tactics, time management, and motivation from peers who pushed through.',
    tab: 'slump',
    color: 'text-blue-400',
  },
  {
    icon: Shield,
    title: 'Certification Prep',
    description: 'Test day strategies, CompTIA tactics, and readiness benchmarks from certified alumni.',
    tab: 'cert',
    color: 'text-blue-400',
  },
  {
    icon: Briefcase,
    title: 'Job Hunt Triage',
    description: 'Resume reality checks, interview prep, and field transition advice from hired grads.',
    tab: 'job',
    color: 'text-blue-400',
  },
];

export default function HomePage() {
  return (
    <div className="flex-1 shrink-0 w-full max-w-3xl mx-auto flex flex-col items-start gap-6 md:gap-8">
      {/* ── Welcome Header ───────────────────────────────── */}
      <section className="w-full space-y-4 pt-2">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <TrendingUp className="w-4 h-4 shrink-0 text-blue-400" />
          <span>Per Scholas</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
          AI Enabled Healthcare IT
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
          Welcome to the collaborative resource hub!
        </p>
        <Link
          to="/learner-experience"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          Start Here
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Cohort Survival Guide ────────────────────────── */}
      <section className="w-full space-y-4 pb-12">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 shrink-0 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-200">Cohort Survival Guide</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SURVIVAL_CARDS.map((card) => (
            <Link
              key={card.tab + card.title}
              to={`/learner-experience?tab=${card.tab}`}
              className="group flex items-start gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800/40 shadow-xl shadow-black/20 hover:border-zinc-700 transition-all"
            >
              <card.icon className={`w-5 h-5 shrink-0 mt-0.5 ${card.color}`} />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-0.5" />
            </Link>
          ))}
        </div>
        <Link
          to="/learner-experience"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          View full Learner Experience Hub
          <ChevronRight className="w-3 h-3" />
        </Link>
      </section>
    </div>
  );
}

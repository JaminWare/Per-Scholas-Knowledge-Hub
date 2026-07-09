import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Compass, BookOpen, Flame, Briefcase, ChevronRight, LifeBuoy,
} from 'lucide-react';

const survivalGuideCards = [
  {
    id: 'onboarding',
    title: 'Onboarding Hurdles',
    description: 'Canvas workflows, VM setups, and tool access.',
    icon: Compass,
    iconBg: 'bg-zinc-800 border border-zinc-700',
    iconColor: 'text-blue-400',
    tab: 'onboarding',
  },
  {
    id: 'lab-survival',
    title: 'Lab Survival Guides',
    description: 'EHR sandboxes, Active Directory, and infrastructure.',
    icon: BookOpen,
    iconBg: 'bg-zinc-800 border border-zinc-700',
    iconColor: 'text-blue-400',
    tab: 'labs',
  },
  {
    id: 'mid-program',
    title: 'The Mid Program Slump',
    description: 'Mental endurance, imposter syndrome, and time management.',
    icon: Flame,
    iconBg: 'bg-amber-500/15 border border-amber-500/30',
    iconColor: 'text-amber-400',
    tab: 'slump',
  },
  {
    id: 'job-hunt',
    title: 'Job Hunt & Certs',
    description: 'Test day strategies, resume reality checks, and interviews.',
    icon: Briefcase,
    iconBg: 'bg-zinc-800 border border-zinc-700',
    iconColor: 'text-zinc-300',
    tab: 'job',
  },
];

export default function HomePage() {
  return (
    <div className="flex-1 shrink-0 w-full max-w-7xl mx-auto flex flex-col items-start gap-6 md:gap-8 animate-page-in">

      {/* Welcome header */}
      <div className="text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium">
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span>Per Scholas</span>
        </div>
        <h1 className="text-lg md:text-xl font-bold text-white leading-tight">
          AI Enabled Healthcare IT
        </h1>
        <p className="text-sm text-zinc-400">Welcome to the collaborative resource hub!</p>
        <Link
          to="/learner-experience"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-400 text-white font-bold text-sm transition-colors whitespace-nowrap outline-none select-none"
        >
          <LifeBuoy className="w-4 h-4 shrink-0" />
          Start Here
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>
      </div>

      {/* Cohort Survival Guide */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
            <Compass className="w-5 h-5 shrink-0 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-100">Cohort Survival Guide</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {survivalGuideCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                to={`/learner-experience?tab=${card.tab}`}
                className="group/card flex items-start gap-3 p-3.5 text-left bg-zinc-950/50 rounded-xl border border-zinc-800/50 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 outline-none select-none"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/card:scale-105 transition-transform ${card.iconBg}`}>
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${card.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-white">
                      {card.title}
                    </p>
                    <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover/card:text-blue-400 group-hover/card:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{card.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-left">
          <Link
            to="/learner-experience"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Explore the full Learner Experience Hub &rarr;
            <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </div>

    </div>
  );
}

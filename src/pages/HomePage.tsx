import { useState } from 'react';
import { Link } from 'react-router-dom';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';
import { type NewSubmission } from '../utils/submissions';
import SuccessToast from '../components/SuccessToast';
import {
  TrendingUp, Users, UploadCloud,
  Compass, BookOpen, Flame, Briefcase, ChevronRight, LifeBuoy,
} from 'lucide-react';

const survivalGuideCards = [
  {
    id: 'onboarding',
    title: 'Onboarding Hurdles',
    description: 'Canvas workflows, VM setups, and tool access.',
    icon: Compass,
    iconBg: 'bg-sky-500',
    tab: 'onboarding',
  },
  {
    id: 'lab-survival',
    title: 'Lab Survival Guides',
    description: 'EHR sandboxes, Active Directory, and infrastructure.',
    icon: BookOpen,
    iconBg: 'bg-sky-500',
    tab: 'labs',
  },
  {
    id: 'mid-program',
    title: 'The Mid Program Slump',
    description: 'Mental endurance, imposter syndrome, and time management.',
    icon: Flame,
    iconBg: 'bg-amber-500',
    tab: 'slump',
  },
  {
    id: 'job-hunt',
    title: 'Job Hunt & Certs',
    description: 'Test day strategies, resume reality checks, and interviews.',
    icon: Briefcase,
    iconBg: 'bg-zinc-600',
    tab: 'job',
  },
];

export default function HomePage({ onRefresh }: { onRefresh?: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmitted = (submission: NewSubmission) => {
    setToastMessage(`${submission.full_name}"${submission.title}" added to the wall!`);
    setToastVisible(true);
  };

  return (
    <>
      <div className="flex-1 shrink-0 w-full flex flex-col items-start gap-4 md:gap-5 max-w-3xl mx-auto">

        {/* Welcome header */}
        <div className="text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Per Scholas</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white leading-tight">
            Learners Hub
            <span className="block text-sky-400 text-sm md:text-base font-semibold mt-0.5">
              AI Enabled Healthcare IT
            </span>
          </h1>
          <p className="text-sm text-zinc-400">Welcome to the collaborative resource hub!</p>
          <Link
            to="/learner-experience"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-colors whitespace-nowrap outline-none select-none"
          >
            <LifeBuoy className="w-4 h-4" />
            Start Here
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap justify-start gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-zinc-950/50 border border-zinc-800/30 hover:border-zinc-700 transition-all duration-200 group outline-none select-none ring-0 focus:ring-0 cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-sky-500/15 flex-shrink-0 group-hover:bg-sky-500/25 transition-colors">
              <UploadCloud className="w-5 h-5 text-sky-500" />
            </div>
            <p className="text-sm font-bold text-zinc-100 group-hover:text-sky-400 transition-colors duration-200">
              Add Intel
            </p>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors flex-shrink-0" />
          </button>

          <Link
            to="/recognition"
            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-zinc-950/50 border border-zinc-800/30 hover:border-zinc-700 transition-all duration-200 group ring-0 focus:ring-0"
          >
            <div className="p-2 rounded-xl bg-sky-500/15 flex-shrink-0">
              <Users className="w-5 h-5 text-sky-500" />
            </div>
            <p className="text-sm font-bold text-zinc-100 group-hover:text-sky-400 transition-colors duration-200">
              View Portfolios
            </p>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors flex-shrink-0" />
          </Link>
        </div>

        {/* Cohort Survival Guide */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100">Cohort Survival Guide</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {survivalGuideCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.id}
                  to={`/learner-experience?tab=${card.tab}`}
                  className="group/card flex items-start gap-3 p-3.5 text-left bg-zinc-950/50 rounded-xl border border-zinc-800/50 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 outline-none select-none"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/card:scale-105 transition-transform ${card.iconBg}`}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-white">
                        {card.title}
                      </p>
                      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 group-hover/card:text-sky-400 group-hover/card:translate-x-0.5 transition-all" />
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
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
            >
              Explore the full Learner Experience Hub &rarr;
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      <ContributorSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={handleSubmitted}
        onRefresh={onRefresh}
      />

      <SuccessToast
        message={toastMessage}
        isVisible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </>
  );
}

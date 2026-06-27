import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Construction, Home } from 'lucide-react';

export default function ComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-full py-20">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
            <Construction className="w-9 h-9 text-amber-500 dark:text-amber-400" />
          </div>
          {/* Pulse ring */}
          <span className="absolute -inset-1 rounded-2xl border border-amber-400/20 animate-ping opacity-30" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Coming Soon
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
            This module is currently being built or undergoing moderation review by our Cohort Leaders.
            Check back shortly!
          </p>
        </div>

        {/* Status strip */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-medium text-amber-700 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Module under active development — 2026-RTT-23
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-all shadow-md shadow-sky-500/20"
          >
            <Home className="w-4 h-4" />
            Home Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

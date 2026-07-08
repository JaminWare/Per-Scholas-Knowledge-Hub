import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/', { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      <h1 className="text-3xl font-bold text-zinc-100 mb-3">
        Page Not Found
      </h1>

      <p className="text-zinc-400 max-w-md mb-8 leading-relaxed">
        The page you requested does not exist or has been moved.
        You will be redirected to the home dashboard automatically.
      </p>

      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-sm text-zinc-300">
          Redirecting in <span className="font-mono text-blue-400">{countdown}s</span>
        </div>

        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
        >
          Go Home Now
        </button>
      </div>

      <div className="mt-12 w-full max-w-xs">
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

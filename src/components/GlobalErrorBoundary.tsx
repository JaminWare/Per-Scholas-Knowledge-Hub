import { Component, type ReactNode } from 'react';
import { ShieldAlert, RotateCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const stack = errorInfo.componentStack ?? '';
    const details = `${error.message}\n\n--- Component Stack ---\n${stack}`.slice(0, 2000);

    supabase.from('admin_audit_logs').insert({
      admin_email: 'system@frontend',
      action_taken: 'frontend_crash',
      target_id: window.location.pathname,
      target_title: details,
    }).then(({ error: dbError }) => {
      if (dbError) console.error('[CrashTelemetry] Failed to log:', dbError.message);
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-lg w-full">
          <div className="relative rounded-2xl border border-red-500/30 bg-zinc-900 shadow-2xl shadow-red-500/10 p-8">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <ShieldAlert className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">System Fault Detected</h1>
                  <p className="text-sm text-zinc-400 mt-0.5">The application encountered an unexpected error</p>
                </div>
              </div>

              <div className="mb-6 rounded-xl bg-zinc-950 border border-zinc-800 p-4 max-h-40 overflow-y-auto">
                <p className="text-sm text-red-300/90 font-mono leading-relaxed break-words">
                  {this.state.error?.message ?? 'An unknown error occurred.'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2.5 w-full px-5 py-3 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-400 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-red-500/20"
                >
                  <RotateCw className="w-4 h-4" />
                  Reload Application
                </button>
                <button
                  type="button"
                  onClick={() => { window.location.href = '/'; }}
                  className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all duration-150"
                >
                  Return to Home
                </button>
              </div>

              <p className="text-center text-xs text-zinc-600 mt-5">
                This error has been automatically logged for review.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

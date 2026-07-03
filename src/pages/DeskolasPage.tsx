import { useState, useEffect } from 'react';
import {
  Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Trash2, Loader2,
  Headphones, RefreshCw, Monitor, Wifi, Code2, GitBranch, User, Wrench,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DESKOLAS_FOCUS_AREAS, parseTicketContent } from '../utils/normalizeDeskolas';
import { formatRelativeTime } from '../utils/formatRelativeTime';

const PASSCODE = 'PerScholas2026!';

const FOCUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Hardware & AV Setup': Monitor,
  'Network & Access': Wifi,
  'Software & IDEs': Code2,
  'Git & GitHub': GitBranch,
  'Accounts & LMS': User,
  'General Troubleshooting': Wrench,
};

interface DeskTicket {
  id: string;
  title: string;
  content: string;
  full_name: string;
  track: string;
  lx_topic: string | null;
  is_approved: boolean;
  created_at: string;
  formatted_content: string | null;
}

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [passcode, setPasscode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === PASSCODE) {
      onAuth();
    } else {
      setError('Incorrect passcode.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 mb-4">
            <Lock className="w-7 h-7 text-sky-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Deskolas Admin Queue</h1>
          <p className="text-sm text-zinc-500 mt-1">Restricted to cohort administrators</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => { setPasscode(e.target.value); setError(''); }}
              placeholder="Enter admin passcode..."
              autoFocus
              className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
            />
            <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}
          <button type="submit" className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/20">
            Access Queue
          </button>
        </form>
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  onPublish,
  onReject,
}: {
  ticket: DeskTicket;
  onPublish: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [publishing, setPublishing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const content = ticket.formatted_content ?? ticket.content;
  const { problem, solution } = parseTicketContent(content);
  const FocusIcon = FOCUS_ICONS[ticket.lx_topic ?? ''] ?? Wrench;

  const handlePublish = async () => {
    setPublishing(true);
    try { await onPublish(ticket.id); } finally { setPublishing(false); }
  };
  const handleReject = async () => {
    setRejecting(true);
    try { await onReject(ticket.id); } finally { setRejecting(false); }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-sky-500/30 transition-colors">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-800/80"
        style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '6px 6px' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FocusIcon className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
            {ticket.lx_topic ?? 'Uncategorized'}
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono flex-shrink-0">
          {formatRelativeTime(ticket.created_at)}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-white leading-snug">{ticket.title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0 ${
            ticket.is_approved
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
            {ticket.is_approved ? 'Published' : 'Pending'}
          </span>
        </div>

        {/* Solution snippet */}
        {!expanded && solution && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {solution.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').slice(0, 150)}
          </p>
        )}

        {/* Expanded view with Problem/Solution callouts */}
        {expanded && (
          <div className="space-y-3">
            {problem && (
              <div className="rounded-lg border-l-4 border-amber-400/70 bg-amber-50 dark:bg-amber-500/5 px-3 py-2.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Problem</span>
                <p className="text-xs text-amber-900 dark:text-amber-200/80 leading-relaxed whitespace-pre-wrap">
                  {problem.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}
                </p>
              </div>
            )}
            {solution && (
              <div className="rounded-lg border-l-4 border-emerald-400/70 bg-emerald-50 dark:bg-emerald-500/5 px-3 py-2.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Solution</span>
                <p className="text-xs text-emerald-900 dark:text-emerald-200/80 leading-relaxed whitespace-pre-wrap">
                  {solution.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-sky-500 hover:text-sky-400 font-medium transition-colors"
        >
          {expanded ? 'Collapse' : 'Show full ticket'}
        </button>

        {/* Submitter */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <User className="w-3 h-3" />
          <span>{ticket.full_name}</span>
        </div>
      </div>

      {/* Actions */}
      {!ticket.is_approved && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            onClick={handlePublish}
            disabled={publishing || rejecting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            {publishing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...</>
              : <><CheckCircle2 className="w-3.5 h-3.5" /> Publish</>
            }
          </button>
          <button
            onClick={handleReject}
            disabled={publishing || rejecting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
          >
            {rejecting
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing...</>
              : <><Trash2 className="w-3.5 h-3.5" /> Reject</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

export default function DeskolasPage() {
  const [authed, setAuthed] = useState(false);
  const [tickets, setTickets] = useState<DeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('type', 'deskolas')
        .order('created_at', { ascending: false });
      setTickets((data as DeskTicket[]) ?? []);
    } catch (e) {
      console.error('Deskolas fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchTickets();
  }, [authed]);

  const handlePublish = async (id: string) => {
    const { error } = await supabase
      .from('submissions')
      .update({ is_approved: true })
      .eq('id', id);
    if (error) throw error;
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, is_approved: true } : t));
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  const filteredTickets = activeFilter === 'All'
    ? tickets
    : tickets.filter((t) => t.lx_topic === activeFilter);

  const pendingCount = tickets.filter((t) => !t.is_approved).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-gradient-to-br from-zinc-50 via-slate-50 to-sky-50 dark:from-zinc-900 dark:via-slate-900 dark:to-sky-950">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative px-6 py-8 md:px-8">
          <div className="flex items-start gap-5 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-white tracking-tight">Deskolas Queue</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Inbound resolved tickets awaiting formatting review and publication.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {pendingCount} pending
            </span>
            <button
              type="button"
              onClick={fetchTickets}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Focus Area Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('All')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
            activeFilter === 'All'
              ? 'bg-sky-600 text-white border-transparent shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-sky-400/60'
          }`}
        >
          All
        </button>
        {DESKOLAS_FOCUS_AREAS.map((area) => {
          const Icon = FOCUS_ICONS[area] ?? Wrench;
          const isActive = activeFilter === area;
          return (
            <button
              key={area}
              type="button"
              onClick={() => setActiveFilter(area)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                isActive
                  ? 'bg-sky-600 text-white border-transparent shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-sky-400/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {area}
            </button>
          );
        })}
      </div>

      {/* Ticket Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden animate-pulse">
              <div className="h-10 bg-zinc-100 dark:bg-zinc-800" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onPublish={handlePublish}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center">
            <Headphones className="w-7 h-7 text-sky-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Queue Empty</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {activeFilter === 'All'
                ? 'No Deskolas tickets in the queue right now.'
                : `No tickets in "${activeFilter}" category.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

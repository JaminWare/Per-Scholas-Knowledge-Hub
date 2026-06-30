import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Lock, ShieldCheck, CheckCircle2, Trash2, Loader2,
  AlertCircle, Eye, EyeOff, RefreshCw, FileText, Link2,
  GitBranch, Zap, BookOpen, Tag, User, Calendar,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PendingSubmission {
  id: string;
  full_name: string;
  track: string;
  badge: string;
  title: string;
  content: string;
  submission_type: string;
  formatted_content: string | null;
  is_approved: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PASSCODE = 'PerScholas2026!';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function sanitizeTitle(raw: string): string {
  return raw.replace(/^\s*\[(OPEN SLOT|sample)\]\s*/i, '').trim();
}

function deriveExcerpt(content: string): string {
  const clean = content.replace(/^#+.+$/gm, '').replace(/[#*`_>]/g, '').trim();
  return clean.slice(0, 200).trim();
}

async function findSectionIdByTrack(track: string): Promise<string | null> {
  const trackLower = track.toLowerCase();
  let slugHint = '';
  if (trackLower.includes('core 1')) slugHint = 'study-tips';
  else if (trackLower.includes('core 2')) slugHint = 'study-tips';
  else if (trackLower.includes('healthcare')) slugHint = 'study-tips';
  else if (trackLower.includes('diagram')) slugHint = 'diagrams';
  else if (trackLower.includes('quick ref')) slugHint = 'quick-references';
  else if (trackLower.includes('prompt')) slugHint = 'azari-prompt-playbook';
  if (!slugHint) slugHint = 'quick-references';
  const { data } = await supabase.from('sections').select('id').eq('slug', slugHint).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let attempt = 0;
  while (attempt < 20) {
    const { data } = await supabase.from('articles').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    attempt++;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Submission type icon
// ---------------------------------------------------------------------------
function TypeIcon({ type }: { type: string }) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    'Article': FileText,
    'Study Tip': BookOpen,
    'Diagram': GitBranch,
    'Quick Reference': Zap,
    'Resource Link': Link2,
  };
  const Icon = map[type] ?? FileText;
  return <Icon className="w-3.5 h-3.5" />;
}

// ---------------------------------------------------------------------------
// Login screen
// ---------------------------------------------------------------------------
function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [passcode, setPasscode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === PASSCODE) {
      onAuth();
    } else {
      setError('Incorrect passcode. Access denied.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 mb-4">
            <Lock className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Cohort Admin Portal</h1>
          <p className="text-sm text-zinc-500 mt-1">Per Scholas — 2026-RTT-23</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 ${shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
        >
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Cohort Admin Passcode</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                placeholder="Enter passcode..."
                autoFocus
                className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/20"
          >
            Access Control Panel
          </button>
        </form>

        <p className="text-center text-xs text-zinc-700 mt-6">
          This portal is restricted to cohort administrators only.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Submission row card
// ---------------------------------------------------------------------------
function SubmissionCard({
  sub,
  onApprove,
  onDelete,
}: {
  sub: PendingSubmission;
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleApprove = async () => {
    setApproving(true);
    setActionError('');
    try {
      await onApprove(sub.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setActionError('');
    try {
      await onDelete(sub.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed.');
      setDeleting(false);
    }
  };

  const isResource = sub.submission_type === 'Resource Link';
  const dateStr = new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${
          isResource ? 'bg-teal-500/10 text-teal-400' : 'bg-sky-500/10 text-sky-400'
        }`}>
          <TypeIcon type={sub.submission_type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-100 text-sm leading-snug">{sub.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <User className="w-3 h-3" /> {sub.full_name}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Calendar className="w-3 h-3" /> {dateStr}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Tag className="w-3 h-3" /> {sub.badge}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
              isResource ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            }`}>
              {sub.submission_type}
            </span>
          </div>

          <p className="mt-1.5 text-[11px] text-zinc-500 font-mono truncate">{sub.track}</p>
        </div>
      </div>

      {/* Content preview toggle */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-sky-500 hover:text-sky-400 font-medium transition-colors"
        >
          {expanded ? 'Hide content preview' : 'Show content preview'}
        </button>
        {expanded && (
          isResource ? (
            <div className="mt-2 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <a
                href={sub.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:underline break-all font-mono text-xs"
              >
                {sub.content}
              </a>
            </div>
          ) : (
            <pre className="mt-2 p-3 bg-zinc-950 rounded-lg text-[11px] text-zinc-400 font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto border border-zinc-800">
              {sub.content}
            </pre>
          )
        )}
      </div>

      {/* Error */}
      {actionError && (
        <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{actionError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800 bg-zinc-900/50">
        <button
          onClick={handleApprove}
          disabled={approving || deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
        >
          {approving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving…</>
            : <><CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Publish</>
          }
        </button>
        <button
          onClick={handleDelete}
          disabled={approving || deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
        >
          {deleting
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</>
            : <><Trash2 className="w-3.5 h-3.5" /> Reject &amp; Delete</>
          }
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Panel
// ---------------------------------------------------------------------------
function AdminPanel() {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubmissions(((data as PendingSubmission[]) ?? []).filter((s) => !s.is_approved));
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleApprove = async (id: string) => {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return;

    const cleanedTitle = sanitizeTitle(sub.title);

    // Step 1: mark submission approved
    const { error: approveError } = await supabase
      .from('submissions')
      .update({ is_approved: true })
      .eq('id', id);
    if (approveError) throw approveError;

    // Clear from UI immediately — submission is now marked approved in DB
    setSubmissions((prev) => prev.filter((s) => s.id !== id));

    // Step 2: try to overwrite a matching [OPEN SLOT] article (exact-then-fuzzy)
    const { data: sampleRows } = await supabase
      .from('articles')
      .select('id, title, study_category')
      .eq('is_sample', true)
      .order('created_at', { ascending: true })
      .limit(50);

    const trackLower = sub.track.toLowerCase();

    // Exact match first
    let sampleMatch = (sampleRows ?? []).find((a) => {
      if (!a.study_category) return false;
      return (a.study_category as string).toLowerCase() === trackLower;
    });

    // Fuzzy fallback (substring inclusion)
    if (!sampleMatch) {
      sampleMatch = (sampleRows ?? []).find((a) => {
        if (!a.study_category) return false;
        const cat = (a.study_category as string).toLowerCase();
        return trackLower.includes(cat) || cat.includes(trackLower);
      });
    }

    const publishContent = sub.formatted_content ?? sub.content;

    if (sampleMatch) {
      // Overwrite the placeholder slot
      const isResourceLink = sub.submission_type === 'Resource Link';
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title: cleanedTitle || sub.title,
          content: publishContent,
          study_category: sub.track,
          is_sample: false,
          is_featured: false,
          submission_type: sub.submission_type,
          author_name: sub.full_name,
          excerpt: isResourceLink ? `Contributed by ${sub.full_name}` : deriveExcerpt(publishContent),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sampleMatch.id);
      if (updateError) throw updateError;
    } else {
      // Step 3: INSERT a brand-new article row
      const baseSlug = slugify(cleanedTitle || `contribution-${Date.now()}`);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);
      const sectionId = await findSectionIdByTrack(sub.track);
      const isResourceLink = sub.submission_type === 'Resource Link';

      const { error: insertError } = await supabase
        .from('articles')
        .insert({
          title: cleanedTitle || sub.title,
          slug: uniqueSlug,
          content: publishContent,
          study_category: sub.track,
          section_id: sectionId,
          is_sample: false,
          is_featured: false,
          submission_type: sub.submission_type,
          author_name: sub.full_name,
          excerpt: isResourceLink ? `Contributed by ${sub.full_name}` : deriveExcerpt(publishContent),
          tags: [],
        });
      if (insertError) throw insertError;
    }

    flashSuccess(`"${cleanedTitle || sub.title}" approved and published successfully.`);
  };

  const handleDelete = async (id: string) => {
    const sub = submissions.find((s) => s.id === id);
    const { error } = await supabase.from('submissions').delete().eq('id', id);
    if (error) {
      console.error('Database deletion failed:', error.message);
      throw new Error('Failed to delete from database. Please check Supabase RLS policies.');
    }
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    flashSuccess(`"${sub?.title ?? 'Submission'}" rejected and removed.`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/25">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-100 leading-none">Admin Control Panel</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Per Scholas — 2026-RTT-23 Cohort</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {submissions.length} pending
            </span>
            <button
              onClick={fetchPending}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Success toast */}
        {successMessage && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Fetch error */}
        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {fetchError}
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Pending Submissions</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Approve to auto-publish to the live knowledge base, or reject to remove permanently.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                    <div className="h-3 bg-zinc-800 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-700 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-teal-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300">All caught up!</h3>
            <p className="text-sm text-zinc-600 mt-1 max-w-xs">
              No pending submissions to review. New contributions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                sub={sub}
                onApprove={handleApprove}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root export — auth gate + panel
// ---------------------------------------------------------------------------
export default function AdminControlPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen onAuth={() => setIsAuthenticated(true)} />;
  }

  return <AdminPanel />;
}

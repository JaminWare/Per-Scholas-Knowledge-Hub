import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeUrl } from '../utils/normalizeUrl';
import { autoFormatContent } from '../utils/autoFormatContent';
import { autoCategorizeSubmission } from '../utils/autoCategorize';
import { handleSupabaseError, isAuthError } from '../utils/handleSupabaseError';
import { calculateSimilarity } from '../utils/textSimilarity';
import {
  DOMAIN_REGISTRY, SLUG_TO_CANONICAL, CANONICAL_TO_SLUG,
  resolveToCanonical, resolveTrackSlug,
} from '../lib/domainRegistry';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import { logAdminAction } from '../utils/auditLogger';
import {
  Lock, ShieldCheck, CheckCircle2, Trash2, Loader2,
  AlertCircle, EyeOff, RefreshCw, FileText, Link2,
  GitBranch, Zap, BookOpen, Tag, User, Calendar, Wand2,
  Pencil, SplitSquareHorizontal, Archive, Filter,
  RotateCcw, XCircle, ShieldOff, Search, UserPlus, Crown, X,
  Activity, UserCheck, Database, HeartPulse,
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
  comp_objective: string | null;
  is_approved: boolean;
  status: string;
  created_at: string;
  lx_stage: string | null;
  lx_topic: string | null;
  lx_focus: string | null;
}

interface ArchiveRow {
  id: string;
  title: string;
  full_name: string;
  track: string;
  status: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function resolveCanonicalSlug(track: string): string | null {
  const resolved = resolveTrackSlug(track);
  return resolved?.slug ?? null;
}

function resolveStudyCategory(track: string): string | null {
  const resolved = resolveTrackSlug(track);
  return resolved?.canonical ?? null;
}

function formatDate(iso: string): string {
  const raw = iso;
  const utcStr = raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw) ? raw : raw + 'Z';
  return new Date(utcStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function trackDisplayName(track: string): string {
  const resolved = resolveTrackSlug(track);
  if (resolved?.canonical) return resolved.canonical;
  if (track.length > 30) return track.slice(0, 28) + '...';
  return track;
}

async function resolveSectionId(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const { data } = await supabase
    .from('sections')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
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
// Status Pill
// ---------------------------------------------------------------------------
function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; dot: string; text: string; label: string }> = {
    approved: { bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Approved' },
    pending: { bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400', text: 'text-amber-400', label: 'Pending' },
    rejected: { bg: 'bg-zinc-500/10 border-zinc-600/20', dot: 'bg-zinc-500', text: 'text-zinc-400', label: 'Rejected' },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Submission row card
// ---------------------------------------------------------------------------
function SubmissionCard({
  sub,
  onApprove,
  onReject,
}: {
  sub: PendingSubmission;
  onApprove: (id: string, domainOverride?: string, editedContent?: string, editedTitle?: string, metadataOverrides?: { compObjective?: string; lxStage?: string }) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);

  const initialContent = sub.formatted_content ?? sub.content;
  const [editedContent, setEditedContent] = useState(initialContent);
  const [editedTitle, setEditedTitle] = useState(sub.title);
  const hasEdits = editedContent !== initialContent || editedTitle !== sub.title;

  const needsOverride = !sub.track.toLowerCase().includes('learner experience') && resolveCanonicalSlug(sub.track) === null;
  const [domainOverride, setDomainOverride] = useState('');

  // Auto-categorization state for admin title edits
  const [suggestedTrack, setSuggestedTrack] = useState('');
  const [suggestedCompObjective, setSuggestedCompObjective] = useState('');
  const [suggestedLxStage, setSuggestedLxStage] = useState('');
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const autoDetectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only fire when admin actively changes the title
    if (editedTitle === sub.title || suggestionDismissed) {
      setSuggestedTrack('');
      setSuggestedCompObjective('');
      setSuggestedLxStage('');
      return;
    }
    if (autoDetectTimer.current) clearTimeout(autoDetectTimer.current);
    autoDetectTimer.current = setTimeout(() => {
      const result = autoCategorizeSubmission(editedTitle, editedContent);
      if (result && result.track) {
        setSuggestedTrack(result.track);
        setSuggestedCompObjective(result.compObjective ?? '');
        setSuggestedLxStage(result.lxStage ?? '');
      } else {
        setSuggestedTrack('');
        setSuggestedCompObjective('');
        setSuggestedLxStage('');
      }
    }, 400);
    return () => { if (autoDetectTimer.current) clearTimeout(autoDetectTimer.current); };
  }, [editedTitle, editedContent, sub.title, suggestionDismissed]);

  useEffect(() => {
    let mounted = true;
    async function checkDuplicate() {
      try {
        if (sub.submission_type === 'Resource Link') {
          const normalized = normalizeUrl(sub.content ?? '');
          const { data } = await supabase
            .from('articles')
            .select('content')
            .eq('submission_type', 'Resource Link')
            .eq('is_sample', false);
          if (mounted && (data ?? []).some((row) => normalizeUrl(row.content ?? '') === normalized)) {
            setIsDuplicate(true);
          }
        } else {
          const { data } = await supabase
            .from('articles')
            .select('id')
            .ilike('title', sub.title)
            .eq('is_sample', false);
          if (mounted && (data ?? []).length > 0) setIsDuplicate(true);
        }
      } catch { /* non-blocking */ }
    }
    checkDuplicate();
    return () => { mounted = false; };
  }, [sub.id]);

  const handleApprove = async () => {
    if (needsOverride && !domainOverride) {
      setActionError('Please select a target domain before approving.');
      return;
    }
    setApproving(true);
    setActionError('');
    try {
      const effectiveDomainOverride = domainOverride || (needsOverride ? '' : undefined);
      const metaOverrides = suggestionApplied && (suggestedCompObjective || suggestedLxStage)
        ? { compObjective: suggestedCompObjective || undefined, lxStage: suggestedLxStage || undefined }
        : undefined;
      await onApprove(sub.id, effectiveDomainOverride || undefined, editedContent, editedTitle !== sub.title ? editedTitle : undefined, metaOverrides);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    setActionError('');
    try {
      await onReject(sub.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reject failed.');
    } finally {
      setRejecting(false);
    }
  };

  const isResource = sub.submission_type === 'Resource Link';
  const submittedAt = (() => {
    const raw = sub.created_at;
    const utcStr = raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw) ? raw : raw + 'Z';
    const d = new Date(utcStr);
    const tz = 'America/New_York';
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: tz });
    const timeParts = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz, timeZoneName: 'short' });
    return `Submitted ${date} at ${timeParts}`;
  })();

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
              {isDuplicate && (
                <span className="inline-block mb-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                  DUPLICATE DETECTED
                </span>
              )}
              <h3 className="font-semibold text-zinc-100 text-sm leading-snug">{sub.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <User className="w-3 h-3" /> {sub.full_name}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Calendar className="w-3 h-3" /> {submittedAt}
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
          {needsOverride && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                Unrecognized track -- select correct domain:
              </label>
              <select
                value={domainOverride}
                onChange={(e) => setDomainOverride(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="">Select a domain...</option>
                {DOMAIN_REGISTRY.map((d) => (
                  <option key={d.canonical} value={d.canonical}>{d.canonical}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content preview & editor toggle */}
      <div className="px-5 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-sky-500 hover:text-sky-400 font-medium transition-colors"
          >
            {expanded ? 'Hide content' : 'Show content'}
          </button>
          {expanded && !isResource && (
            <button
              onClick={() => setIsEditing((v) => !v)}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                isEditing ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isEditing ? <><SplitSquareHorizontal className="w-3 h-3" /> Editor</> : <><Pencil className="w-3 h-3" /> Edit</>}
            </button>
          )}
          {hasEdits && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Modified
            </span>
          )}
        </div>

        {expanded && (
          isResource ? (
            <div className="mt-2 p-3 bg-zinc-950 rounded-lg border border-zinc-800 overflow-x-auto">
              <a
                href={sub.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:underline break-all font-mono text-xs"
              >
                {sub.content}
              </a>
            </div>
          ) : isEditing ? (
            <div className="mt-3 space-y-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const formatted = autoFormatContent(editedContent);
                    if (formatted !== editedContent) setEditedContent(formatted);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-sky-900/20 hover:bg-sky-800/30 text-sky-400 border border-sky-800/50 text-[11px] font-semibold transition-all"
                >
                  <Wand2 className="w-3 h-3" /> Auto-Format
                </button>
                <span className="text-[10px] text-zinc-600 hidden sm:inline">Smart headers, blockquotes, list cleanup</span>
              </div>
              {/* Editable Title */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5 block">Title</span>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => {
                    setEditedTitle(e.target.value);
                    setSuggestionApplied(false);
                    setSuggestionDismissed(false);
                  }}
                  placeholder="Edit submission title..."
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-lg bg-black border border-zinc-800 text-white text-lg font-semibold placeholder:text-zinc-600 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:outline-none transition-all"
                />
                {suggestedTrack && suggestedTrack !== sub.track && !suggestionApplied && !suggestionDismissed && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/5 border border-sky-500/20">
                    <Zap className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    <span className="text-[11px] text-sky-300 font-medium">
                      Auto-detected: <span className="font-bold text-sky-200">{suggestedTrack}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDomainOverride(suggestedTrack);
                        setSuggestionApplied(true);
                      }}
                      className="ml-auto px-2.5 py-1 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold uppercase tracking-wide border border-sky-500/30 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuggestionDismissed(true);
                        setSuggestedTrack('');
                        setSuggestedCompObjective('');
                        setSuggestedLxStage('');
                      }}
                      className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-wide border border-zinc-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
              {/* Side-by-side panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Editor */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Raw Markdown</span>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    maxLength={50000}
                    spellCheck={false}
                    className="flex-1 min-h-[200px] sm:min-h-[320px] w-full px-3 sm:px-4 py-3 rounded-lg bg-black border border-zinc-800 text-zinc-200 text-xs font-mono leading-relaxed resize-y focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:outline-none transition-all"
                  />
                </div>
                {/* Preview */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Live Preview</span>
                  <div className="flex-1 min-h-[200px] sm:min-h-[320px] max-h-[500px] overflow-y-auto overflow-x-auto px-4 sm:px-5 py-3 sm:py-4 rounded-lg bg-black border border-zinc-800">
                    <MarkdownRenderer content={editedContent} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              {/Problem:/i.test(editedContent) && /Solution:/i.test(editedContent) ? (
                <div className="space-y-2">
                  <div className="rounded-lg border-l-4 border-amber-400/70 bg-amber-500/5 px-3 py-2.5 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Problem</h3>
                    <p className="text-xs text-amber-200/80 leading-relaxed whitespace-pre-wrap">
                      {editedContent.match(/Problem:\s*([\s\S]*?)(?=Solution:|$)/i)?.[1]?.trim() ?? ''}
                    </p>
                  </div>
                  <div className="rounded-lg border-l-4 border-emerald-400/70 bg-emerald-500/5 px-3 py-2.5 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Solution</h3>
                    <p className="text-xs text-emerald-200/80 leading-relaxed whitespace-pre-wrap">
                      {editedContent.match(/Solution:\s*([\s\S]*)/i)?.[1]?.trim() ?? ''}
                    </p>
                  </div>
                </div>
              ) : (
                <pre className="p-3 bg-zinc-950 rounded-lg text-[11px] text-zinc-400 font-mono whitespace-pre-wrap break-all max-h-48 overflow-auto border border-zinc-800">
                  {editedContent}
                </pre>
              )}
            </div>
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
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-zinc-800 bg-zinc-900/50">
        <button
          onClick={handleApprove}
          disabled={approving || rejecting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
        >
          {approving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...</>
            : <><CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Publish</>
          }
        </button>
        <button
          onClick={handleReject}
          disabled={approving || rejecting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
        >
          {rejecting
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Rejecting...</>
            : <><Trash2 className="w-3.5 h-3.5" /> Reject</>
          }
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Archive Table
// ---------------------------------------------------------------------------
function ArchiveTable({
  data,
  loading,
  searchQuery,
  onRestore,
  onHardDelete,
  onUnpublish,
}: {
  data: ArchiveRow[];
  loading: boolean;
  searchQuery: string;
  onRestore: (id: string) => Promise<void>;
  onHardDelete: (id: string) => Promise<void>;
  onUnpublish: (id: string) => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter((r) => r.status === statusFilter);
  }, [data, statusFilter]);

  const handleAction = async (id: string, action: (id: string) => Promise<void>) => {
    setBusyId(id);
    try {
      await action(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Archive className="w-5 h-5 text-zinc-500" />
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Cohort Submissions Archive</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{data.length} total submissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-8 h-8 text-zinc-600 mb-4" />
            <h3 className="text-base font-semibold text-zinc-300">No results found</h3>
            <p className="text-sm text-zinc-500 mt-1">No submissions found matching &lsquo;{searchQuery}&rsquo;.</p>
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-600 py-8">No submissions match this filter.</p>
        )
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Title</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Submitter</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hidden lg:table-cell">Track</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 font-medium max-w-[200px] truncate">{row.title}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{row.full_name}</td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap hidden md:table-cell">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-zinc-500 max-w-[160px] truncate hidden lg:table-cell">{trackDisplayName(row.track)}</td>
                  <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {busyId === row.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                      ) : row.status === 'rejected' ? (
                        <>
                          <button
                            onClick={() => handleAction(row.id, onRestore)}
                            title="Restore to pending queue"
                            className="p-1.5 rounded-md hover:bg-amber-500/10 text-zinc-500 hover:text-amber-400 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Permanently delete this submission? This cannot be undone.')) {
                                handleAction(row.id, onHardDelete);
                              }
                            }}
                            title="Permanently delete"
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : row.status === 'approved' ? (
                        <button
                          onClick={() => handleAction(row.id, onUnpublish)}
                          title="Unpublish (move back to pending)"
                          className="p-1.5 rounded-md hover:bg-amber-500/10 text-zinc-500 hover:text-amber-400 transition-colors"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit Trail View (only visible to admins with can_manage_admins)
// ---------------------------------------------------------------------------
interface AuditLogEntry {
  id: string;
  admin_email: string;
  action_taken: string;
  target_id: string | null;
  target_title: string | null;
  created_at: string;
}

function getActionBadge(action: string): { label: string; className: string } {
  const a = action.toUpperCase();
  if (a.includes('APPROVED') || a.includes('INVITED'))
    return { label: action.replace(/_/g, ' '), className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' };
  if (a.includes('REJECTED') || a.includes('HARD_DELETED') || a.includes('REVOKED'))
    return { label: action.replace(/_/g, ' '), className: 'bg-red-500/10 text-red-400 border-red-500/25' };
  if (a.includes('UNPUBLISHED') || a.includes('RESTORED'))
    return { label: action.replace(/_/g, ' '), className: 'bg-amber-500/10 text-amber-400 border-amber-500/25' };
  return { label: action.replace(/_/g, ' '), className: 'bg-zinc-500/10 text-zinc-400 border-zinc-600/25' };
}

// ---------------------------------------------------------------------------
// Name Requests View (visible to all admins)
// ---------------------------------------------------------------------------
interface NameChangeRequest {
  id: string;
  current_name: string;
  requested_name: string;
  status: string;
  created_at: string;
}

function NameRequestsView({ adminEmail }: { adminEmail: string }) {
  const [requests, setRequests] = useState<NameChangeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('name_change_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (!mounted) return;
      setRequests((data as NameChangeRequest[]) ?? []);
      setLoadingRequests(false);
    })();
    return () => { mounted = false; };
  }, []);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleApprove = async (req: NameChangeRequest) => {
    setActionLoading(req.id);
    try {
      await supabase
        .from('submissions')
        .update({ full_name: req.requested_name })
        .eq('full_name', req.current_name);

      await supabase
        .from('articles')
        .update({ author_name: req.requested_name })
        .eq('author_name', req.current_name);

      await supabase
        .from('name_change_requests')
        .update({ status: 'approved' })
        .eq('id', req.id);

      await logAdminAction(adminEmail, 'APPROVED_NAME_CHANGE', req.id, req.requested_name);

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      flash(`Approved: "${req.current_name}" is now "${req.requested_name}"`);
    } catch {
      flash(`Error approving name change for "${req.current_name}"`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (req: NameChangeRequest) => {
    setActionLoading(req.id);
    try {
      await supabase
        .from('name_change_requests')
        .update({ status: 'rejected' })
        .eq('id', req.id);

      await logAdminAction(adminEmail, 'REJECTED_NAME_CHANGE', req.id, req.requested_name);

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      flash(`Rejected name change request from "${req.current_name}"`);
    } catch {
      flash(`Error rejecting name change for "${req.current_name}"`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <UserCheck className="w-5 h-5 text-sky-400" />
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Name Change Requests</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Review and approve or reject display name change requests</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {loadingRequests ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/30">
          <UserCheck className="w-8 h-8 text-zinc-600 mb-4" />
          <h3 className="text-base font-semibold text-zinc-300">No pending name requests</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-xs">
            When users submit name change requests, they will appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200">
                  <span className="font-semibold text-zinc-100">{req.current_name}</span>
                  <span className="text-zinc-500 mx-2">wants to change to</span>
                  <span className="font-semibold text-sky-400">{req.requested_name}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {new Date(req.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(req)}
                  disabled={actionLoading === req.id}
                  className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors disabled:opacity-50"
                  title="Approve"
                >
                  {actionLoading === req.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleReject(req)}
                  disabled={actionLoading === req.id}
                  className="p-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTrailView() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!mounted) return;
      setLogs((data as AuditLogEntry[]) ?? []);
      setLoadingLogs(false);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <Activity className="w-5 h-5 text-sky-400" />
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Audit Trail</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Chronological log of all moderation actions (most recent first)</p>
        </div>
      </div>

      {loadingLogs ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/30">
          <Activity className="w-8 h-8 text-zinc-600 mb-4" />
          <h3 className="text-base font-semibold text-zinc-300">No audit events yet</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-xs">
            Actions taken in the Admin Command Center will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Timestamp</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Admin</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Action</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {logs.map((log) => {
                const badge = getActionBadge(log.action_taken);
                return (
                  <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true,
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-200 font-medium text-xs">
                      {log.admin_email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 text-xs max-w-[240px] truncate">
                      {log.target_title ?? '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Access Control View (only visible to admins with can_manage_admins)
// ---------------------------------------------------------------------------
interface WhitelistEntry {
  id: string;
  email: string;
  can_manage_admins: boolean;
  created_at: string;
}

function AccessControlView({ adminEmail }: { adminEmail: string }) {
  const [admins, setAdmins] = useState<WhitelistEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [grantManage, setGrantManage] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdmins = async () => {
    setLoadingList(true);
    const { data, error: fetchErr } = await supabase
      .from('admin_whitelist')
      .select('id, email, can_manage_admins, created_at')
      .order('created_at', { ascending: true });
    if (fetchErr) {
      setError(fetchErr.message);
    } else {
      setAdmins((data as WhitelistEntry[]) ?? []);
    }
    setLoadingList(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (admins.some((a) => a.email === trimmed)) {
      setError('This email is already in the admin whitelist.');
      return;
    }
    setInviting(true);
    setError('');
    const { error: insertErr } = await supabase
      .from('admin_whitelist')
      .insert({ email: trimmed, can_manage_admins: grantManage });
    if (insertErr) {
      setError(handleSupabaseError(insertErr));
    } else {
      setSuccess(`${trimmed} has been added as an admin.`);
      setInviteEmail('');
      setGrantManage(false);
      await logAdminAction(adminEmail, 'INVITED_ADMIN', undefined, trimmed);
      fetchAdmins();
      setTimeout(() => setSuccess(''), 4000);
    }
    setInviting(false);
  };

  const handleRevoke = async (entry: WhitelistEntry) => {
    if (revoking) return;
    if (entry.email === adminEmail) {
      setError('You cannot remove yourself from the whitelist.');
      return;
    }
    if (!window.confirm(`Remove ${entry.email} from the admin whitelist? They will lose all admin access immediately.`)) return;
    setRevoking(true);
    setError('');
    const { error: deleteErr } = await supabase
      .from('admin_whitelist')
      .delete()
      .eq('id', entry.id);
    if (deleteErr) {
      setError(handleSupabaseError(deleteErr));
    } else {
      setSuccess(`${entry.email} has been removed.`);
      await logAdminAction(adminEmail, 'REVOKED_ADMIN', undefined, entry.email);
      fetchAdmins();
      setTimeout(() => setSuccess(''), 4000);
    }
    setRevoking(false);
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <Crown className="w-5 h-5 text-amber-400" />
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Access Control</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Manage who can access the Admin Command Center</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-500/20 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-sky-400" />
          Invite New Admin
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="admin@example.com"
            maxLength={254}
            className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60 transition-all"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Invite
          </button>
        </div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={grantManage}
            onChange={(e) => setGrantManage(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-950 text-sky-500 focus:ring-sky-500/40 focus:ring-offset-0"
          />
          <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
            Grant Admin Management Privileges (Can invite others)
          </span>
        </label>
      </form>

      {/* Admin List */}
      {loadingList ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Email</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Role</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hidden md:table-cell">Added</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {admins.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 font-medium">
                    <span className="flex items-center gap-2">
                      {entry.email}
                      {entry.email === adminEmail && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/25">You</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.can_manage_admins ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Crown className="w-3 h-3" /> Owner
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-600/20">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap hidden md:table-cell">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.email !== adminEmail && (
                      <button
                        onClick={() => handleRevoke(entry)}
                        disabled={revoking}
                        title={`Remove ${entry.email}`}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// System Maintenance View
// ---------------------------------------------------------------------------
function MaintenanceView({ adminEmail }: { adminEmail: string }) {
  const [isCleaning, setIsCleaning] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDeduplicateArticles = async () => {
    if (!window.confirm('Are you sure? This will permanently delete duplicate database records from both articles and submissions.')) return;

    setIsCleaning(true);
    setResultMessage(null);

    try {
      const contentWeight = (c: string | null): number => {
        if (!c || c.trim() === '' || c.includes('Article Not Found')) return 0;
        return c.length;
      };

      const findDuplicates = (rows: { id: string; title: string | null; created_at: string; content: string | null; slug?: string | null }[]): string[] => {
        const sorted = [...rows].sort((a, b) => {
          const wDiff = contentWeight(b.content) - contentWeight(a.content);
          if (wDiff !== 0) return wDiff;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const uniqueRecords: { id: string; title: string | null; content: string | null; slug?: string | null }[] = [];
        const duplicateIds: string[] = [];

        for (const record of sorted) {
          const normalizedTitle = (record.title ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!normalizedTitle && !record.content && !record.slug) continue;

          let isDuplicate = false;
          for (const unique of uniqueRecords) {
            const uniqueNormalizedTitle = (unique.title ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normalizedTitle && uniqueNormalizedTitle && normalizedTitle === uniqueNormalizedTitle) {
              isDuplicate = true;
              break;
            }
            if (record.content && unique.content && calculateSimilarity(record.content, unique.content) >= 0.85) {
              isDuplicate = true;
              break;
            }
            if (record.slug && unique.slug && record.slug === unique.slug) {
              isDuplicate = true;
              break;
            }
          }

          if (isDuplicate) {
            duplicateIds.push(record.id);
          } else {
            uniqueRecords.push({ id: record.id, title: record.title, content: record.content, slug: record.slug });
          }
        }

        console.log("DEDUP SWEEP:", { uniqueRecords, duplicateIds });
        return duplicateIds;
      };

      // Phase 1: Articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('id, title, created_at, content, slug');
      if (articlesError) throw articlesError;

      const articleDupIds = findDuplicates(articlesData ?? []);
      if (articleDupIds.length > 0) {
        const { error: delErr } = await supabase.from('articles').delete().in('id', articleDupIds);
        if (delErr) throw delErr;
      }

      // Phase 2: Submissions
      const { data: subsData, error: subsError } = await supabase
        .from('submissions')
        .select('id, title, created_at, content');
      if (subsError) throw subsError;

      const subDupIds = findDuplicates(subsData ?? []);
      if (subDupIds.length > 0) {
        const { error: delErr } = await supabase.from('submissions').delete().in('id', subDupIds);
        if (delErr) throw delErr;
      }

      const totalRemoved = articleDupIds.length + subDupIds.length;
      if (totalRemoved === 0) {
        setResultMessage({ type: 'success', text: 'Database is clean: 0 duplicates found.' });
      } else {
        const parts: string[] = [];
        if (articleDupIds.length > 0) parts.push(`${articleDupIds.length} from articles`);
        if (subDupIds.length > 0) parts.push(`${subDupIds.length} from submissions`);
        const text = `Success: ${totalRemoved} duplicate${totalRemoved === 1 ? '' : 's'} removed (${parts.join(', ')}).`;
        setResultMessage({ type: 'success', text });
        await logAdminAction(adminEmail, 'dedup_sweep', undefined, text);
      }
    } catch (err) {
      const msg = handleSupabaseError(err);
      setResultMessage({ type: 'error', text: msg });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Database className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">System Maintenance</h3>
            <p className="text-sm text-zinc-500 mt-0.5">Database integrity tools for senior administrators</p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-700/60 bg-zinc-950/40 p-5">
          <h4 className="text-sm font-semibold text-zinc-200 mb-2">Deduplication Sweep</h4>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Scans both the articles and submissions tables for entries with identical titles or 85%+ content similarity. Keeps the heaviest record for each unique piece of content and permanently deletes duplicates.
          </p>
          <button
            type="button"
            onClick={handleDeduplicateArticles}
            disabled={isCleaning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20"
          >
            {isCleaning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Running sweep...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Run Deduplication Sweep</>
            )}
          </button>
        </div>

        {resultMessage && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5 ${
            resultMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {resultMessage.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            }
            {resultMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Panel
// ---------------------------------------------------------------------------
function AdminPanel({ adminEmail, canManageAdmins }: { adminEmail: string; canManageAdmins: boolean }) {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [archive, setArchive] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'archive' | 'access' | 'audit' | 'names' | 'maintenance' | 'health'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const fetchVersionRef = useRef(0);

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.full_name.toLowerCase().includes(q) ||
      s.track.toLowerCase().includes(q)
    );
  }, [submissions, searchQuery]);

  const filteredArchive = useMemo(() => {
    if (!searchQuery.trim()) return archive;
    const q = searchQuery.toLowerCase();
    return archive.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      r.full_name.toLowerCase().includes(q) ||
      r.track.toLowerCase().includes(q)
    );
  }, [archive, searchQuery]);

  const fetchPending = async () => {
    const version = ++fetchVersionRef.current;
    setLoading(true);
    setFetchError('');
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (fetchVersionRef.current !== version) return;
      if (error) throw error;
      setSubmissions((data as PendingSubmission[]) ?? []);
    } catch (err) {
      if (fetchVersionRef.current !== version) return;
      const msg = handleSupabaseError(err);
      setFetchError(msg);
    } finally {
      if (fetchVersionRef.current === version) setLoading(false);
    }
  };

  const fetchArchive = async () => {
    setArchiveLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, title, full_name, track, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setArchive((data as ArchiveRow[]) ?? []);
    } catch {
      // Non-blocking for archive
    } finally {
      setArchiveLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchArchive();
  }, []);

  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleApprove = async (id: string, domainOverride?: string, editedContent?: string, editedTitle?: string, metadataOverrides?: { compObjective?: string; lxStage?: string }) => {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return;

    const cleanedTitle = sanitizeTitle(editedTitle ?? sub.title);

    const effectiveTrack = domainOverride || sub.track;

    // Step 1: mark submission approved
    const { error: approveError } = await supabase
      .from('submissions')
      .update({ is_approved: true, status: 'approved' })
      .eq('id', id);
    if (approveError) throw approveError;

    try {
      // Step 2: resolve the target section dynamically
      const resolvedSlug = resolveCanonicalSlug(effectiveTrack) ?? (domainOverride ? CANONICAL_TO_SLUG[domainOverride] : null);
      const targetSectionId = await resolveSectionId(resolvedSlug);

      // Step 3: find an open slot in the resolved section
      let openSlot: { id: string } | null = null;
      if (targetSectionId) {
        const { data } = await supabase
          .from('articles')
          .select('id')
          .eq('is_sample', true)
          .eq('section_id', targetSectionId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        openSlot = data as { id: string } | null;
      }

      const publishContent = editedContent ?? sub.formatted_content ?? sub.content;
      const isResourceLink = sub.submission_type === 'Resource Link';
      const finalContent = isResourceLink ? publishContent : autoFormatContent(publishContent);
      const excerpt = isResourceLink
        ? `Contributed by ${sub.full_name}`
        : deriveExcerpt(finalContent);

      const trackLower = effectiveTrack.toLowerCase();
      const isLX = trackLower.includes('learner experience');
      const isHealthcare = trackLower.includes('healthcare');
      const sectionPrefix = isLX
        ? 'learner-experience'
        : isHealthcare
          ? 'advanced-healthcare-it'
          : (resolvedSlug || 'general');

      const studyCategory = resolveStudyCategory(effectiveTrack) ?? (domainOverride || effectiveTrack);

      if (openSlot) {
        const baseSlug = `${sectionPrefix}/${slugify(cleanedTitle || `contribution-${Date.now()}`)}`;
        const uniqueSlug = await ensureUniqueSlug(baseSlug);
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            title: cleanedTitle || sub.title,
            slug: uniqueSlug,
            content: finalContent || '',
            study_category: studyCategory,
            section_id: targetSectionId,
            is_sample: false,
            is_featured: false,
            submission_type: sub.submission_type,
            author_name: sub.full_name,
            comp_objective: metadataOverrides?.compObjective || sub.comp_objective || null,
            lx_stage: metadataOverrides?.lxStage || sub.lx_stage || null,
            lx_topic: sub.lx_topic || null,
            lx_focus: sub.lx_focus || null,
            excerpt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', openSlot.id);
        if (updateError) throw updateError;
      } else {
        const baseSlug = `${sectionPrefix}/${slugify(cleanedTitle || `contribution-${Date.now()}`)}`;
        const uniqueSlug = await ensureUniqueSlug(baseSlug);

        const { error: insertError } = await supabase
          .from('articles')
          .insert({
            title: cleanedTitle || sub.title,
            slug: uniqueSlug,
            content: finalContent || '',
            study_category: studyCategory,
            section_id: targetSectionId,
            is_sample: false,
            is_featured: false,
            submission_type: sub.submission_type,
            author_name: sub.full_name,
            comp_objective: metadataOverrides?.compObjective || sub.comp_objective || null,
            lx_stage: metadataOverrides?.lxStage || sub.lx_stage || null,
            lx_topic: sub.lx_topic || null,
            lx_focus: sub.lx_focus || null,
            excerpt,
            tags: [],
          });
        if (insertError) throw insertError;
      }
    } catch (publishError) {
      // Rollback: revert approval so the submission remains visible in the admin queue
      await supabase
        .from('submissions')
        .update({ is_approved: false, status: 'pending' })
        .eq('id', id);
      throw publishError;
    }

    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setArchive((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
    flashSuccess(`"${cleanedTitle || sub.title}" approved and published successfully.`);
    await logAdminAction(adminEmail, 'APPROVED_SUBMISSION', id, cleanedTitle || sub.title);
  };

  const handleReject = async (id: string) => {
    const sub = submissions.find((s) => s.id === id);
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', id);
    if (error) {
      throw new Error(handleSupabaseError(error));
    }
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setArchive((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r));
    flashSuccess(`"${sub?.title ?? 'Submission'}" rejected.`);
    await logAdminAction(adminEmail, 'REJECTED_SUBMISSION', id, sub?.title ?? 'Unknown');
  };

  const handleArchiveRestore = async (id: string) => {
    const row = archive.find((r) => r.id === id);
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'pending', is_approved: false })
      .eq('id', id);
    if (error) throw new Error(handleSupabaseError(error));
    setArchive((prev) => prev.map((r) => r.id === id ? { ...r, status: 'pending' } : r));
    fetchPending();
    flashSuccess('Submission restored to the pending queue.');
    await logAdminAction(adminEmail, 'RESTORED_SUBMISSION', id, row?.title ?? 'Unknown');
  };

  const handleArchiveHardDelete = async (id: string) => {
    const row = archive.find((r) => r.id === id);
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);
    if (error) throw new Error(handleSupabaseError(error));
    setArchive((prev) => prev.filter((r) => r.id !== id));
    flashSuccess('Submission permanently deleted.');
    await logAdminAction(adminEmail, 'HARD_DELETED_SUBMISSION', id, row?.title ?? 'Unknown');
  };

  const handleArchiveUnpublish = async (id: string) => {
    const row = archive.find((r) => r.id === id);
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'pending', is_approved: false })
      .eq('id', id);
    if (error) throw new Error(handleSupabaseError(error));
    setArchive((prev) => prev.map((r) => r.id === id ? { ...r, status: 'pending' } : r));
    fetchPending();
    flashSuccess('Submission unpublished and moved back to pending queue.');
    await logAdminAction(adminEmail, 'UNPUBLISHED_SUBMISSION', id, row?.title ?? 'Unknown');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Unified sticky command strip: header + search + tabs */}
      <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        {/* Title row */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
            <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/25 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-zinc-100 leading-tight">Admin Command Center</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Per Scholas 2026-RTT-23 Cohort</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {submissions.length} pending
            </span>
            <button
              onClick={() => { fetchPending(); fetchArchive(); }}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Divider between title row and search/tabs */}
        <div className="border-t border-zinc-800/60" />

        {/* Search + Tabs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-3 flex flex-col gap-3">
          {/* Search Bar */}
          <div className="w-full flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or track..."
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/60 transition-all"
              />
            </div>
          </div>

          {/* Pill Tab Switcher */}
          <div className="relative w-full">
            <div className="overflow-x-auto whitespace-nowrap scrollbar-hide flex justify-center [mask-image:linear-gradient(to_right,white_0%,white_80%,transparent_100%)]">
            <div className="inline-flex rounded-full bg-zinc-800/80 border border-zinc-700/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === 'pending'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Pending Submissions
              {filteredSubmissions.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === 'pending'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {filteredSubmissions.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === 'archive'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Submissions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('names')}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === 'names'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Name Requests
            </button>
            {canManageAdmins && (
              <button
                type="button"
                onClick={() => setActiveTab('access')}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'access'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                Access Control
              </button>
            )}
            {canManageAdmins && (
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'audit'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Audit Trail
              </button>
            )}
            {canManageAdmins && (
              <button
                type="button"
                onClick={() => setActiveTab('maintenance')}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'maintenance'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Maintenance
              </button>
            )}
            {canManageAdmins && (
              <button
                type="button"
                onClick={() => setActiveTab('health')}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'health'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                System Health
              </button>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

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

        {/* ─── Pending Queue ─── */}
        {activeTab === 'pending' && (
          <>
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
            ) : filteredSubmissions.length === 0 ? (
              searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <Search className="w-8 h-8 text-zinc-600 mb-4" />
                  <h3 className="text-base font-semibold text-zinc-300">No results found</h3>
                  <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                    No submissions found matching &lsquo;{searchQuery}&rsquo;.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-200">All caught up!</h3>
                  <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                    The pending queue is clear. New contributions will appear here automatically.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((sub) => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Archive Table ─── */}
        {activeTab === 'archive' && (
          <ArchiveTable
            data={filteredArchive}
            loading={archiveLoading}
            searchQuery={searchQuery}
            onRestore={handleArchiveRestore}
            onHardDelete={handleArchiveHardDelete}
            onUnpublish={handleArchiveUnpublish}
          />
        )}

        {/* ─── Access Control ─── */}
        {activeTab === 'access' && canManageAdmins && (
          <AccessControlView adminEmail={adminEmail} />
        )}

        {/* ─── Audit Trail ─── */}
        {activeTab === 'audit' && canManageAdmins && (
          <AuditTrailView />
        )}

        {/* ─── Name Requests ─── */}
        {activeTab === 'names' && (
          <NameRequestsView adminEmail={adminEmail} />
        )}

        {/* ─── System Maintenance ─── */}
        {activeTab === 'maintenance' && canManageAdmins && (
          <MaintenanceView adminEmail={adminEmail} />
        )}

        {/* ─── System Health ─── */}
        {activeTab === 'health' && canManageAdmins && (
          <SystemHealthView />
        )}

      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// System Health View (crash telemetry dashboard)
// ---------------------------------------------------------------------------
interface CrashLogEntry {
  id: string;
  target_id: string | null;
  target_title: string | null;
  created_at: string;
}

function SystemHealthView() {
  const [logs, setLogs] = useState<CrashLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('admin_audit_logs')
        .select('id, target_id, target_title, created_at')
        .eq('action_taken', 'frontend_crash')
        .order('created_at', { ascending: false })
        .limit(100);

      if (cancelled) return;
      if (fetchErr) {
        setError(fetchErr.message);
      } else {
        setLogs(data ?? []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <HeartPulse className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">System Health Monitor</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Frontend crash telemetry captured by the Global Error Boundary</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-300">No Crashes Recorded</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm">
            The Global Error Boundary has not captured any frontend crashes. System is operating normally.
          </p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/80">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 whitespace-nowrap">Route</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.map((log) => {
                  const parts = (log.target_title ?? '').split('\n\n--- Component Stack ---\n');
                  const errorMsg = parts[0] || 'Unknown error';
                  const stack = parts[1] || '';
                  return (
                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap align-top text-xs font-mono">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800 text-xs font-mono text-zinc-300">
                          {log.target_id || '/'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top max-w-md">
                        <p className="text-red-300 text-xs font-medium mb-1 break-words">{errorMsg}</p>
                        {stack && (
                          <pre className="text-[10px] text-zinc-500 font-mono bg-zinc-950 rounded-lg p-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words border border-zinc-800">
                            {stack}
                          </pre>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/80">
            <p className="text-xs text-zinc-500">Showing {logs.length} most recent crash{logs.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Floating toast for unauthenticated admin access
// ---------------------------------------------------------------------------
function AdminAccessToast() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-start gap-3 px-5 py-4 bg-zinc-900 rounded-2xl shadow-2xl border border-amber-500/20 max-w-sm transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="p-1 rounded-full bg-amber-500/20">
        <AlertCircle className="w-5 h-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 text-sm">Sign-in Required</p>
        <p className="text-zinc-400 text-xs mt-0.5">Please sign in to access the Admin Control Panel.</p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root export: auth gate + panel (database-driven whitelist)
// ---------------------------------------------------------------------------
export default function AdminControlPage() {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminCheck, setAdminCheck] = useState<{ checked: boolean; isAdmin: boolean; canManageAdmins: boolean }>({
    checked: false,
    isAdmin: false,
    canManageAdmins: false,
  });

  useEffect(() => {
    if (!user?.email) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('admin_whitelist')
        .select('email, can_manage_admins')
        .eq('email', user.email!)
        .maybeSingle();
      if (!mounted) return;
      setAdminCheck({
        checked: true,
        isAdmin: !!data,
        canManageAdmins: data?.can_manage_admins ?? false,
      });
    })();
    return () => { mounted = false; };
  }, [user?.email]);

  if (loading || (user && !adminCheck.checked)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Access Denied</h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              You must be signed in to access the Admin Command Center. Please authenticate to continue.
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20"
          >
            <Lock className="w-4 h-4" />
            Sign In
          </button>
        </div>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <AdminAccessToast />
      </div>
    );
  }

  if (!adminCheck.isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Unauthorized</h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              You do not have administrative privileges for this workspace. Contact your cohort lead if you believe this is an error.
            </p>
          </div>
          <p className="text-xs text-zinc-600">
            Signed in as {user.email}
          </p>
        </div>
      </div>
    );
  }

  return <AdminPanel adminEmail={user.email ?? 'unknown'} canManageAdmins={adminCheck.canManageAdmins} />;
}

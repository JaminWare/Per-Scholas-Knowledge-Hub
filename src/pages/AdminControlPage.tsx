import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeUrl } from '../utils/normalizeUrl';
import { autoFormatContent } from '../utils/autoFormatContent';
import {
  DOMAIN_REGISTRY, SLUG_TO_CANONICAL, CANONICAL_TO_SLUG,
  resolveToCanonical, resolveTrackSlug,
} from '../lib/domainRegistry';
import { ADMIN_EMAILS } from '../constants/config';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import { logAdminAction } from '../utils/auditLogger';
import {
  Lock, ShieldCheck, CheckCircle2, Trash2, Loader2,
  AlertCircle, EyeOff, RefreshCw, FileText, Link2,
  GitBranch, Zap, BookOpen, Tag, User, Calendar, Wand2,
  Pencil, SplitSquareHorizontal, Archive, Filter,
  RotateCcw, XCircle, ShieldOff,
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
  onApprove: (id: string, domainOverride?: string, editedContent?: string, editedTitle?: string) => Promise<void>;
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

  useEffect(() => {
    async function checkDuplicate() {
      try {
        if (sub.submission_type === 'Resource Link') {
          const normalized = normalizeUrl(sub.content ?? '');
          const { data } = await supabase
            .from('articles')
            .select('content')
            .eq('submission_type', 'Resource Link')
            .eq('is_sample', false);
          if ((data ?? []).some((row) => normalizeUrl(row.content ?? '') === normalized)) {
            setIsDuplicate(true);
          }
        } else {
          const { data } = await supabase
            .from('articles')
            .select('id')
            .ilike('title', sub.title)
            .eq('is_sample', false);
          if ((data ?? []).length > 0) setIsDuplicate(true);
        }
      } catch { /* non-blocking */ }
    }
    checkDuplicate();
  }, [sub.id]);

  const handleApprove = async () => {
    if (needsOverride && !domainOverride) {
      setActionError('Please select a target domain before approving.');
      return;
    }
    setApproving(true);
    setActionError('');
    try {
      await onApprove(sub.id, needsOverride ? domainOverride : undefined, editedContent, editedTitle !== sub.title ? editedTitle : undefined);
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
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Edit submission title..."
                  className="w-full px-4 py-2.5 rounded-lg bg-black border border-zinc-800 text-white text-lg font-semibold placeholder:text-zinc-600 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:outline-none transition-all"
                />
              </div>
              {/* Side-by-side panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Editor */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Raw Markdown</span>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
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
  onRestore,
  onHardDelete,
  onUnpublish,
}: {
  data: ArchiveRow[];
  loading: boolean;
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
        <p className="text-center text-sm text-zinc-600 py-8">No submissions match this filter.</p>
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
// Main Admin Panel
// ---------------------------------------------------------------------------
function AdminPanel({ adminEmail }: { adminEmail: string }) {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [archive, setArchive] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'archive'>('pending');

  const fetchPending = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubmissions((data as PendingSubmission[]) ?? []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load submissions.');
    } finally {
      setLoading(false);
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

  const handleApprove = async (id: string, domainOverride?: string, editedContent?: string, editedTitle?: string) => {
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
            comp_objective: sub.comp_objective || null,
            lx_stage: sub.lx_stage || null,
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
            comp_objective: sub.comp_objective || null,
            lx_stage: sub.lx_stage || null,
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
      throw new Error('Failed to reject submission. Please check Supabase RLS policies.');
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
    setArchive((prev) => prev.map((r) => r.id === id ? { ...r, status: 'pending' } : r));
    fetchPending();
    flashSuccess('Submission unpublished and moved back to pending queue.');
    await logAdminAction(adminEmail, 'UNPUBLISHED_SUBMISSION', id, row?.title ?? 'Unknown');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/25">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-100 leading-none">Admin Command Center</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Per Scholas 2026-RTT-23 Cohort</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
      </header>

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

        {/* Pill Tab Switcher */}
        <div className="flex justify-center">
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
              {submissions.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === 'pending'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {submissions.length}
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
          </div>
        </div>

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
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/30">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200">All caught up!</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                  The pending queue is clear. New contributions will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
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
            data={archive}
            loading={archiveLoading}
            onRestore={handleArchiveRestore}
            onHardDelete={handleArchiveHardDelete}
            onUnpublish={handleArchiveUnpublish}
          />
        )}

      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root export: auth gate + panel
// ---------------------------------------------------------------------------
export default function AdminControlPage() {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  if (loading) {
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
      </div>
    );
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? '');

  if (!isAdmin) {
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

  return <AdminPanel adminEmail={user.email ?? 'unknown'} />;
}

import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, ChevronDown, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LS_KEY = 'lkb_submissions';

const TRACKS = [
  { label: 'CompTIA A+ Core 1 — Domain 1.0 (Mobile Devices)',             badge: 'Core 1 Expert' },
  { label: 'CompTIA A+ Core 1 — Domain 2.0 (Networking)',                  badge: 'Core 1 Expert' },
  { label: 'CompTIA A+ Core 1 — Domain 3.0 (Hardware)',                    badge: 'Core 1 Expert' },
  { label: 'CompTIA A+ Core 1 — Domain 4.0 (Virtualization & Cloud)',      badge: 'Core 1 Expert' },
  { label: 'CompTIA A+ Core 1 — Domain 5.0 (HW & Network Troubleshooting)', badge: 'Core 1 Expert' },
  { label: 'CompTIA A+ Core 2 — Domain 1.0 (Operating Systems)',           badge: 'Core 2 Expert' },
  { label: 'CompTIA A+ Core 2 — Domain 2.0 (Security)',                    badge: 'Core 2 Expert' },
  { label: 'CompTIA A+ Core 2 — Domain 3.0 (Software Troubleshooting)',    badge: 'Core 2 Expert' },
  { label: 'CompTIA A+ Core 2 — Domain 4.0 (Operational Procedures)',      badge: 'Core 2 Expert' },
  { label: 'Advanced Healthcare IT — EHR Architecture',                    badge: 'HealthIT Specialist' },
  { label: 'Advanced Healthcare IT — HIPAA Data Security',                 badge: 'HealthIT Specialist' },
  { label: 'Advanced Healthcare IT — Clinical Workflows',                  badge: 'HealthIT Specialist' },
  { label: 'Study Tips & Mnemonics',                                        badge: 'Study Champion' },
  { label: 'Prompt Engineering Frameworks',                                 badge: 'AI Prompt Engineer' },
];

function getBadgeForTrack(trackLabel: string): string {
  return TRACKS.find((t) => t.label === trackLabel)?.badge ?? 'Cohort Contributor';
}

export interface NewSubmission {
  id: string;
  full_name: string;
  track: string;
  badge: string;
  title: string;
  content: string;
  created_at: string;
}

export function loadLocalSubmissions(): NewSubmission[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveLocalSubmission(s: NewSubmission) {
  const existing = loadLocalSubmissions();
  const deduped = [s, ...existing.filter((x) => x.id !== s.id)].slice(0, 50);
  localStorage.setItem(LS_KEY, JSON.stringify(deduped));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (s: NewSubmission) => void;
}

export default function ContributorSubmissionModal({ isOpen, onClose, onSubmitted }: Props) {
  const [form, setForm] = useState({ full_name: '', track: '', title: '', content: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const selectedBadge = form.track ? getBadgeForTrack(form.track) : null;

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => firstInputRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validate = () => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.full_name.trim()) e.full_name = 'Name or Discord handle is required.';
    if (!form.track) e.track = 'Please select a track.';
    if (!form.title.trim()) e.title = 'Tip title is required.';
    if (form.content.trim().length < 30) e.content = 'Content must be at least 30 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const badge = getBadgeForTrack(form.track);

    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          full_name: form.full_name.trim(),
          track: form.track,
          badge,
          title: form.title.trim(),
          content: form.content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      const submission: NewSubmission = { ...(data as NewSubmission), badge };
      saveLocalSubmission(submission);
      onSubmitted(submission);
      setForm({ full_name: '', track: '', title: '', content: '' });
      setErrors({});
      onClose();
    } catch (err) {
      // Fallback: persist locally even if Supabase fails
      const localSub: NewSubmission = {
        id: `local-${Date.now()}`,
        full_name: form.full_name.trim(),
        track: form.track,
        badge,
        title: form.title.trim(),
        content: form.content.trim(),
        created_at: new Date().toISOString(),
      };
      saveLocalSubmission(localSub);
      onSubmitted(localSub);
      setForm({ full_name: '', track: '', title: '', content: '' });
      setErrors({});
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submit Your Tip</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Share a unique hack to claim your contributor badge on the Recognition Wall.
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name / Discord Handle <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Jane Smith or @jsmith_rtt23"
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                errors.full_name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
          </div>

          {/* Track */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Track / Domain <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.track}
                onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none ${
                  errors.track ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="" disabled>Select a track…</option>
                {TRACKS.map((t) => (
                  <option key={t.label} value={t.label}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.track && <p className="mt-1 text-xs text-red-500">{errors.track}</p>}
            {/* Live badge preview */}
            {selectedBadge && (
              <div className="mt-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  You will earn the badge:{' '}
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    [{selectedBadge}]
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tip / Article Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Fix Boot Camp Audio Driver on Windows 11"
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                errors.title ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Troubleshooting Steps / Tip Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Describe the issue, steps to reproduce, and your fix."
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none font-mono ${
                errors.content ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.content ? <p className="text-xs text-red-500">{errors.content}</p> : <span />}
              <span className="text-xs text-slate-400">{form.content.length} chars</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors disabled:opacity-60 shadow-lg shadow-emerald-500/20">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? 'Submitting…' : 'Claim My Badge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

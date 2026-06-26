import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TRACKS = [
  'CompTIA A+ Core 1 — Domain 1.0 (Mobile Devices)',
  'CompTIA A+ Core 1 — Domain 2.0 (Networking)',
  'CompTIA A+ Core 1 — Domain 3.0 (Hardware)',
  'CompTIA A+ Core 1 — Domain 4.0 (Virtualization & Cloud)',
  'CompTIA A+ Core 1 — Domain 5.0 (HW & Network Troubleshooting)',
  'CompTIA A+ Core 2 — Domain 1.0 (Operating Systems)',
  'CompTIA A+ Core 2 — Domain 2.0 (Security)',
  'CompTIA A+ Core 2 — Domain 3.0 (Software Troubleshooting)',
  'CompTIA A+ Core 2 — Domain 4.0 (Operational Procedures)',
  'Advanced Healthcare IT — EHR Architecture',
  'Advanced Healthcare IT — HIPAA Data Security',
  'Advanced Healthcare IT — Clinical IT Operations',
  'Study Tips & Mnemonics',
  'Azari Prompt Frameworks',
];

export interface NewSubmission {
  id: string;
  full_name: string;
  track: string;
  title: string;
  content: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (s: NewSubmission) => void;
}

export default function ContributorSubmissionModal({ isOpen, onClose, onSubmitted }: Props) {
  const [form, setForm] = useState({ full_name: '', track: '', title: '', content: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // trap focus + close on Escape
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => firstInputRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validate = () => {
    const e: Partial<typeof form> = {};
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

    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          full_name: form.full_name.trim(),
          track: form.track,
          title: form.title.trim(),
          content: form.content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      onSubmitted(data as NewSubmission);
      setForm({ full_name: '', track: '', title: '', content: '' });
      setErrors({});
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      setErrors({ content: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Submit Your Tip
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Share a unique hack to claim your contributor badge on the Recognition Wall.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${
                errors.full_name ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
            )}
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
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm appearance-none ${
                  errors.track ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
                } ${!form.track ? 'text-slate-400 dark:text-slate-500' : ''}`}
              >
                <option value="" disabled>Select a track…</option>
                {TRACKS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.track && (
              <p className="mt-1 text-xs text-red-500">{errors.track}</p>
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
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${
                errors.title ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
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
              placeholder="Describe the issue, steps to reproduce, and your fix. You can include code snippets using backtick syntax."
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm resize-none font-mono ${
                errors.content ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.content ? (
                <p className="text-xs text-red-500">{errors.content}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-400">{form.content.length} chars</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors disabled:opacity-60 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? 'Submitting…' : 'Claim My Badge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

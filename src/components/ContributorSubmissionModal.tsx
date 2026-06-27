import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, ChevronDown, Tag, Image, FileText, Link2, Ticket } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LS_KEY = 'lkb_submissions';

const SUBMISSION_TYPES = [
  { value: 'Article',        label: 'Article',        icon: FileText, desc: 'A full research or study piece' },
  { value: 'Resource Link',  label: 'Resource Link',  icon: Link2,    desc: 'A curated external link or tip' },
  { value: 'Support Ticket', label: 'Support Ticket', icon: Ticket,   desc: 'Report an issue to be resolved' },
] as const;

type SubmissionType = typeof SUBMISSION_TYPES[number]['value'];

const MASTER_CATEGORIES = [
  { label: 'Study Tips',       badge: 'Core 1 Expert',     sub: [
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
    'Advanced Healthcare IT — Clinical Workflows',
  ]},
  { label: 'Diagrams',          badge: 'Diagram Architect', sub: [
    'Diagrams — Motherboard / Hardware Blueprints',
    'Diagrams — Network Topology',
    'Diagrams — EHR / Clinical Data Flow',
    'Diagrams — Security Architecture',
  ]},
  { label: 'Quick References',  badge: 'Reference Author',  sub: [
    'Quick References — Port Numbers & Protocols',
    'Quick References — CLI Commands',
    'Quick References — Acronyms & Mnemonics',
    'Quick References — Subnetting Cheatsheet',
  ]},
  { label: 'Prompt Playbook',   badge: 'Playbook Engineer', sub: [
    'Prompt Playbook — CompTIA PBQ Simulations',
    'Prompt Playbook — Healthcare Case Studies',
    'Prompt Playbook — EHR Troubleshooting Frameworks',
    'Prompt Playbook — Study Drill Frameworks',
  ]},
];

const TICKET_AREAS = [
  'Platform / Navigation Issue',
  'Article Error or Inaccuracy',
  'Missing Content Request',
  'Access / Permissions Problem',
  'General Feedback',
];

function getBadge(masterCategory: string): string {
  return MASTER_CATEGORIES.find((c) => c.label === masterCategory)?.badge ?? 'Cohort Contributor';
}

export interface NewSubmission {
  id: string;
  full_name: string;
  track: string;
  badge: string;
  title: string;
  content: string;
  submission_type?: string;
  media_link?: string;
  created_at: string;
}

export function loadLocalSubmissions(): NewSubmission[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}

function saveLocalSubmission(s: NewSubmission) {
  const existing = loadLocalSubmissions();
  const merged = [s, ...existing.filter((x) => x.id !== s.id)].slice(0, 60);
  localStorage.setItem(LS_KEY, JSON.stringify(merged));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (s: NewSubmission) => void;
}

export default function ContributorSubmissionModal({ isOpen, onClose, onSubmitted }: Props) {
  const [submissionType, setSubmissionType] = useState<SubmissionType | ''>('');
  const [masterCat, setMasterCat]           = useState('');
  const [subTrack, setSubTrack]             = useState('');
  const [ticketArea, setTicketArea]         = useState('');
  const [fullName, setFullName]             = useState('');
  const [title, setTitle]                   = useState('');
  const [mediaLink, setMediaLink]           = useState('');
  const [content, setContent]               = useState('');
  const [errors, setErrors]                 = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const isTicket    = submissionType === 'Support Ticket';
  const selectedCat = MASTER_CATEGORIES.find((c) => c.label === masterCat);
  const autoBadge   = masterCat && !isTicket ? getBadge(masterCat) : null;
  const trackValue  = isTicket
    ? (ticketArea || 'Support Ticket — General')
    : (subTrack || masterCat);

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

  useEffect(() => { setSubTrack(''); }, [masterCat]);
  useEffect(() => {
    setMasterCat(''); setSubTrack(''); setTicketArea('');
    setTitle(''); setContent(''); setErrors({});
  }, [submissionType]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim())         e.fullName = 'Name or Discord handle is required.';
    if (!submissionType)          e.submissionType = 'Please choose a submission type.';
    if (!isTicket && !masterCat)  e.masterCat = 'Please select a master category.';
    if (!title.trim())            e.title = isTicket ? 'Issue summary is required.' : 'Title is required.';
    if (content.trim().length < 20)
      e.content = isTicket
        ? 'Problem description must be at least 20 characters.'
        : 'Content must be at least 20 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setSubmissionType(''); setFullName(''); setMasterCat(''); setSubTrack('');
    setTicketArea(''); setTitle(''); setMediaLink(''); setContent(''); setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const badge = isTicket ? 'Cohort Contributor' : getBadge(masterCat);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          full_name: fullName.trim(),
          track: trackValue,
          badge,
          title: title.trim(),
          content: content.trim(),
          submission_type: submissionType,
        })
        .select().single();
      if (error) throw error;
      const sub: NewSubmission = {
        ...(data as NewSubmission),
        badge,
        submission_type: submissionType,
        media_link: mediaLink.trim() || undefined,
      };
      saveLocalSubmission(sub);
      onSubmitted(sub);
      reset(); onClose();
    } catch {
      const local: NewSubmission = {
        id: `local-${Date.now()}`,
        full_name: fullName.trim(),
        track: trackValue,
        badge: isTicket ? 'Cohort Contributor' : getBadge(masterCat),
        title: title.trim(),
        content: content.trim(),
        submission_type: submissionType,
        media_link: mediaLink.trim() || undefined,
        created_at: new Date().toISOString(),
      };
      saveLocalSubmission(local);
      onSubmitted(local);
      reset(); onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 border text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm transition-all ${
      errors[field] ? 'border-red-400 dark:border-red-500/60' : 'border-zinc-300 dark:border-zinc-700'
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-50 dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">

        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Submit Your Contribution</h2>
              <p className="text-sm text-zinc-500 mt-1">Share a tip, article, resource link, or log a support ticket.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Full Name / Discord Handle <span className="text-red-400">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Smith or @jsmith_rtt23"
              className={inputCls('fullName')}
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>

          {/* Submission type selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Submission Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUBMISSION_TYPES.map((t) => {
                const Icon = t.icon;
                const active = submissionType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSubmissionType(t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      active
                        ? t.value === 'Support Ticket'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'border-sky-400 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.submissionType && <p className="mt-1 text-xs text-red-500">{errors.submissionType}</p>}
            {isTicket && (
              <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                <Ticket className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Support tickets are triaged by the team and will be converted into a knowledge base article once resolved.
                </p>
              </div>
            )}
          </div>

          {/* Support Ticket: area selector */}
          {isTicket && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Problem Area <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  value={ticketArea}
                  onChange={(e) => setTicketArea(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm appearance-none"
                >
                  <option value="">Select a problem area…</option>
                  {TICKET_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Article / Resource Link: master category */}
          {!isTicket && submissionType && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Master Category <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={masterCat}
                  onChange={(e) => setMasterCat(e.target.value)}
                  className={`${inputCls('masterCat')} appearance-none`}
                >
                  <option value="" disabled>Select a category…</option>
                  {MASTER_CATEGORIES.map((c) => (
                    <option key={c.label} value={c.label}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
              {errors.masterCat && <p className="mt-1 text-xs text-red-500">{errors.masterCat}</p>}
              {autoBadge && (
                <div className="mt-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span className="text-xs text-zinc-500">
                    You will earn:{' '}
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      [{autoBadge}]
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sub-track */}
          {!isTicket && selectedCat && selectedCat.sub.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Specific Domain / Sub-track <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  value={subTrack}
                  onChange={(e) => setSubTrack(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm appearance-none"
                >
                  <option value="">All {selectedCat.label} (general)</option>
                  {selectedCat.sub.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Title */}
          {submissionType && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isTicket ? 'Issue Summary' : 'Contribution / Article Title'}{' '}
                <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isTicket
                  ? 'e.g. Broken link on Networking section page'
                  : 'e.g. Fix Boot Camp Audio Driver on Windows 11'}
                className={inputCls('title')}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>
          )}

          {/* Media link — not for tickets */}
          {!isTicket && submissionType && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-zinc-400" />
                  Media / Diagram Embed Link
                  <span className="text-zinc-400 font-normal">(optional)</span>
                </span>
              </label>
              <input
                type="url"
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                placeholder="https://… (image URL, Mermaid diagram link, Canvas pin, etc.)"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
              <p className="text-xs text-zinc-400 mt-1">Supports image URLs, Mermaid diagram links, or direct asset embed URLs.</p>
            </div>
          )}

          {/* Content / Problem description */}
          {submissionType && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isTicket ? 'Problem Description' : 'Contribution Content'}{' '}
                <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isTicket
                  ? 'Describe the problem in detail. Include steps to reproduce, what you expected, and what actually happened.'
                  : 'Describe your tip, troubleshooting steps, prompt syntax, diagram description, or reference notes.'}
                className={`${inputCls('content')} resize-none ${isTicket ? '' : 'font-mono'}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.content
                  ? <p className="text-xs text-red-500">{errors.content}</p>
                  : <span />}
                <span className="text-xs text-zinc-400">{content.length} chars</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60 shadow-lg text-white ${
                isTicket
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
              }`}
            >
              {isSubmitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : isTicket ? <Ticket className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? 'Submitting…' : isTicket ? 'Log Ticket' : 'Claim My Badge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  X, Send, Loader2, ChevronDown, ChevronLeft, Tag,
  FileText, Link2, BookOpen, Zap, GitBranch,
  AlertCircle, CheckCircle, XCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const LS_KEY = 'lkb_submissions';

// ── Profanity filter ──────────────────────────────────────────────────────────
const PROFANITY_PATTERN = new RegExp(
  [
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'damn',
    'piss', 'cock', 'dick', 'pussy', 'whore', 'slut', 'retard', 'nigger',
    'faggot', 'kike', 'spic', 'chink', 'wetback',
  ].join('|'),
  'i',
);

// ── Submission types ──────────────────────────────────────────────────────────
type SubmissionType = 'Article' | 'Study Tip' | 'Diagram' | 'Quick Reference' | 'Resource Link';

const SUBMISSION_TYPES = [
  { value: 'Article'        as SubmissionType, label: 'Article',        icon: FileText  },
  { value: 'Study Tip'      as SubmissionType, label: 'Study Tip',      icon: BookOpen  },
  { value: 'Diagram'        as SubmissionType, label: 'Diagram',        icon: GitBranch },
  { value: 'Quick Reference'as SubmissionType, label: 'Quick Ref',      icon: Zap       },
  { value: 'Resource Link'  as SubmissionType, label: 'Resource Link',  icon: Link2     },
];

const MASTER_CATEGORIES = [
  { label: 'Study Tips',      badge: 'Core 1 Expert',     sub: [
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
  { label: 'Diagrams',         badge: 'Diagram Architect', sub: [
    'Diagrams — Motherboard / Hardware Blueprints',
    'Diagrams — Network Topology',
    'Diagrams — EHR / Clinical Data Flow',
    'Diagrams — Security Architecture',
  ]},
  { label: 'Quick References', badge: 'Reference Author',  sub: [
    'Quick References — Port Numbers & Protocols',
    'Quick References — CLI Commands',
    'Quick References — Acronyms & Mnemonics',
    'Quick References — Subnetting Cheatsheet',
  ]},
  { label: 'Prompt Playbook',  badge: 'Playbook Engineer', sub: [
    'Prompt Playbook — CompTIA PBQ Simulations',
    'Prompt Playbook — Healthcare Case Studies',
    'Prompt Playbook — EHR Troubleshooting Frameworks',
    'Prompt Playbook — Study Drill Frameworks',
  ]},
];

function getBadge(masterCategory: string): string {
  return MASTER_CATEGORIES.find((c) => c.label === masterCategory)?.badge ?? 'Cohort Contributor';
}

// ── Checklist rules (Article only) ───────────────────────────────────────────
const HEALTHCARE_KEYWORDS = [
  'patient', 'clinic', 'hospital', 'ehr', 'hipaa', 'provider',
  'clinical', 'medical', 'care',
];

interface ChecklistRule {
  id: string;
  label: string;
  hint: string;
  test: (text: string) => boolean;
}

const CHECKLIST_RULES: ChecklistRule[] = [
  {
    id: 'depth',
    label: '100-word minimum depth',
    hint: 'Add more detail across both fields — aim for at least 100 words combined.',
    test: (t) => t.trim().split(/\s+/).filter(Boolean).length >= 100,
  },
  {
    id: 'healthcare',
    label: 'Healthcare relevance (2+ keywords)',
    hint: 'Mention at least two healthcare terms (e.g., EHR, HIPAA, patient) in the Healthcare Impact field.',
    test: (t) => {
      const lower = t.toLowerCase();
      return HEALTHCARE_KEYWORDS.filter((kw) => lower.includes(kw)).length >= 2;
    },
  },
  {
    id: 'citation',
    label: 'Reference URL included',
    hint: 'Provide a valid https:// URL in the reference field below.',
    test: (t) => /https?:\/\//.test(t),
  },
  {
    id: 'structure',
    label: 'Structured formatting',
    hint: 'Use bullet points (* or -) or break content into separate paragraphs.',
    test: (t) => /(^\s*[-*] |\n\n)/m.test(t),
  },
];

function evaluateChecklist(text: string): Record<string, boolean> {
  return Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, r.test(text)]));
}

// ── Content templates (keyed by submission type) ─────────────────────────────
const CONTENT_TEMPLATES: Record<string, string> = {
  'Article': `## 🔬 Core Concept Definition\n[What is the absolute textbook definition of this topic?]\n\n## 🏥 Healthcare IT Integration & Clinical Context\n[How does this interface with clinical workstations or impact patient care?]\n\n## 🔗 Verifiable Domain Sources\n[Paste trusted reference link: https://]`,
  'Study Tip': `## 💡 Quick Study Hack\n[Explain the mnemonic or trick to remember this concept]\n\n## 🏥 Clinical Scenario\n[Give an example of how this appears in a hospital IT setting]\n\n## 🔗 Reference\n[Source link: https://]`,
  'Diagram': `## 🗺️ Visual Framework\n[Describe the data pathway or topology]\n\n## 🏥 Clinical Workflow Mapping\n[What medical systems run across these lines?]\n\n## 🔗 Architecture Link\n[Reference link: https://]`,
  'Quick Reference': `## ⚡ Rapid Field Matrix\n[List command flags or port numbers]\n\n## 🏥 Remediation Plan\n[Immediate fix to prevent clinical downtime]\n\n## 🔗 Source\n[Reference link: https://]`,
};

function buildFormattedContent(params: {
  authorName: string;
  masterCat: string;
  trackValue: string;
  rawContent: string;
}): string {
  const { authorName, masterCat, trackValue, rawContent } = params;
  return [
    `> 💡 **Community Contribution** | Research curated by **${authorName}** for track **${masterCat}** — **${trackValue}**.`,
    '',
    '## Executive Overview & Core Concepts',
    '',
    rawContent.trim(),
    '',
    '## Healthcare IT Professional Relevance',
    '',
    'This research directly supports professionals working within healthcare IT environments. The concepts covered relate to real-world clinical and administrative workflows — from EHR system configurations to HIPAA-compliant security postures. Students are encouraged to map these technical details to patient-facing outcomes, provider productivity, and regulatory compliance frameworks used across hospital networks and clinical settings.',
    '',
    '### References & Authoritative Sources',
    '',
    '- *(Add your APA, MLA, or direct URL citations below.)*',
  ].join('\n');
}

// ── Sample slot overwrite ─────────────────────────────────────────────────────
async function trySampleSlotOverwrite(params: {
  trackValue: string;
  submissionId: string;
  formattedContent: string;
  onRefresh?: () => void;
}): Promise<void> {
  const { trackValue, submissionId, formattedContent, onRefresh } = params;
  try {
    const { data: sampleArticles } = await supabase
      .from('articles')
      .select('id, title, study_category')
      .ilike('title', '%[Sample]%')
      .order('created_at', { ascending: true })
      .limit(20);

    if (!sampleArticles || sampleArticles.length === 0) return;

    const trackLower = trackValue.toLowerCase();
    const targetArticle = sampleArticles.find((a) => {
      if (!a.study_category) return false;
      const cat = (a.study_category as string).toLowerCase();
      return trackLower.includes(cat) || cat.includes(trackLower);
    }) ?? sampleArticles[0];

    if (!targetArticle) return;

    const cleanTitle = (targetArticle.title as string)
      .replace(/^\s*\[sample\]\s*/i, '')
      .trim();

    await supabase
      .from('articles')
      .update({ title: cleanTitle, content: formattedContent, is_sample: false, is_featured: false })
      .eq('id', targetArticle.id);

    await supabase
      .from('submissions')
      .update({ is_approved: true })
      .eq('id', submissionId);

    onRefresh?.();
  } catch (err) {
    console.error('[trySampleSlotOverwrite]', err);
  }
}

// ── LocalStorage helpers ──────────────────────────────────────────────────────
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

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (s: NewSubmission) => void;
  onRefresh?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ContributorSubmissionModal({ isOpen, onClose, onSubmitted, onRefresh }: Props) {
  const [step,             setStep]             = useState<1 | 2>(1);
  const [submissionType,   setSubmissionType]   = useState<SubmissionType>('Article');
  const [masterCat,        setMasterCat]        = useState('Study Tips');
  const [subTrack,         setSubTrack]         = useState('');
  const [fullName,  setFullName]  = useState('');
  const [title,     setTitle]     = useState('');
  const [content,   setContent]   = useState('');
  const [errors,           setErrors]           = useState<Record<string, string>>({});
  const [formError,        setFormError]        = useState('');
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [checklistResults, setChecklistResults] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false]))
  );

  const isResourceLink = submissionType === 'Resource Link';
  const isArticle      = submissionType === 'Article';
  const selectedCat    = MASTER_CATEGORIES.find((c) => c.label === masterCat);
  const autoBadge      = masterCat ? getBadge(masterCat) : null;
  const trackValue     = subTrack || masterCat;

  const allChecksPassed = isArticle
    ? Object.values(checklistResults).every(Boolean)
    : true;

  // Reset sub-track when category changes
  useEffect(() => { setSubTrack(''); }, [masterCat]);

  // Template injection: fire on open and on type switch
  useEffect(() => {
    if (!isOpen || isResourceLink) {
      if (isResourceLink) { setContent(''); setErrors({}); setFormError(''); }
      return;
    }
    const template = CONTENT_TEMPLATES[submissionType] ?? '';
    const templateValues = Object.values(CONTENT_TEMPLATES);
    if (content.trim() === '' || templateValues.includes(content)) {
      setContent(template);
    }
    setErrors({}); setFormError('');
    setChecklistResults(Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false])));
  }, [isOpen, submissionType]);

  // Live checklist evaluation for Article type
  useEffect(() => {
    if (!isArticle) return;
    setChecklistResults(evaluateChecklist(content));
  }, [content, isArticle]);

  // Keyboard + scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const reset = () => {
    setStep(1);
    setSubmissionType('Article');
    setMasterCat('Study Tips');
    setSubTrack('');
    setFullName('');
    setTitle('');
    setContent('');
    setErrors({});
    setFormError('');
    setChecklistResults(Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false])));
  };

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Name or Discord handle is required.';
    if (!title.trim())    e.title    = 'Contribution title is required.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setFormError('');
    setStep(2);
  };

  const handleAssembleAndSubmit = async () => {
    const e: Record<string, string> = {};
    if (isResourceLink) {
      if (!/^https?:\/\/.+/.test(content.trim()))
        e.content = 'Please enter a valid https:// URL.';
    } else {
      if (content.trim().length < 50)
        e.content = 'Please add more detail — replace the bracketed prompts with your actual research.';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (PROFANITY_PATTERN.test(title) || PROFANITY_PATTERN.test(content)) {
      setFormError('Submission contains restricted language. Please align your contribution with professional healthcare and academic standards.');
      return;
    }

    if (isArticle && !allChecksPassed) return;

    setIsSubmitting(true);
    const badge = getBadge(masterCat);
    const rawContent = content.trim();

    const formattedContent = !isResourceLink
      ? buildFormattedContent({ authorName: fullName.trim(), masterCat, trackValue, rawContent })
      : null;

    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          full_name: fullName.trim(),
          track: trackValue,
          badge,
          title: title.trim(),
          content: rawContent,
          submission_type: submissionType,
          formatted_content: formattedContent,
          is_approved: false,
        })
        .select().single();

      if (error) throw error;

      const sub: NewSubmission = {
        ...(data as NewSubmission),
        badge,
        submission_type: submissionType,
      };
      saveLocalSubmission(sub);

      if (!isResourceLink && formattedContent) {
        trySampleSlotOverwrite({ trackValue, submissionId: sub.id, formattedContent, onRefresh });
      }

      onSubmitted(sub);
      reset();
      onClose();
    } catch {
      const local: NewSubmission = {
        id: `local-${Date.now()}`,
        full_name: fullName.trim(),
        track: trackValue,
        badge,
        title: title.trim(),
        content: rawContent,
        submission_type: submissionType,
        created_at: new Date().toISOString(),
      };
      saveLocalSubmission(local);
      onSubmitted(local);
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = (field: string) =>
    `w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm transition-all ${
      errors[field] ? 'border-red-400 dark:border-red-500/60' : 'border-zinc-200 dark:border-zinc-800'
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Contribute to the Hub</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Step {step} of 2 — {step === 1 ? 'Categorization' : 'Knowledge Extraction'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className={`w-2 h-2 rounded-full transition-colors ${step >= 1 ? 'bg-sky-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
              <span className={`w-2 h-2 rounded-full transition-colors ${step >= 2 ? 'bg-sky-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Form error banner ───────────────────────────────────────────────── */}
        {formError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-start gap-2.5 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{formError}</p>
          </div>
        )}

        {/* ── Scrollable body ─────────────────────────────────────────────────── */}
        <div className="px-6 py-5 overflow-y-auto flex-1">

          {/* ── STEP 1 — Categorization ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  Full Name / Discord Handle <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Smith or @jsmith_rtt23"
                  className={inputCls('fullName')}
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
              </div>

              {/* Submission Type */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Contribution Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
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
                            ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20'
                            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-sky-300 dark:hover:border-sky-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Master Category */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  Curriculum Track <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={masterCat}
                    onChange={(e) => setMasterCat(e.target.value)}
                    className={`${inputCls('masterCat')} appearance-none`}
                  >
                    {MASTER_CATEGORIES.map((c) => (
                      <option key={c.label} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
                {autoBadge && (
                  <div className="mt-2 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      You will earn:{' '}
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        [{autoBadge}]
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-track (optional) */}
              {selectedCat && selectedCat.sub.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                    Domain / Sub-track{' '}
                    <span className="text-zinc-400 dark:text-zinc-500 font-normal text-xs">(optional)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={subTrack}
                      onChange={(e) => setSubTrack(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm appearance-none"
                    >
                      <option value="">All {selectedCat.label} (general)</option>
                      {selectedCat.sub.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  Contribution Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. TCP/IP Protocol Suite & Healthcare Network Architecture"
                  className={inputCls('title')}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>
            </div>
          )}

          {/* ── STEP 2 — Knowledge Extraction ──────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              {isResourceLink ? (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                    <LinkIcon className="w-4 h-4 text-emerald-500" />
                    Resource URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://…"
                    className={`${inputCls('content')} focus:ring-emerald-500/40`}
                  />
                  {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                    <BookOpen className="w-4 h-4 text-sky-500" />
                    Contribution Body <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Brief description or excerpt..."
                    rows={10}
                    className={`${inputCls('content')} resize-none font-mono leading-relaxed`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.content
                      ? <p className="text-xs text-red-500">{errors.content}</p>
                      : <p className="text-xs italic text-sky-600 dark:text-sky-400">Template pre-loaded — replace the bracketed text with your actual research.</p>
                    }
                    <span className="text-xs text-zinc-400 ml-2 flex-shrink-0">{content.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>
              )}

              {/* Article: Publication Checklist */}
              {isArticle && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Publication Checklist
                    </p>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {CHECKLIST_RULES.map((rule) => {
                      const passed = checklistResults[rule.id];
                      return (
                        <div key={rule.id} className="flex items-start gap-3 px-3 py-2.5">
                          {passed
                            ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            : <XCircle    className="w-4 h-4 text-rose-500   flex-shrink-0 mt-0.5" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium leading-tight ${
                              passed ? 'text-zinc-700 dark:text-zinc-300' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {rule.label}
                            </p>
                            {!passed && (
                              <p className="text-[11px] text-rose-400 dark:text-rose-400/80 mt-0.5 leading-snug">
                                {rule.hint}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => { setErrors({}); setFormError(''); setStep(1); }}
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAssembleAndSubmit}
              disabled={isSubmitting || (isArticle && !allChecksPassed)}
              title={isArticle && !allChecksPassed ? 'Complete all checklist requirements to publish.' : undefined}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all text-white ${
                isArticle && !allChecksPassed
                  ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed opacity-60'
                  : 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/20 disabled:opacity-60'
              }`}
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : <><Send className="w-4 h-4" /> Claim My Badge</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

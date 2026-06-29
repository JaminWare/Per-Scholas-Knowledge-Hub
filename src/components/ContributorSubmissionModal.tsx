import { useState, useEffect, useRef } from 'react';
import {
  X, Send, Loader2, ChevronDown, Tag,
  FileText, Link2, BookOpen, Zap, GitBranch,
  AlertCircle, CheckCircle, XCircle, Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type NewSubmission, saveLocalSubmission } from '../utils/submissions';

const PROFANITY_PATTERN = new RegExp(
  ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'damn', 'piss', 'cock', 'dick', 'pussy', 'whore', 'slut', 'retard', 'nigger', 'faggot', 'kike', 'spic', 'chink', 'wetback'].join('|'),
  'i'
);

type SubmissionType = 'Article' | 'Study Tip' | 'Diagram' | 'Quick Reference' | 'Resource Link';

const SUBMISSION_TYPES = [
  { value: 'Article' as SubmissionType, label: 'Article', icon: FileText },
  { value: 'Study Tip' as SubmissionType, label: 'Study Tip', icon: BookOpen },
  { value: 'Diagram' as SubmissionType, label: 'Diagram', icon: GitBranch },
  { value: 'Quick Reference' as SubmissionType, label: 'Quick Ref', icon: Zap },
  { value: 'Resource Link' as SubmissionType, label: 'Resource Link', icon: Link2 },
];

const MASTER_CATEGORIES = [
  { label: 'Study Tips', badge: 'Core 1 Expert', sub: [
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
  { label: 'Diagrams', badge: 'Diagram Architect', sub: [
    'Diagrams — Motherboard / Hardware Blueprints',
    'Diagrams — Network Topology',
    'Diagrams — EHR / Clinical Data Flow',
    'Diagrams — Security Architecture',
  ]},
  { label: 'Quick References', badge: 'Reference Author', sub: [
    'Quick References — Port Numbers & Protocols',
    'Quick References — CLI Commands',
    'Quick References — Acronyms & Mnemonics',
    'Quick References — Subnetting Cheatsheet',
  ]},
  { label: 'Prompt Playbook', badge: 'Playbook Engineer', sub: [
    'Prompt Playbook — CompTIA PBQ Simulations',
    'Prompt Playbook — Healthcare Case Studies',
    'Prompt Playbook — EHR Troubleshooting Frameworks',
    'Prompt Playbook — Study Drill Frameworks',
  ]},
];

function getBadge(trackName: string): string {
  for (const cat of MASTER_CATEGORIES) {
    if (cat.sub.includes(trackName)) return cat.badge;
  }
  return 'Cohort Contributor';
}

const HEALTHCARE_KEYWORDS = ['patient', 'clinic', 'hospital', 'ehr', 'hipaa', 'provider', 'clinical', 'medical', 'care'];

const CHECKLIST_RULES = [
  { id: 'depth', label: '100-word minimum depth', hint: 'Add more detail — aim for at least 100 words.', test: (t: string) => t.trim().split(/\s+/).filter(Boolean).length >= 100 },
  { id: 'healthcare', label: 'Healthcare relevance (2+ keywords)', hint: 'Mention at least two healthcare terms (e.g., EHR, HIPAA, patient).', test: (t: string) => {
      const lower = t.toLowerCase();
      return HEALTHCARE_KEYWORDS.filter((kw) => lower.includes(kw)).length >= 2;
    }
  },
  { id: 'citation', label: 'Reference URL included', hint: 'Provide a valid https:// URL in the reference section.', test: (t: string) => /https?:\/\//.test(t) },
  { id: 'structure', label: 'Structured formatting', hint: 'Use bullet points (* or -) or separate paragraphs.', test: (t: string) => /(^\s*[-*] |\n\n)/m.test(t) },
];

function evaluateChecklist(text: string): Record<string, boolean> {
  return Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, r.test(text)]));
}

const CONTENT_TEMPLATES: Record<string, string> = {
  'Article': `## 🔬 Core Concept Definition\n[What is the absolute textbook definition of this topic?]\n\n## 🏥 Healthcare IT Integration & Clinical Context\n[How does this interface with clinical workstations or impact patient care?]\n\n## 🔗 Verifiable Domain Sources\n[Paste trusted reference link: https://]`,
  'Study Tip': `## 💡 Quick Study Hack\n[Explain the mnemonic or trick to remember this concept]\n\n## 🏥 Clinical Scenario\n[Give an example of how this appears in a hospital IT setting]\n\n## 🔗 Reference\n[Source link]`,
  'Diagram': `## 🗺️ Visual Framework\n[Describe the data pathway or topology]\n\n## 🏥 Clinical Workflow Mapping\n[What medical systems run across these lines?]\n\n## 🔗 Architecture Link\n[Reference link]`,
  'Quick Reference': `## ⚡ Rapid Field Matrix\n[List command flags or port numbers]\n\n## 🏥 Remediation Plan\n[Immediate fix to prevent clinical downtime]`,
};

function buildFormattedContent(authorName: string, trackValue: string, rawContent: string): string {
  return [
    `> 💡 **Community Contribution** | Research curated by **${authorName}** for track **${trackValue}**.`,
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

async function trySampleSlotOverwrite(trackValue: string, submissionId: string, formattedContent: string, onRefresh?: () => void) {
  try {
    const { data: sampleArticles } = await supabase.from('articles').select('id, title, study_category').ilike('title', '%[Sample]%').order('created_at', { ascending: true }).limit(20);
    if (!sampleArticles || sampleArticles.length === 0) return;

    const trackLower = trackValue.toLowerCase();
    const targetArticle = sampleArticles.find((a) => {
      if (!a.study_category) return false;
      const cat = (a.study_category as string).toLowerCase();
      return trackLower.includes(cat) || cat.includes(trackLower);
    }) ?? sampleArticles[0];

    if (!targetArticle) return;
    const cleanTitle = (targetArticle.title as string).replace(/^\s*\[sample\]\s*/i, '').trim();

    await supabase.from('articles').update({ title: cleanTitle, content: formattedContent, is_sample: false, is_featured: false }).eq('id', targetArticle.id);
    await supabase.from('submissions').update({ is_approved: true }).eq('id', submissionId);
    onRefresh?.();
  } catch (err) {
    console.error('[trySampleSlotOverwrite]', err);
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (s: NewSubmission) => void;
  onRefresh?: () => void;
}

export default function ContributorSubmissionModal({ isOpen, onClose, onSubmitted, onRefresh }: Props) {
  const [fullName, setFullName] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('Article');
  const [track, setTrack] = useState(MASTER_CATEGORIES[0].sub[0]);
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');

  // HARD INITIALIZATION: Cures the blank box issue instantly.
  const [content, setContent] = useState(CONTENT_TEMPLATES['Article']);
  const lastInjectedTemplate = useRef(CONTENT_TEMPLATES['Article']);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistResults, setChecklistResults] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false]))
  );

  const isResourceLink = submissionType === 'Resource Link';
  const isArticle = submissionType === 'Article';
  const autoBadge = getBadge(track);

  // Template Injection Sync
  useEffect(() => {
    if (!isOpen) return;
    if (isResourceLink) {
      if (content.trim() === lastInjectedTemplate.current.trim()) {
        setContent('');
        lastInjectedTemplate.current = '';
      }
      return;
    }
    const template = CONTENT_TEMPLATES[submissionType] || '';
    if (content.trim() === '' || content.trim() === lastInjectedTemplate.current.trim()) {
      setContent(template);
      lastInjectedTemplate.current = template;
    }
    setErrors({});
    setFormError('');
  }, [isOpen, submissionType]);

  useEffect(() => {
    if (!isArticle) return;
    setChecklistResults(evaluateChecklist(content));
  }, [content, isArticle]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  const reset = () => {
    setFullName('');
    setSubmissionType('Article');
    setTrack(MASTER_CATEGORIES[0].sub[0]);
    setTitle('');
    setContent(CONTENT_TEMPLATES['Article']);
    lastInjectedTemplate.current = CONTENT_TEMPLATES['Article'];
    setErrors({});
    setFormError('');
    setIsTrackDropdownOpen(false);
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Name or Discord handle is required.';
    if (!title.trim()) e.title = 'Contribution title is required.';
    if (isResourceLink) {
      if (!/^https?:\/\/.+/.test(content.trim())) e.content = 'Please enter a valid https:// URL.';
    } else {
      if (content.trim().length < 50) e.content = 'Please add more detail — replace the bracketed prompts with your actual research.';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (PROFANITY_PATTERN.test(title) || PROFANITY_PATTERN.test(content)) {
      setFormError('Submission contains restricted language. Please align your contribution with professional healthcare and academic standards.');
      return;
    }

    setIsSubmitting(true);
    const rawContent = content.trim();
    const formattedContent = !isResourceLink ? buildFormattedContent(fullName.trim(), track, rawContent) : null;

    try {
      const { data, error } = await supabase.from('submissions').insert({
        full_name: fullName.trim(),
        track: track,
        badge: autoBadge,
        title: title.trim(),
        content: rawContent,
        submission_type: submissionType,
        formatted_content: formattedContent,
        is_approved: false,
      }).select().single();

      if (error) throw error;
      const sub: NewSubmission = { ...(data as NewSubmission), badge: autoBadge, submission_type: submissionType };
      saveLocalSubmission(sub);

      if (!isResourceLink && formattedContent) {
        await trySampleSlotOverwrite(track, sub.id, formattedContent, onRefresh);
      }
      onSubmitted(sub);
      reset();
      onClose();
    } catch {
      const local: NewSubmission = {
        id: `local-${Date.now()}`,
        full_name: fullName.trim(),
        track: track,
        badge: autoBadge,
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
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => { reset(); onClose(); }} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Contribute to the Hub</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Share your knowledge with the cohort</p>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-start gap-2.5 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{formError}</p>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-5">

            {/* 1. Full Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">Full Name / Discord Handle</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Smith" className={inputCls('fullName')} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            {/* 2. Type */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Contribution Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SUBMISSION_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = submissionType === t.value;
                  return (
                    <button key={t.value} type="button" onClick={() => setSubmissionType(t.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                        active
                          ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-sky-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Track — Custom Scrollable Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">Curriculum Track</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTrackDropdownOpen(!isTrackDropdownOpen)}
                  className={`${inputCls('track')} flex justify-between items-center text-left`}
                >
                  <span className="truncate pr-4">{track}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform ${isTrackDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTrackDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                    {MASTER_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800/80 text-[10px] font-bold text-zinc-500 uppercase tracking-wider sticky top-0">
                          {cat.label}
                        </div>
                        {cat.sub.map((subTrack) => (
                          <button
                            key={subTrack}
                            type="button"
                            onClick={() => { setTrack(subTrack); setIsTrackDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 ${
                              track === subTrack
                                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {subTrack}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  You will earn:{' '}
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    [{autoBadge}]
                  </span>
                </span>
              </div>
            </div>

            {/* 4. Title */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">Contribution Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. TCP/IP Protocol Suite" className={inputCls('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* 5. Description / Content */}
            {isResourceLink ? (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  <LinkIcon className="w-4 h-4 text-emerald-500" /> Resource URL
                </label>
                <input type="url" value={content} onChange={(e) => setContent(e.target.value)} placeholder="https://…" className={`${inputCls('content')} focus:ring-emerald-500/40`} />
                {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  <BookOpen className="w-4 h-4 text-sky-500" /> Contribution Body
                </label>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Brief description or excerpt..."
                    rows={12}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-sky-500/50 outline-none transition-all resize-y custom-scrollbar"
                  />
                  <p className="mt-2 text-xs italic text-sky-600 dark:text-sky-400">
                    Template pre-loaded — replace the bracketed text with your actual research.
                  </p>
                </div>
                {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
              </div>
            )}

            {/* Article: Publication Checklist */}
            {isArticle && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Publication Checklist</p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {CHECKLIST_RULES.map((rule) => (
                    <div key={rule.id} className="flex items-start gap-3 px-3 py-2.5">
                      {checklistResults[rule.id]
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-tight ${checklistResults[rule.id] ? 'text-zinc-700 dark:text-zinc-300' : 'text-rose-600 dark:text-rose-400'}`}>
                          {rule.label}
                        </p>
                        {!checklistResults[rule.id] && (
                          <p className="text-[11px] text-rose-400 dark:text-rose-400/80 mt-0.5 leading-snug">{rule.hint}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <button type="button" onClick={() => { reset(); onClose(); }} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all text-zinc-900 bg-amber-400 hover:bg-amber-500 shadow-amber-500/20 disabled:opacity-60"
          >
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><Send className="w-4 h-4" /> Submit Your Contribution</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}

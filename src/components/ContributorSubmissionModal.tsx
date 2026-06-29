import { useState, useEffect, useRef } from 'react';
import {
  X, Send, Loader2, ChevronDown, Tag, Image, FileText, Link2,
  CheckCircle, XCircle,
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
const SUBMISSION_TYPES = [
  { value: 'Article',        label: 'Article',       icon: FileText, desc: 'A full research or study piece' },
  { value: 'Resource Link',  label: 'Resource Link', icon: Link2,    desc: 'A curated external link or tip' },
] as const;

type SubmissionType = typeof SUBMISSION_TYPES[number]['value'];

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

// ── Content templates (keyed by master category) ─────────────────────────────
const CONTENT_TEMPLATES: Record<string, string> = {
  'Study Tips': `## 🔬 CompTIA A+ Technical Core
- **Core Concept Definition:** [What is the absolute textbook definition of this topic/protocol? Why does CompTIA care about it?]
- **Operational Diagnostics:** [How does a technician check if this component or service is running properly? What CLI commands, tools, or physical configurations are used?]

## 🏥 Healthcare IT Integration & Clinical Context
- **EHR & Medical Device Interface:** [How does this specific technology interface with clinic workstations, hospital networks, or Electronic Health Records (EHR) environments?]
- **Provider & Patient Impact:** [Why does a healthcare provider, nurse, or clinical specialist care about this system staying online? How does a failure here delay patient care or disrupt clinical workflows?]
- **Regulatory Compliance Framework:** [What specific HIPAA security rule, administrative safeguard, or device encryption protocol applies to managing this system safely?]

## 🔗 Verifiable Domain Sources
- Trusted Reference Link: https://`,

  'Diagrams': `## 🗺️ Visual Framework & Infrastructure Flow
- **Data Pathway Directions:** [Where does traffic enter this diagram, and where does it terminate? Map the path from user desktop to back-end server storage arrays.]
- **Boundary Controls:** [Where are the firewall rules, network segmentation points, or access control parameters located along this visual track?]

## 🏥 Healthcare IT Integration & Clinical Context
- **Clinical Workflow Mapping:** [How does this precise infrastructure layout keep hospital systems running smoothly? What medical systems (e.g., PACS imaging, HL7 telemetry feeds) run across these specific connection lines?]
- **Data Protection Controls:** [How does this topology isolate private patient health data (PHI) from public networks to preserve absolute HIPAA data security compliance?]

## 🔗 Architecture References
- Blueprint Reference Link: https://`,

  'Quick References': `## ⚡ Rapid Field Reference Matrix
- **Command Flags & Key Mappings:** [What are the essential command line parameters, port values, or configuration arguments a tech needs on demand?]
- **Symptom vs Remediation Action Plan:** [If Symptom X happens, what is the immediate Step 1 and Step 2 fix to resolve it under pressure?]

## 🏥 Healthcare IT Integration & Clinical Context
- **Clinical Support Utility:** [How does having this fast reference guide protect hospital operations? How does applying this rapid fix prevent clinic device downtime or secure patient health records during an active tech support ticket?]

## 🔗 Trusted Cheat Sheet Sources
- Blueprint Reference Link: https://`,

  'Prompt Playbook': `## 🔬 CompTIA A+ Technical Core
- **Core Concept Definition:** [What is the absolute textbook definition of this topic/protocol? Why does CompTIA care about it?]
- **Operational Diagnostics:** [How does a technician check if this component or service is running properly? What CLI commands, tools, or physical configurations are used?]

## 🏥 Healthcare IT Integration & Clinical Context
- **EHR & Medical Device Interface:** [How does this specific technology interface with clinic workstations, hospital networks, or Electronic Health Records (EHR) environments?]
- **Provider & Patient Impact:** [Why does a healthcare provider, nurse, or clinical specialist care about this system staying online? How does a failure here delay patient care or disrupt clinical workflows?]
- **Regulatory Compliance Framework:** [What specific HIPAA security rule, administrative safeguard, or device encryption protocol applies to managing this system safely?]

## 🔗 Verifiable Domain Sources
- Trusted Reference Link: https://`,
};

function getBadge(masterCategory: string): string {
  return MASTER_CATEGORIES.find((c) => c.label === masterCategory)?.badge ?? 'Cohort Contributor';
}

// ── Checklist rules ───────────────────────────────────────────────────────────
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
    hint: 'Add more detail — aim for at least 100 words.',
    test: (t) => t.trim().split(/\s+/).filter(Boolean).length >= 100,
  },
  {
    id: 'healthcare',
    label: 'Healthcare relevance (2+ keywords)',
    hint: 'Mention at least two healthcare terms (e.g., EHR, HIPAA, patient).',
    test: (t) => {
      const lower = t.toLowerCase();
      return HEALTHCARE_KEYWORDS.filter((kw) => lower.includes(kw)).length >= 2;
    },
  },
  {
    id: 'citation',
    label: 'Reference URL included',
    hint: 'Paste a reference URL (must start with https://).',
    test: (t) => /https?:\/\//.test(t),
  },
  {
    id: 'structure',
    label: 'Structured formatting (bullets or paragraphs)',
    hint: 'Add bullet points (* or -) or break your text into separate paragraphs.',
    test: (t) => /(^\s*[-*] |\n\n)/m.test(t),
  },
];

function evaluateChecklist(text: string): Record<string, boolean> {
  return Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, r.test(text)]));
}

// ── Formatted content wrapper ─────────────────────────────────────────────────
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
  const [submissionType, setSubmissionType] = useState<SubmissionType>('Article');
  const [masterCat, setMasterCat]           = useState('Study Tips');
  const [subTrack, setSubTrack]             = useState('');
  const [fullName, setFullName]             = useState('');
  const [title, setTitle]                   = useState('');
  const [mediaLink, setMediaLink]           = useState('');
  const [content, setContent]               = useState('');
  const [errors, setErrors]                 = useState<Record<string, string>>({});
  const [formError, setFormError]           = useState('');
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [checklistResults, setChecklistResults] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false]))
  );

  const firstInputRef        = useRef<HTMLInputElement>(null);
  const lastInjectedTemplate = useRef('');

  const isResourceLink = submissionType === 'Resource Link';
  const isArticle      = submissionType === 'Article';
  const selectedCat    = MASTER_CATEGORIES.find((c) => c.label === masterCat);
  const autoBadge      = masterCat ? getBadge(masterCat) : null;
  const trackValue     = subTrack || masterCat;

  const allChecksPassed = isResourceLink
    ? /^https?:\/\/.+/.test(content.trim())
    : Object.values(checklistResults).every(Boolean);

  // Live checklist evaluation
  useEffect(() => {
    if (!isResourceLink) setChecklistResults(evaluateChecklist(content));
  }, [content, isResourceLink]);

  // Focus + keyboard
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => firstInputRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Clear sub-track when category changes
  useEffect(() => { setSubTrack(''); }, [masterCat]);

  // Reset content/errors when type switches
  useEffect(() => {
    setSubTrack('');
    setTitle(''); setContent(''); setErrors({}); setFormError('');
    lastInjectedTemplate.current = '';
    setChecklistResults(Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false])));
  }, [submissionType]);

  // Eager template injection — fires on open, category change, or type change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen && submissionType !== 'Resource Link' && masterCat) {
      const template = CONTENT_TEMPLATES[masterCat];
      if (template && (content.trim() === '' || content.trim() === lastInjectedTemplate.current.trim())) {
        setContent(template);
        lastInjectedTemplate.current = template;
      }
    }
  }, [isOpen, masterCat, submissionType]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Name or Discord handle is required.';
    if (!masterCat)       e.masterCat = 'Please select a master category.';
    if (!title.trim())    e.title = 'Title is required.';
    if (isResourceLink) {
      if (!/^https?:\/\/.+/.test(content.trim()))
        e.content = 'Please enter a valid https:// URL.';
    } else {
      if (content.trim().length < 20)
        e.content = 'Content must be at least 20 characters.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setSubmissionType('Article');
    setMasterCat('Study Tips');
    setSubTrack('');
    setFullName('');
    setTitle('');
    setMediaLink('');
    setContent('');
    setErrors({});
    setFormError('');
    lastInjectedTemplate.current = '';
    setChecklistResults(Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false])));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (PROFANITY_PATTERN.test(title) || PROFANITY_PATTERN.test(content)) {
      setFormError(
        'Submission contains restricted language. Please align your contribution with professional healthcare and academic standards.'
      );
      return;
    }

    if (!validate()) return;
    if (!isResourceLink && isArticle && !allChecksPassed) return;

    setIsSubmitting(true);
    const badge = getBadge(masterCat);

    const formattedContent = !isResourceLink
      ? buildFormattedContent({ authorName: fullName.trim(), masterCat, trackValue, rawContent: content.trim() })
      : null;

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
          formatted_content: formattedContent,
          is_approved: false,
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
        badge: getBadge(masterCat),
        title: title.trim(),
        content: content.trim(),
        submission_type: submissionType,
        media_link: mediaLink.trim() || undefined,
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
              <p className="text-sm text-zinc-500 mt-1">Share an article, study tip, diagram, quick reference, or resource link.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {formError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{formError}</p>
          </div>
        )}

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

          {/* Submission type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Submission Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                        ? 'border-sky-400 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master category */}
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

          {/* Sub-track — scrollable wrapper */}
          {selectedCat && selectedCat.sub.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Specific Domain / Sub-track <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <div className="relative max-h-56 overflow-y-auto">
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
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Contribution Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix Boot Camp Audio Driver on Windows 11"
              className={inputCls('title')}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Media link */}
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

          {/* Content — URL input for Resource Link, textarea for everything else */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isResourceLink ? 'Resource URL' : 'Contribution Content'}{' '}
              <span className="text-red-400">*</span>
            </label>

            {isResourceLink ? (
              <input
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://… (paste the resource URL)"
                className={inputCls('content')}
              />
            ) : (
              <>
                <textarea
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your tip, troubleshooting steps, prompt syntax, diagram description, or reference notes."
                  className={`${inputCls('content')} resize-none font-mono text-xs leading-relaxed`}
                />
                {lastInjectedTemplate.current && content.trim() !== '' && (
                  <p className="mt-1 text-[11px] text-sky-500 dark:text-sky-400 italic">
                    Template pre-loaded — replace the placeholder text with your actual content.
                  </p>
                )}
              </>
            )}

            <div className="flex items-center justify-between mt-1">
              {errors.content
                ? <p className="text-xs text-red-500">{errors.content}</p>
                : <span />}
              {!isResourceLink && (
                <span className="text-xs text-zinc-400">{content.length} chars</span>
              )}
            </div>

            {/* Publication Checklist (non-Resource Link only) */}
            {isArticle && (
              <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700/60 border-b border-zinc-200 dark:border-zinc-700">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Publication Checklist
                  </p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
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
                            passed
                              ? 'text-zinc-700 dark:text-zinc-300'
                              : 'text-rose-600 dark:text-rose-400'
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

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isResourceLink && isArticle && !allChecksPassed)}
              title={!isResourceLink && isArticle && !allChecksPassed ? 'Complete all checklist requirements to publish.' : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-lg text-white ${
                !isResourceLink && isArticle && !allChecksPassed
                  ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed opacity-60'
                  : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20 disabled:opacity-60'
              }`}
            >
              {isSubmitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
              {isSubmitting ? 'Submitting…' : 'Claim My Badge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

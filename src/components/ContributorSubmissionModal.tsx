import { useState, useEffect, useRef } from 'react';
import {
  X, Send, Loader2, ChevronDown, Tag, Image, FileText, Link2, Ticket,
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

// ── Checklist rules (Article submissions only) ────────────────────────────────
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

// ── Content field tracks ──────────────────────────────────────────────────────

interface ArticleFields {
  coreDefinition: string;
  operationalDiagnostics: string;
  clinicalWorkflowImpact: string;
  regulatoryCompliance: string;
  referenceLink: string;
}

interface DiagramFields {
  dataPathway: string;
  boundaryControls: string;
  medicalSystemIntegration: string;
  archReferenceLink: string;
}

interface QuickRefFields {
  fieldReferenceMatrix: string;
  symptomActionPlan: string;
  clinicalSupportUtility: string;
  cheatSheetLink: string;
}

function assembleArticleContent(f: ArticleFields): string {
  return [
    '## 🔬 CompTIA A+ Technical Core',
    `- **Core Concept Definition:** ${f.coreDefinition.trim()}`,
    `- **Operational Diagnostics:** ${f.operationalDiagnostics.trim()}`,
    '',
    '## 🏥 Healthcare IT Integration & Clinical Context',
    `- **Clinical Workflow Impact:** ${f.clinicalWorkflowImpact.trim()}`,
    `- **Regulatory & HIPAA Compliance:** ${f.regulatoryCompliance.trim()}`,
    '',
    '## 🔗 Verifiable Domain Sources',
    `- Trusted Reference Link: ${f.referenceLink.trim() || 'https://'}`,
  ].join('\n');
}

function assembleDiagramContent(f: DiagramFields): string {
  return [
    '## 🗺️ Visual Framework & Infrastructure Flow',
    `- **Data Pathway Directions:** ${f.dataPathway.trim()}`,
    `- **Boundary Controls:** ${f.boundaryControls.trim()}`,
    '',
    '## 🏥 Healthcare IT Integration & Clinical Context',
    `- **Medical System Integration:** ${f.medicalSystemIntegration.trim()}`,
    '',
    '## 🔗 Architecture References',
    `- Blueprint Reference Link: ${f.archReferenceLink.trim() || 'https://'}`,
  ].join('\n');
}

function assembleQuickRefContent(f: QuickRefFields): string {
  return [
    '## ⚡ Rapid Field Reference Matrix',
    `- **Command Flags & Key Mappings:** ${f.fieldReferenceMatrix.trim()}`,
    `- **Symptom vs Remediation Action Plan:** ${f.symptomActionPlan.trim()}`,
    '',
    '## 🏥 Healthcare IT Integration & Clinical Context',
    `- **Clinical Support Utility:** ${f.clinicalSupportUtility.trim()}`,
    '',
    '## 🔗 Trusted Cheat Sheet Sources',
    `- Blueprint Reference Link: ${f.cheatSheetLink.trim() || 'https://'}`,
  ].join('\n');
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
  const [submissionType, setSubmissionType] = useState<SubmissionType | ''>('Article');
  const [masterCat, setMasterCat]           = useState('Study Tips');
  const [subTrack, setSubTrack]             = useState('');
  const [ticketArea, setTicketArea]         = useState('');
  const [fullName, setFullName]             = useState('');
  const [title, setTitle]                   = useState('');
  const [mediaLink, setMediaLink]           = useState('');

  // Support ticket — keeps single textarea
  const [ticketContent, setTicketContent] = useState('');

  // Article / Study Tips / Prompt Playbook fields
  const [artCoreDef, setArtCoreDef]                   = useState('');
  const [artOpsDiag, setArtOpsDiag]                   = useState('');
  const [artClinicalImpact, setArtClinicalImpact]     = useState('');
  const [artRegulatoryComp, setArtRegulatoryComp]     = useState('');
  const [artRefLink, setArtRefLink]                   = useState('');

  // Diagram fields
  const [diagDataPathway, setDiagDataPathway]           = useState('');
  const [diagBoundaryControls, setDiagBoundaryControls] = useState('');
  const [diagMedicalInteg, setDiagMedicalInteg]         = useState('');
  const [diagArchLink, setDiagArchLink]                 = useState('');

  // Quick Reference fields
  const [qrFieldMatrix, setQrFieldMatrix]             = useState('');
  const [qrSymptomPlan, setQrSymptomPlan]             = useState('');
  const [qrClinicalUtil, setQrClinicalUtil]           = useState('');
  const [qrCheatLink, setQrCheatLink]                 = useState('');

  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [formError, setFormError]     = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistResults, setChecklistResults] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false]))
  );

  const firstInputRef = useRef<HTMLInputElement>(null);

  const isTicket  = submissionType === 'Support Ticket';
  const isArticle = submissionType === 'Article';
  const isDiagram = masterCat === 'Diagrams';
  const isQuickRef = masterCat === 'Quick References';
  const isArticleTrack = isArticle && !isDiagram && !isQuickRef;

  const selectedCat = MASTER_CATEGORIES.find((c) => c.label === masterCat);
  const autoBadge   = masterCat && !isTicket ? getBadge(masterCat) : null;
  const trackValue  = isTicket
    ? (ticketArea || 'Support Ticket — General')
    : (subTrack || masterCat);

  // Build the assembled content string based on active track
  function getAssembledContent(): string {
    if (isTicket) return ticketContent;
    if (isDiagram) return assembleDiagramContent({
      dataPathway: diagDataPathway,
      boundaryControls: diagBoundaryControls,
      medicalSystemIntegration: diagMedicalInteg,
      archReferenceLink: diagArchLink,
    });
    if (isQuickRef) return assembleQuickRefContent({
      fieldReferenceMatrix: qrFieldMatrix,
      symptomActionPlan: qrSymptomPlan,
      clinicalSupportUtility: qrClinicalUtil,
      cheatSheetLink: qrCheatLink,
    });
    // Article / Study Tips / Prompt Playbook
    return assembleArticleContent({
      coreDefinition: artCoreDef,
      operationalDiagnostics: artOpsDiag,
      clinicalWorkflowImpact: artClinicalImpact,
      regulatoryCompliance: artRegulatoryComp,
      referenceLink: artRefLink,
    });
  }

  const assembledContent = getAssembledContent();

  const allChecksPassed = isArticle
    ? Object.values(checklistResults).every(Boolean)
    : true;

  // Live checklist evaluation
  useEffect(() => {
    if (isArticle) setChecklistResults(evaluateChecklist(assembledContent));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isArticle,
    artCoreDef, artOpsDiag, artClinicalImpact, artRegulatoryComp, artRefLink,
    diagDataPathway, diagBoundaryControls, diagMedicalInteg, diagArchLink,
    qrFieldMatrix, qrSymptomPlan, qrClinicalUtil, qrCheatLink,
  ]);

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
    setTitle(''); setErrors({}); setFormError('');
    setChecklistResults(Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false])));
  }, [submissionType]);

  const resetContentFields = () => {
    setTicketContent('');
    setArtCoreDef(''); setArtOpsDiag(''); setArtClinicalImpact('');
    setArtRegulatoryComp(''); setArtRefLink('');
    setDiagDataPathway(''); setDiagBoundaryControls('');
    setDiagMedicalInteg(''); setDiagArchLink('');
    setQrFieldMatrix(''); setQrSymptomPlan('');
    setQrClinicalUtil(''); setQrCheatLink('');
  };

  const reset = () => {
    setSubmissionType(''); setFullName(''); setMasterCat(''); setSubTrack('');
    setTicketArea(''); setTitle(''); setMediaLink('');
    resetContentFields();
    setErrors({}); setFormError('');
    setChecklistResults(Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, false])));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim())         e.fullName = 'Name or Discord handle is required.';
    if (!submissionType)          e.submissionType = 'Please choose a submission type.';
    if (!isTicket && !masterCat)  e.masterCat = 'Please select a master category.';
    if (!title.trim())            e.title = isTicket ? 'Issue summary is required.' : 'Title is required.';

    if (isTicket) {
      if (ticketContent.trim().length < 20)
        e.ticketContent = 'Problem description must be at least 20 characters.';
    } else if (isDiagram) {
      if (!diagDataPathway.trim())       e.diagDataPathway = 'This field is required.';
      if (!diagBoundaryControls.trim())  e.diagBoundaryControls = 'This field is required.';
      if (!diagMedicalInteg.trim())      e.diagMedicalInteg = 'This field is required.';
      if (diagArchLink.trim() && !diagArchLink.trim().startsWith('https://'))
        e.diagArchLink = 'URL must start with https://';
    } else if (isQuickRef) {
      if (!qrFieldMatrix.trim())   e.qrFieldMatrix = 'This field is required.';
      if (!qrSymptomPlan.trim())   e.qrSymptomPlan = 'This field is required.';
      if (!qrClinicalUtil.trim())  e.qrClinicalUtil = 'This field is required.';
      if (qrCheatLink.trim() && !qrCheatLink.trim().startsWith('https://'))
        e.qrCheatLink = 'URL must start with https://';
    } else {
      if (!artCoreDef.trim())         e.artCoreDef = 'This field is required.';
      if (!artOpsDiag.trim())         e.artOpsDiag = 'This field is required.';
      if (!artClinicalImpact.trim())  e.artClinicalImpact = 'This field is required.';
      if (!artRegulatoryComp.trim())  e.artRegulatoryComp = 'This field is required.';
      if (artRefLink.trim() && !artRefLink.trim().startsWith('https://'))
        e.artRefLink = 'URL must start with https://';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const assembled = getAssembledContent();

    if (assembled.trim().length < 20) {
      setFormError("Please fill in the required fields to support the cohort's studies.");
      return;
    }

    if (PROFANITY_PATTERN.test(title) || PROFANITY_PATTERN.test(assembled)) {
      setFormError(
        'Submission contains restricted language. Please align your contribution with professional healthcare and academic standards.'
      );
      return;
    }

    if (!validate()) return;
    if (isArticle && !allChecksPassed) return;

    setIsSubmitting(true);
    const badge = isTicket ? 'Cohort Contributor' : getBadge(masterCat);

    const formattedContent = isArticle
      ? buildFormattedContent({ authorName: fullName.trim(), masterCat, trackValue, rawContent: assembled })
      : null;

    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          full_name: fullName.trim(),
          track: trackValue,
          badge,
          title: title.trim(),
          content: assembled,
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

      if (isArticle && formattedContent) {
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
        badge: isTicket ? 'Cohort Contributor' : getBadge(masterCat),
        title: title.trim(),
        content: assembled,
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

  const fieldLabel = (text: string, required = true) => (
    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
      {text} {required && <span className="text-red-400">*</span>}
    </label>
  );

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p> : null;

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

        {formError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Full name */}
          <div>
            {fieldLabel('Full Name / Discord Handle')}
            <input
              ref={firstInputRef}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Smith or @jsmith_rtt23"
              className={inputCls('fullName')}
            />
            {fieldError('fullName')}
          </div>

          {/* Submission type */}
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
            {fieldError('submissionType')}
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
              {fieldLabel('Problem Area', false)}
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

          {/* Master category */}
          {!isTicket && submissionType && (
            <div>
              {fieldLabel('Master Category')}
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
              {fieldError('masterCat')}
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
              {fieldLabel('Specific Domain / Sub-track', false)}
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
              {fieldLabel(isTicket ? 'Issue Summary' : 'Contribution / Article Title')}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isTicket
                  ? 'e.g. Broken link on Networking section page'
                  : 'e.g. Fix Boot Camp Audio Driver on Windows 11'}
                className={inputCls('title')}
              />
              {fieldError('title')}
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

          {/* ── Structured content fields ──────────────────────────────────── */}

          {/* TICKET — single textarea */}
          {isTicket && (
            <div>
              {fieldLabel('Problem Description')}
              <textarea
                rows={6}
                value={ticketContent}
                onChange={(e) => setTicketContent(e.target.value)}
                placeholder="Describe the problem in detail. Include steps to reproduce, what you expected, and what actually happened."
                className={`${inputCls('ticketContent')} resize-none`}
              />
              {fieldError('ticketContent')}
            </div>
          )}

          {/* ARTICLE / STUDY TIPS / PROMPT PLAYBOOK */}
          {!isTicket && submissionType && !isDiagram && !isQuickRef && masterCat && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Research Fields</span>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>

              <div>
                {fieldLabel('Textbook definition of this topic/protocol')}
                <textarea
                  rows={3}
                  value={artCoreDef}
                  onChange={(e) => setArtCoreDef(e.target.value)}
                  placeholder="What is the absolute textbook definition of this topic? Why does CompTIA care about it?"
                  className={`${inputCls('artCoreDef')} resize-none`}
                />
                {fieldError('artCoreDef')}
              </div>

              <div>
                {fieldLabel('CLI commands, diagnostic checks, or configurations used')}
                <textarea
                  rows={3}
                  value={artOpsDiag}
                  onChange={(e) => setArtOpsDiag(e.target.value)}
                  placeholder="How does a technician verify this component or service is running properly? What commands or tools are used?"
                  className={`${inputCls('artOpsDiag')} resize-none`}
                />
                {fieldError('artOpsDiag')}
              </div>

              <div>
                {fieldLabel('How a failure here delays patient care or disrupts healthcare providers')}
                <textarea
                  rows={3}
                  value={artClinicalImpact}
                  onChange={(e) => setArtClinicalImpact(e.target.value)}
                  placeholder="Why does a healthcare provider, nurse, or clinical specialist care about this system staying online?"
                  className={`${inputCls('artClinicalImpact')} resize-none`}
                />
                {fieldError('artClinicalImpact')}
              </div>

              <div>
                {fieldLabel('Specific HIPAA security rule or device encryption protocol that applies')}
                <textarea
                  rows={3}
                  value={artRegulatoryComp}
                  onChange={(e) => setArtRegulatoryComp(e.target.value)}
                  placeholder="What administrative safeguard, EHR interface rule, or HIPAA compliance framework applies to this system?"
                  className={`${inputCls('artRegulatoryComp')} resize-none`}
                />
                {fieldError('artRegulatoryComp')}
              </div>

              <div>
                {fieldLabel('Trusted resource URL (must start with https://)', false)}
                <input
                  type="url"
                  value={artRefLink}
                  onChange={(e) => setArtRefLink(e.target.value)}
                  placeholder="https://"
                  className={inputCls('artRefLink')}
                />
                {fieldError('artRefLink')}
              </div>
            </div>
          )}

          {/* DIAGRAM */}
          {!isTicket && submissionType && isDiagram && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Architecture Fields</span>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>

              <div>
                {fieldLabel('Traffic direction flow from user workstation to back-end server storage')}
                <textarea
                  rows={3}
                  value={diagDataPathway}
                  onChange={(e) => setDiagDataPathway(e.target.value)}
                  placeholder="Where does traffic enter this diagram, and where does it terminate? Map the full data path."
                  className={`${inputCls('diagDataPathway')} resize-none`}
                />
                {fieldError('diagDataPathway')}
              </div>

              <div>
                {fieldLabel('Where firewall rules or access controls sit along this visual track')}
                <textarea
                  rows={3}
                  value={diagBoundaryControls}
                  onChange={(e) => setDiagBoundaryControls(e.target.value)}
                  placeholder="Where are the firewall rules, segmentation points, or access control parameters in this diagram?"
                  className={`${inputCls('diagBoundaryControls')} resize-none`}
                />
                {fieldError('diagBoundaryControls')}
              </div>

              <div>
                {fieldLabel('Clinical workflows (e.g., PACS imaging, HL7 data) running across this link')}
                <textarea
                  rows={3}
                  value={diagMedicalInteg}
                  onChange={(e) => setDiagMedicalInteg(e.target.value)}
                  placeholder="How does this layout keep hospital systems running? What medical systems run across these connection lines?"
                  className={`${inputCls('diagMedicalInteg')} resize-none`}
                />
                {fieldError('diagMedicalInteg')}
              </div>

              <div>
                {fieldLabel('Topology source URL (must start with https://)', false)}
                <input
                  type="url"
                  value={diagArchLink}
                  onChange={(e) => setDiagArchLink(e.target.value)}
                  placeholder="https://"
                  className={inputCls('diagArchLink')}
                />
                {fieldError('diagArchLink')}
              </div>
            </div>
          )}

          {/* QUICK REFERENCE */}
          {!isTicket && submissionType && isQuickRef && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Reference Fields</span>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              </div>

              <div>
                {fieldLabel('Essential command-line flags, ports, or rapid configuration key mappings')}
                <textarea
                  rows={3}
                  value={qrFieldMatrix}
                  onChange={(e) => setQrFieldMatrix(e.target.value)}
                  placeholder="What command line parameters, port values, or configuration arguments does a tech need on demand?"
                  className={`${inputCls('qrFieldMatrix')} resize-none`}
                />
                {fieldError('qrFieldMatrix')}
              </div>

              <div>
                {fieldLabel('Immediate Step 1 and Step 2 fix to resolve this issue under pressure')}
                <textarea
                  rows={3}
                  value={qrSymptomPlan}
                  onChange={(e) => setQrSymptomPlan(e.target.value)}
                  placeholder="If Symptom X happens, what is the immediate Step 1 and Step 2 fix?"
                  className={`${inputCls('qrSymptomPlan')} resize-none`}
                />
                {fieldError('qrSymptomPlan')}
              </div>

              <div>
                {fieldLabel('How this fast fix prevents hospital device downtime or safeguards health records')}
                <textarea
                  rows={3}
                  value={qrClinicalUtil}
                  onChange={(e) => setQrClinicalUtil(e.target.value)}
                  placeholder="How does having this fast reference guide protect hospital operations and patient health records?"
                  className={`${inputCls('qrClinicalUtil')} resize-none`}
                />
                {fieldError('qrClinicalUtil')}
              </div>

              <div>
                {fieldLabel('Authoritative reference URL (must start with https://)', false)}
                <input
                  type="url"
                  value={qrCheatLink}
                  onChange={(e) => setQrCheatLink(e.target.value)}
                  placeholder="https://"
                  className={inputCls('qrCheatLink')}
                />
                {fieldError('qrCheatLink')}
              </div>
            </div>
          )}

          {/* Publication Checklist (Article track only) */}
          {isArticle && !isTicket && masterCat && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
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

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isArticle && !allChecksPassed)}
              title={isArticle && !allChecksPassed ? 'Complete all checklist requirements to publish.' : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-lg text-white ${
                isArticle && !allChecksPassed
                  ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed opacity-60'
                  : isTicket
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 disabled:opacity-60'
                    : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20 disabled:opacity-60'
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

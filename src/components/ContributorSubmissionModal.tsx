import { useState, useEffect, useRef } from 'react';
import {
  X, Send, Loader2, ChevronDown, Tag,
  FileText, Link2, BookOpen, Zap, GitBranch,
  AlertCircle, CheckCircle, XCircle, Link as LinkIcon,
  ChevronUp, Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type NewSubmission, saveLocalSubmission } from '../utils/submissions';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------
type SubmissionType = 'Article' | 'Study Tip' | 'Diagram' | 'Quick Reference' | 'Resource Link';

interface SectionConfig {
  id: string;
  heading: string;
  icon: string;
  coachLine: string;
  placeholder: string;
  minWords: number;
}

const PROFANITY_PATTERN = new RegExp(
  ['fuck','shit','bitch','asshole','bastard','cunt','damn','piss','cock','dick','pussy','whore','slut','retard','nigger','faggot','kike','spic','chink','wetback'].join('|'),
  'i'
);

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

// ---------------------------------------------------------------------------
// Guided Slots per Type
// ---------------------------------------------------------------------------
const SECTION_CONFIGS: Record<Exclude<SubmissionType, 'Resource Link'>, SectionConfig[]> = {
  'Article': [
    { id: 'concept', heading: 'Core Concept Definition', icon: '\u{1F52C}', coachLine: 'What is the absolute textbook definition of this topic?', placeholder: 'e.g. TCP/IP is a suite of communication protocols...', minWords: 20 },
    { id: 'diagnostics', heading: 'Operational Diagnostics', icon: '\u{2699}\u{FE0F}', coachLine: 'What CLI commands, tools, or configurations are used to check this?', placeholder: 'e.g. Using the ping or tracert command allows a technician to...', minWords: 15 },
    { id: 'healthcare', heading: 'Healthcare IT Integration', icon: '\u{1F3E5}', coachLine: 'How does this interface with clinical workstations or impact patient care?', placeholder: 'e.g. If this system fails, the EHR terminal cannot reach the database, delaying patient care...', minWords: 20 },
    { id: 'sources', heading: 'Verifiable Domain Sources', icon: '\u{1F517}', coachLine: 'Paste a trusted reference link.', placeholder: 'https://...', minWords: 0 },
  ],
  'Study Tip': [
    { id: 'hack', heading: 'Quick Study Hack', icon: '\u{1F4A1}', coachLine: 'Share the mnemonic or trick to remember this concept.', placeholder: 'e.g. For the OSI model, remember "Please Do Not Throw Sausage Pizza Away"...', minWords: 15 },
    { id: 'scenario', heading: 'Clinical Scenario', icon: '\u{1F3E5}', coachLine: 'Give a realistic hospital IT scenario where knowing this tip saves time.', placeholder: 'e.g. A nurse reports the EHR is down. Using this trick you quickly isolate...', minWords: 15 },
    { id: 'reference', heading: 'Reference', icon: '\u{1F517}', coachLine: 'Link to the study guide page or article.', placeholder: 'https://...', minWords: 0 },
  ],
  'Diagram': [
    { id: 'framework', heading: 'Visual Framework', icon: '\u{1F5FA}\u{FE0F}', coachLine: 'Describe the topology or data pathway.', placeholder: 'e.g. Client workstation \u2192 hospital switch \u2192 firewall \u2192 application server...', minWords: 20 },
    { id: 'clinical', heading: 'Clinical Workflow Mapping', icon: '\u{1F3E5}', coachLine: 'What medical systems run across these connection lines?', placeholder: 'e.g. The application server hosts the EHR. If the firewall goes down...', minWords: 20 },
    { id: 'arch-link', heading: 'Architecture Reference', icon: '\u{1F517}', coachLine: 'Provide a URL to the diagram source.', placeholder: 'https://...', minWords: 0 },
  ],
  'Quick Reference': [
    { id: 'matrix', heading: 'Rapid Field Matrix', icon: '\u{26A1}', coachLine: 'List command flags or port numbers.', placeholder: '- Port 22 \u2192 SSH\n- Port 443 \u2192 HTTPS...', minWords: 10 },
    { id: 'remediation', heading: 'Remediation Plan', icon: '\u{1F3E5}', coachLine: 'Immediate fix to prevent clinical downtime.', placeholder: '1. Verify port 443 is not blocked by the firewall.\n2. Check the vendor ruleset...', minWords: 10 },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getBadge(trackName: string): string {
  for (const cat of MASTER_CATEGORIES) {
    if (cat.sub.includes(trackName)) return cat.badge;
  }
  return 'Cohort Contributor';
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type SectionStatus = 'empty' | 'draft' | 'done';

function sectionStatus(text: string, minWords: number): SectionStatus {
  const wc = wordCount(text);
  if (wc === 0) return 'empty';
  if (minWords > 0 && wc < minWords) return 'draft';
  return 'done';
}

const STATUS_STYLES: Record<SectionStatus, string> = {
  empty: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500',
  draft: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  done:  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};
const STATUS_LABELS: Record<SectionStatus, string> = { empty: 'Empty', draft: 'In Progress', done: 'Done' };

function assembleContent(sections: SectionConfig[], values: Record<string, string>): string {
  return sections.map((s) => `## ${s.icon} ${s.heading}\n${(values[s.id] || '').trim()}`).join('\n\n');
}

function buildFormattedContent(authorName: string, trackValue: string, rawContent: string): string {
  return [
    `> \u{1F4A1} **Community Contribution** | Research curated by **${authorName}** for track **${trackValue}**.`,
    '',
    '## Executive Overview & Core Concepts',
    '',
    rawContent.trim(),
    '',
    '## Healthcare IT Professional Relevance',
    '',
    'This research directly supports professionals working within healthcare IT environments. The concepts covered relate to real-world clinical and administrative workflows \u2014 from EHR system configurations to HIPAA-compliant security postures.',
    '',
    '### References & Authoritative Sources',
    '',
    '- *(Add your APA, MLA, or direct URL citations below.)*',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Guided Section Sub-component
// ---------------------------------------------------------------------------
function GuidedSection({ section, value, onChange, sectionIndex, totalSections }: { section: SectionConfig; value: string; onChange: (val: string) => void; sectionIndex: number; totalSections: number; }) {
  const [isOpen, setIsOpen] = useState(true);
  const status = sectionStatus(value, section.minWords);
  const wc = wordCount(value);

  return (
    <div className={`rounded-xl border transition-all ${status === 'done' ? 'border-emerald-200 dark:border-emerald-500/25' : status === 'draft' ? 'border-amber-200 dark:border-amber-500/25' : 'border-zinc-200 dark:border-zinc-800'}`}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-xl">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold flex items-center justify-center">{sectionIndex + 1}</span>
        <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{section.icon} {section.heading}</span>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">{section.coachLine}</p>
          <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={section.placeholder} rows={section.id === 'sources' || section.id === 'reference' ? 2 : 4} className="w-full bg-white dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-sky-500/40 outline-none transition-all resize-y custom-scrollbar" />
          {section.minWords > 0 && status !== 'done' && (
            <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">{wc === 0 ? `Aim for at least ${section.minWords} words.` : `${wc} / ${section.minWords} words minimum.`}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Modal Component
// ---------------------------------------------------------------------------
export default function ContributorSubmissionModal({ isOpen, onClose, onSubmitted, onRefresh }: { isOpen: boolean; onClose: () => void; onSubmitted: (s: NewSubmission) => void; onRefresh?: () => void; }) {
  const [fullName, setFullName] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('Article');
  const [track, setTrack] = useState(MASTER_CATEGORIES[0].sub[0]);
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sectionValues, setSectionValues] = useState<Record<string, string>>({});
  const [resourceUrl, setResourceUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isResourceLink = submissionType === 'Resource Link';
  const autoBadge = getBadge(track);
  const currentSections = isResourceLink ? [] : SECTION_CONFIGS[submissionType as Exclude<SubmissionType, 'Resource Link'>];

  useEffect(() => {
    if (!isOpen) return;
    setSectionValues({});
    setErrors({});
  }, [isOpen, submissionType]);

  const reset = () => {
    setFullName('');
    setSubmissionType('Article');
    setTrack(MASTER_CATEGORIES[0].sub[0]);
    setTitle('');
    setSectionValues({});
    setResourceUrl('');
    setErrors({});
    setIsTrackDropdownOpen(false);
  };

  const assembledContent = isResourceLink ? resourceUrl.trim() : assembleContent(currentSections, sectionValues);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Required.';
    if (!title.trim()) e.title = 'Required.';
    if (isResourceLink) {
      if (!/^https?:\/\/.+/.test(resourceUrl.trim())) e.content = 'Valid URL required.';
    } else {
      if (assembledContent.trim().length < 20) e.content = 'Please fill in the sections.';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsSubmitting(true);
    const rawContent = assembledContent;
    const formattedContent = !isResourceLink ? buildFormattedContent(fullName.trim(), track, rawContent) : null;

    try {
      const { data, error } = await supabase.from('submissions').insert({
        full_name: fullName.trim(), track, badge: autoBadge, title: title.trim(), content: rawContent, submission_type: submissionType, formatted_content: formattedContent, is_approved: false,
      }).select().single();

      if (error) throw error;
      const sub: NewSubmission = { ...(data as NewSubmission), badge: autoBadge, submission_type: submissionType };
      saveLocalSubmission(sub);
      onSubmitted(sub);
      reset();
      onClose();
    } catch {
      const local: NewSubmission = {
        id: `local-${Date.now()}`, full_name: fullName.trim(), track, badge: autoBadge, title: title.trim(), content: rawContent, submission_type: submissionType, created_at: new Date().toISOString(),
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
  const inputCls = (field: string) => `w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border text-sm transition-all ${errors[field] ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-800'}`;

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
          <button onClick={() => { reset(); onClose(); }} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-5">

            {/* 1. Name */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">Full Name / Discord Handle</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Smith" className={inputCls('fullName')} />
            </div>

            {/* 2. Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">Contribution Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SUBMISSION_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setSubmissionType(t.value)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${submissionType === t.value ? 'bg-sky-500 border-sky-500 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
                    <t.icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Scrollable Accordion Dropdown */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">Curriculum Track</label>
              <div className="relative">
                <button type="button" onClick={() => setIsTrackDropdownOpen(!isTrackDropdownOpen)} className={`${inputCls('track')} flex justify-between items-center text-left`}>
                  <span className="truncate pr-4">{track}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform ${isTrackDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTrackDropdownOpen && (
                  <div className="w-full mt-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-inner max-h-56 overflow-y-auto custom-scrollbar">
                    {MASTER_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800/80 text-[10px] font-bold text-zinc-500 uppercase tracking-wider sticky top-0">{cat.label}</div>
                        {cat.sub.map((subTrack) => (
                          <button key={subTrack} type="button" onClick={() => { setTrack(subTrack); setIsTrackDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-zinc-100 ${track === subTrack ? 'bg-sky-50 text-sky-600 font-medium' : 'hover:bg-zinc-100 text-zinc-700'}`}>
                            {subTrack}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Title */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">Contribution Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. TCP/IP Protocol Suite" className={inputCls('title')} />
            </div>

            {/* 5. Guided Slots */}
            {isResourceLink ? (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-1.5"><LinkIcon className="w-4 h-4 text-emerald-500" /> Resource URL</label>
                <input type="url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://\u2026" className={inputCls('content')} />
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3"><BookOpen className="w-4 h-4 text-sky-500" /> Contribution Body</label>
                <div className="space-y-3">
                  {currentSections.map((section, idx) => (
                    <GuidedSection key={section.id} section={section} value={sectionValues[section.id] || ''} onChange={(val) => setSectionValues((prev) => ({ ...prev, [section.id]: val }))} sectionIndex={idx} totalSections={currentSections.length} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <button type="button" onClick={() => { reset(); onClose(); }} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all text-zinc-900 bg-amber-400 hover:bg-amber-500 shadow-amber-500/20 disabled:opacity-60">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting&hellip;</> : <><Send className="w-4 h-4" /> Submit Your Contribution</>}
          </button>
        </div>

      </div>
    </div>
  );
}

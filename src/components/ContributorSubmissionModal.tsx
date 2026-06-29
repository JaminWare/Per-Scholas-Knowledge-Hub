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
// Types
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
// Guided section configs per submission type
// ---------------------------------------------------------------------------

const SECTION_CONFIGS: Record<Exclude<SubmissionType, 'Resource Link'>, SectionConfig[]> = {
  'Article': [
    {
      id: 'concept',
      heading: 'Core Concept Definition',
      icon: '🔬',
      coachLine: 'Give the textbook-accurate definition of this topic in your own words. What is it, what does it do, and why does it exist?',
      placeholder: 'e.g. TCP/IP is a suite of communication protocols used to interconnect network devices on the internet. TCP manages data transmission reliability while IP handles addressing and routing…',
      minWords: 30,
    },
    {
      id: 'healthcare',
      heading: 'Healthcare IT Integration & Clinical Context',
      icon: '🏥',
      coachLine: 'Explain how this topic shows up in a real hospital or clinic. Connect it to EHRs, HIPAA, patient care, or provider workflows.',
      placeholder: 'e.g. In a clinical environment, TCP/IP underpins the communication between EHR terminals and hospital servers. Any misconfiguration can delay patient record retrieval and violate HIPAA uptime SLAs…',
      minWords: 30,
    },
    {
      id: 'sources',
      heading: 'Verifiable Domain Sources',
      icon: '🔗',
      coachLine: 'Paste at least one trusted reference URL (CompTIA, HHS, NIST, vendor docs, or peer-reviewed sources). Direct links only.',
      placeholder: 'https://www.comptia.org/certifications/a\nhttps://www.hhs.gov/hipaa/…',
      minWords: 0,
    },
  ],
  'Study Tip': [
    {
      id: 'hack',
      heading: 'Quick Study Hack',
      icon: '💡',
      coachLine: 'Share the mnemonic, pattern, or shortcut that makes this concept stick. Write it so a total beginner could repeat it tomorrow.',
      placeholder: 'e.g. For the OSI model, remember "Please Do Not Throw Sausage Pizza Away" — Physical, Data, Network, Transport, Session, Presentation, Application…',
      minWords: 20,
    },
    {
      id: 'scenario',
      heading: 'Clinical Scenario',
      icon: '🏥',
      coachLine: 'Describe a realistic hospital IT scenario where knowing this tip would save time or prevent an incident.',
      placeholder: 'e.g. A nurse reports the EHR is "not working." Using this mnemonic you quickly isolate the issue to Layer 3 (IP addressing) rather than wasting time checking the physical cable…',
      minWords: 20,
    },
    {
      id: 'reference',
      heading: 'Reference',
      icon: '🔗',
      coachLine: 'Link to the official study guide page, video, or article that backs up this tip.',
      placeholder: 'https://…',
      minWords: 0,
    },
  ],
  'Diagram': [
    {
      id: 'framework',
      heading: 'Visual Framework Description',
      icon: '🗺️',
      coachLine: 'Describe the topology, data pathway, or architecture you are diagramming. List every node and the direction data flows between them.',
      placeholder: 'e.g. Client workstation → hospital LAN switch → firewall → application server → SQL database. Data flows bidirectionally over TCP/443 (TLS)…',
      minWords: 25,
    },
    {
      id: 'clinical-map',
      heading: 'Clinical Workflow Mapping',
      icon: '🏥',
      coachLine: 'Identify which medical systems, departments, or patient touchpoints live at each node. What breaks if one link fails?',
      placeholder: 'e.g. The application server hosts the EHR. If the firewall goes down, nursing stations lose access to patient medication records and must fall back to paper…',
      minWords: 25,
    },
    {
      id: 'arch-link',
      heading: 'Architecture Reference',
      icon: '🔗',
      coachLine: 'Provide a URL to a diagram, spec sheet, or architecture guide that supports your layout.',
      placeholder: 'https://…',
      minWords: 0,
    },
  ],
  'Quick Reference': [
    {
      id: 'matrix',
      heading: 'Rapid Field Matrix',
      icon: '⚡',
      coachLine: 'List every command, flag, port number, or acronym in a scannable format. Use bullet points or a simple table.',
      placeholder: '- Port 22 → SSH (Secure Shell)\n- Port 443 → HTTPS (TLS-encrypted web)\n- Port 3389 → RDP (Remote Desktop Protocol)…',
      minWords: 15,
    },
    {
      id: 'remediation',
      heading: 'Clinical Remediation Plan',
      icon: '🏥',
      coachLine: 'Give the 2-3 step immediate fix a healthcare IT tech would execute on-site to prevent clinical downtime.',
      placeholder: '1. Verify port 443 is not blocked by the hospital firewall ruleset.\n2. Check the EHR vendor\'s required port list against the current ACL.\n3. Escalate to the network team if the port remains closed after 15 minutes…',
      minWords: 15,
    },
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
const STATUS_LABELS: Record<SectionStatus, string> = {
  empty: 'Empty',
  draft: 'In Progress',
  done:  'Done',
};

const HEALTHCARE_KEYWORDS = ['patient','clinic','hospital','ehr','hipaa','provider','clinical','medical','care'];

const CHECKLIST_RULES = [
  { id: 'depth',      label: '100-word minimum depth',        test: (t: string) => wordCount(t) >= 100 },
  { id: 'healthcare', label: 'Healthcare relevance (2+ terms)', test: (t: string) => HEALTHCARE_KEYWORDS.filter((kw) => t.toLowerCase().includes(kw)).length >= 2 },
  { id: 'citation',   label: 'Reference URL included',         test: (t: string) => /https?:\/\//.test(t) },
  { id: 'structure',  label: 'Structured formatting',          test: (t: string) => /(^\s*[-*] |\n\n)/m.test(t) },
];

function assembleContent(sections: SectionConfig[], values: Record<string, string>): string {
  return sections
    .map((s) => `## ${s.icon} ${s.heading}\n${(values[s.id] || '').trim()}`)
    .join('\n\n');
}

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

async function trySampleSlotOverwrite(
  trackValue: string,
  submissionId: string,
  formattedContent: string,
  onRefresh?: () => void,
) {
  try {
    const { data: sampleArticles } = await supabase
      .from('articles')
      .select('id, title, study_category')
      .ilike('title', '%[Sample]%')
      .order('created_at', { ascending: true })
      .limit(20);

    if (!sampleArticles || sampleArticles.length === 0) return;

    const trackLower = trackValue.toLowerCase();
    const targetArticle =
      sampleArticles.find((a) => {
        if (!a.study_category) return false;
        const cat = (a.study_category as string).toLowerCase();
        return trackLower.includes(cat) || cat.includes(trackLower);
      }) ?? sampleArticles[0];

    if (!targetArticle) return;
    const cleanTitle = (targetArticle.title as string).replace(/^\s*\[sample\]\s*/i, '').trim();

    await supabase
      .from('articles')
      .update({ title: cleanTitle, content: formattedContent, is_sample: false, is_featured: false })
      .eq('id', targetArticle.id);
    await supabase.from('submissions').update({ is_approved: true }).eq('id', submissionId);
    onRefresh?.();
  } catch (err) {
    console.error('[trySampleSlotOverwrite]', err);
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface GuidedSectionProps {
  section: SectionConfig;
  value: string;
  onChange: (val: string) => void;
  sectionIndex: number;
  totalSections: number;
}

function GuidedSection({ section, value, onChange, sectionIndex, totalSections }: GuidedSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showTip, setShowTip] = useState(false);
  const status = sectionStatus(value, section.minWords);
  const wc = wordCount(value);

  return (
    <div className={`rounded-xl border transition-all ${
      status === 'done'
        ? 'border-emerald-200 dark:border-emerald-500/25'
        : status === 'draft'
        ? 'border-amber-200 dark:border-amber-500/25'
        : 'border-zinc-200 dark:border-zinc-800'
    }`}>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-xl"
      >
        {/* Step badge */}
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold flex items-center justify-center">
          {sectionIndex + 1}
        </span>

        {/* Emoji + heading */}
        <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
          {section.icon} {section.heading}
        </span>

        {/* Status badge */}
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>

        {/* Word count */}
        {wc > 0 && (
          <span className="flex-shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block">
            {wc}w
          </span>
        )}

        {/* Section progress: last section gets no separator line hint */}
        <span className="flex-shrink-0 text-[10px] text-zinc-300 dark:text-zinc-600 hidden sm:block">
          {sectionIndex + 1}/{totalSections}
        </span>

        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        )}
      </button>

      {/* Section body */}
      {isOpen && (
        <div className="px-4 pb-4">
          {/* Coach line */}
          <div className="flex items-start gap-2 mb-2">
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
              {section.coachLine}
            </p>
            <button
              type="button"
              onClick={() => setShowTip(!showTip)}
              className="flex-shrink-0 mt-0.5 text-sky-400 hover:text-sky-500 transition-colors"
              title="Writing tips"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expandable tip */}
          {showTip && (
            <div className="mb-3 px-3 py-2.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/25">
              <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400 mb-1 uppercase tracking-wide">Writing Tips</p>
              <ul className="text-[11px] text-sky-700 dark:text-sky-300 space-y-1 list-disc list-inside leading-relaxed">
                {section.id === 'concept' && <>
                  <li>Define the term, then explain the mechanism (how it works)</li>
                  <li>Avoid copy-pasting — paraphrase in your own words</li>
                  <li>Aim for 2-4 clear sentences minimum</li>
                </>}
                {section.id === 'healthcare' && <>
                  <li>Name a specific clinical system (Epic, Cerner, Meditech)</li>
                  <li>Mention at least one HIPAA-related risk if a misconfiguration occurs</li>
                  <li>Think: what does a day-1 healthcare IT tech need to know on the floor?</li>
                </>}
                {(section.id === 'sources' || section.id === 'reference' || section.id === 'arch-link') && <>
                  <li>Prefer .gov, .org, vendor docs, or CompTIA official pages</li>
                  <li>One URL per line — no URL shorteners</li>
                  <li>If you only have one source, that is fine — quality over quantity</li>
                </>}
                {section.id === 'hack' && <>
                  <li>Write the mnemonic out letter-by-letter if applicable</li>
                  <li>Explain WHY the trick works, not just the trick itself</li>
                  <li>Keep it short — if it takes more than 3 sentences, simplify</li>
                </>}
                {section.id === 'scenario' && <>
                  <li>Set the scene: department, role, symptom reported</li>
                  <li>Walk through the 2-3 diagnostic steps the tech takes</li>
                  <li>End with the resolution and what was learned</li>
                </>}
                {section.id === 'framework' && <>
                  <li>List every node left-to-right or top-to-bottom in order</li>
                  <li>State the protocol at each connection (TCP, UDP, HTTPS, etc.)</li>
                  <li>Note which direction data travels (unidirectional vs. bidirectional)</li>
                </>}
                {section.id === 'clinical-map' && <>
                  <li>Tie each node to a real department or system (radiology PACS, pharmacy)</li>
                  <li>Describe the failure mode: what happens to patients if this breaks?</li>
                  <li>Reference downtime procedures if known</li>
                </>}
                {section.id === 'matrix' && <>
                  <li>Use a consistent format: "- Port XX → Protocol (description)"</li>
                  <li>Sort numerically by port or alphabetically by command</li>
                  <li>Mark which entries are exam-critical with "(A+ exam)"</li>
                </>}
                {section.id === 'remediation' && <>
                  <li>Number each step — this becomes a field checklist</li>
                  <li>Include the tool or command used at each step</li>
                  <li>End with an escalation path if self-resolution fails</li>
                </>}
              </ul>
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={section.placeholder}
            rows={section.id === 'sources' || section.id === 'reference' || section.id === 'arch-link' ? 3 : 5}
            className={`w-full bg-white dark:bg-zinc-950/60 rounded-lg border px-3 py-2.5 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-sky-500/40 outline-none transition-all resize-y custom-scrollbar placeholder-zinc-300 dark:placeholder-zinc-600 text-zinc-800 dark:text-zinc-200 ${
              status === 'done'
                ? 'border-emerald-200 dark:border-emerald-500/25'
                : status === 'draft'
                ? 'border-amber-200 dark:border-amber-500/25'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          />

          {/* Min-word hint */}
          {section.minWords > 0 && status !== 'done' && (
            <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              {wc === 0
                ? `Aim for at least ${section.minWords} words in this section.`
                : `${wc} / ${section.minWords} words minimum — keep going!`
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function SectionProgress({ sections, values }: { sections: SectionConfig[]; values: Record<string, string> }) {
  const done = sections.filter((s) => sectionStatus(values[s.id] || '', s.minWords) === 'done').length;
  const pct = Math.round((done / sections.length) * 100);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Section Progress
        </span>
        <span className={`text-[11px] font-bold ${done === sections.length ? 'text-emerald-500' : 'text-zinc-400'}`}>
          {done}/{sections.length} complete
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done === sections.length ? 'bg-emerald-400' : 'bg-sky-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

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
  // Guided sections: keyed by section id
  const [sectionValues, setSectionValues] = useState<Record<string, string>>({});
  // Resource Link keeps a single URL field
  const [resourceUrl, setResourceUrl] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isResourceLink = submissionType === 'Resource Link';
  const isArticle = submissionType === 'Article';
  const autoBadge = getBadge(track);

  const currentSections = isResourceLink
    ? []
    : SECTION_CONFIGS[submissionType as Exclude<SubmissionType, 'Resource Link'>];

  // Reset section values when submission type changes
  const prevTypeRef = useRef<SubmissionType>('Article');
  useEffect(() => {
    if (!isOpen) return;
    if (prevTypeRef.current !== submissionType) {
      setSectionValues({});
      prevTypeRef.current = submissionType;
    }
    setErrors({});
    setFormError('');
  }, [isOpen, submissionType]);

  // Escape key + scroll lock
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
    prevTypeRef.current = 'Article';
    setTrack(MASTER_CATEGORIES[0].sub[0]);
    setTitle('');
    setSectionValues({});
    setResourceUrl('');
    setErrors({});
    setFormError('');
    setIsTrackDropdownOpen(false);
  };

  // Assemble the raw content string from guided sections
  const assembledContent = isResourceLink
    ? resourceUrl.trim()
    : assembleContent(currentSections, sectionValues);

  // Checklist for Articles
  const checklistResults = isArticle
    ? Object.fromEntries(CHECKLIST_RULES.map((r) => [r.id, r.test(assembledContent)]))
    : {};

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Name or Discord handle is required.';
    if (!title.trim()) e.title = 'Contribution title is required.';

    if (isResourceLink) {
      if (!/^https?:\/\/.+/.test(resourceUrl.trim())) e.content = 'Please enter a valid https:// URL.';
    } else {
      const allText = assembledContent;
      if (allText.trim().length < 50) e.content = 'Please fill in at least one section with your research before submitting.';
    }

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (PROFANITY_PATTERN.test(title) || PROFANITY_PATTERN.test(assembledContent)) {
      setFormError('Submission contains restricted language. Please align your contribution with professional healthcare and academic standards.');
      return;
    }

    setIsSubmitting(true);
    const rawContent = assembledContent;
    const formattedContent = !isResourceLink
      ? buildFormattedContent(fullName.trim(), track, rawContent)
      : null;

    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          full_name: fullName.trim(),
          track,
          badge: autoBadge,
          title: title.trim(),
          content: rawContent,
          submission_type: submissionType,
          formatted_content: formattedContent,
          is_approved: false,
        })
        .select()
        .single();

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
        track,
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
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={() => { reset(); onClose(); }}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Contribute to the Hub</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Share your knowledge with the cohort</p>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form error banner ── */}
        {formError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-start gap-2.5 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{formError}</p>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="px-6 py-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-5">

            {/* 1 — Full Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Full Name / Discord Handle
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className={inputCls('fullName')}
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            {/* 2 — Submission Type */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Contribution Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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

            {/* 3 — Curriculum Track */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Curriculum Track
              </label>
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

            {/* 4 — Title */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Contribution Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. TCP/IP Protocol Suite"
                className={inputCls('title')}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* 5 — Content: Resource Link OR Guided Sections */}
            {isResourceLink ? (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  <LinkIcon className="w-4 h-4 text-emerald-500" /> Resource URL
                </label>
                <input
                  type="url"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://…"
                  className={`${inputCls('content')} focus:ring-emerald-500/40`}
                />
                {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
              </div>
            ) : (
              <div>
                {/* Guided section label row */}
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    <BookOpen className="w-4 h-4 text-sky-500" /> Contribution Body
                  </label>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Fill each section below</span>
                </div>

                {/* Progress bar */}
                <SectionProgress sections={currentSections} values={sectionValues} />

                {/* Guided sections */}
                <div className="space-y-3">
                  {currentSections.map((section, idx) => (
                    <GuidedSection
                      key={section.id}
                      section={section}
                      value={sectionValues[section.id] || ''}
                      onChange={(val) => setSectionValues((prev) => ({ ...prev, [section.id]: val }))}
                      sectionIndex={idx}
                      totalSections={currentSections.length}
                    />
                  ))}
                </div>

                {errors.content && (
                  <p className="mt-2 text-xs text-red-500">{errors.content}</p>
                )}
              </div>
            )}

            {/* 6 — Article publication checklist */}
            {isArticle && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Publication Checklist
                  </p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {CHECKLIST_RULES.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-3 px-3 py-2.5">
                      {checklistResults[rule.id]
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      }
                      <p className={`text-xs font-medium ${
                        checklistResults[rule.id]
                          ? 'text-zinc-600 dark:text-zinc-300'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}>
                        {rule.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
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

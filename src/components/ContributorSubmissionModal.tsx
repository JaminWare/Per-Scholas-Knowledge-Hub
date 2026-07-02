import { useState, useEffect } from 'react';
import {
  X, Send, Loader2, Tag,
  FileText, Link2, BookOpen, GitBranch,
  AlertCircle, Link as LinkIcon, ImagePlus, CheckCircle2, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type NewSubmission } from '../utils/submissions';
import { normalizeUrl } from '../utils/normalizeUrl';
import { JOURNEY_TABS, CATEGORY_FILTERS } from '../pages/LearnerExperiencePage';
import { COMPTIA_OBJECTIVES } from '../lib/domainObjectives';

type SubmissionType = 'Article' | 'Study Tip' | 'Diagram' | 'Resource Link' | 'Prompt Playbook';

const PROFANITY_PATTERN = new RegExp(
  ['fuck','shit','bitch','asshole','bastard','cunt','damn','piss','cock','dick','pussy','whore','slut','retard','nigger','faggot','kike','spic','chink','wetback'].join('|'),
  'i'
);

const SUBMISSION_TYPES = [
  { value: 'Article' as SubmissionType, label: 'Article', icon: FileText },
  { value: 'Study Tip' as SubmissionType, label: 'Study Tip', icon: BookOpen },
  { value: 'Diagram' as SubmissionType, label: 'Diagram', icon: GitBranch },
  { value: 'Resource Link' as SubmissionType, label: 'Resource Link', icon: Link2 },
  { value: 'Prompt Playbook' as SubmissionType, label: 'Playbook', icon: Sparkles },
];

const LX_TRACK_VALUE = 'Learner Experience & FAQs';

const MASTER_CATEGORIES = [
  { label: 'Learner Experience & FAQs', badge: 'Community Contributor', sub: [] as string[] },
  { label: 'CompTIA A+ Core 1', badge: 'Core 1 Expert', sub: [
    'CompTIA A+ Core 1 — Domain 1.0 (Mobile Devices)',
    'CompTIA A+ Core 1 — Domain 2.0 (Networking)',
    'CompTIA A+ Core 1 — Domain 3.0 (Hardware)',
    'CompTIA A+ Core 1 — Domain 4.0 (Virtualization & Cloud)',
    'CompTIA A+ Core 1 — Domain 5.0 (HW & Network Troubleshooting)',
  ]},
  { label: 'CompTIA A+ Core 2', badge: 'Core 2 Expert', sub: [
    'CompTIA A+ Core 2 — Domain 1.0 (Operating Systems)',
    'CompTIA A+ Core 2 — Domain 2.0 (Security)',
    'CompTIA A+ Core 2 — Domain 3.0 (Software Troubleshooting)',
    'CompTIA A+ Core 2 — Domain 4.0 (Operational Procedures)',
  ]},
  { label: 'Advanced Healthcare IT', badge: 'Healthcare IT Specialist', sub: [
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
  { label: 'Prompt Playbook', badge: 'Playbook Engineer', sub: [
    'Prompt Playbook — CompTIA PBQ Simulations',
    'Prompt Playbook — Healthcare Case Studies',
    'Prompt Playbook — EHR Troubleshooting Frameworks',
    'Prompt Playbook — Study Drill Frameworks',
  ]},
];

function getVisibleCategories(type: SubmissionType) {
  switch (type) {
    case 'Article':
    case 'Study Tip':
    case 'Resource Link':
      return MASTER_CATEGORIES.filter((c) =>
        c.label === 'Learner Experience & FAQs' ||
        c.label === 'CompTIA A+ Core 1' ||
        c.label === 'CompTIA A+ Core 2' ||
        c.label === 'Advanced Healthcare IT'
      );
    case 'Diagram':
      return MASTER_CATEGORIES.filter((c) =>
        c.label === 'Learner Experience & FAQs' ||
        c.label === 'Diagrams'
      );
    case 'Prompt Playbook':
      return MASTER_CATEGORIES.filter((c) =>
        c.label === 'Learner Experience & FAQs' ||
        c.label === 'Prompt Playbook'
      );
  }
}

function getBadge(trackName: string): string {
  if (trackName === LX_TRACK_VALUE || trackName.startsWith('Learner Experience')) return 'Community Contributor';
  if (trackName.includes('Core 2')) return 'Core 2 Expert';
  if (trackName.includes('Advanced Healthcare IT')) return 'Healthcare IT Specialist';
  if (trackName.includes('Prompt Playbook')) return 'Playbook Engineer';
  if (trackName.includes('Diagrams')) return 'Diagram Architect';
  if (trackName.includes('Quick References')) return 'Reference Author';
  return 'Core 1 Expert';
}

function autoLinkUrls(text: string): string {
  return text.replace(/(?<!\]\()https?:\/\/[^\s)>\]]+/g, (url) => `[${url}](${url})`);
}

const STRUCTURED_LINE = /^\s*[-*•]\s|^\s*\d+[.)]\s|^\s*[$>]\s/;

function isStructuredBlock(text: string): boolean {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return false;
  const structuredCount = lines.filter((l) => STRUCTURED_LINE.test(l)).length;
  return structuredCount / lines.length > 0.4;
}

function wrapInCodeFence(text: string): string {
  return '```text\n' + text.trim() + '\n```';
}

function cleanReferences(raw: string): string {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '- *No external references provided.*';

  return lines.map((line) => {
    const alreadyLinked = /\[.+\]\(.+\)/.test(line);
    if (alreadyLinked) {
      return line.startsWith('-') || line.startsWith('*') ? line : `- ${line}`;
    }
    const urlMatch = line.match(/https?:\/\/[^\s)>\]]+/);
    if (urlMatch) {
      let cleanedUrl = urlMatch[0];
      try {
        const u = new URL(cleanedUrl);
        const tracking = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','si','feature','ref','t','list'];
        tracking.forEach((p) => u.searchParams.delete(p));
        cleanedUrl = u.toString().replace(/\/+$/, '');
      } catch { /* keep original */ }
      const domain = cleanedUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      const path = cleanedUrl.replace(/^https?:\/\/(www\.)?[^/]+/, '').replace(/\/+$/, '');
      const label = path ? `${domain}${path}` : domain;
      return `- [${label}](${cleanedUrl})`;
    }
    return `- ${line}`;
  }).join('\n');
}

function buildFormattedContent(
  authorName: string,
  trackValue: string,
  type: SubmissionType,
  descriptionText: string,
  relevanceText: string,
  healthcareText: string,
  referencesText: string,
  diagramUrl?: string,
): string {
  const desc = descriptionText.trim();
  const relevance = relevanceText.trim();
  const healthcare = healthcareText.trim();

  const descriptionBlock = isStructuredBlock(desc)
    ? wrapInCodeFence(desc)
    : autoLinkUrls(desc);

  const relevanceBlock = isStructuredBlock(relevance)
    ? wrapInCodeFence(relevance)
    : autoLinkUrls(relevance);

  const healthcareCallout = `> \u{1F3E5} **Clinical Workflow Impact:** ${healthcare}`;

  const referencesBlock = cleanReferences(referencesText);

  const sections: string[] = [
    `> \u{1F4A1} **Community Contribution** | Research curated by **${authorName}** for track **${trackValue}**.`,
    '',
    '\u{1F52C} Guided Description'.replace('\u{1F52C}', '## \u{1F52C}'),
    '',
  ];

  sections.push(descriptionBlock);

  sections.push('', '## \u{26A1} CompTIA A+ Relevance', '', relevanceBlock);
  sections.push('', '## \u{1F3E5} Healthcare IT Integration', '', healthcareCallout);

  if (diagramUrl) {
    sections.push('', '## \u{1F5FA}\u{FE0F} Visual Architecture', '', `![Diagram](${diagramUrl})`);
  }

  sections.push('', '## \u{1F517} References & Citations', '', referencesBlock);

  return sections.join('\n');
}

const LX_STAGES = JOURNEY_TABS.filter((t) => t.id !== 'all');

export default function ContributorSubmissionModal({ isOpen, onClose, onSubmitted, onRefresh }: { isOpen: boolean; onClose: () => void; onSubmitted: (s: NewSubmission) => void; onRefresh?: () => void; }) {
  const [fullName, setFullName] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('Article');

  const [masterCategory, setMasterCategory] = useState('');
  const [track, setTrack] = useState('');
  const [title, setTitle] = useState('');

  const [concept, setConcept] = useState('');
  const [aPlusRelevance, setAPlusRelevance] = useState('');
  const [impact, setImpact] = useState('');
  const [references, setReferences] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [diagramUrl, setDiagramUrl] = useState('');

  // Prompt Playbook fields
  const [promptRole, setPromptRole] = useState('');
  const [promptText, setPromptText] = useState('');
  const [promptUseCase, setPromptUseCase] = useState('');

  // Learner Experience cascading selections
  const [lxStage, setLxStage] = useState('');
  const [lxTopic, setLxTopic] = useState('');
  const [lxFocus, setLxFocus] = useState('');

  // CompTIA Objective
  const [compObjective, setCompObjective] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isResourceLink = submissionType === 'Resource Link';
  const isLearnerExperience = masterCategory === LX_TRACK_VALUE;
  const isLightweight = submissionType === 'Diagram' || submissionType === 'Study Tip';
  const autoBadge = isLearnerExperience ? 'Community Contributor' : getBadge(track || masterCategory);

  const visibleCategories = getVisibleCategories(submissionType);
  const selectedMasterObj = MASTER_CATEGORIES.find((c) => c.label === masterCategory);
  const domainOptions = selectedMasterObj?.sub ?? [];

  // Derive LX topic/focus options
  const lxTopicOptions = lxStage && CATEGORY_FILTERS[lxStage]
    ? CATEGORY_FILTERS[lxStage].filter((f) => !f.id.startsWith('all-'))
    : [];
  const selectedTopicObj = lxTopicOptions.find((t) => t.id === lxTopic);
  const lxFocusOptions = selectedTopicObj
    ? selectedTopicObj.nested.filter((n) => n.keywords.length > 0)
    : [];

  useEffect(() => {
    setMasterCategory('');
    setTrack('');
    setLxStage('');
    setLxTopic('');
    setLxFocus('');
    setErrors({});
    setFormError('');
  }, [submissionType]);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setFormError('');
    }
  }, [isOpen]);

  const reset = () => {
    setFullName('');
    setSubmissionType('Article');
    setMasterCategory('');
    setTrack('');
    setTitle('');
    setConcept('');
    setAPlusRelevance('');
    setImpact('');
    setReferences('');
    setResourceUrl('');
    setDiagramUrl('');
    setPromptRole('');
    setPromptText('');
    setPromptUseCase('');
    setCompObjective('');
    setLxStage('');
    setLxTopic('');
    setLxFocus('');
    setErrors({});
    setFormError('');
    setIsSuccess(false);
  };

  const assembleContent = () => {
    if (isResourceLink) return resourceUrl.trim();

    if (submissionType === 'Prompt Playbook') {
      return `**System Role / Context:**\n${promptRole.trim()}\n\n**The Prompt:**\n${promptText.trim()}\n\n**Use Case:**\n${promptUseCase.trim()}`;
    }

    if (isLightweight) {
      let content = concept.trim();
      if (diagramUrl.trim()) content += `\n\n![Attachment](${diagramUrl.trim()})`;
      return content;
    }

    const descBlock = isStructuredBlock(concept)
      ? wrapInCodeFence(concept.trim())
      : concept.trim();
    let md = `## \u{1F52C} Guided Description\n\n${descBlock}`;
    md += `\n\n## \u{26A1} CompTIA A+ Relevance\n\n${aPlusRelevance.trim()}`;
    md += `\n\n## \u{1F3E5} Healthcare IT Integration\n\n> \u{1F3E5} **Clinical Workflow Impact:** ${impact.trim()}`;
    md += `\n\n## \u{1F517} References & Citations\n\n${cleanReferences(references)}`;
    if (diagramUrl.trim()) {
      md += `\n\n## \u{1F5FA}\u{FE0F} Visual Architecture\n\n![Diagram](${diagramUrl.trim()})`;
    }
    return md;
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Required.';
    if (!title.trim()) e.title = 'Required.';
    if (!masterCategory) e.masterCategory = 'Please select a category.';

    if (isLearnerExperience && !lxStage) {
      e.lxStage = 'Please select a stage.';
    }

    if (!isLearnerExperience && masterCategory && domainOptions.length > 0 && !track) {
      e.track = 'Please select a domain.';
    }

    if (isResourceLink) {
      if (!/^https?:\/\/.+/.test(resourceUrl.trim())) e.resourceUrl = 'Valid URL required.';
    } else if (submissionType === 'Prompt Playbook') {
      if (promptRole.trim().length < 10) e.promptRole = 'At least 10 characters required.';
      if (promptText.trim().length < 15) e.promptText = 'At least 15 characters required.';
      if (promptUseCase.trim().length < 10) e.promptUseCase = 'At least 10 characters required.';
    } else if (isLightweight) {
      if (concept.trim().length < 15) e.concept = 'At least 15 characters required.';
    } else {
      if (concept.trim().length < 15) e.concept = 'Required.';
      if (aPlusRelevance.trim().length < 15) e.aPlusRelevance = 'Required.';
      if (impact.trim().length < 15) e.impact = 'Required.';
      if (references.trim().length === 0) e.references = 'Required.';
      if (!diagramUrl.trim() || !/images\.unsplash\.com/.test(diagramUrl.trim())) {
        e.diagramUrl = 'Please provide a valid Unsplash image URL to ensure cohesive knowledge base styling.';
      }
    }

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    let rawContent = assembleContent();

    if (PROFANITY_PATTERN.test(title) || PROFANITY_PATTERN.test(rawContent)) {
      setFormError('Submission contains restricted language. Please align your contribution with professional academic standards.');
      return;
    }

    setIsSubmitting(true);

    // Duplicate detection
    try {
      if (isResourceLink) {
        const normalizedInput = normalizeUrl(resourceUrl);
        const [{ data: existingArticles }, { data: pendingSubs }] = await Promise.all([
          supabase.from('articles').select('content').eq('submission_type', 'Resource Link').eq('is_sample', false),
          supabase.from('submissions').select('content').eq('submission_type', 'Resource Link').eq('is_approved', false),
        ]);
        const allUrls = [...(existingArticles ?? []), ...(pendingSubs ?? [])];
        if (allUrls.some((row) => normalizeUrl(row.content ?? '') === normalizedInput)) {
          setFormError('This specific resource or title has already been submitted or published to the Hub!');
          setIsSubmitting(false);
          return;
        }
      } else {
        const [{ data: existingArticles }, { data: pendingSubs }] = await Promise.all([
          supabase.from('articles').select('title').ilike('title', title.trim()).eq('is_sample', false),
          supabase.from('submissions').select('title').ilike('title', title.trim()).eq('is_approved', false),
        ]);
        if ((existingArticles ?? []).length > 0 || (pendingSubs ?? []).length > 0) {
          setFormError('This specific resource or title has already been submitted or published to the Hub!');
          setIsSubmitting(false);
          return;
        }
      }
    } catch {
      // Non-blocking: if the duplicate check fails, allow submission to proceed
    }

    // Resolve track and badge for LX submissions
    let payloadTrack = track;
    let payloadBadge = autoBadge;
    if (isLearnerExperience) {
      const stageTab = LX_STAGES.find((t) => t.id === lxStage);
      payloadTrack = `Learner Experience \u2014 ${stageTab?.label || lxStage}`;
      payloadBadge = 'Community Contributor';
    }

    const formattedContent = (submissionType === 'Article' && !isLearnerExperience)
      ? buildFormattedContent(
          fullName.trim(), payloadTrack, submissionType,
          concept.trim(), aPlusRelevance.trim(), impact.trim(), references.trim(),
          diagramUrl.trim() || undefined,
        )
      : null;

    const insertPayload = {
      full_name: fullName.trim(),
      track: payloadTrack,
      badge: payloadBadge,
      title: title.trim(),
      content: rawContent,
      submission_type: submissionType,
      formatted_content: formattedContent,
      is_approved: false,
      comp_objective: compObjective || null,
      lx_stage: isLearnerExperience ? lxStage || null : null,
      lx_topic: isLearnerExperience ? (selectedTopicObj?.label || null) : null,
      lx_focus: isLearnerExperience ? (lxFocus || null) : null,
    };

    try {
      const { data, error } = await supabase.from('submissions').insert(insertPayload).select().single();

      if (error) {
        setFormError('Database Error: ' + error.message);
        setIsSubmitting(false);
        return;
      }

      const sub: NewSubmission = { ...(data as NewSubmission), badge: payloadBadge, submission_type: submissionType };

      onSubmitted(sub);
      setIsSuccess(true);
    } catch (err: any) {
      setFormError('Database Error: ' + (err?.message || JSON.stringify(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const inputCls = (field: string) => `w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all ${errors[field] ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-800'}`;
  const selectCls = (field: string) => `w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all appearance-none ${errors[field] ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-800'} text-zinc-900 dark:text-zinc-100`;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-zinc-950/70 dark:bg-zinc-300/25 backdrop-blur-sm" onClick={() => { reset(); onClose(); }} />
        <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
          <div className="flex flex-col items-center text-center px-8 py-12">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Contribution Submitted!</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
              Your resource has been sent to the curation queue for peer review and admin approval.
            </p>
          </div>
          <div className="px-8 pb-8">
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/70 dark:bg-zinc-300/25 backdrop-blur-sm" onClick={() => { reset(); onClose(); }} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">

        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Contribute to the Hub</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Share your knowledge with the cohort</p>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {formError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-start gap-2.5 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{formError}</p>
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-6">

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">Full Name / Discord Handle</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Smith" className={inputCls('fullName')} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Contribution Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SUBMISSION_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setSubmissionType(t.value)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${submissionType === t.value ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-sky-300'}`}>
                    <t.icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">Curriculum Track</label>
              <select
                value={masterCategory}
                onChange={(e) => { setMasterCategory(e.target.value); setTrack(''); setCompObjective(''); setLxStage(''); setLxTopic(''); setLxFocus(''); }}
                className={selectCls('masterCategory')}
              >
                <option value="">Select a category...</option>
                {visibleCategories.map((cat) => (
                  <option key={cat.label} value={cat.label}>{cat.label}</option>
                ))}
              </select>
              {errors.masterCategory && <p className="mt-1 text-xs text-red-500">{errors.masterCategory}</p>}

              {/* Level 2: Domain select for technical tracks */}
              {masterCategory && !isLearnerExperience && domainOptions.length > 0 && (
                <div className="mt-3 pl-3 border-l-2 border-sky-200 dark:border-sky-800">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Specific Domain / Module</label>
                  <select
                    value={track}
                    onChange={(e) => { setTrack(e.target.value); setCompObjective(''); }}
                    className={selectCls('track')}
                  >
                    <option value="">Select a domain...</option>
                    {domainOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.track && <p className="mt-1 text-xs text-red-500">{errors.track}</p>}

                  {track && COMPTIA_OBJECTIVES[track] && COMPTIA_OBJECTIVES[track].length > 0 && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Specific Objective</label>
                      <select
                        value={compObjective}
                        onChange={(e) => setCompObjective(e.target.value)}
                        className={selectCls('compObjective')}
                      >
                        <option value="">Select an objective (optional)...</option>
                        {COMPTIA_OBJECTIVES[track].map((obj) => (
                          <option key={obj} value={obj}>{obj}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Level 2+: LX Cascading Dropdowns */}
              {isLearnerExperience && (
                <div className="mt-3 space-y-3 pl-3 border-l-2 border-sky-200 dark:border-sky-800">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Stage</label>
                    <select
                      value={lxStage}
                      onChange={(e) => { setLxStage(e.target.value); setLxTopic(''); setLxFocus(''); }}
                      className={selectCls('lxStage')}
                    >
                      <option value="">Select a stage...</option>
                      {LX_STAGES.map((tab) => (
                        <option key={tab.id} value={tab.id}>{tab.label}</option>
                      ))}
                    </select>
                    {errors.lxStage && <p className="mt-1 text-xs text-red-500">{errors.lxStage}</p>}
                  </div>

                  {lxStage && lxTopicOptions.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Topic</label>
                      <select
                        value={lxTopic}
                        onChange={(e) => { setLxTopic(e.target.value); setLxFocus(''); }}
                        className={selectCls('lxTopic')}
                      >
                        <option value="">Select a topic...</option>
                        {lxTopicOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {lxTopic && lxFocusOptions.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Focus</label>
                      <select
                        value={lxFocus}
                        onChange={(e) => setLxFocus(e.target.value)}
                        className={selectCls('lxFocus')}
                      >
                        <option value="">Select a focus...</option>
                        {lxFocusOptions.map((opt) => (
                          <option key={opt.label} value={opt.label}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">You will earn: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">[{autoBadge}]</span></span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">Contribution Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. TCP/IP Protocol Suite" className={inputCls('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Guided Submission Builder</h3>
              </div>

              {isResourceLink ? (
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"><LinkIcon className="w-3.5 h-3.5 text-sky-500" /> Resource URL</label>
                  <input type="url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://..." className={inputCls('resourceUrl')} />
                  {errors.resourceUrl && <p className="mt-1 text-xs text-red-500">{errors.resourceUrl}</p>}
                </div>
              ) : (submissionType === 'Study Tip' || submissionType === 'Diagram') ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Description / Core Concept <span className="text-red-400">*</span>
                    </label>
                    <textarea value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Explain the tip, concept, or describe the diagram..." rows={4} className={`${inputCls('concept')} font-mono resize-y custom-scrollbar`} />
                    {errors.concept && <p className="mt-1 text-xs text-red-500">{errors.concept}</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      <ImagePlus className="w-3.5 h-3.5 text-sky-500" /> Supported Media / Attachment Link
                    </label>
                    <input type="url" value={diagramUrl} onChange={(e) => setDiagramUrl(e.target.value)} placeholder="Paste a link to an image, PDF, YouTube video, or Google Drive file..." className={inputCls('diagramUrl')} />
                    <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">Supports images, PDFs, YouTube, Google Drive, and other shareable URLs.</p>
                  </div>
                </div>
              ) : submissionType === 'Prompt Playbook' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      System Role & Context <span className="text-red-400">*</span>
                    </label>
                    <textarea value={promptRole} onChange={(e) => setPromptRole(e.target.value)} placeholder="e.g., Act as a senior network engineer troubleshooting Active Directory..." rows={3} className={`${inputCls('promptRole')} font-mono resize-y custom-scrollbar`} />
                    {errors.promptRole && <p className="mt-1 text-xs text-red-500">{errors.promptRole}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      The Prompt Template <span className="text-red-400">*</span>
                    </label>
                    <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Paste the exact prompt text here..." rows={4} className={`${inputCls('promptText')} font-mono resize-y custom-scrollbar`} />
                    {errors.promptText && <p className="mt-1 text-xs text-red-500">{errors.promptText}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Use Case & Expected Output <span className="text-red-400">*</span>
                    </label>
                    <textarea value={promptUseCase} onChange={(e) => setPromptUseCase(e.target.value)} placeholder="When should the cohort use this prompt and what will it generate?" rows={3} className={`${inputCls('promptUseCase')} font-mono resize-y custom-scrollbar`} />
                    {errors.promptUseCase && <p className="mt-1 text-xs text-red-500">{errors.promptUseCase}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      1. Guided Description <span className="text-red-400">*</span>
                    </label>
                    <textarea value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Explain the main idea, textbook definition, or step-by-step process..." rows={4} className={`${inputCls('concept')} font-mono resize-y custom-scrollbar`} />
                    {errors.concept && <p className="mt-1 text-xs text-red-500">{errors.concept}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      2. CompTIA A+ Relevance <span className="text-red-400">*</span>
                    </label>
                    <textarea value={aPlusRelevance} onChange={(e) => setAPlusRelevance(e.target.value)} placeholder="How does this topic map to the CompTIA A+ exam objectives (Core 1 / Core 2)?" rows={3} className={`${inputCls('aPlusRelevance')} font-mono resize-y custom-scrollbar`} />
                    {errors.aPlusRelevance && <p className="mt-1 text-xs text-red-500">{errors.aPlusRelevance}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      3. Clinical / Healthcare Impact <span className="text-red-400">*</span>
                    </label>
                    <textarea value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="How does this apply to clinical workflows, hospital networks, or patient care?" rows={3} className={`${inputCls('impact')} font-mono resize-y custom-scrollbar`} />
                    {errors.impact && <p className="mt-1 text-xs text-red-500">{errors.impact}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      4. References and Citations <span className="text-red-400">*</span>
                    </label>
                    <textarea value={references} onChange={(e) => setReferences(e.target.value)} placeholder="Paste links (e.g., https://...) or cite your sources here..." rows={2} className={`${inputCls('references')} font-mono resize-y custom-scrollbar`} />
                    {errors.references && <p className="mt-1 text-xs text-red-500">{errors.references}</p>}
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      5. Diagram / Visual Attachment <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ImagePlus className="h-4 w-4 text-zinc-400" />
                      </div>
                      <input type="url" value={diagramUrl} onChange={(e) => setDiagramUrl(e.target.value)} placeholder="Required: Provide a valid high-resolution Unsplash image link (e.g., https://images.unsplash.com/...)" className={`${inputCls('diagramUrl')} pl-10`} />
                    </div>
                    {errors.diagramUrl && <p className="mt-1 text-xs text-red-500">{errors.diagramUrl}</p>}
                    <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-500 font-medium">Required: Use a valid Unsplash image URL (images.unsplash.com) to preserve responsive visual layouts and cohesive knowledge base styling.</p>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <button type="button" onClick={() => { reset(); onClose(); }} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all text-zinc-900 bg-sky-400 hover:bg-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] disabled:opacity-60">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Your Contribution</>}
          </button>
        </div>

      </div>
    </div>
  );
}

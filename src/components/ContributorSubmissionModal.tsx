import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Send, Loader2, Tag,
  FileText, Link2, BookOpen, GitBranch,
  AlertCircle, Link as LinkIcon, ImagePlus, CheckCircle2, Sparkles, Lightbulb
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type NewSubmission } from '../utils/submissions';
import { checkForDuplicate } from '../utils/duplicateCheck';
import { JOURNEY_TABS, CATEGORY_FILTERS } from '../pages/LearnerExperiencePage';
import { COMPTIA_OBJECTIVES } from '../lib/domainObjectives';
import { MASTER_CATEGORIES, getBadgeForTrack } from '../lib/domainRegistry';
import { autoCategorizeSubmission } from '../utils/autoCategorize';
import { isImageUrl, sanitizeUrlForMarkdown, encodeMarkdownUrl, extractSmartLinkLabel } from '../utils/markdownLinks';

type SubmissionType = 'Article' | 'Study Tip' | 'Diagram' | 'Resource Link' | 'Prompt Playbook';

const PROFANITY_PATTERN = new RegExp(
  ['fuck','shit','bitch','asshole','bastard','cunt','damn','piss','cock','dick','pussy','whore','slut','retard','nigger','faggot','kike','spic','chink','wetback'].join('|'),
  'i'
);

const SUBMISSION_TYPES = [
  { value: 'Resource Link' as SubmissionType, label: 'Resource Link', icon: Link2 },
  { value: 'Article' as SubmissionType, label: 'Article', icon: FileText },
  { value: 'Study Tip' as SubmissionType, label: 'Pro Tip', icon: BookOpen },
  { value: 'Diagram' as SubmissionType, label: 'Diagram', icon: GitBranch },
  { value: 'Prompt Playbook' as SubmissionType, label: 'Playbook', icon: Sparkles },
];

const LX_TRACK_VALUE = 'Learner Experience & FAQs';

function getVisibleCategories(_type: SubmissionType) {
  return MASTER_CATEGORIES;
}

function autoLinkUrls(text: string): string {
  return text.replace(/(?<!\]\()https?:\/\/[^\s)>\]]+/g, (url) => {
    const sanitized = sanitizeUrlForMarkdown(url);
    return `[${sanitized}](${sanitized})`;
  });
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
      const safeUrl = encodeMarkdownUrl(cleanedUrl);
      const domain = cleanedUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      const path = cleanedUrl.replace(/^https?:\/\/(www\.)?[^/]+/, '').replace(/\/+$/, '');
      const label = path ? `${domain}${path}` : domain;
      return `- [${label}](${safeUrl})`;
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
    const safeUrl = sanitizeUrlForMarkdown(diagramUrl);
    const media = isImageUrl(safeUrl)
      ? `![Diagram](${safeUrl})`
      : `[Attachment](${safeUrl})`;
    sections.push('', '## \u{1F5FA}\u{FE0F} Visual Architecture', '', media);
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

  // LX Survival Guide fields
  const [hardship, setHardship] = useState('');
  const [breakthrough, setBreakthrough] = useState('');

  // CompTIA Objective
  const [compObjective, setCompObjective] = useState('');
  const [dbObjectives, setDbObjectives] = useState<Record<string, string[]>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [authorSuggestions, setAuthorSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const authorFieldRef = useRef<HTMLDivElement>(null);

  const [autoDetected, setAutoDetected] = useState(false);
  const [userOverride, setUserOverride] = useState(false);
  const autoDetectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleManuallyEdited = useRef(false);

  // Reset all form state to clean defaults whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    titleManuallyEdited.current = false;
    setSubmissionType('Article');
    try {
      const saved = localStorage.getItem('learnerHub_authorName');
      setFullName(saved || '');
    } catch {
      setFullName('');
    }
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
    setLxStage('');
    setLxTopic('');
    setLxFocus('');
    setHardship('');
    setBreakthrough('');
    setCompObjective('');
    setErrors({});
    setFormError('');
    setIsSubmitting(false);
    setIsSuccess(false);
    setAutoDetected(false);
    setUserOverride(false);
  }, [isOpen]);

  const runAutoDetect = useCallback(() => {
    if (userOverride || masterCategory || track) return;
    const textBody = [concept, aPlusRelevance, promptText, promptRole].filter(Boolean).join(' ');
    const result = autoCategorizeSubmission(title, textBody);
    if (!result) return;
    if (result.submissionType) {
      setSubmissionType(result.submissionType);
    }
    if (result.masterCategory) {
      setMasterCategory(result.masterCategory);
    }
    if (result.track) {
      setTrack(result.track);
    }
    if (result.compObjective) {
      setCompObjective(result.compObjective);
    }
    if (result.masterCategory || result.track) {
      setAutoDetected(true);
    }
  }, [title, concept, aPlusRelevance, promptText, promptRole, userOverride, masterCategory, track]);

  useEffect(() => {
    if (userOverride || masterCategory || track) return;
    if (autoDetectTimer.current) clearTimeout(autoDetectTimer.current);
    autoDetectTimer.current = setTimeout(runAutoDetect, 400);
    return () => { if (autoDetectTimer.current) clearTimeout(autoDetectTimer.current); };
  }, [title, concept, aPlusRelevance, promptText, promptRole, runAutoDetect, userOverride, masterCategory, track]);

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from('articles')
      .select('author_name')
      .not('author_name', 'is', null)
      .not('author_name', 'eq', '')
      .then(({ data }) => {
        if (!data) return;
        const unique = [...new Set(data.map((r) => r.author_name as string).filter(Boolean))].sort();
        setAuthorSuggestions(unique);
      });
  }, [isOpen]);

  useEffect(() => {
    if (dbObjectives && Object.keys(dbObjectives).length > 0) return;
    supabase
      .from('articles')
      .select('study_category, comp_objective')
      .not('comp_objective', 'is', null)
      .not('comp_objective', 'eq', '')
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string[]> = {};
        for (const row of data as { study_category: string | null; comp_objective: string | null }[]) {
          const cat = row.study_category?.trim();
          const obj = row.comp_objective?.trim();
          if (!cat || !obj) continue;
          if (!map[cat]) map[cat] = [];
          if (!map[cat].includes(obj)) map[cat].push(obj);
        }
        setDbObjectives(map);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (authorFieldRef.current && !authorFieldRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isResourceLink = submissionType === 'Resource Link';
  const isLearnerExperience = masterCategory === LX_TRACK_VALUE;
  const isLightweight = submissionType === 'Diagram' || submissionType === 'Study Tip';
  const autoBadge = isLearnerExperience ? 'Community Contributor' : getBadgeForTrack(track || masterCategory);

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
    setCompObjective('');
    setLxStage('');
    setLxTopic('');
    setLxFocus('');
    setHardship('');
    setBreakthrough('');
    setErrors({});
    setFormError('');
    setAutoDetected(false);
    setUserOverride(false);
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
    titleManuallyEdited.current = false;
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
    setHardship('');
    setBreakthrough('');
    setErrors({});
    setFormError('');
    setIsSuccess(false);
    setShowSuggestions(false);
    setAutoDetected(false);
    setUserOverride(false);
  };

  const assembleContent = () => {
    if (isResourceLink) return resourceUrl.trim();

    if (submissionType === 'Prompt Playbook') {
      return `**System Role / Context:**\n${promptRole.trim()}\n\n**The Prompt:**\n${promptText.trim()}\n\n**Use Case:**\n${promptUseCase.trim()}`;
    }

    if (submissionType === 'Article' && isLearnerExperience) {
      return `### PROBLEM\n\n> ${hardship.trim()}\n\n### SOLUTION\n\n> ${breakthrough.trim()}`;
    }

    if (isLightweight) {
      let content = concept.trim();
      if (diagramUrl.trim()) {
        const safeAttachUrl = sanitizeUrlForMarkdown(diagramUrl.trim());
        content += isImageUrl(safeAttachUrl) ? `\n\n![Attachment](${safeAttachUrl})` : `\n\n[Attachment](${safeAttachUrl})`;
      }
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
      const safeDiagUrl = sanitizeUrlForMarkdown(diagramUrl.trim());
      const diagMedia = isImageUrl(safeDiagUrl) ? `![Diagram](${safeDiagUrl})` : `[Diagram](${safeDiagUrl})`;
      md += `\n\n## \u{1F5FA}\u{FE0F} Visual Architecture\n\n${diagMedia}`;
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
    } else if (submissionType === 'Article' && isLearnerExperience) {
      if (hardship.trim().length < 15) e.hardship = 'At least 15 characters required.';
      if (breakthrough.trim().length < 15) e.breakthrough = 'At least 15 characters required.';
    } else {
      if (concept.trim().length < 15) e.concept = 'Required.';
      if (aPlusRelevance.trim().length < 15) e.aPlusRelevance = 'Required.';
      if (impact.trim().length < 15) e.impact = 'Required.';
      if (references.trim().length === 0) e.references = 'Required.';
      if (!diagramUrl.trim() || !/^https?:\/\/.+/.test(diagramUrl.trim())) {
        e.diagramUrl = 'Please provide a valid URL (must start with http:// or https://).';
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

    // Pre-flight duplication check (fuzzy title + URL + content)
    try {
      const duplicateError = await checkForDuplicate(
        title.trim(),
        rawContent,
        isResourceLink ? resourceUrl.trim() : undefined,
        submissionType,
      );
      if (duplicateError) {
        setFormError(duplicateError);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Non-blocking: if the duplicate check fails, allow submission to proceed
    }

    // Resolve track and badge for LX submissions
    let payloadTrack = track;
    let payloadBadge = autoBadge;
    if (isLearnerExperience) {
      const stageTab = LX_STAGES.find((t) => t.id === lxStage);
      payloadTrack = `Learner Experience ${stageTab?.label || lxStage}`;
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

      try { localStorage.setItem('learnerHub_authorName', fullName.trim()); } catch {}

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
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh]">

        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0 gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">Log New Intel</h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Add your breakthrough, workflow fix, or study hack to the Cohort Survival Guide.</p>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-2.5 flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-sky-600 dark:text-sky-400 leading-snug">Diagramming? Don't upload screenshots of your topology. Use the <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-sky-300">Mermaid Live Editor</a> to visually map out your architecture and paste the markdown code below.</p>
        </div>

        {formError && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 px-3 sm:px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-start gap-2.5 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{formError}</p>
          </div>
        )}

        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-6">

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">Full Name / Discord Handle</label>
              <div className="relative" ref={authorFieldRef}>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => { if (fullName.length > 0) setShowSuggestions(true); }}
                  placeholder="e.g. Jane Smith"
                  className={inputCls('fullName')}
                  autoComplete="off"
                />
                {showSuggestions && fullName.length > 0 && (() => {
                  const filtered = authorSuggestions.filter((name) =>
                    name.toLowerCase().includes(fullName.toLowerCase()) && name.toLowerCase() !== fullName.toLowerCase()
                  );
                  if (filtered.length === 0) return null;
                  return (
                    <ul className="absolute top-full left-0 right-0 mt-1 z-50 max-h-40 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1">
                      {filtered.map((name) => (
                        <li
                          key={name}
                          onClick={() => { setFullName(name); setShowSuggestions(false); }}
                          className="px-4 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-sky-50 dark:hover:bg-sky-500/10 cursor-pointer transition-colors"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Contribution Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SUBMISSION_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setSubmissionType(t.value)} className={`flex flex-col items-center gap-1.5 p-3 sm:p-3 rounded-xl border text-center transition-all min-h-[56px] ${submissionType === t.value ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-sky-300'}`}>
                    <t.icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
              {submissionType === 'Diagram' && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-600 dark:text-amber-400 leading-snug">Building a Diagram? We use Mermaid.js! Build your flowchart at the <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-amber-300">Mermaid Live Editor</a>, copy the markdown block, and paste it directly into the Guided Description below.</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">Curriculum Track</label>
              <select
                value={masterCategory}
                onChange={(e) => { setMasterCategory(e.target.value); setTrack(''); setCompObjective(''); setLxStage(''); setLxTopic(''); setLxFocus(''); setUserOverride(true); setAutoDetected(false); }}
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
                    onChange={(e) => { setTrack(e.target.value); setCompObjective(''); setUserOverride(true); setAutoDetected(false); }}
                    className={selectCls('track')}
                  >
                    <option value="">Select a domain...</option>
                    {domainOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.track && <p className="mt-1 text-xs text-red-500">{errors.track}</p>}

                  {track && (() => {
                    const staticOpts = COMPTIA_OBJECTIVES[track] ?? [];
                    const dbOpts = dbObjectives[track] ?? [];
                    const mergedOpts = [...staticOpts, ...dbOpts.filter((o) => !staticOpts.includes(o))];
                    if (mergedOpts.length === 0) return null;
                    return (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Specific Objective</label>
                        <select
                          value={compObjective}
                          onChange={(e) => { setCompObjective(e.target.value); setUserOverride(true); setAutoDetected(false); }}
                          className={selectCls('compObjective')}
                        >
                          <option value="">Select an objective (optional)...</option>
                          {mergedOpts.map((obj) => (
                            <option key={obj} value={obj}>{obj}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
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
                {autoDetected && (
                  <span className="inline-flex items-center gap-1 ml-auto text-xs font-medium text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" /> Auto-detected
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">Contribution Title</label>
              <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); titleManuallyEdited.current = true; }} placeholder="e.g. TCP/IP Protocol Suite" className={inputCls('title')} />
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
                  <input type="url" value={resourceUrl} onChange={(e) => {
                    const val = e.target.value;
                    setResourceUrl(val);
                    if (!titleManuallyEdited.current && !title && /^https?:\/\/.+/.test(val.trim())) {
                      setTitle(extractSmartLinkLabel(val.trim()));
                    }
                  }} onBlur={() => {
                    if (!titleManuallyEdited.current && !title && resourceUrl.trim()) {
                      setTitle(extractSmartLinkLabel(resourceUrl.trim()));
                    }
                  }} placeholder="https://example.com/your-resource..." className={inputCls('resourceUrl')} />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Paste any link (PDFs, YouTube, articles, websites). The system will automatically generate a clean, readable title for the knowledge base.</p>
                  {errors.resourceUrl && <p className="mt-1 text-xs text-red-500">{errors.resourceUrl}</p>}
                </div>
              ) : (submissionType === 'Study Tip' || submissionType === 'Diagram') ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Description / Core Concept <span className="text-red-400">*</span>
                    </label>
                    <textarea value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Explain the tip, concept, or describe the diagram..." rows={4} maxLength={5000} className={`${inputCls('concept')} font-mono resize-y custom-scrollbar`} />
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
              ) : (submissionType === 'Article' && isLearnerExperience) ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      The Breakthrough / The Challenge <span className="text-red-400">*</span>
                    </label>
                    <textarea value={hardship} onChange={(e) => setHardship(e.target.value)} placeholder="Describe the specific challenge, breakthrough moment, or lesson learned..." rows={4} maxLength={5000} className={`${inputCls('hardship')} font-mono resize-y custom-scrollbar`} />
                    {errors.hardship && <p className="mt-1 text-xs text-red-500">{errors.hardship}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      The Breakthrough / Field Notes <span className="text-red-400">*</span>
                    </label>
                    <textarea value={breakthrough} onChange={(e) => setBreakthrough(e.target.value)} placeholder="How did you solve it? What is your tactical advice for the next peer?" rows={6} maxLength={5000} className={`${inputCls('breakthrough')} font-mono resize-y custom-scrollbar`} />
                    {errors.breakthrough && <p className="mt-1 text-xs text-red-500">{errors.breakthrough}</p>}
                  </div>
                </div>
              ) : submissionType === 'Prompt Playbook' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      System Role & Context <span className="text-red-400">*</span>
                    </label>
                    <textarea value={promptRole} onChange={(e) => setPromptRole(e.target.value)} placeholder="e.g., Act as a senior network engineer troubleshooting Active Directory..." rows={3} maxLength={2000} className={`${inputCls('promptRole')} font-mono resize-y custom-scrollbar`} />
                    {errors.promptRole && <p className="mt-1 text-xs text-red-500">{errors.promptRole}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      The Prompt Template <span className="text-red-400">*</span>
                    </label>
                    <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Paste the exact prompt text here..." rows={4} maxLength={5000} className={`${inputCls('promptText')} font-mono resize-y custom-scrollbar`} />
                    {errors.promptText && <p className="mt-1 text-xs text-red-500">{errors.promptText}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Use Case & Expected Output <span className="text-red-400">*</span>
                    </label>
                    <textarea value={promptUseCase} onChange={(e) => setPromptUseCase(e.target.value)} placeholder="When should the cohort use this prompt and what will it generate?" rows={3} maxLength={2000} className={`${inputCls('promptUseCase')} font-mono resize-y custom-scrollbar`} />
                    {errors.promptUseCase && <p className="mt-1 text-xs text-red-500">{errors.promptUseCase}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      1. Guided Description <span className="text-red-400">*</span>
                    </label>
                    <textarea value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Explain the main idea, textbook definition, or step-by-step process..." rows={4} maxLength={5000} className={`${inputCls('concept')} font-mono resize-y custom-scrollbar`} />
                    {errors.concept && <p className="mt-1 text-xs text-red-500">{errors.concept}</p>}
                    <p className="mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">Building a network map or timeline? Use <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-400 underline">Mermaid Live Editor</a> to visually generate your diagram, then paste the markdown code block here.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      2. CompTIA A+ Relevance <span className="text-red-400">*</span>
                    </label>
                    <textarea value={aPlusRelevance} onChange={(e) => setAPlusRelevance(e.target.value)} placeholder="How does this topic map to the CompTIA A+ exam objectives (Core 1 / Core 2)?" rows={3} maxLength={3000} className={`${inputCls('aPlusRelevance')} font-mono resize-y custom-scrollbar`} />
                    {errors.aPlusRelevance && <p className="mt-1 text-xs text-red-500">{errors.aPlusRelevance}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      3. Clinical / Healthcare Impact <span className="text-red-400">*</span>
                    </label>
                    <textarea value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="How does this apply to clinical workflows, hospital networks, or patient care?" rows={3} maxLength={3000} className={`${inputCls('impact')} font-mono resize-y custom-scrollbar`} />
                    {errors.impact && <p className="mt-1 text-xs text-red-500">{errors.impact}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      4. References and Citations <span className="text-red-400">*</span>
                    </label>
                    <textarea value={references} onChange={(e) => setReferences(e.target.value)} placeholder="Paste links (e.g., https://...) or cite your sources here..." rows={2} maxLength={2000} className={`${inputCls('references')} font-mono resize-y custom-scrollbar`} />
                    {errors.references && <p className="mt-1 text-xs text-red-500">{errors.references}</p>}
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      5. Media, Document, or Visual Attachment (URL) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ImagePlus className="h-4 w-4 text-zinc-400" />
                      </div>
                      <input type="url" value={diagramUrl} onChange={(e) => setDiagramUrl(e.target.value)} placeholder="e.g., https://drive.google.com/... or https://images.unsplash.com/..." className={`${inputCls('diagramUrl')} pl-10`} />
                    </div>
                    {errors.diagramUrl && <p className="mt-1 text-xs text-red-500">{errors.diagramUrl}</p>}
                    <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium"><span className="font-bold text-sky-500">Visualizing a process? Use the <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-400">Mermaid Live Editor</a> instead of uploading an image.</span> Supported: Standard Image URLs (.png, .jpg, .gif), Google Drive links (PDFs/Docs), and Canva presentation links. For raw code or CLI logs, use markdown code blocks in the description.</p>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
          <button type="button" onClick={() => { reset(); onClose(); }} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors py-2.5 sm:py-0">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all text-zinc-900 bg-sky-400 hover:bg-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] disabled:opacity-60">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Your Contribution</>}
          </button>
        </div>

      </div>
    </div>
  );
}

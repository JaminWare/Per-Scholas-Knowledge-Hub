import { useState, useEffect } from 'react';
import {
  X, Send, Loader2, ChevronDown, Tag,
  FileText, Link2, BookOpen, Zap, GitBranch,
  AlertCircle, Link as LinkIcon, ImagePlus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type NewSubmission, saveLocalSubmission } from '../utils/submissions';

type SubmissionType = 'Article' | 'Study Tip' | 'Diagram' | 'Quick Reference' | 'Resource Link';

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

function getFilteredCategories(type: SubmissionType) {
  switch (type) {
    case 'Article':
      return MASTER_CATEGORIES.filter((c) => c.label === 'Study Tips').map(c => ({ ...c, label: 'General' }));
    case 'Study Tip':
      return MASTER_CATEGORIES.filter((c) => c.label === 'Study Tips');
    case 'Diagram':
    case 'Quick Reference':
      return MASTER_CATEGORIES;
    case 'Resource Link':
      return MASTER_CATEGORIES.map(c => ({ ...c, label: 'General' }));
  }
}

function getBadge(trackName: string): string {
  if (trackName.includes('Core 2')) return 'Core 2 Expert';
  if (trackName.includes('Advanced Healthcare IT')) return 'Healthcare IT Specialist';
  if (trackName.includes('Prompt Playbook')) return 'Playbook Engineer';
  if (trackName.includes('Diagrams')) return 'Diagram Architect';
  if (trackName.includes('Quick References')) return 'Reference Author';
  return 'Core 1 Expert';
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
    'This research directly supports professionals working within healthcare IT environments. The concepts covered relate to real-world clinical and administrative workflows — from EHR system configurations to HIPAA-compliant security postures.',
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

export default function ContributorSubmissionModal({ isOpen, onClose, onSubmitted, onRefresh }: { isOpen: boolean; onClose: () => void; onSubmitted: (s: NewSubmission) => void; onRefresh?: () => void; }) {
  const [fullName, setFullName] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('Article');
  
  const filteredCategories = getFilteredCategories(submissionType);
  const [track, setTrack] = useState(filteredCategories[0].sub[0]);
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');
  
  const [concept, setConcept] = useState('');
  const [aPlusRelevance, setAPlusRelevance] = useState('');
  const [impact, setImpact] = useState('');
  const [references, setReferences] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [diagramUrl, setDiagramUrl] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isResourceLink = submissionType === 'Resource Link';
  const autoBadge = getBadge(track);

  useEffect(() => {
    const newFiltered = getFilteredCategories(submissionType);
    setTrack(newFiltered[0].sub[0]);
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
    setTrack(MASTER_CATEGORIES[0].sub[0]);
    setTitle('');
    setConcept('');
    setAPlusRelevance('');
    setImpact('');
    setReferences('');
    setResourceUrl('');
    setDiagramUrl('');
    setErrors({});
    setFormError('');
    setIsTrackDropdownOpen(false);
  };

  const assembleContent = () => {
    if (isResourceLink) return resourceUrl.trim();
    let md = `## 🔬 Guided Description\n${concept.trim()}`;
    md += `\n\n## ⚡ CompTIA A+ Relevance\n${aPlusRelevance.trim()}`;
    md += `\n\n## 🏥 Healthcare IT Integration\n${impact.trim()}`;
    md += `\n\n## 🔗 References & Citations\n${references.trim()}`;
    if (diagramUrl.trim()) {
      md += `\n\n## 🗺️ Visual Architecture\n![Diagram](${diagramUrl.trim()})`;
    }
    return md;
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Required.';
    if (!title.trim()) e.title = 'Required.';
    
    if (isResourceLink) {
      if (!/^https?:\/\/.+/.test(resourceUrl.trim())) e.resourceUrl = 'Valid URL required.';
    } else {
      if (concept.trim().length < 15) e.concept = 'Required.';
      if (aPlusRelevance.trim().length < 15) e.aPlusRelevance = 'Required.';
      if (impact.trim().length < 15) e.impact = 'Required.';
      if (references.trim().length === 0) e.references = 'Required.';
    }
    
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const rawContent = assembleContent();

    if (PROFANITY_PATTERN.test(title) || PROFANITY_PATTERN.test(rawContent)) {
      setFormError('Submission contains restricted language. Please align your contribution with professional academic standards.');
      return;
    }

    setIsSubmitting(true);
    const formattedContent = !isResourceLink ? buildFormattedContent(fullName.trim(), track, rawContent) : null;

    try {
      const { data, error } = await supabase.from('submissions').insert({
        full_name: fullName.trim(), track, badge: autoBadge, title: title.trim(), content: rawContent, submission_type: submissionType, formatted_content: formattedContent, is_approved: false,
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
    } catch (err: any) {
      console.error('[Database Ingestion Failure]', err);
      alert(`Database Error: ${err?.message || JSON.stringify(err)} \n\nFalling back to local cache storage.`);
      
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
  const inputCls = (field: string) => `w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all ${errors[field] ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-800'}`;

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
              <div className="relative">
                <button type="button" onClick={() => setIsTrackDropdownOpen(!isTrackDropdownOpen)} className={`${inputCls('track')} flex justify-between items-center text-left`}>
                  <span className="truncate pr-4 text-zinc-900 dark:text-zinc-100">{track}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform ${isTrackDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isTrackDropdownOpen && (
                  <div className="w-full mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-inner overflow-hidden flex flex-col">
                    <div className="bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                      Track
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-3">
                      {filteredCategories.map((cat) => (
                        <div key={cat.label}>
                          <div className="px-2 py-1 text-[10px] font-bold text-sky-500 uppercase tracking-wider">{cat.label}</div>
                          <div className="mt-1 space-y-1">
                            {cat.sub.map((subTrack) => (
                              <button key={subTrack} type="button" onClick={() => { setTrack(subTrack); setIsTrackDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${track === subTrack ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'}`}>
                                {subTrack}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"><LinkIcon className="w-3.5 h-3.5 text-emerald-500" /> Resource URL</label>
                  <input type="url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://…" className={inputCls('resourceUrl')} />
                  {errors.resourceUrl && <p className="mt-1 text-xs text-red-500">{errors.resourceUrl}</p>}
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
                      5. Diagram / Visual Attachment <span className="text-zinc-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ImagePlus className="h-4 w-4 text-zinc-400" />
                      </div>
                      <input type="url" value={diagramUrl} onChange={(e) => setDiagramUrl(e.target.value)} placeholder="Paste image URL (e.g., https://imgur.com/...)" className={`${inputCls('diagramUrl')} pl-10`} />
                    </div>
                    <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-500 font-medium">⚠️ Supported file types: .png, .jpg, .jpeg, .svg (Max size: 5MB). Ensure text in diagrams is highly legible to preserve UI layout responsiveness.</p>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <button type="button" onClick={() => { reset(); onClose(); }} className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all text-zinc-900 bg-amber-400 hover:bg-amber-500 shadow-amber-500/20 disabled:opacity-60">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Your Contribution</>}
          </button>
        </div>

      </div>
    </div>
  );
}
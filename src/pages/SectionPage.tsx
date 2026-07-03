import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import CardZoomOverlay from '../components/CardZoomOverlay';
import ArticleRenderer from '../components/ArticleRenderer';
import ContributorSubmissionModal from '../components/ContributorSubmissionModal';
import contentMap, { type LocalArticle } from '../data/contentMap';
import { extractReferences } from '../utils/extractReferences';
import { useArticles, type ArticleWithContributor } from '../hooks/useArticles';
import { normalizeCategory } from '../utils/normalizeCategory';
import { COMPTIA_OBJECTIVES } from '../lib/domainObjectives';
import {
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users,
  Lightbulb, Sparkles, Layout, Laptop, Monitor, Database,
  Heart, BookOpen, Link2, Check, ArrowLeft, ArrowRight, ArrowDown,
  Construction, Layers, Target, Bookmark, Compass,
} from 'lucide-react';

const sectionMeta: Record<string, { title: string; icon: React.ComponentType<{ className?: string }>; track?: string }> = {
  'study-tips':            { title: 'Study Tips', icon: Lightbulb },
  'study-tips/core1-overview': { title: 'Core 1 Overview', icon: Lightbulb, track: 'Study Tips' },
  'study-tips/acronyms': { title: 'Acronym Master Directory', icon: Lightbulb, track: 'Study Tips' },
  'diagrams':              { title: 'Diagrams', icon: Layout },
  'azari-prompt-playbook': { title: 'Prompt Playbook', icon: Sparkles },
  'azari-prompt-playbook/pbq-prompts':    { title: 'PBQ Simulation Prompts', icon: Sparkles, track: 'Prompt Playbook' },
  'core1-mobile':          { title: 'Domain 1.0 — Mobile Devices', icon: Laptop, track: 'CompTIA A+ Core 1' },
  'core1-networking':      { title: 'Domain 2.0 — Networking', icon: Network, track: 'CompTIA A+ Core 1' },
  'core1-hardware':        { title: 'Domain 3.0 — Hardware', icon: Cpu, track: 'CompTIA A+ Core 1' },
  'core1-cloud':           { title: 'Domain 4.0 — Virtualization & Cloud', icon: Cloud, track: 'CompTIA A+ Core 1' },
  'core1-virtualization':  { title: 'Domain 4.0 — Virtualization & Cloud', icon: Cloud, track: 'CompTIA A+ Core 1' },
  'core1-troubleshooting': { title: 'Domain 5.0 — HW & Network Troubleshooting', icon: Wrench, track: 'CompTIA A+ Core 1' },
  'core2-os':              { title: 'Domain 1.0 — Operating Systems', icon: Monitor, track: 'CompTIA A+ Core 2' },
  'core2-os/cli-runbook': { title: 'CLI Command Runbook', icon: Monitor, track: 'CompTIA A+ Core 2' },
  'core2-security':        { title: 'Domain 2.0 — Security', icon: Shield, track: 'CompTIA A+ Core 2' },
  'core2-software':        { title: 'Domain 3.0 — Software Troubleshooting', icon: Wrench, track: 'CompTIA A+ Core 2' },
  'core2-operations':      { title: 'Domain 4.0 — Operational Procedures', icon: Users, track: 'CompTIA A+ Core 2' },
  'healthcare-ehr':        { title: 'EHR Architecture', icon: Database, track: 'Advanced Healthcare IT' },
  'healthcare-hipaa':      { title: 'HIPAA Data Security', icon: Lock, track: 'Advanced Healthcare IT' },
  'healthcare-clinical':   { title: 'Clinical Workflows', icon: Heart, track: 'Advanced Healthcare IT' },
  'learner-experience/navigation':  { title: 'Navigating the Hub: Search, Domains & Filtering', icon: Compass, track: 'Learner Experience & FAQs' },
  'learner-experience/adding-intel': { title: 'Adding Intel: How to Submit Your Field Notes', icon: BookOpen, track: 'Learner Experience & FAQs' },
};

const roleColors: Record<string, string> = {
  'Core 1 Expert':       'bg-sky-500/10 text-sky-400',
  'Core 2 Expert':       'bg-sky-500/10 text-sky-400',
  'HealthIT Specialist': 'bg-sky-500/10 text-sky-400',
  'AI Prompt Engineer':  'bg-sky-500/10 text-sky-400',
  'Reference Author':    'bg-amber-500/10 text-amber-400',
};

const KNOWN_AUTHORS: Record<string, string> = {
  'firewall-basics':               'Jamin Ware',
  'command-documentation':         'Jamin Ware',
  'snap-in':                       'Jamin Ware',
  'intro-healthcare-it-security':  'Jamin Ware',
  'cloud-computing-healthcare':    'Jamin Ware',
  'ai-prompt-engineering-healthcare': 'Jamin Ware',
  'core2-os/cli-runbook':          'Jamin Ware',
  'study-tips/acronyms':           'Cohort Lead',
  'healthcare-ehr':                'Jamin Ware',
  'healthcare-ehr/integration':    'Jamin Ware',
  'healthcare-clinical/cpoe':      'Jamin Ware',
  'learner-experience/navigation':  'Jamin Ware',
  'learner-experience/adding-intel': 'Jamin Ware',
};

const CANONICAL_DOMAINS: Record<string, string> = {
  'Domain 1.0 — Mobile Devices': 'CompTIA A+ Core 1 — Domain 1.0 (Mobile Devices)',
  'Domain 2.0 — Networking': 'CompTIA A+ Core 1 — Domain 2.0 (Networking)',
  'Domain 3.0 — Hardware': 'CompTIA A+ Core 1 — Domain 3.0 (Hardware)',
  'Domain 4.0 — Virtualization & Cloud': 'CompTIA A+ Core 1 — Domain 4.0 (Cloud)',
  'Domain 5.0 — Hardware & Network Troubleshooting': 'CompTIA A+ Core 1 — Domain 5.0 (Troubleshooting)',
  'Domain 1.0 — Operating Systems': 'CompTIA A+ Core 2 — Domain 1.0 (Operating Systems)',
  'Domain 2.0 — Security': 'CompTIA A+ Core 2 — Domain 2.0 (Security)',
  'Domain 3.0 — Software Troubleshooting': 'CompTIA A+ Core 2 — Domain 3.0 (Software Troubleshooting)',
  'Domain 4.0 — Operational Procedures': 'CompTIA A+ Core 2 — Domain 4.0 (Operational Procedures)',
  'EHR Architecture': 'Advanced Healthcare IT — EHR Architecture',
  'HIPAA Data Security': 'Advanced Healthcare IT — HIPAA Data Security',
  'Clinical Workflows': 'Advanced Healthcare IT — Clinical Workflows',
};

const CURRICULUM_TRACKS = [
  {
    track: 'CompTIA A+ Core 1',
    icon: Laptop,
    color: 'sky' as const,
    domains: [
      'Domain 1.0 — Mobile Devices',
      'Domain 2.0 — Networking',
      'Domain 3.0 — Hardware',
      'Domain 4.0 — Virtualization & Cloud',
      'Domain 5.0 — Hardware & Network Troubleshooting',
    ],
  },
  {
    track: 'CompTIA A+ Core 2',
    icon: Monitor,
    color: 'teal' as const,
    domains: [
      'Domain 1.0 — Operating Systems',
      'Domain 2.0 — Security',
      'Domain 3.0 — Software Troubleshooting',
      'Domain 4.0 — Operational Procedures',
    ],
  },
  {
    track: 'Advanced Healthcare IT',
    icon: Heart,
    color: 'cyan' as const,
    domains: [
      'EHR Architecture',
      'HIPAA Data Security',
      'Clinical Workflows',
    ],
  },
] as const;

const SLUG_TO_DOMAIN: Record<string, { domain: string; trackIndex: number }> = {
  'core1-mobile':          { domain: 'Domain 1.0 — Mobile Devices', trackIndex: 0 },
  'core1-networking':      { domain: 'Domain 2.0 — Networking', trackIndex: 0 },
  'core1-hardware':        { domain: 'Domain 3.0 — Hardware', trackIndex: 0 },
  'core1-cloud':           { domain: 'Domain 4.0 — Virtualization & Cloud', trackIndex: 0 },
  'core1-virtualization':  { domain: 'Domain 4.0 — Virtualization & Cloud', trackIndex: 0 },
  'core1-troubleshooting': { domain: 'Domain 5.0 — Hardware & Network Troubleshooting', trackIndex: 0 },
  'core2-os':              { domain: 'Domain 1.0 — Operating Systems', trackIndex: 1 },
  'core2-security':        { domain: 'Domain 2.0 — Security', trackIndex: 1 },
  'core2-software':        { domain: 'Domain 3.0 — Software Troubleshooting', trackIndex: 1 },
  'core2-operations':      { domain: 'Domain 4.0 — Operational Procedures', trackIndex: 1 },
  'healthcare-ehr':        { domain: 'EHR Architecture', trackIndex: 2 },
  'healthcare-hipaa':      { domain: 'HIPAA Data Security', trackIndex: 2 },
  'healthcare-clinical':   { domain: 'Clinical Workflows', trackIndex: 2 },
};

const TRACK_COLORS = {
  sky:  { header: 'text-sky-600 dark:text-sky-400',   icon: 'bg-sky-500/10 text-sky-500',   domainHeader: 'text-sky-500 dark:text-sky-400'  },
  teal: { header: 'text-sky-600 dark:text-sky-400', icon: 'bg-sky-500/10 text-sky-500', domainHeader: 'text-sky-500 dark:text-sky-400' },
  cyan: { header: 'text-sky-600 dark:text-sky-400', icon: 'bg-sky-500/10 text-sky-500', domainHeader: 'text-sky-500 dark:text-sky-400' },
};

const DASHBOARD_CONTEXTS: Record<string, string> = {
  'study-tips':            'Study Tips',
  'diagrams':              'Diagram',
  'azari-prompt-playbook': 'Prompt',
};

const RESOURCE_TABS = ['All', 'Study Tips', 'Diagrams', 'Prompt Playbook', 'Quick References'] as const;
type ResourceTab = typeof RESOURCE_TABS[number];

const TAB_ICONS: Record<ResourceTab, React.ComponentType<{ className?: string }>> = {
  'All': Layers,
  'Study Tips': Lightbulb,
  'Diagrams': Layout,
  'Prompt Playbook': Sparkles,
  'Quick References': Bookmark,
};

const TAB_TO_CONTEXT: Record<ResourceTab, string> = {
  'All': 'All',
  'Study Tips': 'Study Tips',
  'Diagrams': 'Diagram',
  'Prompt Playbook': 'Prompt',
  'Quick References': 'Quick Reference',
};

const SCROLL_TRACK = 'flex overflow-x-auto gap-4 pb-4 pt-1 snap-x snap-mandatory [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-transparent';
const CARD_WIDTH = 'w-[280px] sm:w-[320px] md:w-[350px] shrink-0 snap-start';

function contentMapEntryToArticle(slug: string, entry: LocalArticle): ArticleWithContributor {
  const introBlock = entry.content.find((b) => b.type === 'intro');
  return {
    id: `local-${slug}`,
    title: entry.title,
    slug,
    section_id: null,
    content: '',
    formatted_content: null,
    excerpt: introBlock && 'text' in introBlock ? introBlock.text.slice(0, 160) : null,
    contributor_id: null,
    tags: entry.tags ?? [],
    is_featured: false,
    is_sample: false,
    study_category: entry.studyCategory || normalizeCategory(entry.trackLabel, entry.title),
    source_file: null,
    author_name: entry.contributor,
    submission_type: 'Quick Reference',
    comp_objective: entry.studyCategory || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function getLocalArticlesForSection(sectionSlug: string): ArticleWithContributor[] {
  const prefix = sectionSlug + '/';
  return Object.entries(contentMap)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, entry]) => contentMapEntryToArticle(key, entry));
}

function groupByObjective(
  articles: ArticleWithContributor[],
  canonicalTrack?: string,
): [string, ArticleWithContributor[]][] {
  const map = new Map<string, ArticleWithContributor[]>();
  for (const a of articles) {
    const key = a.comp_objective?.trim();
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }

  const knownOrder = canonicalTrack ? (COMPTIA_OBJECTIVES[canonicalTrack] ?? []) : [];
  const ordered: [string, ArticleWithContributor[]][] = [];

  for (const obj of knownOrder) {
    if (map.has(obj)) {
      ordered.push([obj, map.get(obj)!]);
      map.delete(obj);
    }
  }

  for (const [key, items] of map) {
    ordered.push([key, items]);
  }

  return ordered;
}

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const url = `${window.location.origin}${window.location.pathname}#/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        copied
          ? 'bg-sky-500/10 text-sky-500 dark:text-sky-400'
          : 'bg-zinc-200 dark:bg-zinc-100 text-zinc-500 dark:text-zinc-700 hover:bg-sky-100 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

function ComingSoonPanel({ minimal = false }: { minimal?: boolean }) {
  const navigate = useNavigate();
  if (minimal) {
    return (
      <div className={`${CARD_WIDTH} flex flex-col items-center justify-center gap-3 p-8 bg-white/80 dark:bg-slate-700/60 border border-dashed border-zinc-300 dark:border-slate-600 rounded-xl text-center`}>
        <Construction className="w-7 h-7 text-amber-400" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          This module is currently being built or undergoing moderation review. Check back shortly!
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
        <Construction className="w-8 h-8 text-amber-500 dark:text-amber-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Coming Soon</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
          This module is currently being built or undergoing moderation review by our Cohort Leaders. Check back shortly!
        </p>
      </div>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm font-medium transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  );
}

function ResourcePlacard({ activeTab, onTabChange }: { activeTab: ResourceTab; onTabChange: (tab: ResourceTab) => void }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-slate-50 dark:bg-zinc-800/50 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        {RESOURCE_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm border-transparent dark:bg-sky-500/30 dark:text-sky-300 dark:border-sky-400/50'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-transparent dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white dark:border-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ObjectivePlacard({
  domainInfo,
  activeObjective,
  onObjectiveChange,
  activeTab,
  onTabChange,
}: {
  domainInfo: { domain: string; trackIndex: number };
  activeObjective: string;
  onObjectiveChange: (obj: string) => void;
  activeTab: ResourceTab;
  onTabChange: (tab: ResourceTab) => void;
}) {
  const canonicalTrack = CANONICAL_DOMAINS[domainInfo.domain] || domainInfo.domain;
  const objectives = COMPTIA_OBJECTIVES[canonicalTrack] ?? [];

  return (
    <div className="space-y-3">
      {objectives.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-slate-50 dark:bg-zinc-800/50 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Objectives</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onObjectiveChange('All')}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                activeObjective === 'All'
                  ? 'bg-sky-600 text-white shadow-sm border-transparent dark:bg-sky-500/30 dark:text-sky-300 dark:border-sky-400/50'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-transparent dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white dark:border-zinc-700'
              }`}
            >
              All Objectives
            </button>
            {objectives.map((obj) => (
              <button
                key={obj}
                type="button"
                onClick={() => onObjectiveChange(obj)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                  activeObjective === obj
                    ? 'bg-sky-600 text-white shadow-sm border-transparent dark:bg-sky-500/30 dark:text-sky-300 dark:border-sky-400/50'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-transparent dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white dark:border-zinc-700'
                }`}
              >
                {obj}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-slate-50 dark:bg-zinc-800/50 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {RESOURCE_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm border-transparent dark:bg-sky-500/30 dark:text-sky-300 dark:border-sky-400/50'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-transparent dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white dark:border-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function parseAuthorFromExcerpt(excerpt: string | null | undefined): string | null {
  if (!excerpt?.startsWith('Contributed by ')) return null;
  return excerpt.replace('Contributed by ', '').trim() || null;
}

function AppletCard({ article, gridMode = false }: { article: ArticleWithContributor; gridMode?: boolean }) {
  const [zoomed, setZoomed] = useState(false);
  const isSample = article.is_sample;
  const authorName = (article.contributor as { name: string } | null)?.name
    ?? KNOWN_AUTHORS[article.slug]
    ?? parseAuthorFromExcerpt(article.excerpt)
    ?? (isSample ? '[OPEN SLOT]' : 'Knowledge Base');

  const widthClass = gridMode ? 'w-full' : CARD_WIDTH;

  const cardContent = (
    <>
      <div
        className={`flex items-center justify-between px-3 py-1.5 ${
          isSample ? 'bg-zinc-800 dark:bg-zinc-900/80' : 'bg-zinc-800 dark:bg-zinc-900'
        }`}
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
      >
        <div className="flex items-center gap-2">
          {isSample ? (
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse flex-shrink-0" />
          ) : (
            <span className="text-[11px] font-mono font-bold text-sky-400 select-none">{`</>`}</span>
          )}
          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">
            {article.slug?.split('/').pop() || 'resource'}
          </span>
        </div>
        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wide flex-shrink-0 ${
          isSample
            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20'
            : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
        }`} style={isSample ? { textShadow: '0 0 8px rgba(56,189,248,0.8)' } : undefined}>
          {isSample ? '[OPEN SLOT]' : '[Verified Peer Build]'}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform ${
            isSample ? 'bg-gradient-to-br from-sky-400 to-sky-500 shadow-sky-500/20' : 'bg-gradient-to-br from-sky-500 to-sky-400 shadow-sky-500/20'
          }`}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm leading-snug line-clamp-2 transition-colors duration-200 ${
              isSample
                ? 'text-sky-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-zinc-50'
                : 'text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-zinc-50'
            }`}>
              {article.title}
              {!isSample && (
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors duration-200 group-hover:text-zinc-400 dark:group-hover:text-zinc-300 mt-1">Curated by {article.author || authorName}</p>
              )}
            </h3>
          </div>
        </div>

        {!isSample && article.excerpt && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 transition-colors duration-200 line-clamp-2 leading-relaxed">{article.excerpt}</p>
        )}

        {!isSample && article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-100 text-zinc-600 dark:text-zinc-700 border border-zinc-300/60 dark:border-zinc-300">
                {tag}
              </span>
            ))}
          </div>
        )}

        {isSample && (
          <p className="text-[11px] text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-500/10 rounded-lg px-2.5 py-2 border border-sky-200/60 dark:border-sky-500/20" style={{ textShadow: '0 0 6px rgba(56,189,248,0.4)' }}>
            This curriculum endpoint is currently open for peer review and documentation.
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className={`${widthClass} group flex flex-col rounded-xl border overflow-hidden transition-all duration-300 ease-out ${
      isSample
        ? 'bg-zinc-100/60 dark:bg-zinc-950/50 border-sky-200/60 dark:border-zinc-800 hover:border-sky-400/70 dark:hover:border-zinc-600 hover:shadow-[0_0_0_1.5px_rgba(56,189,248,0.5),0_4px_16px_rgba(56,189,248,0.08)] dark:hover:shadow-[0_4px_20px_rgba(255,255,255,0.04)]'
        : 'bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 hover:border-sky-400/50 dark:hover:border-zinc-600 hover:shadow-md dark:hover:shadow-[0_4px_20px_rgba(255,255,255,0.04)]'
    }`}>
      <div className="cursor-zoom-in" onClick={() => setZoomed(true)}>
        {cardContent}
      </div>

      <div className="px-4 pb-4 mt-auto">
        {article.submission_type === 'Resource Link' ? (
          <a
            href={article.content}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border bg-sky-50/50 hover:bg-sky-500 text-sky-600 dark:text-sky-400 hover:text-white border-sky-500/20 hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]"
          >
            View Resource ↗
          </a>
        ) : (
          <Link
            to={`/article/${article.slug}`}
            className={`inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border ${
              isSample
                ? 'bg-sky-500/10 hover:bg-sky-500 text-sky-700 dark:text-sky-400 hover:text-white border-sky-500/20 hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'bg-sky-500/10 hover:bg-sky-500 text-sky-600 dark:text-sky-400 hover:text-white border-sky-500/20 hover:border-sky-500 hover:shadow-md hover:shadow-sky-500/20'
            }`}
          >
            Read Mission Brief
          </Link>
        )}
      </div>

      <CardZoomOverlay open={zoomed} onClose={() => setZoomed(false)}>
        <div className="rounded-xl overflow-hidden">
          {cardContent}
          <div className="px-4 pb-4 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50">
            {article.submission_type === 'Resource Link' ? (
              <a
                href={article.content}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 hover:border-sky-500 transition-all duration-200"
              >
                View Resource ↗
              </a>
            ) : (
              <Link
                to={`/article/${article.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 hover:border-sky-500 transition-all duration-200"
              >
                Read Mission Brief <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </CardZoomOverlay>
    </div>
  );
}

function AppletSkeleton() {
  return (
    <div className={`${CARD_WIDTH} bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 animate-pulse`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
      </div>
      <div className="h-9 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
    </div>
  );
}

function OpenSlotPlaceholder({ domain, context, onContribute, gridMode = false }: { domain: string; context: string; onContribute: () => void; gridMode?: boolean }) {
  const widthClass = gridMode ? 'w-full' : CARD_WIDTH;
  return (
    <div className={`${widthClass} group flex flex-col rounded-xl border overflow-hidden bg-slate-50 dark:bg-zinc-900 border-sky-200/60 dark:border-zinc-800`}>
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 dark:bg-zinc-900/80"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse flex-shrink-0" />
          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">open-slot</span>
        </div>
        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wider flex-shrink-0 bg-sky-500/20 text-sky-400 border border-sky-500/20" style={{ textShadow: '0 0 8px rgba(56,189,248,0.8)' }}>
          [OPEN SLOT]
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-sky-400 to-sky-500 shadow-sky-500/20">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
              {domain} — {context}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[8px] font-bold">?</span>
              </div>
              <span className="text-[11px] text-slate-900 dark:text-white truncate font-mono font-bold tracking-wider transition-colors duration-200 group-hover:text-sky-600 dark:group-hover:text-sky-400" style={{ textShadow: '0 0 6px rgba(56,189,248,0.6)' }}>[OPEN SLOT]</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 bg-slate-100/60 dark:bg-sky-500/10 rounded-lg px-2.5 py-2 border border-sky-200/60 dark:border-sky-500/20" style={{ textShadow: '0 0 6px rgba(56,189,248,0.4)' }}>
          This curriculum endpoint is currently open for peer review and documentation.
        </p>
        <button
          type="button"
          onClick={onContribute}
          className="mt-auto inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border bg-sky-500/10 hover:bg-sky-500 text-sky-700 dark:text-sky-400 hover:text-white border-sky-500/20 hover:border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]"
        >
          Add Intel
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function TrackDomains({
  domains,
  colors,
  articles,
  isLoading,
  context,
  onContribute,
  gridMode = false,
}: {
  domains: readonly string[];
  colors: { domainHeader: string };
  articles: ArticleWithContributor[];
  isLoading: boolean;
  context: string;
  onContribute: () => void;
  gridMode?: boolean;
}) {
  return (
    <div className="space-y-8">
      {domains.map((domain) => {
        const canonicalTarget = CANONICAL_DOMAINS[domain] || domain;
        const domainArticles = articles.filter((a) => a.study_category === canonicalTarget);
        return (
          <div key={domain}>
            {!gridMode && (
              <div className="flex items-center gap-2 mb-3">
                <h3 className={`text-sm font-bold ${colors.domainHeader}`}>{domain}</h3>
                {!isLoading && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-100 text-zinc-600 dark:text-zinc-700">
                    {domainArticles.length}
                  </span>
                )}
              </div>
            )}
            {gridMode ? (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AppletSkeleton />
                    <AppletSkeleton />
                    <AppletSkeleton />
                  </div>
                ) : domainArticles.length > 0 ? (
                  <div className="space-y-0">
                    {groupByObjective(domainArticles, canonicalTarget).map(([objective, items], idx) => (
                      <div key={objective}>
                        <div className={`flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700/50 ${idx === 0 ? 'mt-0' : 'mt-8'}`}>
                          <Target className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">{objective}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-100 text-zinc-600 dark:text-zinc-700">
                            {items.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                          {items.map((a) => <AppletCard key={a.id} article={a} gridMode />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <OpenSlotPlaceholder domain={domain} context={context} onContribute={onContribute} gridMode />
                  </div>
                )}
              </>
            ) : (
              <div className={SCROLL_TRACK}>
                {isLoading ? (
                  <>
                    <AppletSkeleton />
                    <AppletSkeleton />
                  </>
                ) : domainArticles.length > 0 ? (
                  domainArticles.map((a) => <AppletCard key={a.id} article={a} />)
                ) : (
                  <OpenSlotPlaceholder domain={domain} context={context} onContribute={onContribute} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CurriculumDashboard({
  articles,
  isLoading,
  context,
  onContribute,
  focusDomain,
  activeTab,
  activeObjective,
}: {
  articles: ArticleWithContributor[];
  isLoading: boolean;
  context: string;
  onContribute: () => void;
  focusDomain?: { domain: string; trackIndex: number };
  activeTab?: ResourceTab;
  activeObjective?: string;
}) {
  const isVisibleInContext = (a: ArticleWithContributor) => {
    if (context === 'All') {
      return !a.is_sample;
    }
    if (context === 'Quick Reference') {
      return a.is_sample || (a.submission_type ?? '').toLowerCase() === 'quick reference' || (a.submission_type ?? '').toLowerCase() === 'resource link';
    }
    if (context === 'Study Tips') {
      const type = (a.submission_type ?? '').toLowerCase();
      return a.is_sample || type === 'article' || type === 'study tip' || type === 'quick reference' || type === '';
    }
    if (context === 'Diagram') {
      return a.is_sample || (a.submission_type ?? '').toLowerCase() === 'diagram';
    }
    if (context === 'Prompt') {
      return a.is_sample || (a.submission_type ?? '').toLowerCase() === 'prompt playbook';
    }
    return true;
  };

  const referenceCards = useMemo<ArticleWithContributor[]>(() => {
    if (context !== 'Quick Reference') return [];
    const nonQrArticles = articles.filter((a) => {
      const type = (a.submission_type ?? '').toLowerCase();
      return type !== 'quick reference' && type !== 'resource link' && !a.is_sample;
    });
    const cards: ArticleWithContributor[] = [];
    const seenUrls = new Set<string>();
    for (const article of nonQrArticles) {
      const refs = extractReferences(article.formatted_content ?? article.content);
      for (const ref of refs) {
        if (seenUrls.has(ref.url)) continue;
        seenUrls.add(ref.url);
        cards.push({
          id: `ref-${ref.url}`,
          title: ref.label,
          slug: `ref-${encodeURIComponent(ref.url)}`,
          section_id: null,
          content: ref.url,
          formatted_content: null,
          excerpt: `Extracted from: ${article.title}`,
          contributor_id: null,
          tags: [],
          is_featured: false,
          is_sample: false,
          study_category: article.study_category,
          source_file: null,
          author_name: article.author_name ?? null,
          submission_type: 'Resource Link',
          created_at: article.created_at,
          updated_at: article.created_at,
        });
      }
    }
    return cards;
  }, [articles, context]);

  const visibleArticles = useMemo(() => {
    let base = articles;
    if (context === 'Quick Reference' && referenceCards.length > 0) {
      const existingUrls = new Set(
        articles.filter((a) => (a.submission_type ?? '').toLowerCase() === 'resource link').map((a) => a.content?.trim())
      );
      const newRefs = referenceCards.filter((r) => !existingUrls.has(r.content?.trim()));
      base = [...articles, ...newRefs];
    }
    return base.filter(isVisibleInContext);
  }, [articles, referenceCards, context]);

  if (focusDomain) {
    const track = CURRICULUM_TRACKS[focusDomain.trackIndex];
    const colors = TRACK_COLORS[track.color];
    const canonicalTarget = CANONICAL_DOMAINS[focusDomain.domain] || focusDomain.domain;

    const objectiveFilteredArticles = activeObjective && activeObjective !== 'All'
      ? articles.filter((a) => a.comp_objective === activeObjective)
      : articles;

    if (activeTab === 'All') {
      const allDomainArticles = objectiveFilteredArticles.filter((a) => a.study_category === canonicalTarget && !a.is_sample);
      const hasAnyContent = allDomainArticles.length > 0;

      if (isLoading) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AppletSkeleton />
            <AppletSkeleton />
            <AppletSkeleton />
          </div>
        );
      }

      if (!hasAnyContent) {
        return (
          <div className="flex justify-center py-12">
            <div className="w-full max-w-sm group flex flex-col rounded-xl border overflow-hidden bg-slate-50 dark:bg-zinc-900 border-sky-200/60 dark:border-zinc-800">
              <div
                className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 dark:bg-zinc-900/80"
                style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse flex-shrink-0" />
                  <span className="text-[10px] font-mono text-zinc-500">first-contribution</span>
                </div>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wider flex-shrink-0 bg-sky-500/20 text-sky-400 border border-sky-500/20" style={{ textShadow: '0 0 8px rgba(56,189,248,0.8)' }}>
                  [PIONEER]
                </span>
              </div>
              <div className="flex flex-col gap-3 p-5 flex-1 items-center text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-400 to-sky-500 shadow-lg shadow-sky-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-base text-zinc-800 dark:text-white">Be the first to contribute to this domain!</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  No peer submissions exist yet. Your contribution will pioneer this curriculum track for the cohort.
                </p>
                <button
                  type="button"
                  onClick={onContribute}
                  className="mt-2 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border bg-sky-500/10 hover:bg-sky-500 text-sky-700 dark:text-sky-400 hover:text-white border-sky-500/20 hover:border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]"
                >
                  Submit a Contribution
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-0">
          {groupByObjective(allDomainArticles, canonicalTarget).map(([objective, items], idx) => (
            <div key={objective}>
              <div className={`flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700/50 ${idx === 0 ? 'mt-0' : 'mt-8'}`}>
                <Target className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">{objective}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-100 text-zinc-600 dark:text-zinc-700">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {items.map((a) => <AppletCard key={a.id} article={a} gridMode />)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    const filteredVisible = activeObjective && activeObjective !== 'All'
      ? visibleArticles.filter((a) => a.comp_objective === activeObjective)
      : visibleArticles;

    return (
      <TrackDomains
        domains={[focusDomain.domain]}
        colors={colors}
        articles={filteredVisible}
        isLoading={isLoading}
        context={context}
        onContribute={onContribute}
        gridMode
      />
    );
  }

  const [core1, core2, healthcare] = CURRICULUM_TRACKS;

  const allCanonicalTargets = useMemo(() => {
    const targets = new Set<string>();
    for (const track of CURRICULUM_TRACKS) {
      for (const domain of track.domains) {
        targets.add(CANONICAL_DOMAINS[domain] || domain);
      }
    }
    return targets;
  }, []);

  const uncategorizedArticles = useMemo(() => {
    return visibleArticles.filter((a) => !a.is_sample && !allCanonicalTargets.has(a.study_category ?? ''));
  }, [visibleArticles, allCanonicalTargets]);

  return (
    <div className="space-y-10">
      {uncategorizedArticles.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-sky-500/10 text-sky-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">General Resources</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-100 text-zinc-600 dark:text-zinc-700">
              {uncategorizedArticles.length}
            </span>
          </div>
          <div className={SCROLL_TRACK}>
            {uncategorizedArticles.map((a) => <AppletCard key={a.id} article={a} />)}
          </div>
        </section>
      )}
      <div className="grid grid-cols-2 gap-6 items-start min-w-[640px] md:min-w-0 overflow-x-auto md:overflow-x-visible">
        <section className="min-w-[300px]">
          <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-zinc-200 dark:border-zinc-700">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TRACK_COLORS[core1.color].icon}`}>
              <core1.icon className="w-4 h-4" />
            </div>
            <h2 className={`text-base font-bold uppercase tracking-widest ${TRACK_COLORS[core1.color].header}`}>{core1.track}</h2>
          </div>
          <TrackDomains
            domains={core1.domains}
            colors={TRACK_COLORS[core1.color]}
            articles={visibleArticles}
            isLoading={isLoading}
            context={context}
            onContribute={onContribute}
          />
        </section>

        <section className="min-w-[300px]">
          <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-zinc-200 dark:border-zinc-700">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TRACK_COLORS[core2.color].icon}`}>
              <core2.icon className="w-4 h-4" />
            </div>
            <h2 className={`text-base font-bold uppercase tracking-widest ${TRACK_COLORS[core2.color].header}`}>{core2.track}</h2>
          </div>
          <TrackDomains
            domains={core2.domains}
            colors={TRACK_COLORS[core2.color]}
            articles={visibleArticles}
            isLoading={isLoading}
            context={context}
            onContribute={onContribute}
          />
        </section>
      </div>

      <section>
        <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TRACK_COLORS[healthcare.color].icon}`}>
            <healthcare.icon className="w-4 h-4" />
          </div>
          <h2 className={`text-base font-bold uppercase tracking-widest ${TRACK_COLORS[healthcare.color].header}`}>{healthcare.track}</h2>
        </div>
        <TrackDomains
          domains={healthcare.domains}
          colors={TRACK_COLORS[healthcare.color]}
          articles={visibleArticles}
          isLoading={isLoading}
          context={context}
          onContribute={onContribute}
        />
      </section>
    </div>
  );
}

export default function SectionPage({ refreshKey = 0, onRefresh }: { refreshKey?: number; onRefresh?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const slug = location.pathname.replace(/^\//, '').replace(/\/$/, '');

  const rawTab = searchParams.get('tab');
  const validatedTab: ResourceTab = RESOURCE_TABS.includes(rawTab as ResourceTab)
    ? (rawTab as ResourceTab)
    : 'All';
  const [activeTab, setActiveTab] = useState<ResourceTab>(validatedTab);
  const [activeObjective, setActiveObjective] = useState('All');

  const handleTabChange = (tab: ResourceTab) => {
    setActiveTab(tab);
    if (tab === 'All') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  const { articles: allArticles, isLoading } = useArticles(refreshKey);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setActiveObjective('All');
  }, [slug]);

  const meta = sectionMeta[slug];
  const Icon = meta?.icon ?? BookOpen;
  const localContent = contentMap[slug];
  const isSubPage = slug.includes('/') || (meta?.track !== undefined);
  const isDomainSection = meta?.track !== undefined && !slug.includes('/');
  const dashboardContext = DASHBOARD_CONTEXTS[slug];
  const domainInfo = SLUG_TO_DOMAIN[slug];

  const mergedArticles = useMemo(() => {
    const sectionSlug = domainInfo ? slug : dashboardContext ? slug : null;
    if (!sectionSlug) return allArticles;
    const localArticles = getLocalArticlesForSection(sectionSlug);
    if (localArticles.length === 0) return allArticles;
    const existingSlugs = new Set(allArticles.map((a) => a.slug));
    const newLocals = localArticles.filter((la) => !existingSlugs.has(la.slug));
    return newLocals.length > 0 ? [...allArticles, ...newLocals] : allArticles;
  }, [allArticles, slug, domainInfo, dashboardContext]);

  const isKnownSlug = !!(meta || localContent || dashboardContext || domainInfo);

  useEffect(() => {
    if (!isKnownSlug) {
      navigate('/', { replace: true });
    }
  }, [isKnownSlug, navigate]);

  if (!isKnownSlug) return null;

  if (localContent && !isDomainSection) {
    const roleColor = roleColors[localContent.contributorRole ?? ''] ?? 'bg-zinc-800 text-zinc-400';
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 mb-6 cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Previous Page
        </button>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-sky-950 dark:from-zinc-900 dark:via-zinc-800 dark:to-sky-950 border border-zinc-300 dark:border-zinc-700 p-8 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30">
                <Icon className="w-6 h-6 text-sky-400" />
              </div>
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                {localContent.trackLabel}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-4">{localContent.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white text-xs font-bold">
                  {localContent.contributor.charAt(0)}
                </div>
                <span className="text-sm text-zinc-300">{localContent.contributor}</span>
              </div>
              {localContent.contributorRole && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleColor}`}>
                  [{localContent.contributorRole}]
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {localContent.cohort}
              </span>
              {localContent.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-zinc-700/60 text-zinc-400">{tag}</span>
              ))}
              <div className="ml-auto">
                <CopyLinkButton slug={slug} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 md:p-8">
          <ArticleRenderer blocks={localContent.content} />
        </div>

        {!isLoading && mergedArticles.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">More in this section</h2>
            <div className={SCROLL_TRACK}>
              {mergedArticles.filter(a => {
                const canonicalTarget = CANONICAL_DOMAINS[meta?.title ?? ''] || meta?.title;
                return a.study_category === canonicalTarget;
              }).map((a) => <AppletCard key={a.id} article={a} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  const displayTitle = meta?.title ?? (slug?.replace(/[-/]/g, ' ') ?? 'Articles');

  return (
    <div className="space-y-8 max-w-5xl">
      {isSubPage && (
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Previous Page
        </button>
      )}

      <div className="flex items-center gap-4 pb-6 border-b border-zinc-300 dark:border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {meta?.track && (
            <p className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider mb-1">{meta.track}</p>
          )}
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{displayTitle}</h1>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <ArrowDown className="animate-bounce text-sky-400 w-6 h-6 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-zinc-900 text-sm font-bold shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all"
          >
            Add Intel
          </button>
        </div>
      </div>

      {dashboardContext ? (
        <CurriculumDashboard
          articles={mergedArticles}
          isLoading={isLoading}
          context={dashboardContext}
          onContribute={() => setIsModalOpen(true)}
        />
      ) : domainInfo ? (
        <>
          <ObjectivePlacard
            domainInfo={domainInfo}
            activeObjective={activeObjective}
            onObjectiveChange={setActiveObjective}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <CurriculumDashboard
            articles={mergedArticles}
            isLoading={isLoading}
            context={TAB_TO_CONTEXT[activeTab]}
            onContribute={() => setIsModalOpen(true)}
            focusDomain={domainInfo}
            activeTab={activeTab}
            activeObjective={activeObjective}
          />
        </>
      ) : isLoading ? (
        <div className={SCROLL_TRACK}>
          {[...Array(4)].map((_, i) => <AppletSkeleton key={i} />)}
        </div>
      ) : mergedArticles.length > 0 ? (
        <div className={SCROLL_TRACK}>
          {mergedArticles.map((a) => <AppletCard key={a.id} article={a} />)}
        </div>
      ) : (
        <ComingSoonPanel />
      )}

      <ContributorSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitted={() => {
          if (typeof onRefresh === 'function') onRefresh();
        }}
      />
    </div>
  );
}

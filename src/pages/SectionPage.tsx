import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ArticleRenderer from '../components/ArticleRenderer';
import ContributorSubmissionModal, { type EditableArticle } from '../components/ContributorSubmissionModal';
import { AppletCard, AppletSkeleton, OpenSlotPlaceholder, CARD_WIDTH } from '../components/AppletCard';
import contentMap, { type LocalArticle } from '../data/contentMap';
import { useArticles, type ArticleWithContributor } from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import { normalizeCategory } from '../utils/normalizeCategory';
import { COMPTIA_OBJECTIVES } from '../lib/domainObjectives';
import {
  SECTION_TITLE_TO_CANONICAL, SLUG_TO_CANONICAL, SLUG_TO_DOMAIN_META,
} from '../lib/domainRegistry';
import { useSmartBack } from '../hooks/useSmartBack';
import { SECTION_ROLE_COLORS } from '../constants/badges';
import { TRACK_NAMES, CURRICULUM_TRACKS } from '../constants/tracks';
import {
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users,
  Lightbulb, Sparkles, Laptop, Monitor, Database,
  Heart, BookOpen, Link2, Check, ArrowLeft, ArrowRight,
  Construction, Layers, Target, Bookmark, Compass, FileText, GitBranch,
} from 'lucide-react';

const sectionMeta: Record<string, { title: string; icon: React.ComponentType<{ className?: string }>; track?: string }> = {
  'study-tips/core1-overview': { title: 'Core 1 Overview', icon: Lightbulb, track: TRACK_NAMES.CORE_1 },
  'study-tips/acronyms': { title: 'Acronym Master Directory', icon: Bookmark, track: TRACK_NAMES.CORE_1 },
  'core1-networking/pbq-prompts': { title: 'PBQ Simulation Prompts', icon: Sparkles, track: TRACK_NAMES.CORE_1 },
  'core1-mobile':          { title: 'Domain 1.0 Mobile Devices', icon: Laptop, track: TRACK_NAMES.CORE_1 },
  'core1-networking':      { title: 'Domain 2.0 Networking', icon: Network, track: TRACK_NAMES.CORE_1 },
  'core1-hardware':        { title: 'Domain 3.0 Hardware', icon: Cpu, track: TRACK_NAMES.CORE_1 },
  'core1-cloud':           { title: 'Domain 4.0 Virtualization & Cloud', icon: Cloud, track: TRACK_NAMES.CORE_1 },
  'core1-virtualization':  { title: 'Domain 4.0 Virtualization & Cloud', icon: Cloud, track: TRACK_NAMES.CORE_1 },
  'core1-troubleshooting': { title: 'Domain 5.0 HW & Network Troubleshooting', icon: Wrench, track: TRACK_NAMES.CORE_1 },
  'core2-os':              { title: 'Domain 1.0 Operating Systems', icon: Monitor, track: TRACK_NAMES.CORE_2 },
  'core2-os/cli-runbook': { title: 'CLI Command Runbook', icon: Monitor, track: TRACK_NAMES.CORE_2 },
  'core2-security':        { title: 'Domain 2.0 Security', icon: Shield, track: TRACK_NAMES.CORE_2 },
  'core2-software':        { title: 'Domain 3.0 Software Troubleshooting', icon: Wrench, track: TRACK_NAMES.CORE_2 },
  'core2-operations':      { title: 'Domain 4.0 Operational Procedures', icon: Users, track: TRACK_NAMES.CORE_2 },
  'healthcare-ehr':        { title: 'EHR Architecture', icon: Database, track: TRACK_NAMES.HEALTHCARE },
  'healthcare-hipaa':      { title: 'HIPAA Data Security', icon: Lock, track: TRACK_NAMES.HEALTHCARE },
  'healthcare-clinical':   { title: 'Clinical Workflows', icon: Heart, track: TRACK_NAMES.HEALTHCARE },
  'learner-experience/navigation':  { title: 'Navigating the Hub: Search, Domains & Filtering', icon: Compass, track: 'Learner Experience & FAQs' },
  'learner-experience/adding-intel': { title: 'Adding Intel: How to Submit Your Field Notes', icon: BookOpen, track: 'Learner Experience & FAQs' },
};

const roleColors = SECTION_ROLE_COLORS;

const CANONICAL_DOMAINS = SECTION_TITLE_TO_CANONICAL;

const CURRICULUM_TRACKS_WITH_ICONS = CURRICULUM_TRACKS.map((t) => ({
  ...t,
  icon: t.track === TRACK_NAMES.CORE_1 ? Laptop : t.track === TRACK_NAMES.CORE_2 ? Monitor : Heart,
}));

const SLUG_TO_DOMAIN = SLUG_TO_DOMAIN_META;

const TRACK_COLORS = {
  sky:  { header: 'text-sky-400',   icon: 'bg-sky-500/10 text-sky-500',   domainHeader: 'text-sky-400'  },
  teal: { header: 'text-sky-400', icon: 'bg-sky-500/10 text-sky-500', domainHeader: 'text-sky-400' },
  cyan: { header: 'text-sky-400', icon: 'bg-sky-500/10 text-sky-500', domainHeader: 'text-sky-400' },
};

const DASHBOARD_CONTEXTS: Record<string, string> = {};

const RESOURCE_TABS = ['All', 'Resource Links', 'Articles', 'Pro Tips', 'Diagrams', 'Playbooks'] as const;
type ResourceTab = typeof RESOURCE_TABS[number];

const TAB_ICONS: Record<ResourceTab, React.ComponentType<{ className?: string }>> = {
  'All': Layers,
  'Articles': FileText,
  'Pro Tips': Lightbulb,
  'Diagrams': GitBranch,
  'Resource Links': Link2,
  'Playbooks': Sparkles,
};

const TAB_TO_SUBMISSION_TYPE: Record<ResourceTab, string | null> = {
  'All': null,
  'Articles': 'Article',
  'Pro Tips': 'Study Tip',
  'Diagrams': 'Diagram',
  'Resource Links': 'Resource Link',
  'Playbooks': 'Prompt Playbook',
};

const SCROLL_TRACK = 'flex overflow-x-auto gap-4 pb-4 pt-1 snap-x snap-mandatory [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent';


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
    created_at: entry.date || new Date().toISOString(),
    updated_at: entry.date || new Date().toISOString(),
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
    const url = `${window.location.origin}/${slug}`;
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
          ? 'bg-sky-500/10 text-sky-400'
          : 'bg-zinc-800 text-zinc-400 hover:bg-sky-500/10 hover:text-sky-400'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

function ComingSoonPanel({ minimal = false }: { minimal?: boolean }) {
  const { goBack } = useSmartBack('/');
  if (minimal) {
    return (
      <div className={`${CARD_WIDTH} flex flex-col items-center justify-center gap-3 p-8 bg-zinc-900 border border-dashed border-zinc-800/50 rounded-xl text-center`}>
        <Construction className="w-7 h-7 text-amber-400" />
        <p className="text-sm font-medium text-zinc-400">
          This module is currently being built or undergoing moderation review. Check back shortly!
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
        <Construction className="w-8 h-8 text-amber-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-100">Coming Soon</h2>
        <p className="text-zinc-400 max-w-md leading-relaxed">
          This module is currently being built or undergoing moderation review by our Cohort Leaders. Check back shortly!
        </p>
      </div>
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  );
}

function ResourcePlacard({ activeTab, onTabChange }: { activeTab: ResourceTab; onTabChange: (tab: ResourceTab) => void }) {
  return (
    <div className="rounded-2xl border border-zinc-800/30 bg-zinc-950/50 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        {RESOURCE_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-300 ease-in-out ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300 border-sky-400/40'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border-zinc-700'
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

function DomainFilterRow({
  domainInfo,
  activeTab,
  onTabChange,
}: {
  domainInfo: { domain: string; trackIndex: number };
  activeTab: ResourceTab;
  onTabChange: (tab: ResourceTab) => void;
}) {
  if (!domainInfo?.domain) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/30 bg-zinc-950/50 px-5 py-4">
      <div className="flex flex-wrap gap-2">
        {RESOURCE_TABS.map((tab) => {
          const TabIcon = TAB_ICONS[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-300 ease-in-out ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300 border-sky-400/40'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border-zinc-700'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DomainBanner({
  icon: BannerIcon,
  title,
  track,
  domainInfo,
  activeObjective,
  onObjectiveChange,
  onContribute,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  track?: string;
  domainInfo: { domain: string; trackIndex: number };
  activeObjective: string;
  onObjectiveChange: (obj: string) => void;
  onContribute: () => void;
}) {
  const canonicalTrack = CANONICAL_DOMAINS[domainInfo.domain] || domainInfo.domain;
  const objectives = COMPTIA_OBJECTIVES[canonicalTrack] ?? [];

  return (
    <div className="relative rounded-2xl border border-zinc-800/30 overflow-hidden bg-zinc-950/50">
      <div className="relative px-6 py-5 md:px-8 md:py-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-5 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
              <BannerIcon className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              {track && (
                <p className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">{track}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onContribute}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-zinc-900 text-sm font-bold transition-all"
          >
            Add Intel
          </button>
        </div>
        {objectives.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onObjectiveChange('All')}
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                activeObjective === 'All'
                  ? 'bg-sky-500/30 text-sky-300 border-sky-400/50'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border-zinc-700'
              }`}
            >
              All Objectives
            </button>
            {objectives.map((obj) => (
              <button
                key={obj}
                type="button"
                onClick={() => onObjectiveChange(obj)}
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                  activeObjective === obj
                    ? 'bg-sky-500/30 text-sky-300 border-sky-400/50'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border-zinc-700'
                }`}
              >
                {obj}
              </button>
            ))}
          </div>
        )}
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
    <div className="space-y-5">
      {domains.map((domain) => {
        const canonicalTarget = CANONICAL_DOMAINS[domain] || domain;
        const domainArticles = articles.filter((a) => a.study_category === canonicalTarget);
        return (
          <div key={domain}>
            {!gridMode && (
              <div className="flex items-center gap-2 mb-3">
                <h3 className={`text-sm font-bold ${colors.domainHeader}`}>{domain}</h3>
                {!isLoading && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                    {domainArticles.length}
                  </span>
                )}
              </div>
            )}
            {gridMode ? (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AppletSkeleton />
                    <AppletSkeleton />
                    <AppletSkeleton />
                  </div>
                ) : domainArticles.length > 0 ? (
                  <div className="space-y-0">
                    {groupByObjective(domainArticles, canonicalTarget).map(([objective, items], idx) => (
                      <div key={objective}>
                        <div className={`flex items-center gap-2 pb-2 border-b border-zinc-800/50 ${idx === 0 ? 'mt-0' : 'mt-5'}`}>
                          <Target className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                          <h3 className="text-lg font-semibold text-zinc-200">{objective}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                            {items.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                          {items.map((a) => <AppletCard key={a.id} article={a} gridMode />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    return !a.is_sample;
  };

  const visibleArticles = useMemo(() => {
    return articles.filter(isVisibleInContext);
  }, [articles, context]);

  if (focusDomain) {
    const track = CURRICULUM_TRACKS_WITH_ICONS[focusDomain.trackIndex] ?? CURRICULUM_TRACKS_WITH_ICONS[0];
    if (!track) return <ComingSoonPanel />;
    const colors = TRACK_COLORS[track.color] ?? TRACK_COLORS.sky;
    const canonicalTarget = CANONICAL_DOMAINS[focusDomain.domain] || focusDomain.domain;

    const objectiveFilteredArticles = activeObjective && activeObjective !== 'All'
      ? articles.filter((a) => a.comp_objective === activeObjective)
      : articles;

    const typeFilter = activeTab ? TAB_TO_SUBMISSION_TYPE[activeTab] : null;
    const typeFilteredArticles = typeFilter
      ? objectiveFilteredArticles.filter((a) => a.submission_type === typeFilter)
      : objectiveFilteredArticles;

    const allDomainArticles = typeFilteredArticles.filter((a) => a.study_category === canonicalTarget && !a.is_sample);
    const hasAnyContent = allDomainArticles.length > 0;

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AppletSkeleton />
          <AppletSkeleton />
          <AppletSkeleton />
        </div>
      );
    }

    if (!hasAnyContent) {
      const emptyLabel = typeFilter ? activeTab : null;
      return (
        <div className="flex justify-center py-12">
          <div className="w-full max-w-sm group flex flex-col rounded-xl border overflow-hidden bg-zinc-900 border-zinc-800">
            <div
              className="flex items-center justify-between px-3 py-1.5 bg-zinc-800"
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-500">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-base text-white">
                {emptyLabel ? `No ${emptyLabel} submitted for this domain yet!` : 'Be the first to contribute to this domain!'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {emptyLabel
                  ? `Be the first to submit ${emptyLabel.toLowerCase()} for this curriculum track.`
                  : 'No peer submissions exist yet. Your contribution will pioneer this curriculum track for the cohort.'}
              </p>
              <button
                type="button"
                onClick={onContribute}
                className="mt-2 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border-sky-500/20 hover:border-sky-500"
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
            <div className={`flex items-center gap-2 pb-2 border-b border-zinc-800/50 ${idx === 0 ? 'mt-0' : 'mt-5'}`}>
              <Target className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-zinc-200">{objective}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                {items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
              {items.map((a) => <AppletCard key={a.id} article={a} gridMode />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const [core1, core2, healthcare] = CURRICULUM_TRACKS_WITH_ICONS;
  if (!core1 || !core2 || !healthcare) return <ComingSoonPanel />;

  const allCanonicalTargets = useMemo(() => {
    const targets = new Set<string>();
    for (const track of CURRICULUM_TRACKS_WITH_ICONS) {
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
    <div className="space-y-6">
      {uncategorizedArticles.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-zinc-800/50">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-sky-500/10 text-sky-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold uppercase tracking-widest text-sky-400">General Resources</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
              {uncategorizedArticles.length}
            </span>
          </div>
          <div className={SCROLL_TRACK}>
            {uncategorizedArticles.map((a) => <AppletCard key={a.id} article={a} />)}
          </div>
        </section>
      )}
      <div className="grid grid-cols-2 gap-4 items-start min-w-[640px] md:min-w-0 overflow-x-auto md:overflow-x-visible">
        <section className="min-w-[300px]">
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-zinc-800/50">
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
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-zinc-800/50">
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
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-zinc-800/50">
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
  const rawPath = location.pathname.replace(/^\//, '').replace(/\/$/, '');
  let slug = rawPath;
  try { slug = decodeURIComponent(rawPath); } catch { /* malformed URI -- use raw */ }

  const parentSlug = slug.includes('/') ? '/' + slug.split('/')[0] : '/';
  const { goBack } = useSmartBack(parentSlug);

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
  const [editItem, setEditItem] = useState<EditableArticle | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!searchParams.get('highlight')) {
      setActiveObjective('All');
    }
  }, [slug]);

  console.log('SectionPage Data:', { slug, tracksLength: CURRICULUM_TRACKS?.length });

  if (!CURRICULUM_TRACKS || !SLUG_TO_DOMAIN_META) {
    return (
      <div className="p-8 rounded-xl border-2 border-red-500/60 bg-red-950/30 text-red-400 font-medium">
        Critical Error: Domain registry failed to load.
      </div>
    );
  }

  const meta = sectionMeta[slug];
  const Icon = meta?.icon ?? BookOpen;
  const localContent = contentMap[slug];
  const isSubPage = slug.includes('/') || (meta?.track !== undefined);
  const isDomainSection = meta?.track !== undefined && !slug.includes('/');
  const dashboardContext = DASHBOARD_CONTEXTS[slug];
  const domainInfo = SLUG_TO_DOMAIN[slug];

  const mergedArticles = useMemo(() => {
    const safe = allArticles ?? [];
    const sectionSlug = domainInfo ? slug : dashboardContext ? slug : null;
    if (!sectionSlug) return safe;
    const localArticles = getLocalArticlesForSection(sectionSlug);
    if (localArticles.length === 0) return safe;
    const existingSlugs = new Set(safe.map((a) => a.slug));
    const newLocals = localArticles.filter((la) => !existingSlugs.has(la.slug));
    return newLocals.length > 0 ? [...safe, ...newLocals] : safe;
  }, [allArticles, slug, domainInfo, dashboardContext]);

  // --- Deep Linking Auto-Expand & Scroll ---
  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight && mergedArticles.length > 0) {
      const targetArticle = mergedArticles.find(a => a.slug === highlight);
      
      if (targetArticle) {
        // 1. Set the Active Objective Category
        if (targetArticle.comp_objective) {
          setActiveObjective(targetArticle.comp_objective);
        } else {
          setActiveObjective('All');
        }
        
        // 2. Set the Active Resource Tab based on submission type
        let matchingTab: ResourceTab = 'All';
        for (const [tab, type] of Object.entries(TAB_TO_SUBMISSION_TYPE)) {
          if (type === targetArticle.submission_type) {
            matchingTab = tab as ResourceTab;
            break;
          }
        }
        setActiveTab(matchingTab);
        
        // 3. Scroll to the specific card element ID
        setTimeout(() => {
          const el = document.getElementById(targetArticle.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add a temporary visual flash so the user sees which item they clicked
            el.style.transition = 'all 0.5s ease-out';
            el.style.boxShadow = '0 0 0 2px #0ea5e9'; // sky-500 ring
            setTimeout(() => { 
              el.style.boxShadow = 'none'; 
            }, 2000);
          }
        }, 300); // Small delay to let React render the new tab/objective content
        
        // 4. Clean up the URL
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('highlight');
          // Ensure tab is synced to URL if we changed it
          if (matchingTab === 'All') {
            newParams.delete('tab');
          } else {
            newParams.set('tab', matchingTab);
          }
          return newParams;
        }, { replace: true });
      }
    }
  }, [searchParams, mergedArticles, setSearchParams]);

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
          onClick={goBack}
          className="text-zinc-400 hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 mb-6 cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Previous Page
        </button>

        <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/50 p-8 mb-8">
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
                <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white text-xs font-bold">
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

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
          <ArticleRenderer blocks={localContent.content} />
        </div>

        {!isLoading && mergedArticles.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">More in this section</h2>
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
    <div className="space-y-5 max-w-7xl">
      {isSubPage && (
        <button
          onClick={goBack}
          className="text-zinc-400 hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Previous Page
        </button>
      )}

      {domainInfo ? (
        <>
          <DomainBanner
            icon={Icon}
            title={displayTitle}
            track={meta?.track}
            domainInfo={domainInfo}
            activeObjective={activeObjective}
            onObjectiveChange={setActiveObjective}
            onContribute={() => setIsModalOpen(true)}
          />
          <DomainFilterRow
            domainInfo={domainInfo}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <CurriculumDashboard
            articles={mergedArticles}
            isLoading={isLoading}
            context={activeTab}
            onContribute={() => setIsModalOpen(true)}
            focusDomain={domainInfo}
            activeTab={activeTab}
            activeObjective={activeObjective}
          />
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 pb-6 border-b border-zinc-800/50">
            <div className="w-14 h-14 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {meta?.track && (
                <p className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">{meta.track}</p>
              )}
              <h1 className="text-2xl font-bold text-zinc-100">{displayTitle}</h1>
            </div>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-zinc-900 text-sm font-bold transition-all"
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
        </>
      )}

      <ContributorSubmissionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditItem(null); }}
        onSubmitted={() => {
          if (typeof onRefresh === 'function') onRefresh();
        }}
        editItem={editItem}
      />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
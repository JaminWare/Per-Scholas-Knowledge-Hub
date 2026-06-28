import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ArticleRenderer from '../components/ArticleRenderer';
import type { Article } from '../types/database';
import contentMap from '../data/contentMap';
import {
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users,
  Lightbulb, FileText, Sparkles, Layout, Laptop, Monitor, Database,
  Heart, BookOpen, Link2, Check, ArrowLeft, ArrowRight, User,
  Construction,
} from 'lucide-react';

const sectionMeta: Record<string, { title: string; icon: React.ComponentType<{ className?: string }>; track?: string }> = {
  'study-tips':            { title: 'Study Tips', icon: Lightbulb },
  'study-tips/core1-overview': { title: 'Core 1 Overview', icon: Lightbulb, track: 'Study Tips' },
  'study-tips/core2-overview': { title: 'Core 2 Overview', icon: Lightbulb, track: 'Study Tips' },
  'diagrams':              { title: 'Diagrams', icon: Layout },
  'diagrams/motherboard':  { title: 'Motherboard Blueprint', icon: Layout, track: 'Diagrams' },
  'diagrams/network-topology': { title: 'Network Topology', icon: Layout, track: 'Diagrams' },
  'diagrams/ehr-dataflow': { title: 'EHR Data Flow', icon: Layout, track: 'Diagrams' },
  'quick-references':      { title: 'Quick References', icon: FileText },
  'quick-references/ports':    { title: 'Port Number Cheatsheet', icon: FileText, track: 'Quick References' },
  'quick-references/acronyms': { title: 'Acronym Guide', icon: FileText, track: 'Quick References' },
  'quick-references/cli-runbook': { title: 'CLI Runbook', icon: FileText, track: 'Quick References' },
  'azari-prompt-playbook': { title: 'Prompt Playbook', icon: Sparkles },
  'azari-prompt-playbook/pbq-prompts':    { title: 'PBQ Simulation Prompts', icon: Sparkles, track: 'Prompt Playbook' },
  'azari-prompt-playbook/medical-prompts':{ title: 'Medical Case Study Prompts', icon: Sparkles, track: 'Prompt Playbook' },
  'azari-prompt-playbook/ehr-prompts':    { title: 'EHR Troubleshooting Prompts', icon: Sparkles, track: 'Prompt Playbook' },
  'core1-mobile':          { title: 'Domain 1.0 — Mobile Devices', icon: Laptop, track: 'CompTIA A+ Core 1' },
  'core1-networking':      { title: 'Domain 2.0 — Networking', icon: Network, track: 'CompTIA A+ Core 1' },
  'core1-hardware':        { title: 'Domain 3.0 — Hardware', icon: Cpu, track: 'CompTIA A+ Core 1' },
  'core1-cloud':           { title: 'Domain 4.0 — Virtualization & Cloud', icon: Cloud, track: 'CompTIA A+ Core 1' },
  'core1-virtualization':  { title: 'Domain 4.0 — Virtualization & Cloud', icon: Cloud, track: 'CompTIA A+ Core 1' },
  'core1-troubleshooting': { title: 'Domain 5.0 — HW & Network Troubleshooting', icon: Wrench, track: 'CompTIA A+ Core 1' },
  'core2-os':              { title: 'Domain 1.0 — Operating Systems', icon: Monitor, track: 'CompTIA A+ Core 2' },
  'core2-security':        { title: 'Domain 2.0 — Security', icon: Shield, track: 'CompTIA A+ Core 2' },
  'core2-software':        { title: 'Domain 3.0 — Software Troubleshooting', icon: Wrench, track: 'CompTIA A+ Core 2' },
  'core2-operations':      { title: 'Domain 4.0 — Operational Procedures', icon: Users, track: 'CompTIA A+ Core 2' },
  'healthcare-ehr':        { title: 'EHR Architecture', icon: Database, track: 'Advanced Healthcare IT' },
  'healthcare-hipaa':      { title: 'HIPAA Data Security', icon: Lock, track: 'Advanced Healthcare IT' },
  'healthcare-clinical':   { title: 'Clinical Workflows', icon: Heart, track: 'Advanced Healthcare IT' },
};

const roleColors: Record<string, string> = {
  'Core 1 Expert':       'bg-emerald-500/10 text-emerald-400',
  'Core 2 Expert':       'bg-teal-500/10 text-teal-400',
  'HealthIT Specialist': 'bg-cyan-500/10 text-cyan-400',
  'AI Prompt Engineer':  'bg-purple-500/10 text-purple-400',
};

const KNOWN_AUTHORS: Record<string, string> = {
  'firewall-basics':               'Jamin Ware',
  'command-documentation':         'Jamin Ware',
  'snap-in':                       'Jamin Ware',
  'intro-healthcare-it-security':  'Jamin Ware',
  'cloud-computing-healthcare':    'Jamin Ware',
  'ai-prompt-engineering-healthcare': 'Jamin Ware',
};

// Study Tips three-track curriculum map
const STUDY_TRACKS = [
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

const STUDY_TRACK_COLORS = {
  sky:  { header: 'text-sky-600 dark:text-sky-400',   icon: 'bg-sky-500/10 text-sky-500',   domainHeader: 'text-sky-500 dark:text-sky-400'  },
  teal: { header: 'text-teal-600 dark:text-teal-400', icon: 'bg-teal-500/10 text-teal-500', domainHeader: 'text-teal-500 dark:text-teal-400' },
  cyan: { header: 'text-cyan-600 dark:text-cyan-400', icon: 'bg-cyan-500/10 text-cyan-500', domainHeader: 'text-cyan-500 dark:text-cyan-400' },
};

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
          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

// ── Coming Soon inline panel ──────────────────────────────
function ComingSoonPanel({ minimal = false }: { minimal?: boolean }) {
  const navigate = useNavigate();
  if (minimal) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center gap-3 p-8 bg-white/80 dark:bg-zinc-700/50 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl text-center">
        <Construction className="w-7 h-7 text-amber-400" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          This module is currently being built or undergoing moderation review by our Cohort Leaders. Check back shortly!
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="relative">
        <div className="w-18 h-18 w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
          <Construction className="w-8 h-8 text-amber-500 dark:text-amber-400" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Coming Soon</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
          This module is currently being built or undergoing moderation review by our Cohort Leaders. Check back shortly!
        </p>
      </div>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-medium text-amber-700 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Under active development — 2026-RTT-23
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

// ── Applet Card — Lab Capsule Format ─────────────────────
type ArticleWithContributor = Article & { contributor?: { name: string } | null };

function AppletCard({ article }: { article: ArticleWithContributor }) {
  const isSample = article.is_sample;
  const authorName = (article.contributor as { name: string } | null)?.name
    ?? KNOWN_AUTHORS[article.slug]
    ?? (isSample ? '[Sample Learner]' : 'Knowledge Base');
  const authorInitial = authorName.charAt(0).toUpperCase();
  const toolsPreview = article.tags.length > 0
    ? `$ Tools: ${article.tags.slice(0, 3).join(' · ')}`
    : null;

  return (
    <div className={`group flex flex-col rounded-xl border overflow-hidden transition-all duration-300 ease-out ${
      isSample
        ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/60 dark:border-amber-500/20 hover:border-amber-400/70 dark:hover:border-amber-400/50 hover:shadow-[0_0_0_1.5px_rgba(251,191,36,0.5),0_4px_16px_rgba(251,191,36,0.08)]'
        : 'bg-white dark:bg-zinc-700 border-slate-200 dark:border-zinc-600 hover:border-sky-400/50 dark:hover:border-sky-500/50 hover:shadow-[0_0_0_1.5px_rgba(56,189,248,0.45),0_4px_16px_rgba(56,189,248,0.08)]'
    }`}>

      {/* ── Terminal Header Strip ── */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 ${
          isSample ? 'bg-zinc-800 dark:bg-zinc-900/80' : 'bg-zinc-800 dark:bg-zinc-900'
        }`}
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
      >
        <div className="flex items-center gap-2">
          {isSample ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          ) : (
            <span className="text-[11px] font-mono font-bold text-sky-400 select-none">{`</>`}</span>
          )}
          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">
            {article.slug.split('/').pop()}
          </span>
        </div>
        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wide flex-shrink-0 ${
          isSample
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
            : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
        }`}>
          {isSample ? '[Lab Documentation]' : '[Verified Peer Build]'}
        </span>
      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform ${
            isSample ? 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/20' : 'bg-gradient-to-br from-sky-500 to-sky-400 shadow-sky-500/20'
          }`}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm leading-snug line-clamp-2 transition-colors ${
              isSample
                ? 'text-amber-800 dark:text-amber-300 group-hover:text-amber-600 dark:group-hover:text-amber-300'
                : 'text-zinc-800 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400'
            }`}>
              {article.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-zinc-400 to-zinc-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[8px] font-bold">{authorInitial}</span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">{authorName}</span>
            </div>
          </div>
        </div>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 flex-1 leading-relaxed">{article.excerpt}</p>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300/60 dark:border-zinc-700/60">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Sample incentive caption */}
        {isSample && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-500/10 rounded-lg px-2.5 py-2 border border-amber-200/60 dark:border-amber-500/15">
            💡 This slot is open! Submit your research via the portal below to claim this applet.
          </p>
        )}

        {/* Hover preview snippet */}
        {toolsPreview && (
          <div className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-zinc-900/6 dark:bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 truncate">
            {toolsPreview}
          </div>
        )}

        {/* CTA button */}
        <Link
          to={`/article/${article.slug}`}
          className={`mt-auto inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border ${
            isSample
              ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-400 hover:text-white border-amber-500/20 hover:border-amber-500'
              : 'bg-sky-500/10 hover:bg-sky-500 text-sky-600 dark:text-sky-400 hover:text-white border-sky-500/20 hover:border-sky-500 hover:shadow-md hover:shadow-sky-500/20'
          }`}
        >
          Read Article
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────
function AppletSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
      </div>
      <div className="h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
    </div>
  );
}

// ── Study Tips placeholder for empty domains ─────────────
function StudyTipPlaceholder({ domain }: { domain: string }) {
  return (
    <div className="group flex flex-col rounded-xl border overflow-hidden bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/60 dark:border-amber-500/20">
      {/* Terminal header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 dark:bg-zinc-900/80"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">open-slot</span>
        </div>
        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wide flex-shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/20">
          [Lab Documentation]
        </span>
      </div>
      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/20">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug text-amber-800 dark:text-amber-300">
              {domain} — Study Tips
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-zinc-400 to-zinc-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[8px] font-bold">S</span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">[Sample Learner]</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-500/10 rounded-lg px-2.5 py-2 border border-amber-200/60 dark:border-amber-500/15">
          💡 This slot is open! Submit your research via the portal below to claim this applet.
        </p>
        <Link
          to="/"
          className="mt-auto inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-400 hover:text-white border-amber-500/20 hover:border-amber-500"
        >
          Submit a Contribution
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Study Tips grouped three-track view ───────────────────
function StudyTipsDashboard({ articles, isLoading }: { articles: ArticleWithContributor[]; isLoading: boolean }) {
  return (
    <div className="space-y-12">
      {STUDY_TRACKS.map(({ track, icon: TrackIcon, color, domains }) => {
        const colors = STUDY_TRACK_COLORS[color];
        return (
          <section key={track}>
            {/* Track-level header */}
            <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-zinc-200 dark:border-zinc-700">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                <TrackIcon className="w-4.5 h-4.5 w-4 h-4" />
              </div>
              <h2 className={`text-base font-bold uppercase tracking-widest ${colors.header}`}>{track}</h2>
            </div>

            {/* Domain sub-sections */}
            <div className="space-y-8">
              {domains.map((domain) => {
                const domainArticles = articles.filter((a) => a.study_category === domain);
                return (
                  <div key={domain}>
                    {/* Domain sub-header */}
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className={`text-sm font-bold ${colors.domainHeader}`}>{domain}</h3>
                      {!isLoading && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {domainArticles.length}
                        </span>
                      )}
                    </div>
                    {isLoading ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AppletSkeleton />
                        <AppletSkeleton />
                      </div>
                    ) : domainArticles.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {domainArticles.map((a) => <AppletCard key={a.id} article={a} />)}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StudyTipPlaceholder domain={domain} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Uncategorized articles */}
      {(() => {
        const allMappedCategories = STUDY_TRACKS.flatMap((t) => t.domains);
        const uncategorized = articles.filter(
          (a) => !a.study_category || !allMappedCategories.includes(a.study_category as never),
        );
        if (isLoading || uncategorized.length === 0) return null;
        return (
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-zinc-700">
                <Lightbulb className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <h2 className="text-base font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">General</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uncategorized.map((a) => <AppletCard key={a.id} article={a} />)}
            </div>
          </section>
        );
      })()}
    </div>
  );
}

// ── Main SectionPage ──────────────────────────────────────
export default function SectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.replace(/^\//, '').replace(/\/$/, '');

  const [dbArticles, setDbArticles] = useState<ArticleWithContributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const meta = sectionMeta[slug];
  const Icon = meta?.icon ?? BookOpen;
  const localContent = contentMap[slug];
  const isSubPage = slug.includes('/') || (meta?.track !== undefined);
  // Domain sections (e.g. core1-mobile) always use the applet grid — never the legacy article view
  const isDomainSection = meta?.track !== undefined && !slug.includes('/');

  useEffect(() => {
    async function fetchArticles() {
      if (!slug) { setIsLoading(false); return; }
      try {
        const { data: section } = await supabase
          .from('sections').select('id').eq('slug', slug).maybeSingle();
        let query = supabase
          .from('articles')
          .select('*, contributor:contributors(name)')
          .order('created_at', { ascending: false });
        if (section?.id) query = query.eq('section_id', section.id);
        else query = query.ilike('slug', `${slug}/%`);
        const { data } = await query;
        setDbArticles((data as ArticleWithContributor[]) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticles();
  }, [slug]);

  // ── Rich local wiki article ──────────────────────────────
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

        <div className="bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-xl p-6 md:p-8">
          <ArticleRenderer blocks={localContent.content} />
        </div>

        {!isLoading && dbArticles.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">More in this section</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dbArticles.map((a) => <AppletCard key={a.id} article={a} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Applet Dashboard ─────────────────────────────────────
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

      {/* Section header */}
      <div className="flex items-center gap-4 pb-6 border-b border-zinc-300 dark:border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {meta?.track && (
            <p className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider mb-1">{meta.track}</p>
          )}
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{displayTitle}</h1>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {isLoading ? '…' : `${dbArticles.length} article${dbArticles.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Study Tips uses grouped category rows */}
      {slug === 'study-tips' ? (
        <StudyTipsDashboard articles={dbArticles} isLoading={isLoading} />
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => <AppletSkeleton key={i} />)}
        </div>
      ) : dbArticles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dbArticles.map((a) => <AppletCard key={a.id} article={a} />)}
        </div>
      ) : (
        <ComingSoonPanel />
      )}
    </div>
  );
}

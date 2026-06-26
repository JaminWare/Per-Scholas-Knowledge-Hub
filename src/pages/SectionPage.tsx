import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import ArticleRenderer from '../components/ArticleRenderer';
import type { Article } from '../types/database';
import contentMap from '../data/contentMap';
import {
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users,
  Lightbulb, FileText, Sparkles, Layout, Laptop, Monitor, Database,
  Heart, BookOpen, Home, Link2, Check, ArrowLeft,
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

export default function SectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.hash.replace('#/', '').replace(/\/$/, '');

  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const meta = sectionMeta[slug];
  const Icon = meta?.icon ?? BookOpen;
  const localContent = contentMap[slug];
  const isSubPage = slug.includes('/') || (meta?.track !== undefined);

  useEffect(() => {
    async function fetchArticles() {
      if (!slug) { setIsLoading(false); return; }
      try {
        const { data: section } = await supabase
          .from('sections').select('id').eq('slug', slug).maybeSingle();
        let query = supabase.from('articles').select('*').order('created_at', { ascending: false });
        if (section?.id) query = query.eq('section_id', section.id);
        else query = query.ilike('slug', `${slug}/%`);
        const { data } = await query;
        setDbArticles(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticles();
  }, [slug]);

  // ── Rich local wiki article ──────────────────────────────
  if (localContent) {
    const roleColor = roleColors[localContent.contributorRole ?? ''] ?? 'bg-zinc-800 text-zinc-400';
    return (
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 mb-6 cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Previous Page
        </button>

        {/* Article hero header */}
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
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-4">
              {localContent.title}
            </h1>
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

        {/* Article body */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 md:p-8">
          <ArticleRenderer blocks={localContent.content} />
        </div>

        {!isLoading && dbArticles.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">More in this section</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {dbArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Fallback grid ────────────────────────────────────────
  const displayTitle = meta?.title ?? (slug?.replace(/[-/]/g, ' ') ?? 'Articles');
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back to Dashboard — only on sub-pages */}
      {isSubPage && (
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Previous Page
        </button>
      )}

      <div className="flex items-center gap-4 pb-6 border-b border-zinc-800">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {meta?.track && (
            <p className="text-xs font-semibold text-sky-500 dark:text-sky-400 uppercase tracking-wider mb-1">{meta.track}</p>
          )}
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{displayTitle}</h1>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">{dbArticles.length} articles</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-zinc-700 rounded w-3/4" />
              <div className="h-4 bg-zinc-700 rounded w-full mt-3" />
            </div>
          ))}
        </div>
      ) : dbArticles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dbArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Icon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">No articles in this section yet.</p>
        </div>
      )}
    </div>
  );
}

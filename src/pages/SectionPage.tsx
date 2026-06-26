import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import ArticleRenderer from '../components/ArticleRenderer';
import type { Article } from '../types/database';
import contentMap from '../data/contentMap';
import {
  Shield, Network, Cpu, Lock, Cloud, Wrench, Users, AlertTriangle,
  Lightbulb, FileText, Sparkles, Layout, Laptop, Monitor, Database,
  Heart, BookOpen, Home,
} from 'lucide-react';

const sectionMeta: Record<string, { title: string; icon: React.ComponentType<{ className?: string }>; track?: string }> = {
  // top nav
  'study-tips':           { title: 'Study Tips', icon: Lightbulb },
  'diagrams':             { title: 'Diagrams', icon: Layout },
  'quick-references':     { title: 'Quick References', icon: FileText },
  'azari-prompt-playbook':{ title: 'Prompt Playbook', icon: Sparkles },
  // core 1
  'core1-mobile':         { title: 'Domain 1.0 — Mobile Devices', icon: Laptop, track: 'CompTIA A+ Core 1 (220-1201)' },
  'core1-networking':     { title: 'Domain 2.0 — Networking', icon: Network, track: 'CompTIA A+ Core 1 (220-1201)' },
  'core1-hardware':       { title: 'Domain 3.0 — Hardware', icon: Cpu, track: 'CompTIA A+ Core 1 (220-1201)' },
  'core1-cloud':          { title: 'Domain 4.0 — Virtualization & Cloud', icon: Cloud, track: 'CompTIA A+ Core 1 (220-1201)' },
  'core1-troubleshooting':{ title: 'Domain 5.0 — Hardware & Network Troubleshooting', icon: Wrench, track: 'CompTIA A+ Core 1 (220-1201)' },
  // core 2
  'core2-os':             { title: 'Domain 1.0 — Operating Systems', icon: Monitor, track: 'CompTIA A+ Core 2 (220-1202)' },
  'core2-security':       { title: 'Domain 2.0 — Security', icon: Shield, track: 'CompTIA A+ Core 2 (220-1202)' },
  'core2-software':       { title: 'Domain 3.0 — Software Troubleshooting', icon: Wrench, track: 'CompTIA A+ Core 2 (220-1202)' },
  'core2-operations':     { title: 'Domain 4.0 — Operational Procedures', icon: Users, track: 'CompTIA A+ Core 2 (220-1202)' },
  // healthcare
  'healthcare-ehr':       { title: 'EHR Architecture', icon: Database, track: 'Advanced Healthcare IT' },
  'healthcare-hipaa':     { title: 'HIPAA Data Security', icon: Lock, track: 'Advanced Healthcare IT' },
  'healthcare-clinical':  { title: 'Clinical IT Operations', icon: Heart, track: 'Advanced Healthcare IT' },
};

export default function SectionPage() {
  const location = useLocation();
  const slug = location.hash.replace('#/', '').replace(/\/$/, '');

  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const meta = sectionMeta[slug];
  const Icon = meta?.icon ?? BookOpen;
  const localContent = contentMap[slug];

  useEffect(() => {
    async function fetchArticles() {
      if (!slug) { setIsLoading(false); return; }
      try {
        const { data: section } = await supabase
          .from('sections')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        let query = supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (section?.id) {
          query = query.eq('section_id', section.id);
        } else {
          query = query.ilike('slug', `${slug}/%`);
        }

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

  // ── Polished wiki article view when local content exists ──
  if (localContent) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />Home
          </Link>
          {localContent.trackLabel.split('—').map((part, i, arr) => (
            <span key={i} className="flex items-center gap-2">
              <span>/</span>
              <span className={i === arr.length - 1 ? 'text-slate-900 dark:text-white font-medium' : ''}>
                {part.trim()}
              </span>
            </span>
          ))}
        </nav>

        {/* Article header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Icon className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                {localContent.trackLabel}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {localContent.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-slate-300">{localContent.contributor}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {localContent.cohort}
              </span>
              {localContent.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-slate-700/60 text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Article body */}
        <div className="card p-6 md:p-8">
          <ArticleRenderer blocks={localContent.content} />
        </div>

        {/* DB articles that also match */}
        {!isLoading && dbArticles.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">More in this section</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {dbArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Fallback: DB articles grid ────────────────────────────
  const displayTitle = meta?.title ?? (slug?.replace(/[-/]/g, ' ') ?? 'Articles');

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          {meta?.track && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              {meta.track}
            </p>
          )}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
            {displayTitle}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {dbArticles.length} articles in this section
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mt-3" />
            </div>
          ))}
        </div>
      ) : dbArticles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dbArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No articles in this section yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Headphones, ExternalLink, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppletCard, AppletSkeleton } from '../components/AppletCard';
import type { ArticleWithContributor } from '../hooks/useArticles';
import ContributorSubmissionModal, { type EditableArticle } from '../components/ContributorSubmissionModal';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import { DESKOLAS_CATEGORIES, DESKOLAS_APP_URL } from '../constants/deskolas';

interface LxMeta { lx_stage: string | null; lx_topic: string | null; lx_focus: string | null; }

function entryToArticle(entry: {
  id: string;
  title: string;
  content: string;
  author: string;
  track: string;
  slug: string;
  created_at: string;
}): ArticleWithContributor {
  return {
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    section_id: null,
    content: entry.content,
    formatted_content: null,
    excerpt: null,
    contributor_id: null,
    tags: [],
    is_featured: false,
    is_sample: false,
    study_category: entry.track,
    source_file: null,
    author_name: entry.author,
    author: entry.author,
    submission_type: null,
    comp_objective: null,
    created_at: entry.created_at,
    updated_at: entry.created_at,
    contributor: null,
  };
}

export default function DeskolasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeLevel2, setActiveLevel2] = useState(searchParams.get('level2') || '');
  const [activeLevel3, setActiveLevel3] = useState(searchParams.get('level3') || '');
  const [entries, setEntries] = useState<ArticleWithContributor[]>([]);
  const [lxMeta, setLxMeta] = useState<Map<string, LxMeta>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<EditableArticle | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const abortRef = useRef(false);

  // Deep Linking Auto-Expand & Scroll
  useEffect(() => {
    const paramLevel2 = searchParams.get('level2') || '';
    const paramLevel3 = searchParams.get('level3') || '';
    const highlight = searchParams.get('highlight');

    if (paramLevel2 && paramLevel2 !== activeLevel2) setActiveLevel2(paramLevel2);
    if (paramLevel3 && paramLevel3 !== activeLevel3) setActiveLevel3(paramLevel3);

    if (highlight && entries.length > 0) {
      const targetArticle = entries.find(a => a.slug === highlight);
      if (targetArticle) {
        setTimeout(() => {
          const el = document.getElementById(targetArticle.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'all 0.5s ease-out';
            el.style.boxShadow = '0 0 0 2px #2563eb';
            setTimeout(() => { el.style.boxShadow = 'none'; }, 2000);
          }
        }, 300);

        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('highlight');
          return newParams;
        }, { replace: true });
      }
    }
  }, [searchParams, entries, activeLevel2, activeLevel3, setSearchParams]);

  useEffect(() => {
    abortRef.current = false;
    async function fetchEntries() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const [subsRes, articlesRes] = await Promise.all([
          supabase
            .from('submissions')
            .select('*')
            .eq('is_approved', true)
            .or('lx_stage.eq.labs,track.ilike.%Tech Solutions%,type.eq.deskolas'),
          supabase
            .from('articles')
            .select('*')
            .eq('status', 'published')
            .or('lx_stage.eq.labs,study_category.ilike.%Tech Solutions%'),
        ]);

        if (abortRef.current) return;
        if (subsRes.error) throw subsRes.error;
        if (articlesRes.error) throw articlesRes.error;

        const metaMap = new Map<string, LxMeta>();

        const fromSubs = (subsRes.data ?? []).map((s: any) => {
          metaMap.set(s.id, { lx_stage: s.lx_stage ?? null, lx_topic: s.lx_topic ?? null, lx_focus: s.lx_focus ?? null });
          return entryToArticle({
            id: s.id,
            title: s.title ?? 'Untitled',
            content: s.formatted_content ?? s.content ?? '',
            author: s.full_name ?? 'Anonymous',
            track: s.track ?? '',
            slug: (s.title ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `entry-${s.id}`,
            created_at: s.created_at,
          });
        });

        const fromArticles = (articlesRes.data ?? []).map((a: any) => {
          metaMap.set(a.id, { lx_stage: a.lx_stage ?? null, lx_topic: a.lx_topic ?? null, lx_focus: a.lx_focus ?? null });
          return entryToArticle({
            id: a.id,
            title: a.title ?? 'Untitled',
            content: a.formatted_content ?? a.content ?? '',
            author: a.author_name ?? 'Deskolas',
            track: a.study_category ?? '',
            slug: a.slug ?? `article-${a.id}`,
            created_at: a.created_at,
          });
        });

        const subMetaByTitle = new Map<string, LxMeta>();
        for (const s of (subsRes.data ?? [])) {
          if (s.lx_stage) {
            subMetaByTitle.set((s.title ?? '').toLowerCase().trim(), { lx_stage: s.lx_stage, lx_topic: s.lx_topic ?? null, lx_focus: s.lx_focus ?? null });
          }
        }
        for (const art of fromArticles) {
          const existing = metaMap.get(art.id);
          if (!existing?.lx_stage) {
            const fromSub = subMetaByTitle.get(art.title.toLowerCase().trim());
            if (fromSub) metaMap.set(art.id, fromSub);
          }
        }

        const existingTitles = new Set(fromArticles.map((a) => a.title.toLowerCase()));
        const merged = [
          ...fromArticles,
          ...fromSubs.filter((s) => !existingTitles.has(s.title.toLowerCase())),
        ];
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (!abortRef.current) {
          setEntries(merged);
          setLxMeta(metaMap);
        }
      } catch (e: any) {
        console.error('DeskolasPage fetch error:', e);
        if (!abortRef.current) {
          setFetchError(e?.message ?? 'Failed to load entries');
        }
      } finally {
        if (!abortRef.current) {
          setIsLoading(false);
        }
      }
    }
    fetchEntries();
    return () => { abortRef.current = true; };
  }, []);

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (activeLevel2) {
      const sub = DESKOLAS_CATEGORIES.find((s) => s.label === activeLevel2);
      if (sub && sub.keywords.length > 0) {
        result = result.filter((e) => {
          const meta = lxMeta.get(e.id);
          if (meta?.lx_topic) return meta.lx_topic === activeLevel2;
          const haystack = `${e.title} ${e.content}`.toLowerCase();
          return sub.keywords.some((kw) => haystack.includes(kw));
        });
      }

      if (sub && activeLevel3) {
        const nested = sub.nested.find((n) => n.label === activeLevel3);
        if (nested && nested.keywords.length > 0) {
          result = result.filter((e) => {
            const meta = lxMeta.get(e.id);
            if (meta?.lx_focus) return meta.lx_focus === activeLevel3;
            const haystack = `${e.title} ${e.content}`.toLowerCase();
            return nested.keywords.some((kw) => haystack.includes(kw));
          });
        }
      }
    }

    return result;
  }, [entries, lxMeta, activeLevel2, activeLevel3]);

  return (
    <div className="relative max-w-7xl mx-auto space-y-4 pb-20">
      {/* Banner */}
      <div className="relative rounded-2xl bg-zinc-950/50 border border-zinc-800/30 overflow-hidden">
        <div className="relative px-6 py-5 md:px-8 md:py-6">
          <div className="flex items-start gap-5 mb-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Deskolas Tech Solutions</h1>
              <p className="text-sm md:text-base text-zinc-400 mt-1 leading-relaxed">Resolved tickets and peer sourced fixes from our ticketing system!</p>
            </div>
            <a
              href={DESKOLAS_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-400 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-400/30 flex-shrink-0"
            >
              Open Deskolas
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <a
            href={DESKOLAS_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-400 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            Open Deskolas
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Category Sub-Navigation */}
      <div className="rounded-2xl border border-zinc-800/30 bg-zinc-950/50 p-4 space-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Filter by focus area</span>
        <div className="flex flex-wrap gap-2">
          {DESKOLAS_CATEGORIES.map((sub) => {
            const isAll = sub.keywords.length === 0;
            const isActive = isAll ? activeLevel2 === '' : activeLevel2 === sub.label;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setActiveLevel2(isAll ? '' : sub.label);
                  setActiveLevel3('');
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-700 text-white border-zinc-600'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border-zinc-700'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>

        {(() => {
          const activeSub = DESKOLAS_CATEGORIES.find((s) => s.label === activeLevel2);
          if (!activeSub || activeSub.nested.length === 0) return null;
          return (
            <div className="pl-3 border-l-2 border-zinc-700 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Narrow further</span>
              <div className="flex flex-wrap gap-1.5">
                {activeSub.nested.map((n) => {
                  const isAll = n.keywords.length === 0;
                  const isNested = isAll ? activeLevel3 === '' : activeLevel3 === n.label;
                  return (
                    <button
                      key={n.label}
                      type="button"
                      onClick={() => setActiveLevel3(isAll ? '' : (isNested ? '' : n.label))}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200 ${
                        isNested
                          ? 'bg-blue-600/30 text-blue-300 border-blue-400/50'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border-zinc-700'
                      }`}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AppletSkeleton gridMode />
          <AppletSkeleton gridMode />
          <AppletSkeleton gridMode />
        </div>
      ) : fetchError ? (
        <div className="text-center py-10 text-red-400">{fetchError}</div>
      ) : filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <AppletCard key={entry.id} article={entry} gridMode />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-6 py-10 text-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-400/20 flex items-center justify-center">
            <Headphones className="w-8 h-8 text-blue-400" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-lg font-bold text-zinc-100">No tickets yet</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Resolved tickets from Deskolas will appear here automatically. You can also contribute a fix manually.
            </p>
          </div>
          <button
            onClick={() => user ? setIsModalOpen(true) : setAuthModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-400 text-white font-bold text-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add a Fix
          </button>
        </div>
      )}

      {/* Floating contribute button */}
      {filteredEntries.length > 0 && (
        <div className="absolute bottom-6 right-6 z-30">
          <button
            onClick={() => user ? setIsModalOpen(true) : setAuthModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add a Fix
          </button>
        </div>
      )}

      <ContributorSubmissionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditItem(null); }}
        onSubmitted={() => {}}
        editItem={editItem}
      />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

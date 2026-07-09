import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, Folder, Loader2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { supabase } from '../lib/supabase';
import { resolveTrackSlug } from '../lib/domainRegistry';
import { JOURNEY_TABS } from '../constants/learnerExperience';
import type { SearchResult } from '../types/database';

interface SearchBarProps {
  onMenuClick: () => void;
}

const fuseOptions: Fuse.IFuseOptions<SearchResult> = {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'excerpt', weight: 0.3 },
    { name: 'slug', weight: 0.1 },
  ],
  threshold: 0.35,
  includeScore: true,
  ignoreLocation: true,
};

function getDashboardRoute(result: SearchResult): string {
  if (result.type === 'section') return `/${result.slug}`;

  const category = (result.study_category ?? '').trim();
  if (!category) return `/article/${result.slug}`;

  // Route to Deskolas dashboard for Tech Solutions / Deskolas articles
  const catLower = category.toLowerCase();
  if (catLower.includes('tech solutions') || catLower.includes('deskolas') || result.lx_stage === 'labs') {
    const params = new URLSearchParams();
    if (result.lx_topic) params.set('level2', result.lx_topic);
    if (result.lx_focus) params.set('level3', result.lx_focus);
    params.set('highlight', result.slug);
    const qs = params.toString();
    return `/deskolas${qs ? '?' + qs : ''}#${result.slug}`;
  }

  // Route to Learner Experience with deep-link parameters
  if (catLower.includes('learner experience')) {
    const params = new URLSearchParams();

    // Use lx_stage if available; otherwise infer from study_category suffix
    let tabId = result.lx_stage;
    if (!tabId) {
      const suffix = category.replace(/^learner experience\s*/i, '').trim();
      if (suffix) {
        const match = JOURNEY_TABS.find(
          (t) => t.trackSuffix && t.trackSuffix.toLowerCase() === suffix.toLowerCase()
        );
        if (match) tabId = match.id;
      }
    }

    if (tabId) params.set('tab', tabId);
    if (result.lx_topic) params.set('level2', result.lx_topic);
    if (result.lx_focus) params.set('level3', result.lx_focus);
    params.set('highlight', result.slug);
    const qs = params.toString();
    return `/learner-experience${qs ? '?' + qs : ''}#${result.slug}`;
  }

  // Route to Domain Tracks and attach the highlight parameter for auto-expansion
  const resolved = resolveTrackSlug(category, result.slug);

  // Safely extract the track slug whether the registry returns a string or an object
  let trackSlug = '';
  if (typeof resolved === 'string') {
    trackSlug = resolved;
  } else if (resolved && typeof resolved === 'object') {
    trackSlug = (resolved as any).slug || (resolved as any).path?.replace(/^\//, '') || '';
  }

  if (trackSlug) {
    // Append both the URL query param (for our React hook) and an anchor hash (for native browser scrolling)
    return `/${trackSlug}?highlight=${result.slug}#${result.slug}`;
  }

  // Fallback
  return `/article/${result.slug}`;
}

export default function SearchBar({ onMenuClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [rawResults, setRawResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const searchContent = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setRawResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const [articlesResult, sectionsResult] = await Promise.all([
        supabase
          .from('articles')
          .select('id, title, slug, excerpt, study_category, lx_stage, lx_topic, lx_focus')
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .limit(15),
        supabase
          .from('sections')
          .select('id, title, slug')
          .ilike('title', `%${searchQuery}%`)
          .limit(8),
      ]);
      const searchResults: SearchResult[] = [
        ...(articlesResult.data?.map((a) => ({
          type: 'article' as const,
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          study_category: a.study_category,
          lx_stage: a.lx_stage,
          lx_topic: a.lx_topic,
          lx_focus: a.lx_focus,
        })) || []),
        ...(sectionsResult.data?.map((s) => ({
          type: 'section' as const,
          id: s.id,
          title: s.title,
          slug: s.slug,
        })) || []),
      ];
      setRawResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setRawResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || rawResults.length === 0) return rawResults;
    const fuse = new Fuse(rawResults, fuseOptions);
    return fuse.search(query.trim()).map((r) => r.item).slice(0, 8);
  }, [rawResults, query]);

  useEffect(() => {
    const timer = setTimeout(() => searchContent(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchContent]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (result: SearchResult) => {
    const targetRoute = getDashboardRoute(result);
    // Force React Router to push the state change even if we are already on the current domain
    navigate(targetRoute, { 
      replace: false, 
      state: { highlight: result.slug, timestamp: Date.now() } 
    });
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl min-w-0">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search the Archives..."
          className="w-full pl-12 pr-20 py-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-zinc-500 text-xs font-medium">
            <span>Ctrl/Cmd</span><span>K</span>
          </div>
        </div>
      </div>

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl border border-zinc-800/50 shadow-lg overflow-hidden z-50">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-zinc-800">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      result.type === 'article'
                        ? 'bg-blue-600/10'
                        : 'bg-zinc-800'
                    }`}>
                      {result.type === 'article'
                        ? <FileText className="w-4 h-4 text-blue-400" />
                        : <Folder className="w-4 h-4 text-zinc-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{result.title}</p>
                      {result.excerpt && (
                        <p className="text-sm text-zinc-500 line-clamp-1 mt-0.5">{result.excerpt}</p>
                      )}
                    </div>
                    <span className="text-xs text-zinc-600">{result.type === 'article' ? 'Mission Brief' : 'Domain'}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p>No results for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeCategory } from '../utils/normalizeCategory';
import type { Article } from '../types/database';

export type ArticleWithContributor = Article & { contributor?: { name: string } | null; author?: string | null };

export function useArticles(refreshKey: number = 0) {
  const [articles, setArticles] = useState<ArticleWithContributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [articlesRes, subsRes] = await Promise.all([
          supabase
            .from('articles')
            .select('*, contributor:contributors(name)')
            .eq('status', 'published')
            .order('created_at', { ascending: true }),
          supabase
            .from('submissions')
            .select('*')
            .eq('is_approved', true),
        ]);

        if (abortRef.current) return;

        if (articlesRes.error) throw articlesRes.error;
        if (subsRes.error) throw subsRes.error;

        const dbArticles: ArticleWithContributor[] = (articlesRes.data ?? []).map((a: any) => ({
          ...a,
          study_category: normalizeCategory(a.study_category ?? '', a.title ?? ''),
        }));

        const approvedSubs: ArticleWithContributor[] = (subsRes.data ?? []).map((s: any) => ({
          id: s.id,
          title: s.title,
          slug: s.title
            ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            : `submission-${s.id}`,
          section_id: null,
          content: s.content ?? '',
          formatted_content: s.formatted_content ?? null,
          excerpt: `Contributed by ${s.full_name}`,
          contributor_id: null,
          tags: s.badge ? [s.badge] : [],
          is_featured: false,
          is_sample: false,
          study_category: normalizeCategory(s.track ?? '', s.title ?? ''),
          source_file: null,
          author_name: s.full_name ?? null,
          author: s.full_name ?? null,
          submission_type: s.submission_type ?? null,
          comp_objective: s.comp_objective ?? null,
          created_at: s.created_at,
          updated_at: s.created_at,
        }));

        const existingTitles = new Set(dbArticles.map((a) => (a.title ?? '').toLowerCase().trim()));
        const merged = [
          ...dbArticles,
          ...approvedSubs.filter((s) => !existingTitles.has((s.title ?? '').toLowerCase().trim())),
        ];

        const seenIds = new Set<string>();
        const deduplicated = merged.filter((a) => {
          if (seenIds.has(a.id)) return false;
          seenIds.add(a.id);
          return true;
        });

        if (!abortRef.current) {
          setArticles(deduplicated);
        }
      } catch (e: any) {
        console.error('useArticles fetch error:', e);
        if (!abortRef.current) {
          setError(e?.message ?? 'Failed to load articles');
        }
      } finally {
        if (!abortRef.current) {
          setIsLoading(false);
        }
      }
    }
    fetchData();

    return () => { abortRef.current = true; };
  }, [refreshKey]);

  return { articles, isLoading, error };
}

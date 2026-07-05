import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { type NewSubmission } from '../utils/submissions';
import { FOUNDER_KEY } from '../constants/config';
import { TRACK_ORDER } from '../constants/tracks';
import { resolveToTrackName } from '../lib/domainRegistry';

export interface PortfolioItem extends NewSubmission {
  slug?: string;
}

export interface ContributorGroup {
  name: string;
  topBadge: string;
  items: PortfolioItem[];
  rawTypeCounts: Record<string, number>;
  portalTypeCounts: Record<string, number>;
  totalCount: number;
  tracks: string[];
  objectives: string[];
  latestContribution: string;
}

interface UseContributorGroupsOptions {
  newSubmission?: NewSubmission | null;
}

interface UseContributorGroupsResult {
  contributors: ContributorGroup[];
  newestNonFounderName: string | null;
  isLoading: boolean;
  error: string | null;
}

type PortalBucket = 'Articles' | 'Pro Tips' | 'Diagrams' | 'Resource Links' | 'Playbooks';

export function mapToPortalBucket(rawType: string | null | undefined): PortalBucket {
  switch (rawType) {
    case 'Pro Tip':
    case 'Study Tip':
    case 'Quick Reference':
    case 'Quick Ref':
      return 'Pro Tips';
    case 'Diagram':
      return 'Diagrams';
    case 'Resource Link':
      return 'Resource Links';
    case 'Playbook':
    case 'Prompt Playbook':
      return 'Playbooks';
    default:
      return 'Articles';
  }
}

export function resolveTrack(track: string, slug?: string): string {
  return resolveToTrackName(track, slug);
}

export function groupItemsByTrack(items: PortfolioItem[]): Map<string, PortfolioItem[]> {
  const map = new Map<string, PortfolioItem[]>();
  for (const s of items) {
    const bucket = resolveTrack(s.track ?? '', s.slug);
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(s);
  }
  for (const [, val] of map) {
    val.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  }
  const sorted = new Map<string, PortfolioItem[]>();
  for (const known of TRACK_ORDER) {
    if (map.has(known)) { sorted.set(known, map.get(known)!); map.delete(known); }
  }
  const otherBucket = map.get('Other Contributions');
  map.delete('Other Contributions');
  for (const [key, val] of [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    sorted.set(key, val);
  }
  if (otherBucket) sorted.set('Other Contributions', otherBucket);
  return sorted;
}

function shortenTrack(track: string): string {
  const match = track.match(/Domain\s+\d+\.\d+/i);
  return match ? match[0] : track;
}

function buildGroups(entries: PortfolioItem[]): ContributorGroup[] {
  const map = new Map<string, ContributorGroup & { _tracks: Set<string>; _objectives: Set<string> }>();

  for (const item of entries) {
    const key = item.full_name.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        name: item.full_name.trim(),
        topBadge: 'Cohort Contributor',
        items: [],
        rawTypeCounts: {},
        portalTypeCounts: {},
        totalCount: 0,
        tracks: [],
        objectives: [],
        latestContribution: '',
        _tracks: new Set(),
        _objectives: new Set(),
      });
    }
    const group = map.get(key)!;
    if (item.badge && item.badge !== 'Cohort Contributor') group.topBadge = item.badge;

    group.items.push(item);
    group.totalCount++;

    const rawType = item.submission_type ?? 'Article';
    group.rawTypeCounts[rawType] = (group.rawTypeCounts[rawType] ?? 0) + 1;

    const portalBucket = mapToPortalBucket(item.submission_type);
    group.portalTypeCounts[portalBucket] = (group.portalTypeCounts[portalBucket] ?? 0) + 1;

    if (item.created_at && item.created_at > group.latestContribution) {
      group.latestContribution = item.created_at;
    }
    if (item.track) group._tracks.add(shortenTrack(item.track));
    if (item.comp_objective) group._objectives.add(item.comp_objective);
  }

  const jamin = map.get(FOUNDER_KEY);
  if (jamin) jamin.topBadge = 'Founder';

  const allGroups = Array.from(map.values()).map((g) => {
    g.tracks = Array.from(g._tracks);
    g.objectives = Array.from(g._objectives);
    return g as ContributorGroup;
  });

  const founder = allGroups.find((g) => g.topBadge === 'Founder');
  const rest = allGroups.filter((g) => g.topBadge !== 'Founder');

  rest.sort((a, b) => {
    const dateCompare = b.latestContribution.localeCompare(a.latestContribution);
    if (dateCompare !== 0) return dateCompare;
    return b.totalCount - a.totalCount;
  });

  return founder ? [founder, ...rest] : rest;
}

export function useContributorGroups(options?: UseContributorGroupsOptions): UseContributorGroupsResult {
  const newSubmission = options?.newSubmission ?? null;
  const [entries, setEntries] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      setError(null);

      const [subResult, articleResult] = await Promise.all([
        supabase
          .from('submissions')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('articles')
          .select('id, title, slug, content, author_name, study_category, submission_type, comp_objective, created_at')
          .eq('is_sample', false)
          .not('author_name', 'is', null)
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (subResult.error || articleResult.error) {
        setError(subResult.error?.message ?? articleResult.error?.message ?? 'Fetch failed');
        setIsLoading(false);
        return;
      }

      const articleEntries: PortfolioItem[] = (articleResult.data ?? []).map((a: any) => ({
        id: `art-${a.id}`,
        full_name: a.author_name,
        track: a.study_category ?? '',
        badge: 'Cohort Contributor',
        title: a.title,
        content: a.content ?? '',
        submission_type: a.submission_type ?? 'Article',
        comp_objective: a.comp_objective ?? '',
        created_at: a.created_at ?? '',
        slug: a.slug,
      }));

      const submissionEntries: PortfolioItem[] = ((subResult.data as any[]) ?? []).map((s: any) => ({
        ...s,
        slug: undefined,
      }));

      const allEntries: PortfolioItem[] = [];
      const seenTitles = new Set<string>();

      for (const entry of articleEntries) {
        const key = entry.title.trim().toLowerCase();
        if (!seenTitles.has(key)) { seenTitles.add(key); allEntries.push(entry); }
      }
      for (const entry of submissionEntries) {
        const key = entry.title.trim().toLowerCase();
        if (!seenTitles.has(key)) { seenTitles.add(key); allEntries.push(entry); }
      }

      setEntries(allEntries);
      setIsLoading(false);
    }
    fetch();
  }, []);

  useEffect(() => {
    if (!newSubmission) return;
    setEntries((prev) => {
      const already = prev.some((s) => s.id === newSubmission.id);
      if (already) return prev;
      return [{ ...newSubmission, slug: undefined }, ...prev];
    });
  }, [newSubmission]);

  const contributors = useMemo(() => buildGroups(entries), [entries]);

  const newestNonFounderName = useMemo(() => {
    const first = entries.find((s) => s.full_name?.trim().toLowerCase() !== FOUNDER_KEY);
    return first?.full_name?.trim() ?? null;
  }, [entries]);

  return { contributors, newestNonFounderName, isLoading, error };
}

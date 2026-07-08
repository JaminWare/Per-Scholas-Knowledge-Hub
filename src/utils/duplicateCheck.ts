import { supabase } from '../lib/supabase';
import { normalizeUrl } from './normalizeUrl';

const DUPLICATE_MSG =
  'A resource with a similar title or identical content has already been submitted or published.';

function normalizeTitle(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function checkForDuplicate(
  title: string,
  content: string,
  resourceUrl: string | undefined,
  submissionType: string,
): Promise<string | null> {
  const normalized = normalizeTitle(title);
  if (!normalized || normalized.length < 3) return null;

  // Use exact match for short titles (< 8 chars), substring for longer ones
  const useExact = normalized.length < 8;
  const titlePattern = useExact ? normalized : `%${normalized}%`;
  const titleFilter = useExact ? 'eq' : 'ilike';

  // Title check across both tables
  const [articlesByTitle, submissionsByTitle] = await Promise.all([
    titleFilter === 'eq'
      ? supabase
          .from('articles')
          .select('id, title')
          .eq('is_sample', false)
          .limit(50)
      : supabase
          .from('articles')
          .select('id')
          .ilike('title', titlePattern)
          .eq('is_sample', false)
          .limit(1),
    titleFilter === 'eq'
      ? supabase
          .from('submissions')
          .select('id, title')
          .limit(50)
      : supabase
          .from('submissions')
          .select('id')
          .ilike('title', titlePattern)
          .limit(1),
  ]);

  if (useExact) {
    // For short titles, do client-side exact normalized comparison
    const articleMatch = (articlesByTitle.data ?? []).some(
      (row: { title?: string }) => normalizeTitle(row.title ?? '') === normalized
    );
    const submissionMatch = (submissionsByTitle.data ?? []).some(
      (row: { title?: string }) => normalizeTitle(row.title ?? '') === normalized
    );
    if (articleMatch || submissionMatch) return DUPLICATE_MSG;
  } else {
    if (
      (articlesByTitle.data && articlesByTitle.data.length > 0) ||
      (submissionsByTitle.data && submissionsByTitle.data.length > 0)
    ) {
      return DUPLICATE_MSG;
    }
  }

  // URL exact match (Resource Link type)
  if (submissionType === 'Resource Link' && resourceUrl?.trim()) {
    const normalizedInput = normalizeUrl(resourceUrl);
    if (normalizedInput.length >= 5) {
      const [articlesByUrl, submissionsByUrl] = await Promise.all([
        supabase
          .from('articles')
          .select('id, content')
          .eq('submission_type', 'Resource Link')
          .eq('is_sample', false),
        supabase
          .from('submissions')
          .select('id, content')
          .eq('submission_type', 'Resource Link'),
      ]);

      const articleUrlMatch = (articlesByUrl.data ?? []).some(
        (row: { content?: string | null }) => normalizeUrl(row.content ?? '') === normalizedInput
      );
      const submissionUrlMatch = (submissionsByUrl.data ?? []).some(
        (row: { content?: string | null }) => normalizeUrl(row.content ?? '') === normalizedInput
      );

      if (articleUrlMatch || submissionUrlMatch) return DUPLICATE_MSG;
    }
  }

  // Content substring check for non-link types with substantial body text
  if (submissionType !== 'Resource Link' && content.length >= 80) {
    const contentSnippet = content
      .replace(/[#*>`\-_|[\]()!]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80)
      .trim();

    if (contentSnippet.length >= 40) {
      const contentPattern = `%${contentSnippet}%`;

      const [articlesByContent, submissionsByContent] = await Promise.all([
        supabase
          .from('articles')
          .select('id')
          .eq('is_sample', false)
          .ilike('content', contentPattern)
          .limit(1),
        supabase
          .from('submissions')
          .select('id')
          .ilike('content', contentPattern)
          .limit(1),
      ]);

      if (
        (articlesByContent.data && articlesByContent.data.length > 0) ||
        (submissionsByContent.data && submissionsByContent.data.length > 0)
      ) {
        return DUPLICATE_MSG;
      }
    }
  }

  return null;
}

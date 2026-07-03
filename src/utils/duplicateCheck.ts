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
  if (!normalized) return null;

  const titlePattern = `%${normalized}%`;

  // Title fuzzy check across both tables
  const [articlesByTitle, submissionsByTitle] = await Promise.all([
    supabase
      .from('articles')
      .select('id')
      .ilike('title', titlePattern)
      .eq('is_sample', false)
      .limit(1),
    supabase
      .from('submissions')
      .select('id')
      .ilike('title', titlePattern)
      .limit(1),
  ]);

  if (
    (articlesByTitle.data && articlesByTitle.data.length > 0) ||
    (submissionsByTitle.data && submissionsByTitle.data.length > 0)
  ) {
    return DUPLICATE_MSG;
  }

  // URL exact match (Resource Link type)
  if (submissionType === 'Resource Link' && resourceUrl?.trim()) {
    const normalizedInput = normalizeUrl(resourceUrl);
    const urlPattern = `%${normalizedInput}%`;

    const [articlesByUrl, submissionsByUrl] = await Promise.all([
      supabase
        .from('articles')
        .select('id')
        .eq('submission_type', 'Resource Link')
        .eq('is_sample', false)
        .ilike('content', urlPattern)
        .limit(1),
      supabase
        .from('submissions')
        .select('id')
        .eq('submission_type', 'Resource Link')
        .ilike('content', urlPattern)
        .limit(1),
    ]);

    if (
      (articlesByUrl.data && articlesByUrl.data.length > 0) ||
      (submissionsByUrl.data && submissionsByUrl.data.length > 0)
    ) {
      return DUPLICATE_MSG;
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

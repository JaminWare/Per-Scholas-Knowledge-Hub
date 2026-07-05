export interface TabEntry {
  pageTitle: string;
  pageUrl: string;
  tabId: number;
  isCurrent: boolean;
}

export interface DiffEntry {
  field: 'pageTitle' | 'pageUrl';
  tabId: number;
  original: string;
  cleaned: string;
  changed: boolean;
}

const WRAPPER_TAG_RE = /<WebsiteContent_[A-Za-z0-9_]+>([\s\S]*?)<\/WebsiteContent_[A-Za-z0-9_]+>/g;

export function stripWrapperTags(raw: string): string {
  if (!raw || typeof raw !== 'string') return raw ?? '';
  const stripped = raw.replace(WRAPPER_TAG_RE, '$1');
  if (stripped !== raw) return stripped;
  // Fallback: conservative removal of any remaining angle-bracket wrappers
  // matching the WebsiteContent pattern that the primary regex might miss
  return raw.replace(/<\/?WebsiteContent_[A-Za-z0-9_]+>/g, '');
}

export function parseRawTabsMetadata(raw: string): TabEntry[] {
  if (!raw || typeof raw !== 'string') return [];

  let jsonStr = raw.trim();
  // Strip the assignment prefix if present
  const assignmentMatch = jsonStr.match(/^(?:edge_all_open_tabs\s*=\s*)/);
  if (assignmentMatch) {
    jsonStr = jsonStr.slice(assignmentMatch[0].length);
  }

  let parsed: unknown[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Attempt recovery: try wrapping in array brackets
    try {
      parsed = JSON.parse(`[${jsonStr}]`);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      pageTitle: stripWrapperTags(String(item.pageTitle ?? '')),
      pageUrl: stripWrapperTags(String(item.pageUrl ?? '')),
      tabId: typeof item.tabId === 'number' ? item.tabId : 0,
      isCurrent: Boolean(item.isCurrent),
    }));
}

export function generateCleaningDiff(
  rawInput: string,
  cleaned: TabEntry[]
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  let jsonStr = rawInput.trim();
  const assignmentMatch = jsonStr.match(/^(?:edge_all_open_tabs\s*=\s*)/);
  if (assignmentMatch) jsonStr = jsonStr.slice(assignmentMatch[0].length);

  let originals: Record<string, unknown>[] = [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) originals = parsed;
  } catch {
    try {
      const parsed = JSON.parse(`[${jsonStr}]`);
      if (Array.isArray(parsed)) originals = parsed;
    } catch { /* no diff available */ }
  }

  cleaned.forEach((entry, i) => {
    const orig = originals[i];
    if (!orig) return;

    const origTitle = String(orig.pageTitle ?? '');
    const origUrl = String(orig.pageUrl ?? '');

    diffs.push({
      field: 'pageTitle',
      tabId: entry.tabId,
      original: origTitle,
      cleaned: entry.pageTitle,
      changed: origTitle !== entry.pageTitle,
    });

    diffs.push({
      field: 'pageUrl',
      tabId: entry.tabId,
      original: origUrl,
      cleaned: entry.pageUrl,
      changed: origUrl !== entry.pageUrl,
    });
  });

  return diffs;
}

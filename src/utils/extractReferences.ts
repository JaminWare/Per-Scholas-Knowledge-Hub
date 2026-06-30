export interface ExtractedReference {
  label: string;
  url: string;
}

const REFERENCES_SECTION_RE = /## .*(?:References|Citations).*\n([\s\S]*?)(?=\n## |$)/i;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
const BARE_URL_RE = /(?<!\]\()https?:\/\/[^\s)>\]]+/g;

export function extractReferences(content: string | null | undefined): ExtractedReference[] {
  if (!content) return [];

  const sectionMatch = content.match(REFERENCES_SECTION_RE);
  if (!sectionMatch) return [];

  const block = sectionMatch[1];
  const refs: ExtractedReference[] = [];
  const seenUrls = new Set<string>();

  let match: RegExpExecArray | null;
  const linkRegex = new RegExp(MD_LINK_RE.source, 'g');
  while ((match = linkRegex.exec(block)) !== null) {
    const url = match[2].replace(/\/+$/, '');
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      refs.push({ label: match[1], url });
    }
  }

  const bareRegex = new RegExp(BARE_URL_RE.source, 'g');
  while ((match = bareRegex.exec(block)) !== null) {
    const url = match[0].replace(/\/+$/, '');
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      refs.push({ label: domain, url });
    }
  }

  return refs;
}

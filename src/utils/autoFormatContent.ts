import { extractSmartLinkLabel, isImageUrl, encodeParens } from './markdownLinks';

const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'in', 'on', 'at', 'to', 'by', 'of', 'up', 'as', 'is', 'it',
]);

const WRAPPER_TAG_RE = /<WebsiteContent_[A-Za-z0-9_]+>([\s\S]*?)<\/WebsiteContent_[A-Za-z0-9_]+>/g;
const STRAY_TAG_RE = /<\/?WebsiteContent_[A-Za-z0-9_]+>/g;
const TABS_PREFIX_RE = /^edge_all_open_tabs\s*=\s*/gm;

function stripMetadataWrappers(text: string): string {
  let cleaned = text.replace(WRAPPER_TAG_RE, '$1');
  cleaned = cleaned.replace(STRAY_TAG_RE, '');
  cleaned = cleaned.replace(TABS_PREFIX_RE, '');
  return cleaned;
}

function toTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
      if (MINOR_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function extractHeaderPhrase(paragraph: string): { header: string; wordCount: number } {
  const words = paragraph.replace(/[#*>`_\[\]()]/g, '').trim().split(/\s+/);
  const count = Math.min(Math.max(3, Math.ceil(words.length * 0.3)), 6);
  return { header: toTitleCase(words.slice(0, count).join(' ')), wordCount: count };
}

function sliceLeadingWords(paragraph: string, count: number): string {
  const words = paragraph.trim().split(/\s+/);
  const remaining = words.slice(count);
  if (remaining.length < 5) return '';
  const body = remaining.join(' ');
  return body.charAt(0).toUpperCase() + body.slice(1);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isListBlock(block: string): boolean {
  const lines = block.split('\n');
  return lines.every((l) => /^\s*[-*]\s/.test(l) || l.trim() === '');
}

function isHeading(block: string): boolean {
  return /^#{1,6}\s/.test(block.trim());
}

function isBlockquote(block: string): boolean {
  return block.split('\n').every((l) => /^> /.test(l) || l.trim() === '');
}

// ---------------------------------------------------------------------------
// Link sanitization pass (ported from MarkdownSanitizerPanel)
// ---------------------------------------------------------------------------

function extractMarkdownLink(text: string, startIdx: number): { full: string; bang: string; label: string; url: string } | null {
  const bangChar = text[startIdx] === '!' ? '!' : '';
  const bracketStart = bangChar ? startIdx + 1 : startIdx;

  if (text[bracketStart] !== '[') return null;

  let depth = 0;
  let i = bracketStart;
  for (; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0 || text[i + 1] !== '(') return null;

  const label = text.slice(bracketStart + 1, i);
  const urlStart = i + 2;

  let parenDepth = 1;
  let j = urlStart;
  for (; j < text.length && parenDepth > 0; j++) {
    if (text[j] === '(') parenDepth++;
    else if (text[j] === ')') parenDepth--;
  }
  if (parenDepth !== 0) return null;

  const url = text.slice(urlStart, j - 1);
  const full = text.slice(startIdx, j);
  return { full, bang: bangChar, label, url };
}

function sanitizeLinks(input: string): string {
  const result: string[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    if ((input[cursor] === '!' && input[cursor + 1] === '[') || input[cursor] === '[') {
      const parsed = extractMarkdownLink(input, cursor);
      if (parsed) {
        const encoded = encodeParens(parsed.url);

        if (parsed.bang === '!' && !isImageUrl(parsed.url)) {
          const label = parsed.label || extractSmartLinkLabel(parsed.url);
          result.push(`[${label}](${encoded})`);
        } else if (!parsed.bang && !parsed.label) {
          result.push(`[${extractSmartLinkLabel(parsed.url)}](${encoded})`);
        } else {
          result.push(`${parsed.bang}[${parsed.label}](${encoded})`);
        }
        cursor += parsed.full.length;
        continue;
      }
    }

    const remaining = input.slice(cursor);
    const bareMatch = remaining.match(/^https?:\/\/[^\s)>\]]+/);
    if (bareMatch && (cursor === 0 || !/\]\($/.test(input.slice(Math.max(0, cursor - 2), cursor)))) {
      const url = bareMatch[0];
      const encoded = encodeParens(url);
      if (isImageUrl(url)) {
        result.push(`![Image](${encoded})`);
      } else {
        result.push(`[${extractSmartLinkLabel(url)}](${encoded})`);
      }
      cursor += url.length;
      continue;
    }

    result.push(input[cursor]);
    cursor++;
  }

  return result.join('');
}

// ---------------------------------------------------------------------------
// Main auto-format pipeline
// ---------------------------------------------------------------------------

export function autoFormatContent(raw: string): string {
  try {
    let text = raw.trim();
    if (!text) return text;

    // Strip any metadata wrapper tags before processing
    text = stripMetadataWrappers(text);

    // Collapse 3+ consecutive newlines to exactly 2
    text = text.replace(/\n{3,}/g, '\n\n');

    // Split into discrete blocks by double newlines
    const blocks = text.split(/\n\n/).map((b) => b.trim()).filter(Boolean);
    const output: string[] = [];

    // Track whether the previous emitted block was a heading so we never
    // extract a second header from the body paragraph that follows it.
    // This is the key idempotency guard: clicking Auto-Format twice produces
    // identical output because `### H\n\nbody` splits into ["### H", "body"]
    // and the body is protected by this flag on the second pass.
    let prevWasHeading = false;

    for (const block of blocks) {
      if (isHeading(block)) {
        output.push(block);
        prevWasHeading = true;
      } else if (isBlockquote(block)) {
        // Already-quoted blocks pass through unchanged to avoid double-quoting.
        output.push(block);
        prevWasHeading = false;
      } else if (prevWasHeading) {
        // Body paragraph immediately after a heading: pass through as-is.
        output.push(block);
        prevWasHeading = false;
      } else if (isListBlock(block)) {
        const cleaned = block
          .split('\n')
          .map((line) => {
            const match = line.match(/^\s*[-*]\s+(.*)/);
            return match ? `- ${match[1].trim()}` : line;
          })
          .join('\n');
        output.push(cleaned);
        prevWasHeading = false;
      } else if (wordCount(block) < 15) {
        const quoted = block
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
        output.push(quoted);
        prevWasHeading = false;
      } else {
        const { header, wordCount: headerWordCount } = extractHeaderPhrase(block);
        const body = sliceLeadingWords(block, headerWordCount);
        if (body) {
          output.push(`### ${header}\n\n${body}`);
          prevWasHeading = false;
        } else {
          output.push(block);
          prevWasHeading = false;
        }
      }
    }

    let result = output.join('\n\n');

    // Ensure a blank line after a heading if missing
    result = result.replace(/^(#{1,6}\s.+)\n(?!\n)/gm, '$1\n\n');

    // Ensure a blank line before the first list item when preceded by a paragraph
    result = result.replace(/([^\n])\n([-*] |\d+[.)]\s)/g, '$1\n\n$2');

    // Trim trailing whitespace on each line
    result = result
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');

    // Sanitize all links: encode parens, fix broken markdown links, label bare URLs
    result = sanitizeLinks(result);

    return result.trim();
  } catch {
    return raw;
  }
}

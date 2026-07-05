import { extractSmartLinkLabel, isImageUrl, encodeParens } from './markdownLinks';

const WRAPPER_TAG_RE = /<WebsiteContent_[A-Za-z0-9_]+>([\s\S]*?)<\/WebsiteContent_[A-Za-z0-9_]+>/g;
const STRAY_TAG_RE = /<\/?WebsiteContent_[A-Za-z0-9_]+>/g;
const TABS_PREFIX_RE = /^edge_all_open_tabs\s*=\s*/gm;

const GENERIC_LABELS = new Set([
  'attachment', 'link', 'click here', 'here', 'untitled',
  'url', 'source', 'image', 'file', 'document', 'resource',
]);

function stripMetadataWrappers(text: string): string {
  let cleaned = text.replace(WRAPPER_TAG_RE, '$1');
  cleaned = cleaned.replace(STRAY_TAG_RE, '');
  cleaned = cleaned.replace(TABS_PREFIX_RE, '');
  return cleaned;
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

function isSingleSentence(text: string): boolean {
  const trimmed = text.trim();
  const sentenceBreak = trimmed.match(/\.\s+[A-Z]/);
  return !sentenceBreak;
}

// ---------------------------------------------------------------------------
// Structure-aware header extraction
// ---------------------------------------------------------------------------

function tryExtractStructuralHeader(block: string): { header: string; body: string } | null {
  // Strategy 1: Colon delimiter in first ~80 chars with a short prefix (2-7 words)
  const colonIdx = block.indexOf(': ');
  if (colonIdx > 0 && colonIdx <= 80) {
    const prefix = block.slice(0, colonIdx).trim();
    const prefixWords = prefix.split(/\s+/).length;
    if (prefixWords >= 2 && prefixWords <= 7) {
      const body = block.slice(colonIdx + 2).trim();
      if (body.length >= 20) {
        return { header: prefix, body };
      }
    }
  }

  // Strategy 2: Multi-sentence text -- use the first sentence as the header
  // Only if block has 2+ sentences (detected by ". " followed by uppercase)
  if (!isSingleSentence(block)) {
    const match = block.match(/^(.+?\.)(\s+[A-Z][\s\S]*)$/);
    if (match) {
      const firstSentence = match[1].trim();
      const rest = match[2].trim();
      const firstWords = firstSentence.split(/\s+/).length;
      if (firstWords <= 12 && rest.length >= 20) {
        return { header: firstSentence, body: rest };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Link sanitization pass
// ---------------------------------------------------------------------------

function isGenericLabel(label: string): boolean {
  return GENERIC_LABELS.has(label.toLowerCase().trim());
}

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
        const smartLabel = extractSmartLinkLabel(parsed.url);

        if (parsed.bang === '!' && isImageUrl(parsed.url)) {
          // Valid image: keep as image, replace generic labels
          const label = (parsed.label && !isGenericLabel(parsed.label)) ? parsed.label : smartLabel;
          result.push(`![${label}](${encoded})`);
        } else if (parsed.bang === '!' && !isImageUrl(parsed.url)) {
          // Bang prefix on non-image: convert to regular link
          const label = (parsed.label && !isGenericLabel(parsed.label)) ? parsed.label : smartLabel;
          result.push(`[${label}](${encoded})`);
        } else if (!parsed.label || isGenericLabel(parsed.label)) {
          // No label or generic placeholder: always generate smart label
          result.push(`[${smartLabel}](${encoded})`);
        } else {
          // Has a meaningful label: preserve it
          result.push(`[${parsed.label}](${encoded})`);
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
        result.push(`![${extractSmartLinkLabel(url)}](${encoded})`);
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
// Smart dash normalization
// ---------------------------------------------------------------------------

const MARKDOWN_LINK_RE = /\[([^\]]*)\]\([^)]*\)/g;
const URL_RE = /https?:\/\/[^\s)>\]]+/g;

function normalizeDashes(input: string): string {
  return input.split('\n').map((line) => {
    if (/^\s*[-*]\s/.test(line)) return line;

    const shields: { start: number; end: number }[] = [];
    let m: RegExpExecArray | null;

    MARKDOWN_LINK_RE.lastIndex = 0;
    while ((m = MARKDOWN_LINK_RE.exec(line)) !== null) {
      shields.push({ start: m.index, end: m.index + m[0].length });
    }
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(line)) !== null) {
      shields.push({ start: m.index, end: m.index + m[0].length });
    }

    const isShielded = (idx: number) => shields.some((s) => idx >= s.start && idx < s.end);

    let result = '';
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      const isEm = ch === '\u2014';
      const isEn = ch === '\u2013';
      const isHyphenBreak = ch === '-' && i > 0 && i < line.length - 1
        && line[i - 1] === ' ' && line[i + 1] === ' ';

      if ((isEm || isEn || isHyphenBreak) && !isShielded(i)) {
        const hasPre = result.length > 0 && result[result.length - 1] === ' ';
        const postStart = isHyphenBreak ? i + 2 : i + 1;
        const hasPost = postStart < line.length && line[postStart] === ' ';

        if (hasPre && (isHyphenBreak || hasPost)) {
          result = result.slice(0, -1) + ' ';
          i = isHyphenBreak ? i + 2 : (hasPost ? postStart + 1 : postStart);
        } else if (hasPre) {
          i = isHyphenBreak ? i + 2 : i + 1;
        } else {
          result += ' ';
          i = isHyphenBreak ? i + 2 : i + 1;
          if (i < line.length && line[i] === ' ') i++;
        }
      } else {
        result += ch;
        i++;
      }
    }
    return result;
  }).join('\n');
}

// ---------------------------------------------------------------------------
// Main auto-format pipeline
// ---------------------------------------------------------------------------

export function autoFormatContent(raw: string): string {
  try {
    let text = raw.trim();
    if (!text) return text;

    text = stripMetadataWrappers(text);
    text = text.replace(/\n{3,}/g, '\n\n');

    const blocks = text.split(/\n\n/).map((b) => b.trim()).filter(Boolean);
    const output: string[] = [];

    let prevWasHeading = false;

    for (const block of blocks) {
      if (isHeading(block)) {
        output.push(block);
        prevWasHeading = true;
      } else if (isBlockquote(block)) {
        output.push(block);
        prevWasHeading = false;
      } else if (prevWasHeading) {
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
        // Only extract a header if the block has a natural structural delimiter.
        // Single cohesive sentences/bullet points are left intact.
        const extracted = tryExtractStructuralHeader(block);
        if (extracted) {
          output.push(`### ${extracted.header}\n\n${extracted.body}`);
        } else {
          output.push(block);
        }
        prevWasHeading = false;
      }
    }

    let result = output.join('\n\n');

    result = result.replace(/^(#{1,6}\s.+)\n(?!\n)/gm, '$1\n\n');
    result = result.replace(/([^\n])\n([-*] |\d+[.)]\s)/g, '$1\n\n$2');

    result = result
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');

    result = normalizeDashes(result);
    result = sanitizeLinks(result);

    return result.trim();
  } catch {
    return raw;
  }
}

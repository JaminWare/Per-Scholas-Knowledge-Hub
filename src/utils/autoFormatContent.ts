const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'in', 'on', 'at', 'to', 'by', 'of', 'up', 'as', 'is', 'it',
]);

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

function extractHeaderPhrase(paragraph: string): string {
  const words = paragraph.replace(/[#*>`_\[\]()]/g, '').trim().split(/\s+/);
  const count = Math.min(Math.max(3, Math.ceil(words.length * 0.3)), 6);
  return toTitleCase(words.slice(0, count).join(' '));
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

export function autoFormatContent(raw: string): string {
  let text = raw.trim();
  if (!text) return text;

  // Collapse 3+ consecutive newlines to exactly 2
  text = text.replace(/\n{3,}/g, '\n\n');

  // Split into discrete blocks by double newlines
  const blocks = text.split(/\n\n/).map((b) => b.trim()).filter(Boolean);
  const output: string[] = [];

  for (const block of blocks) {
    if (isHeading(block)) {
      output.push(block);
    } else if (isListBlock(block)) {
      const cleaned = block
        .split('\n')
        .map((line) => {
          const match = line.match(/^\s*[-*]\s+(.*)/);
          return match ? `- ${match[1].trim()}` : line;
        })
        .join('\n');
      output.push(cleaned);
    } else if (wordCount(block) < 15) {
      const quoted = block
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
      output.push(quoted);
    } else {
      const header = `### ${extractHeaderPhrase(block)}`;
      output.push(`${header}\n\n${block}`);
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

  return result.trim();
}

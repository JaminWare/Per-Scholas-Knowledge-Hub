const DEFAULT_HEADERS = ['## Overview', '## Key Points', '## Summary'];

export function autoFormatContent(raw: string): string {
  let text = raw.trim();
  if (!text) return text;

  // Inject default section headers if no ## headings exist
  const hasH2 = /^##\s/m.test(text);
  if (!hasH2) {
    const lines = text.split('\n');
    const firstNonEmpty = lines.findIndex((l) => l.trim().length > 0);
    if (firstNonEmpty >= 0) {
      // Insert "## Overview" before the first content line
      lines.splice(firstNonEmpty, 0, DEFAULT_HEADERS[0], '');
      text = lines.join('\n');
    }
  }

  // Collapse 3+ consecutive newlines to exactly 2
  text = text.replace(/\n{3,}/g, '\n\n');

  // Ensure a blank line before the first list item when preceded by a paragraph
  text = text.replace(/([^\n])\n([-*] |\d+[.)]\s)/g, '$1\n\n$2');

  // Ensure a blank line after a heading if missing
  text = text.replace(/^(#{1,4}\s.+)\n(?!\n)/gm, '$1\n\n');

  // Trim trailing whitespace on each line
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Trim overall leading/trailing whitespace
  text = text.trim();

  return text;
}

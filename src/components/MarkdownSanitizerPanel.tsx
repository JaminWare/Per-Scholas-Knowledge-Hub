import { useState, useCallback } from 'react';
import { Wand2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { isImageUrl, extractSmartLinkLabel } from '../utils/markdownLinks';

const WRAPPER_TAG_RE = /<\/?WebsiteContent_[A-Za-z0-9_]+>/g;

function encodeParens(url: string): string {
  return url.replace(/\(/g, '%28').replace(/\)/g, '%29');
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

function sanitizeMarkdown(input: string): string {
  let text = input.replace(WRAPPER_TAG_RE, '');
  text = text.replace(/^edge_all_open_tabs\s*=\s*/, '');

  const result: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    if ((text[cursor] === '!' && text[cursor + 1] === '[') || text[cursor] === '[') {
      const parsed = extractMarkdownLink(text, cursor);
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

    const remaining = text.slice(cursor);
    const bareMatch = remaining.match(/^https?:\/\/[^\s)>\]]+/);
    if (bareMatch && (cursor === 0 || !/\]\($/.test(text.slice(Math.max(0, cursor - 2), cursor)))) {
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

    result.push(text[cursor]);
    cursor++;
  }

  return result.join('');
}

export default function MarkdownSanitizerPanel() {
  const [rawInput, setRawInput] = useState('');
  const [cleanedOutput, setCleanedOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClean = useCallback(() => {
    setError(null);
    setCleanedOutput(null);
    setCopied(false);

    if (!rawInput.trim()) {
      setError('Paste raw markdown to sanitize.');
      return;
    }

    setCleanedOutput(sanitizeMarkdown(rawInput));
  }, [rawInput]);

  const handleCopy = useCallback(() => {
    if (!cleanedOutput) return;
    navigator.clipboard.writeText(cleanedOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [cleanedOutput]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Paste raw markdown here
        </label>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Paste raw markdown here..."
          className="w-full h-40 px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 resize-y"
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleClean}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors shadow-md shadow-sky-500/20"
        >
          <Wand2 className="w-4 h-4" />
          Sanitize Markdown
        </button>

        {cleanedOutput !== null && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Cleaned Markdown'}
          </button>
        )}
      </div>

      {cleanedOutput !== null && (
        <div className="space-y-3">
          <pre className="w-full max-h-80 overflow-y-auto px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-sm font-mono text-zinc-300 whitespace-pre-wrap break-all">
            {cleanedOutput}
          </pre>
          <div className="flex items-center gap-2 text-sm text-teal-400">
            <CheckCircle2 className="w-4 h-4" />
            Markdown sanitized successfully
          </div>
        </div>
      )}
    </div>
  );
}

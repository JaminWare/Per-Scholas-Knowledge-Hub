import { Fragment } from 'react';
import { ExternalLink } from 'lucide-react';

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; label: string; href: string };

type Block =
  | { type: 'h2'; content: string }
  | { type: 'h3'; content: string }
  | { type: 'blockquote'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'paragraph'; content: string }
  | { type: 'citations'; items: string[] };

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Order matters: **bold** and `code` must be matched before *italic*
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*([^*\n]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      tokens.push({ type: 'bold', value: match[1] });
    } else if (match[2] !== undefined) {
      tokens.push({ type: 'code', value: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'link', label: match[3], href: match[4] });
    } else if (match[5] !== undefined) {
      tokens.push({ type: 'italic', value: match[5] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return tokens;
}

function renderInline(text: string): React.ReactNode {
  const tokens = parseInline(text);
  if (tokens.length === 1 && tokens[0].type === 'text') return tokens[0].value;
  return (
    <>
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'bold':
            return <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">{token.value}</strong>;
          case 'italic':
            return <em key={i} className="italic text-zinc-500 dark:text-zinc-400">{token.value}</em>;
          case 'code':
            return (
              <code key={i} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[0.85em] font-mono text-sky-700 dark:text-sky-400 border border-zinc-200 dark:border-zinc-700">
                {token.value}
              </code>
            );
          case 'link':
            return (
              <a key={i} href={token.href} target="_blank" rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 hover:underline underline-offset-2">
                {token.label}
              </a>
            );
          case 'text':
            return <Fragment key={i}>{token.value}</Fragment>;
        }
      })}
    </>
  );
}

function parseTableRow(row: string): string[] {
  return row
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function isAlignmentRow(row: string): boolean {
  return /^\|[\s:|–-]+\|$/.test(row.replace(/\s/g, ''));
}

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const heading = trimmed.slice(3).trim();
      if (heading === 'References & Citations') {
        // Consume all following list/paragraph lines until next H2
        i++;
        const citationItems: string[] = [];
        while (i < lines.length && !lines[i].trim().startsWith('## ')) {
          const t = lines[i].trim();
          if (t.startsWith('* ') || t.startsWith('- ')) {
            citationItems.push(t.slice(2));
          }
          i++;
        }
        blocks.push({ type: 'citations', items: citationItems });
      } else {
        blocks.push({ type: 'h2', content: heading });
        i++;
      }
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', content: trimmed.slice(4) });
      i++;
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'blockquote', content: trimmed.slice(2) });
      i++;
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.startsWith('* ') || t.startsWith('- ')) {
          items.push(t.slice(2));
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', items });
    } else if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = parseTableRow(tableLines[0]);
        const dataLines = tableLines.slice(1).filter((l) => !isAlignmentRow(l));
        const rows = dataLines.map(parseTableRow);
        blocks.push({ type: 'table', headers, rows });
      }
    } else {
      const paragraphLines: string[] = [];
      while (i < lines.length && lines[i].trim()) {
        paragraphLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'paragraph', content: paragraphLines.join(' ') });
    }
  }

  return blocks;
}

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-5 text-zinc-700 dark:text-zinc-300 leading-relaxed">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={idx} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-8 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 first:mt-0">
                {renderInline(block.content)}
              </h2>
            );
          case 'citations':
            return (
              <div key={idx} className="mt-10 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-200 dark:border-amber-500/20">
                  <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">
                    References & Citations
                  </h2>
                </div>
                {block.items.length > 0 && (
                  <ul className="px-5 py-4 space-y-2.5">
                    {block.items.map((item, j) => (
                      <li key={j} className="flex gap-2.5 items-start text-sm text-zinc-600 dark:text-zinc-400">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
                        <span>{renderInline(item)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          case 'h3':
            return (
              <h3 key={idx} className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-2">
                {renderInline(block.content)}
              </h3>
            );
          case 'blockquote':
            return (
              <blockquote key={idx} className="pl-4 border-l-4 border-sky-400 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/20 rounded-r py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                {renderInline(block.content)}
              </blockquote>
            );
          case 'list':
            return (
              <ul key={idx} className="space-y-2 pl-0 list-none">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 items-start">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400" />
                    <span className="text-zinc-600 dark:text-zinc-400">{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <div key={idx} className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700 my-6">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60">
                      {block.headers.map((header, hIdx) => (
                        <th key={hIdx} className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                          {renderInline(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-400">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'paragraph':
            return (
              <p key={idx} className="text-zinc-600 dark:text-zinc-400 leading-7">
                {renderInline(block.content)}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

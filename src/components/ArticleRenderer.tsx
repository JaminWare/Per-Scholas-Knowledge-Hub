import { AlertTriangle, Lightbulb, Terminal, ChevronRight } from 'lucide-react';
import type { ContentBlock } from '../data/contentMap';

interface Props {
  blocks: ContentBlock[];
}

export default function ArticleRenderer({ blocks }: Props) {
  return (
    <div className="space-y-6 text-zinc-300 leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'intro':
            return (
              <p key={i} className="text-base text-zinc-300 leading-relaxed border-l-4 border-sky-500 pl-4 py-1 italic">
                {block.text}
              </p>
            );

          case 'heading':
            return (
              <h2 key={i} className="text-xl font-bold text-zinc-100 mt-8 pt-4 border-t border-zinc-800 first-of-type:border-0 first-of-type:mt-4">
                {block.text}
              </h2>
            );

          case 'paragraph':
            return (
              <p key={i} className="text-zinc-400">{block.text}</p>
            );

          case 'warning':
            return (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">{block.text}</p>
              </div>
            );

          case 'tip':
            return (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-sky-500/5 border border-sky-500/20">
                <Lightbulb className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-sky-300">{block.text}</p>
              </div>
            );

          case 'steps':
            return (
              <ol key={i} className="space-y-2">
                {block.items.map((step, j) => (
                  <li key={j} className="flex gap-3 text-sm text-zinc-300">
                    <ChevronRight className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            );

          case 'code':
            return (
              <div key={i} className="rounded-xl overflow-hidden border border-zinc-700">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-700 border-b border-zinc-600">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{block.lang}</span>
                  <div className="ml-auto flex gap-1.5">
                    {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                      <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <pre className="p-4 bg-zinc-900 overflow-x-auto text-sm">
                  <code className="text-sky-300 font-mono leading-relaxed whitespace-pre">{block.code}</code>
                </pre>
              </div>
            );

          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-700">
                      {block.headers.map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-zinc-200 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-zinc-700/50 transition-colors">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-3 text-zinc-400">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

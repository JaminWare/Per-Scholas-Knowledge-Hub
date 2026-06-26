import { AlertTriangle, Lightbulb, Terminal, ChevronRight } from 'lucide-react';
import type { ContentBlock } from '../data/contentMap';

interface Props {
  blocks: ContentBlock[];
}

export default function ArticleRenderer({ blocks }: Props) {
  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'intro':
            return (
              <p key={i} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed border-l-4 border-emerald-500 pl-4 py-1 italic">
                {block.text}
              </p>
            );

          case 'heading':
            return (
              <h2 key={i} className="text-xl font-bold text-slate-900 dark:text-white mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 first-of-type:border-0 first-of-type:mt-4">
                {block.text}
              </h2>
            );

          case 'paragraph':
            return (
              <p key={i} className="text-slate-600 dark:text-slate-400">
                {block.text}
              </p>
            );

          case 'warning':
            return (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">{block.text}</p>
              </div>
            );

          case 'tip':
            return (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 dark:text-emerald-300">{block.text}</p>
              </div>
            );

          case 'steps':
            return (
              <ol key={i} className="space-y-2">
                {block.items.map((step, j) => (
                  <li key={j} className="flex gap-3 text-sm">
                    <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            );

          case 'code':
            return (
              <div key={i} className="rounded-xl overflow-hidden border border-slate-700 dark:border-slate-600">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    {block.lang}
                  </span>
                  <div className="ml-auto flex gap-1.5">
                    {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                      <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <pre className="p-4 bg-slate-900 overflow-x-auto text-sm">
                  <code className="text-emerald-300 font-mono leading-relaxed whitespace-pre">
                    {block.code}
                  </code>
                </pre>
              </div>
            );

          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      {block.headers.map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {cell}
                          </td>
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

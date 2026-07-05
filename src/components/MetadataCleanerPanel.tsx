import { useState, useCallback } from 'react';
import {
  Wand2, Copy, Download, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, FileJson,
} from 'lucide-react';
import { parseRawTabsMetadata, generateCleaningDiff, type TabEntry, type DiffEntry } from '../utils/tabMetadata';
import { redactSensitiveParams, encodeMarkdownUrl, extractUrlFromMarkdownWrapper } from '../utils/markdownLinks';

interface MetadataCleanerPanelProps {
  onOpenLinkFixer: (entries: TabEntry[]) => void;
}

export default function MetadataCleanerPanel({ onOpenLinkFixer }: MetadataCleanerPanelProps) {
  const [rawInput, setRawInput] = useState('');
  const [cleanedEntries, setCleanedEntries] = useState<TabEntry[] | null>(null);
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState<'json' | 'markdown' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClean = useCallback(() => {
    setError(null);
    if (!rawInput.trim()) {
      setError('Paste raw edge_all_open_tabs JSON to clean.');
      return;
    }

    const entries = parseRawTabsMetadata(rawInput);
    if (entries.length === 0) {
      setError('Could not parse any tab entries. Check the JSON format.');
      return;
    }

    const diffLog = generateCleaningDiff(rawInput, entries);
    setCleanedEntries(entries);
    setDiffs(diffLog);
    setShowDiff(true);
  }, [rawInput]);

  const exportJson = useCallback((withMarkdown: boolean) => {
    if (!cleanedEntries) return;

    const output = withMarkdown
      ? cleanedEntries.map((e) => ({
          ...e,
          pageUrl: `[${encodeMarkdownUrl(extractUrlFromMarkdownWrapper(e.pageUrl))}](${encodeMarkdownUrl(extractUrlFromMarkdownWrapper(e.pageUrl))})`,
        }))
      : cleanedEntries.map((e) => ({
          ...e,
          pageUrl: extractUrlFromMarkdownWrapper(e.pageUrl),
        }));

    const json = JSON.stringify(output, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopied(withMarkdown ? 'markdown' : 'json');
      setTimeout(() => setCopied(null), 2000);
    });
  }, [cleanedEntries]);

  const downloadJson = useCallback(() => {
    if (!cleanedEntries) return;
    const output = cleanedEntries.map((e) => ({
      ...e,
      pageUrl: extractUrlFromMarkdownWrapper(e.pageUrl),
    }));
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned-tabs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cleanedEntries]);

  const changedDiffs = diffs.filter((d) => d.changed);

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Raw Tab Metadata (paste edge_all_open_tabs JSON)
        </label>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder='edge_all_open_tabs = [{"pageTitle":"...","pageUrl":"...","tabId":123,"isCurrent":true}]'
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

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleClean}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors shadow-md shadow-sky-500/20"
        >
          <Wand2 className="w-4 h-4" />
          Clean Metadata
        </button>

        {cleanedEntries && (
          <>
            <button
              onClick={() => exportJson(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied === 'json' ? 'Copied!' : 'Copy JSON'}
            </button>
            <button
              onClick={() => exportJson(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              <FileJson className="w-4 h-4" />
              {copied === 'markdown' ? 'Copied!' : 'Copy with Markdown'}
            </button>
            <button
              onClick={downloadJson}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => onOpenLinkFixer(cleanedEntries)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors"
            >
              Fix Links
            </button>
          </>
        )}
      </div>

      {/* Diff view */}
      {cleanedEntries && showDiff && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setShowDiff((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/80 hover:bg-zinc-900 transition-colors"
          >
            <span className="text-sm font-semibold text-zinc-300">
              Cleaning Diff ({changedDiffs.length} change{changedDiffs.length !== 1 ? 's' : ''} across {cleanedEntries.length} tab{cleanedEntries.length !== 1 ? 's' : ''})
            </span>
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          </button>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
            {diffs.map((d, i) => (
              <div key={i} className={`px-4 py-2.5 text-xs font-mono ${d.changed ? 'bg-zinc-950/40' : 'bg-transparent'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-zinc-500">Tab {d.tabId}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{d.field}</span>
                  {d.changed ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">modified</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600">unchanged</span>
                  )}
                </div>
                {d.changed && (
                  <div className="space-y-1 mt-1">
                    <div className="flex gap-2">
                      <span className="text-red-400 select-none flex-shrink-0">-</span>
                      <span className="text-red-300/80 break-all">{redactSensitiveParams(d.original)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-emerald-400 select-none flex-shrink-0">+</span>
                      <span className="text-emerald-300/80 break-all">{redactSensitiveParams(d.cleaned)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cleaned result summary */}
      {cleanedEntries && !showDiff && (
        <button
          onClick={() => setShowDiff(true)}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
          Show diff ({changedDiffs.length} change{changedDiffs.length !== 1 ? 's' : ''})
        </button>
      )}

      {cleanedEntries && (
        <div className="flex items-center gap-2 text-sm text-teal-400">
          <CheckCircle2 className="w-4 h-4" />
          {cleanedEntries.length} tab{cleanedEntries.length !== 1 ? 's' : ''} cleaned successfully
        </div>
      )}
    </div>
  );
}

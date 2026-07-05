import { useState, useCallback, useRef } from 'react';
import {
  X, CheckCircle2, AlertCircle, Loader2, ExternalLink,
  Undo2, Copy, Zap, Shield,
} from 'lucide-react';
import type { TabEntry } from '../utils/tabMetadata';
import {
  encodeMarkdownUrl, extractUrlFromMarkdownWrapper,
  buildMarkdownUrl, redactSensitiveParams,
} from '../utils/markdownLinks';
import { validateSingle, type ValidationResult } from '../utils/linkValidator';

interface LinkFixerModalProps {
  entries: TabEntry[];
  onClose: () => void;
  onApply: (updated: TabEntry[]) => void;
}

interface LinkState {
  entry: TabEntry;
  fixedUrl: string;
  applied: boolean;
  validation: ValidationResult | null;
  isValidating: boolean;
}

export default function LinkFixerModal({ entries, onClose, onApply }: LinkFixerModalProps) {
  const [links, setLinks] = useState<LinkState[]>(() =>
    entries.map((entry) => {
      const rawUrl = extractUrlFromMarkdownWrapper(entry.pageUrl);
      const encoded = encodeMarkdownUrl(rawUrl);
      return {
        entry,
        fixedUrl: encoded,
        applied: false,
        validation: null,
        isValidating: false,
      };
    })
  );
  const [undoStack, setUndoStack] = useState<LinkState[][]>([]);
  const [copied, setCopied] = useState(false);
  const [batchValidating, setBatchValidating] = useState(false);
  const abortRef = useRef(false);

  const handleTestLink = useCallback(async (index: number) => {
    setLinks((prev) => prev.map((l, i) =>
      i === index ? { ...l, isValidating: true } : l
    ));

    const url = extractUrlFromMarkdownWrapper(links[index].entry.pageUrl);
    const result = await validateSingle(url);

    setLinks((prev) => prev.map((l, i) =>
      i === index ? { ...l, isValidating: false, validation: result } : l
    ));
  }, [links]);

  const handleTestAll = useCallback(async () => {
    setBatchValidating(true);
    abortRef.current = false;

    for (let i = 0; i < links.length; i++) {
      if (abortRef.current) break;
      await handleTestLink(i);
    }

    setBatchValidating(false);
  }, [links, handleTestLink]);

  const handleApplySingle = useCallback((index: number) => {
    setUndoStack((prev) => [...prev, links]);
    setLinks((prev) => prev.map((l, i) =>
      i === index ? { ...l, applied: true } : l
    ));
  }, [links]);

  const handleApplyAll = useCallback(() => {
    setUndoStack((prev) => [...prev, links]);
    setLinks((prev) => prev.map((l) => ({ ...l, applied: true })));
  }, [links]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setLinks(last);
  }, [undoStack]);

  const handleSave = useCallback(() => {
    const updated: TabEntry[] = links.map((l) => ({
      ...l.entry,
      pageUrl: l.applied ? l.fixedUrl : l.entry.pageUrl,
    }));
    onApply(updated);
    onClose();
  }, [links, onApply, onClose]);

  const copyAsMarkdown = useCallback(() => {
    const md = links
      .map((l) => buildMarkdownUrl(l.entry.pageTitle, l.applied ? l.fixedUrl : l.entry.pageUrl))
      .join('\n');
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [links]);

  const appliedCount = links.filter((l) => l.applied).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Link Fixer</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Review and apply URL encoding fixes. {appliedCount}/{links.length} fixed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {links.map((link, idx) => {
            const rawUrl = extractUrlFromMarkdownWrapper(link.entry.pageUrl);
            const needsFix = rawUrl !== link.fixedUrl;

            return (
              <div
                key={link.entry.tabId}
                className={`rounded-xl border p-4 transition-colors ${
                  link.applied
                    ? 'border-teal-500/30 bg-teal-500/5'
                    : 'border-zinc-800 bg-zinc-950/40'
                }`}
              >
                {/* Title row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-zinc-200 truncate flex-1">
                    {link.entry.pageTitle}
                  </span>
                  {link.entry.isCurrent && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Active
                    </span>
                  )}
                  {/* Validation badge */}
                  {link.validation && (
                    link.validation.reachable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Reachable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertCircle className="w-3 h-3" />
                        {link.validation.corsBlocked ? 'CORS Suspected' : 'Unreachable'}
                      </span>
                    )
                  )}
                  {link.isValidating && (
                    <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  )}
                </div>

                {/* URL comparison */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-zinc-600 font-mono w-12 flex-shrink-0 pt-0.5">orig</span>
                    <span className="text-xs font-mono text-zinc-400 break-all">
                      {redactSensitiveParams(rawUrl)}
                    </span>
                  </div>
                  {needsFix && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-emerald-600 font-mono w-12 flex-shrink-0 pt-0.5">fixed</span>
                      <span className="text-xs font-mono text-emerald-400/80 break-all">
                        {redactSensitiveParams(link.fixedUrl)}
                      </span>
                    </div>
                  )}
                  {!needsFix && (
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <Shield className="w-3 h-3" />
                      Already properly encoded
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestLink(idx)}
                    disabled={link.isValidating}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    Test Link
                  </button>
                  {needsFix && !link.applied && (
                    <button
                      onClick={() => handleApplySingle(idx)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-colors"
                    >
                      Apply Fix
                    </button>
                  )}
                  {link.applied && (
                    <span className="text-xs text-teal-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Applied
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors disabled:opacity-30"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={handleTestAll}
              disabled={batchValidating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              {batchValidating ? 'Testing...' : 'Test All'}
            </button>
            <button
              onClick={copyAsMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy as Markdown'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyAll}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-400 text-white transition-colors shadow-md shadow-sky-500/20"
            >
              Apply All Fixes
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-teal-500 hover:bg-teal-400 text-white transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

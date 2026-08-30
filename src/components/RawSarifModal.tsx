import React, { useState, useMemo } from 'react';
import { NormalizedFinding } from '../types/viewer';
import { highlightJson } from '../utils/jsonHighlighter';
import { X, Copy, Check, Download, Code2, ShieldAlert } from 'lucide-react';

interface RawSarifModalProps {
  finding: NormalizedFinding | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RawSarifModal: React.FC<RawSarifModalProps> = ({
  finding,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => {
    if (!finding) return '';
    return JSON.stringify(finding.rawResult, null, 2);
  }, [finding]);

  const highlightedLines = useMemo(() => {
    if (!jsonString) return [];
    const html = highlightJson(jsonString);
    return html.split('\n');
  }, [jsonString]);

  if (!isOpen || !finding) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarif-finding-${finding.ruleId}-${finding.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <dialog
      open
      aria-labelledby="raw-sarif-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs w-full h-full border-none max-w-none max-h-none overflow-hidden m-0"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden text-slate-900 dark:text-zinc-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/75 dark:bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-zinc-800 text-white flex items-center justify-center shadow-xs border border-transparent dark:border-zinc-700">
              <Code2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 id="raw-sarif-title" className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Raw SARIF Result</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  {finding.ruleId}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                ID: {finding.id} • Driver: {finding.toolName} {finding.toolVersion ? `v${finding.toolVersion}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Syntax Highlighted Code Viewer with Line Numbers */}
        <div className="p-4 overflow-auto flex-1 bg-slate-950 dark:bg-black text-slate-100 font-mono text-xs leading-5">
          <div className="min-w-max">
            {highlightedLines.map((lineHtml, idx) => (
              <div
                key={`line-${idx + 1}-${lineHtml.length}`}
                className="flex items-start hover:bg-slate-900/90 dark:hover:bg-zinc-900/90 px-1 py-0.5 rounded-xs transition-colors group"
              >
                <span className="w-10 shrink-0 text-right pr-4 text-slate-600 dark:text-zinc-600 select-none font-mono text-[11px] group-hover:text-slate-400 dark:group-hover:text-zinc-400">
                  {idx + 1}
                </span>
                <span
                  className="whitespace-pre selection:bg-blue-900 selection:text-white"
                  dangerouslySetInnerHTML={{ __html: lineHtml }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <ShieldAlert className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <span>OASIS SARIF 2.1.0 JSON representation</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-700 rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-700 rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Download .json</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

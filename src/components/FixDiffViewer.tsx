import React, { useState } from 'react';
import { NormalizedFix } from '../types/viewer';
import { Copy, Check, FileCode, Wrench } from 'lucide-react';

interface FixDiffViewerProps {
  fixes: NormalizedFix[];
  originalSnippet?: string;
  findingFilePath?: string;
}

export const FixDiffViewer: React.FC<FixDiffViewerProps> = ({ fixes, originalSnippet, findingFilePath }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!fixes || fixes.length === 0) return null;

  const handleCopyReplacement = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      {fixes.map((fix, fixIdx) => (
        <div key={`fix-${fix.description || fixIdx}`} className="space-y-3">
          {/* Fix Description */}
          {fix.description && (
            <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
              <Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>{fix.description}</span>
            </div>
          )}

          {/* Artifact Changes */}
          {fix.artifactChanges.map((change, changeIdx) => (
            <div key={`change-${change.filePath}-${changeIdx}`} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-mono">
                <FileCode className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-zinc-300 break-all">{change.filePath}</span>
              </div>

              {change.replacements.map((rep, repIdx) => {
                const isCopied = copiedIndex === fixIdx * 100 + repIdx;
                return (
                  <div
                    key={`rep-${rep.deletedRegion.startLine}-${rep.deletedRegion.endLine}-${repIdx}`}
                    className="bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden font-mono text-xs shadow-2xs"
                  >
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                      <span>Lines {rep.deletedRegion.startLine} - {rep.deletedRegion.endLine}</span>
                      {rep.insertedContent && (
                        <button
                          type="button"
                          onClick={() => handleCopyReplacement(rep.insertedContent!, fixIdx * 100 + repIdx)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-500 dark:text-zinc-400" />}
                          <span>{isCopied ? 'Copied' : 'Copy Replacement'}</span>
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-zinc-800/80">
                      {/* Deleted / Existing Content */}
                      {originalSnippet && (!findingFilePath || findingFilePath === change.filePath) && (
                        <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-l-2 border-rose-500 flex items-start gap-2 overflow-x-auto">
                          <span className="text-rose-600 dark:text-rose-400 font-bold select-none">-</span>
                          <pre className="leading-relaxed font-mono">
                            <code>{originalSnippet}</code>
                          </pre>
                        </div>
                      )}

                      {/* Inserted Replacement Content */}
                      {rep.insertedContent && (
                        <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-l-2 border-emerald-500 flex items-start gap-2 overflow-x-auto">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold select-none">+</span>
                          <pre className="leading-relaxed font-mono font-medium">
                            <code>{rep.insertedContent}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

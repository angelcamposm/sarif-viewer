import React, { useState } from 'react';
import { NormalizedFix } from '../types/viewer';
import { Wrench, Copy, Check, FileCode } from 'lucide-react';

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
    <div className="bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="p-3.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Automated Remediation / Fix</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-mono font-semibold">
                {fixes.length} Available
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Suggested code patch from static analysis engine
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {fixes.map((fix, fixIdx) => (
          <div key={`fix-${fix.description || fixIdx}`} className="space-y-3">
            {fix.description && (
              <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                {fix.description}
              </div>
            )}

            {fix.artifactChanges.map((change, changeIdx) => (
              <div key={`change-${change.filePath}-${changeIdx}`} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{change.filePath}</span>
                  </div>
                </div>

                {change.replacements.map((rep, repIdx) => {
                  const isCopied = copiedIndex === fixIdx * 100 + repIdx;
                  return (
                    <div
                      key={`rep-${rep.deletedRegion.startLine}-${rep.deletedRegion.endLine}-${repIdx}`}
                      className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 overflow-hidden font-mono text-xs shadow-2xs"
                    >
                      <div className="px-3 py-1.5 bg-slate-800/90 dark:bg-zinc-900/90 border-b border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Lines {rep.deletedRegion.startLine} - {rep.deletedRegion.endLine}</span>
                        {rep.insertedContent && (
                          <button
                            type="button"
                            onClick={() => handleCopyReplacement(rep.insertedContent!, fixIdx * 100 + repIdx)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 dark:bg-zinc-800 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy Replacement'}</span>
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-slate-800/60">
                        {/* Deleted / Existing content representation */}
                        {originalSnippet && (!findingFilePath || findingFilePath === change.filePath) && (
                          <div className="p-2.5 bg-rose-950/40 text-rose-300 flex items-start gap-2 overflow-x-auto">
                            <span className="text-rose-500 font-bold select-none">-</span>
                            <pre className="leading-relaxed">
                              <code>{originalSnippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Inserted replacement code */}
                        {rep.insertedContent && (
                          <div className="p-2.5 bg-emerald-950/40 text-emerald-300 flex items-start gap-2 overflow-x-auto">
                            <span className="text-emerald-500 font-bold select-none">+</span>
                            <pre className="leading-relaxed font-semibold">
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
    </div>
  );
};

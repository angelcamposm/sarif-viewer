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
      {/* Top Fixes Status Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
          <Wrench className="w-3.5 h-3.5 text-blue-500" />
          <span>Suggested Remediation Patch</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {fixes.length} patch(es) available
        </span>
      </div>

      <div className="space-y-4">
        {fixes.map((fix, fixIdx) => (
          <div key={`fix-${fix.description || fixIdx}`} className="space-y-3">
            {fix.description && (
              <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg text-xs text-blue-900 dark:text-blue-200 font-medium leading-relaxed">
                {fix.description}
              </div>
            )}

            {fix.artifactChanges.map((change, changeIdx) => (
              <div key={`change-${change.filePath}-${changeIdx}`} className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300 font-mono">
                  <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold break-all">{change.filePath}</span>
                </div>

                {change.replacements.map((rep, repIdx) => {
                  const isCopied = copiedIndex === fixIdx * 100 + repIdx;
                  return (
                    <div
                      key={`rep-${rep.deletedRegion.startLine}-${rep.deletedRegion.endLine}-${repIdx}`}
                      className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 overflow-hidden font-mono text-xs shadow-inner"
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

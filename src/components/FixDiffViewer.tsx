import React, { useState } from 'react';
import { NormalizedFix, NormalizedReplacement } from '../types/viewer';
import { Copy, Check, FileCode, Wrench } from 'lucide-react';
import { HighlightedCode } from './HighlightedCode';

interface FixDiffViewerProps {
  fixes: NormalizedFix[];
  originalSnippet?: string;
  findingFilePath?: string;
}

interface DiffLineItem {
  oldLineNumber?: number;
  newLineNumber?: number;
  type: 'deleted' | 'inserted';
  content: string;
}

function buildDiffLines(
  replacement: NormalizedReplacement,
  originalSnippet?: string,
  findingFilePath?: string,
  changeFilePath?: string
): DiffLineItem[] {
  const lines: DiffLineItem[] = [];
  const startLine = replacement.deletedRegion.startLine || 1;

  // Add deleted lines if original snippet is available and paths match
  if (originalSnippet && (!findingFilePath || findingFilePath === changeFilePath)) {
    const delLines = originalSnippet.split(/\r?\n/);
    delLines.forEach((content, idx) => {
      lines.push({
        oldLineNumber: startLine + idx,
        type: 'deleted',
        content,
      });
    });
  }

  // Add inserted lines
  if (replacement.insertedContent) {
    const insLines = replacement.insertedContent.split(/\r?\n/);
    insLines.forEach((content, idx) => {
      lines.push({
        newLineNumber: startLine + idx,
        type: 'inserted',
        content,
      });
    });
  }

  return lines;
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

          {/* Artifact Changes (Files) */}
          {fix.artifactChanges.map((change, changeIdx) => (
            <div key={`change-${change.filePath}-${changeIdx}`} className="space-y-2">
              {change.replacements.map((rep, repIdx) => {
                const isCopied = copiedIndex === fixIdx * 100 + repIdx;
                const diffLines = buildDiffLines(rep, originalSnippet, findingFilePath, change.filePath);

                return (
                  <div
                    key={`rep-${rep.deletedRegion.startLine}-${rep.deletedRegion.endLine}-${repIdx}`}
                    className="rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 font-mono text-xs shadow-2xs"
                  >
                    {/* GitHub-style Diff Header */}
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0 font-mono">
                        <FileCode className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate" title={change.filePath}>
                          {change.filePath}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 px-1.5 py-0.5 bg-slate-200/70 dark:bg-zinc-800 rounded">
                          Lines {rep.deletedRegion.startLine} - {rep.deletedRegion.endLine}
                        </span>
                      </div>

                      {rep.insertedContent && (
                        <button
                          type="button"
                          onClick={() => handleCopyReplacement(rep.insertedContent!, fixIdx * 100 + repIdx)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer text-[11px] font-sans font-medium whitespace-nowrap"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-500 dark:text-zinc-400" />}
                          <span>{isCopied ? 'Copied' : 'Copy replacement'}</span>
                        </button>
                      )}
                    </div>

                    {/* GitHub-style Unified Diff Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse font-mono text-xs text-left">
                        <tbody>
                          {diffLines.map((lineItem, idx) => {
                            const isDeleted = lineItem.type === 'deleted';

                            const rowBg = isDeleted
                              ? 'bg-[#ffebe9] hover:bg-[#ffdcd9] dark:bg-[#490202]/35 dark:hover:bg-[#490202]/50 text-slate-900 dark:text-rose-100'
                              : 'bg-[#e6ffec] hover:bg-[#d5f9dc] dark:bg-[#04260f]/35 dark:hover:bg-[#04260f]/50 text-slate-900 dark:text-emerald-100';

                            const gutterBorder = isDeleted
                              ? 'border-rose-200/60 dark:border-rose-900/30'
                              : 'border-emerald-200/60 dark:border-emerald-900/30';

                            const signColor = isDeleted
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400';

                            return (
                              <tr key={`line-${idx}`} className={`transition-colors ${rowBg}`}>
                                {/* Old Line Number */}
                                <td
                                  className={`w-10 min-w-[2.5rem] text-right pr-2.5 py-2 text-slate-400 dark:text-zinc-500 select-none text-[11px] align-top border-r ${gutterBorder}`}
                                >
                                  {lineItem.oldLineNumber || ''}
                                </td>

                                {/* New Line Number */}
                                <td
                                  className={`w-10 min-w-[2.5rem] text-right pr-2.5 py-2 text-slate-400 dark:text-zinc-500 select-none text-[11px] align-top border-r ${gutterBorder}`}
                                >
                                  {lineItem.newLineNumber || ''}
                                </td>

                                {/* Sign Symbol (+ / -) */}
                                <td className={`w-5 min-w-[1.25rem] text-center py-2 select-none font-bold text-[11px] align-top ${signColor}`}>
                                  {isDeleted ? '-' : '+'}
                                </td>

                                {/* Code Content */}
                                <td className="py-2 pl-2.5 pr-4 whitespace-pre leading-relaxed font-mono align-top">
                                  <HighlightedCode
                                    code={lineItem.content}
                                    filePath={change.filePath}
                                    isDiffDeleted={isDeleted}
                                    isDiffInserted={!isDeleted}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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

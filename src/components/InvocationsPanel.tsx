import React from 'react';
import { ParsedSarifReport } from '../types/viewer';
import { Terminal, Clock, CheckCircle2, XCircle, X, Shield } from 'lucide-react';

interface InvocationsPanelProps {
  report: ParsedSarifReport;
  isOpen: boolean;
  onClose: () => void;
}

export const InvocationsPanel: React.FC<InvocationsPanelProps> = ({ report, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Tool Invocations & Diagnostics
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Execution metadata and runtime diagnostics for {report.fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-4 space-y-4 text-xs">
          {report.runs.map((run, runIdx) => (
            <div
              key={runIdx}
              className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3"
            >
              {/* Tool Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">{run.toolName}</span>
                  {run.toolVersion && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[10px]">
                      v{run.toolVersion}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Run #{run.runIndex + 1} • {run.findingsCount} findings • {run.rulesCount} rules
                </span>
              </div>

              {/* Invocations */}
              {run.invocations && run.invocations.length > 0 ? (
                <div className="space-y-3">
                  {run.invocations.map((inv, invIdx) => (
                    <div
                      key={invIdx}
                      className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 space-y-2.5"
                    >
                      {/* Success / Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {inv.executionSuccessful ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-700 dark:text-emerald-400">Execution Succeeded</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-500" />
                              <span className="text-rose-700 dark:text-rose-400">Execution Failed</span>
                            </>
                          )}
                          {inv.exitCode !== undefined && (
                            <span className="ml-1 text-slate-400 font-mono text-[11px]">
                              (Exit Code: {inv.exitCode})
                            </span>
                          )}
                        </div>

                        {(inv.startTimeUtc || inv.endTimeUtc) && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{inv.startTimeUtc || 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      {/* Command line */}
                      {inv.commandLine && (
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Command Line</div>
                          <div className="p-2 bg-slate-900 dark:bg-black rounded font-mono text-[11px] text-slate-200 overflow-x-auto">
                            <code>{inv.commandLine}</code>
                          </div>
                        </div>
                      )}

                      {/* Working Directory */}
                      {inv.workingDirectory?.uri && (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                          Working Directory: <strong className="text-slate-700 dark:text-zinc-300">{inv.workingDirectory.uri}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 text-center">
                  No invocation logs were recorded in this SARIF run.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

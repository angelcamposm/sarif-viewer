import React from 'react';
import { ParsedSarifReport } from '../types/viewer';

interface FooterProps {
  report: ParsedSarifReport | null;
  filteredCount: number;
}

export const Footer: React.FC<FooterProps> = ({ report, filteredCount }) => {
  return (
    <footer className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-slate-500 dark:text-zinc-400 transition-colors duration-200">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left Status */}
        <div>
          {report ? (
            <span>
              Loaded <strong className="text-slate-800 dark:text-zinc-200 font-mono">{report.fileName}</strong> — {report.totalFindings} finding(s), {report.runsCount} run(s).
            </span>
          ) : (
            <span>Open a SARIF 2.1.0 report to begin.</span>
          )}
        </div>

        {/* Right Status */}
        {report && (
          <div className="text-slate-500 dark:text-zinc-400">
            Showing <strong className="text-slate-800 dark:text-zinc-200">{filteredCount}</strong> of <strong className="text-slate-800 dark:text-zinc-200">{report.totalFindings}</strong> findings
          </div>
        )}
      </div>
    </footer>
  );
};

import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  Shield,
  BellOff,
  ChevronDown,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import { ParsedSarifReport, NormalizedFinding } from '../types/viewer';
import { exportService } from '../services/exportService';

interface HeaderProps {
  report: ParsedSarifReport | null;
  filteredFindings: NormalizedFinding[];
  onFileLoaded: (fileContent: string, fileName: string) => void;
  onOpenMuteManager: () => void;
  mutedCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  report,
  filteredFindings,
  onFileLoaded,
  onOpenMuteManager,
  mutedCount,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onFileLoaded(text, file.name);
      };
      reader.readAsText(file);
    }
    // reset input so the same file can be reloaded if needed
    e.target.value = '';
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-30 transition-colors duration-200">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sarif,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: App Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight">
              SARIF Security Report Viewer
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Inspect findings from SARIF 2.1.0 security reports
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-md shadow-2xs transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Black (Zinc)'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          {/* Muted Alerts Button */}
          <button
            type="button"
            onClick={onOpenMuteManager}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-colors shadow-2xs cursor-pointer ${
              mutedCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                : 'text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
            title="Manage muted/suppressed findings in browser storage"
          >
            <BellOff className="w-3.5 h-3.5" />
            <span>Muted</span>
            {mutedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 rounded-full text-[10px] font-bold">
                {mutedCount}
              </span>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={!report || filteredFindings.length === 0}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showExportMenu && report && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-800 py-1.5 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Export {filteredFindings.length} findings
                </div>
                <button
                  type="button"
                  onClick={() => {
                    exportService.exportToCsv(filteredFindings, report.fileName);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Export as CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportService.exportToSarif(report, filteredFindings);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Export SARIF 2.1.0 JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportService.exportToMarkdown(report, filteredFindings);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Export Markdown Report</span>
                </button>
              </div>
            )}
          </div>

          {/* Rate this app / Info Button */}
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <span>About</span>
          </button>

          {/* Main Primary Action: Open SARIF */}
          <button
            type="button"
            onClick={handleOpenClick}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md transition-all shadow-xs cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open SARIF</span>
          </button>
        </div>
      </div>

      {/* Info / About Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">SARIF Security Report Viewer</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">OASIS SARIF 2.1.0 Compliant • Shift-Left Architecture</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-zinc-100">Shift-Left Privacy & Security:</strong> All parsing, filtering, and analysis occurs strictly
                inside your browser memory. No source code or telemetry is uploaded or shared with any third party.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-zinc-100">Criticality Tag Override:</strong> Findings tagged with priority identifiers (e.g.,{' '}
                <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">CRITICAL</code>,{' '}
                <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">HIGH</code>,{' '}
                <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">WARNING</code>) dynamically adjust
                their triage ranking according to security policy.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-zinc-100">Local Alert Muting:</strong> Muted alerts and suppression justifications are saved locally in
                your browser storage and can be exported as standard SARIF suppressions.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

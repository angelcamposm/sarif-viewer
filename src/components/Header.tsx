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
  ExternalLink,
  X,
  User,
  Scale,
  Bug,
  Globe,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { ParsedSarifReport, NormalizedFinding } from '../types/viewer';
import { exportService } from '../services/exportService';

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface HeaderProps {
  report: ParsedSarifReport | null;
  filteredFindings: NormalizedFinding[];
  onFileLoaded: (fileContent: string, fileName: string) => void;
  onOpenMuteManager: () => void;
  onOpenDiagnostics?: () => void;
  mutedCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  report,
  filteredFindings,
  onFileLoaded,
  onOpenMuteManager,
  onOpenDiagnostics,
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

          {/* Tool Invocations / Diagnostics Button */}
          {onOpenDiagnostics && report && (
            <button
              type="button"
              onClick={onOpenDiagnostics}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-700 rounded-md transition-colors shadow-2xs cursor-pointer"
              title="View Tool Invocations & Diagnostics"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              <span>Diagnostics</span>
            </button>
          )}

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

      {/* Enhanced About Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      SARIF Security Report Viewer
                    </h2>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800">
                      v1.0.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    OASIS SARIF 2.1.0 Compliant • Shift-Left Architecture
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 py-4 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-zinc-100">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Privacy-First Static Analysis</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400">
                  All parsing, triage, filtering, and report generation occur strictly in your browser memory.
                  Zero code, telemetry, or finding data is ever transmitted to external servers.
                </p>
              </div>

              {/* Repository & Open Source Section */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                  Repository & Links
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href="https://github.com/angelcamposm/sarif-viewer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GithubIcon className="w-4 h-4 text-slate-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      <span className="font-medium text-slate-800 dark:text-zinc-200">GitHub Repository</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </a>

                  <a
                    href="https://angelcamposm.github.io/sarif-viewer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-slate-800 dark:text-zinc-200">Live Demo</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                  </a>

                  <a
                    href="https://github.com/angelcamposm/sarif-viewer/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-medium text-slate-800 dark:text-zinc-200">Report an Issue</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                  </a>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-slate-800 dark:text-zinc-200">License: MIT</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">Open Source</span>
                  </div>
                </div>
              </div>

              {/* Creator Info Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                  Creator & Maintainer
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-zinc-800 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs border border-blue-200 dark:border-zinc-700">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-zinc-100">Ángel Campos</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">@angelcamposm</div>
                    </div>
                  </div>
                  <a
                    href="https://github.com/angelcamposm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-700 rounded-md transition-colors shadow-2xs"
                  >
                    <span>Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer"
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

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
  onCloseReport?: () => void;
  mutedCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const ExportDropdownMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  report: ParsedSarifReport;
  filteredFindings: NormalizedFinding[];
}> = ({ isOpen, onClose, report, filteredFindings }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-800 py-1.5 z-50">
      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
        Export {filteredFindings.length} findings
      </div>
      <button
        type="button"
        onClick={() => {
          exportService.exportToCsv(filteredFindings, report.fileName);
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
        <div>
          <div className="font-medium">CSV Spreadsheet</div>
          <div className="text-[10px] text-slate-400">Filtered findings data</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          exportService.exportToSarif(report, filteredFindings);
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
      >
        <FileCode className="w-3.5 h-3.5 text-blue-600" />
        <div>
          <div className="font-medium">SARIF 2.1.0 JSON</div>
          <div className="text-[10px] text-slate-400">With suppression records</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          exportService.exportToMarkdown(report, filteredFindings);
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
      >
        <FileText className="w-3.5 h-3.5 text-purple-600" />
        <div>
          <div className="font-medium">Markdown Report</div>
          <div className="text-[10px] text-slate-400">Executive security summary</div>
        </div>
      </button>
    </div>
  );
};

const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                SARIF Security Viewer
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Shift-Left Security & Compliance Platform</p>
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

        <div className="py-4 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
          <div className="p-3 bg-blue-50/80 dark:bg-zinc-800/80 rounded-lg border border-blue-100 dark:border-zinc-700 text-blue-900 dark:text-zinc-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              High-performance, 100% client-side viewer and triage interface for OASIS SARIF 2.1.0 security logs.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-xs uppercase tracking-wider">Features</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 mb-1">
                  <Bug className="w-3.5 h-3.5 text-blue-500" />
                  <span>Dataflow & Taint Traces</span>
                </div>
                <p className="text-[11px] text-slate-500">Interactive step-by-step codeflow timeline & state inspector.</p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 mb-1">
                  <Scale className="w-3.5 h-3.5 text-purple-500" />
                  <span>Taxonomies & Standards</span>
                </div>
                <p className="text-[11px] text-slate-500">Automatic mapping to CWE, OWASP Top 10, and NIST standards.</p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 mb-1">
                  <BellOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cross-Scan Muting</span>
                </div>
                <p className="text-[11px] text-slate-500">Persist triage decisions locally with import/export capabilities.</p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>DAST & API Traffic</span>
                </div>
                <p className="text-[11px] text-slate-500">Inspect captured HTTP requests and responses.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-zinc-800 pt-3 space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Created by <strong>Angel Campos</strong>
              </span>
              <a
                href="https://github.com/angelcamposm/sarif-viewer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

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

export const Header: React.FC<HeaderProps> = ({
  report,
  filteredFindings,
  onFileLoaded,
  onOpenMuteManager,
  onOpenDiagnostics,
  onCloseReport,
  mutedCount,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      onFileLoaded(text, file.name);
    }
    e.target.value = '';
  };

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-30 transition-colors duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept=".sarif,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
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

        <div className="flex items-center gap-2.5">
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

            {report && (
              <ExportDropdownMenu
                isOpen={showExportMenu}
                onClose={() => setShowExportMenu(false)}
                report={report}
                filteredFindings={filteredFindings}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
            title="Open local SARIF file"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open SARIF</span>
          </button>

          {onCloseReport && report && (
            <button
              type="button"
              onClick={onCloseReport}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-md transition-colors shadow-2xs cursor-pointer"
              title="Close active report"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          )}

          {onOpenDiagnostics && report && (
            <button
              type="button"
              onClick={onOpenDiagnostics}
              className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-md shadow-2xs transition-colors cursor-pointer"
              title="View Tool Invocations & Diagnostics"
            >
              <Terminal className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-md shadow-2xs transition-colors cursor-pointer"
            title="About SARIF Security Viewer"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AboutModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </header>
  );
};

import React, { useState, useRef } from 'react';
import { FolderOpen, UploadCloud, FileCode2, Sparkles, ShieldCheck, Sun, Moon } from 'lucide-react';
import { SAMPLE_REPORTS } from '../data/sampleReports';

interface EmptyStateProps {
  onFileLoaded: (fileContent: string, fileName: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onFileLoaded,
  theme,
  onToggleTheme,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onFileLoaded(text, file.name);
      };
      reader.readAsText(file);
    }
  };

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
    e.target.value = '';
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-[#09090b] flex-1 flex flex-col justify-center items-center px-4 py-12 min-h-screen relative transition-colors duration-200">
      {/* Top Right Theme Toggle */}
      {onToggleTheme && (
        <div className="absolute top-6 right-6">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Black (Zinc)'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sarif,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`max-w-xl w-full text-center p-10 rounded-2xl border border-dashed transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/70 hover:border-slate-400 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900'
        } shadow-xs`}
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-2xs border border-transparent dark:border-zinc-700">
          {isDragging ? <UploadCloud className="w-8 h-8 animate-bounce" /> : <FolderOpen className="w-8 h-8" />}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Open a SARIF report</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Review findings, rules, and locations from a SARIF 2.1.0 report.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open SARIF</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 dark:text-zinc-500 font-medium mb-6">
          Drag and drop your <code>.sarif</code> or <code>.json</code> file here
        </div>

        {/* Preset Sample Quick Loaders */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Or try an instant sample report:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {SAMPLE_REPORTS.map((sample) => (
              <button
                key={sample.filename}
                type="button"
                onClick={() => onFileLoaded(JSON.stringify(sample.data), sample.filename)}
                className="p-3 bg-white dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 font-medium text-xs text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <FileCode2 className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:text-blue-500 shrink-0" />
                  <span className="truncate">{sample.name}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">{sample.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
        <span>100% In-Browser Execution • Zero Server Exfiltration</span>
      </div>
    </div>
  );
};

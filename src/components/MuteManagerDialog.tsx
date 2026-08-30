import React, { useRef, useState } from 'react';
import { MuteRecord } from '../types/viewer';
import { muteStorage } from '../services/muteStorage';
import { BellOff, Trash2, Download, Upload, X, Search, CheckCircle } from 'lucide-react';

interface MuteManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mutedRecords: Record<string, MuteRecord>;
  onUnmute: (id: string) => void;
  onClearAll: () => void;
}

function filterMutedRecords(records: MuteRecord[], query: string): MuteRecord[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return records;

  return records.filter(
    (r) =>
      r.ruleId.toLowerCase().includes(cleanQuery) ||
      r.filePath?.toLowerCase().includes(cleanQuery) ||
      r.reason.toLowerCase().includes(cleanQuery) ||
      r.justification?.toLowerCase().includes(cleanQuery)
  );
}

const MuteRecordItem: React.FC<{
  record: MuteRecord;
  onUnmute: (id: string) => void;
}> = ({ record, onUnmute }) => (
  <div className="py-3 px-2 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-md transition-colors text-xs">
    <div className="space-y-1 flex-1">
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
          {record.ruleId}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
          {record.reason}
        </span>
      </div>
      <div className="text-[11px] text-slate-600 dark:text-zinc-400 font-mono">
        {record.filePath || 'Global'}{record.line ? `:${record.line}` : ''}
      </div>
      {record.justification && (
        <div className="text-[11px] text-slate-500 dark:text-zinc-400 italic">
          "{record.justification}"
        </div>
      )}
      <div className="text-[10px] text-slate-400 dark:text-zinc-500">
        By {record.mutedBy || 'Reviewer'} on {new Date(record.mutedAt).toLocaleDateString()}
      </div>
    </div>

    <button
      type="button"
      onClick={() => onUnmute(record.id)}
      className="px-2.5 py-1 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-md font-medium cursor-pointer"
    >
      Unmute
    </button>
  </div>
);

export const MuteManagerDialog: React.FC<MuteManagerDialogProps> = ({
  isOpen,
  onClose,
  mutedRecords,
  onUnmute,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const recordsList = Object.values(mutedRecords);
  const filteredList = filterMutedRecords(recordsList, search);

  const handleExport = () => {
    const jsonStr = muteStorage.exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarif-muted-findings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          const count = muteStorage.import(parsed);
          setStatusMessage(`Successfully imported ${count} muted suppression rule(s).`);
          setTimeout(() => setStatusMessage(null), 3000);
        } else {
          alert('Invalid suppression file format: expected a JSON array.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    }
    e.target.value = '';
  };

  return (
    <dialog
      open
      aria-labelledby="mute-manager-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 w-full h-full border-none max-w-none max-h-none overflow-hidden m-0"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-2xl w-full p-6 flex flex-col max-h-[85vh] text-slate-900 dark:text-zinc-100">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />

        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <BellOff className="w-5 h-5" />
            </div>
            <div>
              <h2 id="mute-manager-title" className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Browser-Muted Findings Storage
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {recordsList.length} finding(s) persisted in browser localStorage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search muted findings..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer"
              title="Import JSON suppression list"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={recordsList.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-50 cursor-pointer"
              title="Export JSON suppression list"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            {recordsList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all muted records from browser storage?')) {
                    onClearAll();
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 divide-y divide-slate-100 dark:divide-zinc-800">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
              {recordsList.length === 0
                ? 'No alerts currently muted in browser storage.'
                : 'No muted alerts match your search.'}
            </div>
          ) : (
            filteredList.map((rec) => (
              <MuteRecordItem key={rec.id} record={rec} onUnmute={onUnmute} />
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
};

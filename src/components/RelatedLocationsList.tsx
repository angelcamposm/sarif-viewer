import React from 'react';
import { NormalizedRelatedLocation } from '../types/viewer';
import { MapPin, FileCode, Info } from 'lucide-react';

interface RelatedLocationsListProps {
  relatedLocations: NormalizedRelatedLocation[];
}

export const RelatedLocationsList: React.FC<RelatedLocationsListProps> = ({ relatedLocations }) => {
  if (!relatedLocations || relatedLocations.length === 0) return null;

  return (
    <div className="bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="p-3.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Related / Secondary Locations</span>
              <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded text-[10px] font-mono font-semibold">
                {relatedLocations.length}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Declaration, allocation, or cross-referenced sites
            </p>
          </div>
        </div>
      </div>

      <div className="p-3.5 space-y-2.5">
        {relatedLocations.map((loc, idx) => (
          <div
            key={loc.id !== undefined ? `loc-id-${loc.id}` : `loc-${loc.filePath}-${loc.line}-${idx}`}
            className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 space-y-2"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-200 font-medium">
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span>{loc.filePath}</span>
                {loc.line && <span className="text-blue-600 dark:text-blue-400 font-bold">:{loc.line}</span>}
              </div>
              {loc.id !== undefined && (
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">ID: {loc.id}</span>
              )}
            </div>

            {loc.message && (
              <div className="text-xs text-slate-600 dark:text-zinc-300 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{loc.message}</span>
              </div>
            )}

            {loc.codeSnippet && (
              <div className="bg-slate-900 dark:bg-black rounded border border-slate-800 p-2 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
                <code>{loc.codeSnippet}</code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

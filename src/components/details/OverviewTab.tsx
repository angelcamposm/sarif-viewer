import React from 'react';
import { NormalizedFinding } from '../../types/viewer';
import { TagChip } from '../ui/Badge';
import { TaxonomyBadge } from '../ui/TaxonomyBadge';
import { RichContent } from '../ui/RichContent';
import { HighlightedCode } from '../HighlightedCode';
import {
  Copy,
  Check,
  BellOff,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface OverviewTabProps {
  finding: NormalizedFinding;
  uniqueTags: string[];
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

const MuteBanners: React.FC<{ finding: NormalizedFinding }> = ({ finding }) => (
  <>
    {finding.isMuted && finding.muteRecord && (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-lg p-3.5 text-amber-900 dark:text-amber-300 text-xs">
        <div className="flex items-center gap-1.5 font-semibold mb-1">
          <BellOff className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
          <span>Muted in Browser Storage: {finding.muteRecord.reason}</span>
        </div>
        {finding.muteRecord.justification && (
          <p className="text-amber-800 dark:text-amber-300/90 italic mt-0.5">
            "{finding.muteRecord.justification}"
          </p>
        )}
        <div className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-1.5">
          Muted on {new Date(finding.muteRecord.mutedAt).toLocaleString()}
        </div>
      </div>
    )}

    {finding.inSarifSuppressions && finding.inSarifSuppressions.length > 0 && (
      <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-lg p-3.5 text-blue-900 dark:text-blue-300 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
          <span>In-SARIF Tool Suppression</span>
        </div>
        {finding.inSarifSuppressions.map((sup, sIdx) => (
          <div key={`${sup.kind}-${sup.status}-${sIdx}`} className="text-xs text-blue-800 dark:text-blue-300">
            <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 rounded mr-1.5">
              {sup.kind} ({sup.status})
            </span>
            {sup.justification && <span className="italic">"{sup.justification}"</span>}
          </div>
        ))}
      </div>
    )}
  </>
);

const PrimaryLocationSection: React.FC<{
  finding: NormalizedFinding;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}> = ({ finding, copiedField, onCopy }) => {
  if (!finding.filePath || finding.filePath === 'Not provided') return null;

  return (
    <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        Primary Location
      </div>

      {finding.logicalLocations && finding.logicalLocations.length > 0 && (
        <div className="p-2 bg-slate-50 dark:bg-zinc-950 rounded border border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-mono">
          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{finding.logicalLocations.join(' › ')}</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">
          <span>File / URI</span>
          <button
            type="button"
            onClick={() => onCopy(finding.filePath, 'filepath')}
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
          >
            {copiedField === 'filepath' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedField === 'filepath' ? 'Copied' : 'Copy path'}</span>
          </button>
        </div>
        <div className="font-mono text-slate-800 dark:text-zinc-200 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 p-2.5 rounded border border-slate-200 dark:border-zinc-800 break-all">
          {finding.filePath || 'Not provided'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 bg-slate-50 dark:bg-zinc-950/60 rounded border border-slate-200 dark:border-zinc-800">
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mb-0.5">Line</div>
          <div className="font-mono font-semibold text-slate-900 dark:text-zinc-100 text-sm">
            {finding.line !== null ? finding.line : '—'}
          </div>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-zinc-950/60 rounded border border-slate-200 dark:border-zinc-800">
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mb-0.5">Column</div>
          <div className="font-mono font-semibold text-slate-900 dark:text-zinc-100 text-sm">
            {finding.column !== null ? finding.column : '—'}
          </div>
        </div>
      </div>

      {finding.codeSnippet && (
        <div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Source Snippet</div>
          <div className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 p-3 rounded-lg font-mono text-xs overflow-x-auto border border-slate-200 dark:border-zinc-800 shadow-2xs">
            <span className="text-slate-400 dark:text-zinc-500 mr-2 select-none">{finding.line || 1}</span>
            <HighlightedCode code={finding.codeSnippet} filePath={finding.filePath} />
          </div>
        </div>
      )}
    </section>
  );
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  finding,
  uniqueTags,
  copiedField,
  onCopy,
}) => {
  return (
    <div className="space-y-5">
      <MuteBanners finding={finding} />

      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Finding Overview
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Level:</span>
            <span className="font-mono text-xs font-semibold capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
              {finding.originalLevel}
            </span>
          </div>
        </div>

        {finding.isLevelOverridden && (
          <div className="p-2.5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs">
            <div className="font-semibold text-rose-800 dark:text-rose-300">
              Overwrite Level:{' '}
              <span className="font-bold uppercase tracking-wide">
                {finding.overrideTag || finding.effectiveLevel}
              </span>
              <span className="ml-1.5 font-normal text-rose-600 dark:text-rose-400">
                (Effective: {finding.effectiveLevel})
              </span>
            </div>
            {finding.overrideReason && (
              <div className="mt-1 text-rose-600 dark:text-rose-400/90 text-[11px]">
                {finding.overrideReason}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Rule ID</div>
          <div className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm sm:text-base">
            {finding.ruleId}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Message</div>
          <div className="bg-slate-50/50 dark:bg-zinc-950/40 p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800/80">
            <RichContent text={finding.message} markdown={finding.messageMarkdown} />
          </div>
        </div>

        {finding.taxonomies && finding.taxonomies.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">
              Standards & Taxonomies
            </div>
            <div className="flex flex-wrap gap-1.5">
              {finding.taxonomies.map((tax) => (
                <TaxonomyBadge key={`${tax.taxonomyName}:${tax.id}`} taxonomy={tax} />
              ))}
            </div>
          </div>
        )}

        {uniqueTags.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {uniqueTags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>
          </div>
        )}
      </section>

      <PrimaryLocationSection
        finding={finding}
        copiedField={copiedField}
        onCopy={onCopy}
      />
    </div>
  );
};

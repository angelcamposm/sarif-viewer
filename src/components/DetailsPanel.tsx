import React, { useState, useMemo } from 'react';
import { NormalizedFinding } from '../types/viewer';
import { TagChip } from './ui/Badge';
import { TaxonomyBadge } from './ui/TaxonomyBadge';
import { DataflowStepper } from './DataflowStepper';
import { FixDiffViewer } from './FixDiffViewer';
import { RelatedLocationsList } from './RelatedLocationsList';
import { WebRequestInspector } from './WebRequestInspector';
import { renderSafeMarkdown } from '../utils/sanitize';
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  BellOff,
  Bell,
  Code2,
  Toolbox,
  FileIcon,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface DetailsPanelProps {
  finding: NormalizedFinding | null;
  reportFileName?: string;
  onToggleMute: (finding: NormalizedFinding) => void;
  onViewRawSarif?: (finding: NormalizedFinding) => void;
}

function deduplicateTags(tags?: string[]): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const trimmed = typeof tag === 'string' ? tag.trim() : String(tag);
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }
  return result;
}

const DetailsPanelHeader: React.FC<{
  findingId: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onViewRawSarif?: () => void;
}> = ({ findingId, isMuted, onToggleMute, onViewRawSarif }) => (
  <div className="p-4 sm:p-5 bg-slate-50/75 dark:bg-zinc-950/70 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
    <div>
      <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Finding details</h2>
      <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 truncate max-w-[200px] block" title={findingId}>
        ID: {findingId}
      </span>
    </div>
    <div className="flex items-center gap-2">
      {onViewRawSarif && (
        <button
          type="button"
          onClick={onViewRawSarif}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
          title="View Raw SARIF JSON Modal"
        >
          <Code2 className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <span>Raw SARIF</span>
        </button>
      )}

      <button
        type="button"
        onClick={onToggleMute}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
          isMuted
            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/60'
            : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-2xs'
        }`}
        title={isMuted ? 'Unmute alert' : 'Mute alert'}
      >
        {isMuted ? <BellOff className="w-4 h-4 text-amber-700 dark:text-amber-400" /> : <Bell className="w-4 h-4 text-slate-500 dark:text-zinc-400" />}
        <span>{isMuted ? 'Muted' : 'Mute'}</span>
      </button>
    </div>
  </div>
);

const MuteBanners: React.FC<{ finding: NormalizedFinding }> = ({ finding }) => (
  <>
    {finding.isMuted && finding.muteRecord && (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-lg p-3.5 text-amber-900 dark:text-amber-300 text-xs">
        <div className="flex items-center gap-1.5 font-semibold mb-1">
          <BellOff className="w-4 h-4 text-amber-700 dark:text-amber-400" />
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
          <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>In-SARIF Tool Suppression</span>
        </div>
        {finding.inSarifSuppressions.map((sup, sIdx) => (
          <div key={sIdx} className="text-xs text-blue-800 dark:text-blue-300">
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

const FindingOverviewSection: React.FC<{ finding: NormalizedFinding; uniqueTags: string[] }> = ({
  finding,
  uniqueTags,
}) => (
  <section className="space-y-4">
    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
      Finding
    </div>

    <div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Baseline SARIF Level</div>
      <div className="font-mono text-slate-900 dark:text-zinc-100 text-sm font-semibold capitalize">
        {finding.originalLevel}
      </div>
    </div>

    {finding.isLevelOverridden && (
      <div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Overwrite Level</div>
        <div className="font-mono text-sm font-semibold">
          <span className="text-rose-700 dark:text-rose-400 font-bold">
            {finding.overrideTag || finding.effectiveLevel.toUpperCase()}
            <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-zinc-400">
              (Effective: {finding.effectiveLevel})
            </span>
          </span>
        </div>
        {finding.overrideReason && (
          <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-normal">
            {finding.overrideReason}
          </div>
        )}
      </div>
    )}

    <div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Rule ID</div>
      <div className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm sm:text-base">
        {finding.ruleId}
      </div>
    </div>

    {finding.taxonomies && finding.taxonomies.length > 0 && (
      <div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Security Standards & Taxonomies</div>
        <div className="flex flex-wrap gap-1.5 py-1">
          {finding.taxonomies.map((tax, idx) => (
            <TaxonomyBadge key={idx} taxonomy={tax} />
          ))}
        </div>
      </div>
    )}

    <div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Message</div>
      <div
        className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed break-words"
        dangerouslySetInnerHTML={{
          __html: renderSafeMarkdown(finding.messageMarkdown || finding.message),
        }}
      />
    </div>

    {uniqueTags.length > 0 && (
      <div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Tags</div>
        <div className="flex flex-wrap gap-1.5 py-1">
          {uniqueTags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      </div>
    )}
  </section>
);

const PrimaryLocationSection: React.FC<{
  finding: NormalizedFinding;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}> = ({ finding, copiedField, onCopy }) => {
  if (!finding.filePath || finding.filePath === 'Not provided') return null;

  return (
    <section className="space-y-3.5 pt-4 border-t border-slate-200 dark:border-zinc-800">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        Primary Location
      </div>

      {finding.logicalLocations && finding.logicalLocations.length > 0 && (
        <div className="p-2 bg-slate-50 dark:bg-zinc-950 rounded border border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-mono">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
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
            {copiedField === 'filepath' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedField === 'filepath' ? 'Copied' : 'Copy path'}</span>
          </button>
        </div>
        <div className="font-mono text-slate-800 dark:text-zinc-200 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 p-3 rounded border border-slate-200 dark:border-zinc-800 break-all">
          {finding.filePath || 'Not provided'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Line</div>
          <div className="font-mono font-medium text-slate-900 dark:text-zinc-100 text-sm">
            {finding.line !== null ? finding.line : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Column</div>
          <div className="font-mono font-medium text-slate-900 dark:text-zinc-100 text-sm">
            {finding.column !== null ? finding.column : '—'}
          </div>
        </div>
      </div>

      {finding.codeSnippet && (
        <div>
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Source Snippet</div>
          <div className="bg-slate-900 dark:bg-black text-slate-100 p-3 rounded-md font-mono text-xs overflow-x-auto border border-slate-800 dark:border-zinc-800">
            <span className="text-slate-500 dark:text-zinc-500 mr-2 select-none">{finding.line || 1}</span>
            <code>{finding.codeSnippet}</code>
          </div>
        </div>
      )}
    </section>
  );
};

const RuleDocumentationSection: React.FC<{ finding: NormalizedFinding }> = ({ finding }) => (
  <section className="space-y-3.5 pt-4 border-t border-slate-200 dark:border-zinc-800">
    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
      Rule
    </div>

    <div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Rule Name</div>
      <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm sm:text-base">
        {finding.ruleName || finding.ruleId}
      </div>
    </div>

    {finding.ruleDescription && (
      <div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Description</div>
        <div className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed">
          {finding.ruleDescription}
        </div>
      </div>
    )}

    {finding.ruleFullDescription && finding.ruleFullDescription !== finding.ruleDescription && (
      <div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1.5">Details</div>
        <div className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
          {finding.ruleFullDescription}
        </div>
      </div>
    )}

    {finding.ruleHelpUri && (
      <div>
        <a
          href={finding.ruleHelpUri}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
        >
          <span>Documentation / Remediation Guide</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    )}
  </section>
);

const CustomPropertiesSection: React.FC<{ properties?: Record<string, any> }> = ({ properties }) => {
  const customProperties = Object.entries(properties || {}).filter(
    ([key, val]) =>
      !['tags', 'category', 'precision', 'criticality'].includes(key) &&
      val !== undefined &&
      val !== null &&
      typeof val !== 'object'
  );

  if (customProperties.length === 0) return null;

  return (
    <section className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-zinc-800">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        Metadata & Properties
      </div>
      <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-md border border-slate-200 dark:border-zinc-800">
        {customProperties.map(([key, val]) => (
          <div key={key} className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-zinc-400 capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="font-mono text-slate-800 dark:text-zinc-200 font-medium truncate max-w-[220px]" title={String(val)}>
              {String(val)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  finding,
  reportFileName,
  onToggleMute,
  onViewRawSarif,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const uniqueTags = useMemo(() => deduplicateTags(finding?.tags), [finding?.tags]);

  if (!finding) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-8 text-center text-slate-400 dark:text-zinc-500 shadow-2xs">
        <FileCode className="w-9 h-9 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Select a finding from the table to view comprehensive details.</p>
      </div>
    );
  }

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 text-sm h-full flex flex-col transition-colors duration-200">
      <DetailsPanelHeader
        findingId={finding.id}
        isMuted={finding.isMuted}
        onToggleMute={() => onToggleMute(finding)}
        onViewRawSarif={onViewRawSarif ? () => onViewRawSarif(finding) : undefined}
      />

      <div className="p-4 sm:p-5 space-y-6 flex-1 overflow-y-auto">
        <MuteBanners finding={finding} />

        <FindingOverviewSection finding={finding} uniqueTags={uniqueTags} />

        {finding.codeFlows && finding.codeFlows.length > 0 && (
          <section className="pt-4 border-t border-slate-200 dark:border-zinc-800">
            <DataflowStepper codeFlows={finding.codeFlows} />
          </section>
        )}

        {finding.fixes && finding.fixes.length > 0 && (
          <section className="pt-4 border-t border-slate-200 dark:border-zinc-800">
            <FixDiffViewer fixes={finding.fixes} originalSnippet={finding.codeSnippet} findingFilePath={finding.filePath} />
          </section>
        )}

        {finding.relatedLocations && finding.relatedLocations.length > 0 && (
          <section className="pt-4 border-t border-slate-200 dark:border-zinc-800">
            <RelatedLocationsList relatedLocations={finding.relatedLocations} />
          </section>
        )}

        {(finding.webRequest || finding.webResponse) && (
          <section className="pt-4 border-t border-slate-200 dark:border-zinc-800">
            <WebRequestInspector webRequest={finding.webRequest} webResponse={finding.webResponse} />
          </section>
        )}

        <PrimaryLocationSection
          finding={finding}
          copiedField={copiedField}
          onCopy={handleCopy}
        />

        <RuleDocumentationSection finding={finding} />

        <CustomPropertiesSection properties={finding.properties} />

        <section className="space-y-3.5 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Context
          </div>

          {reportFileName && (
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 font-medium mb-1.5">
                <FileIcon className="size-4" />
                Report File
              </div>
              <div className="font-mono text-slate-800 dark:text-zinc-200 text-sm font-medium break-all">
                {reportFileName}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 font-medium mb-1.5">
              <Toolbox className="size-4" />
              Tool Driver
            </div>
            <div className="font-medium text-slate-800 dark:text-zinc-200 text-sm">
              {finding.toolName} {finding.toolVersion ? `v${finding.toolVersion}` : ''}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

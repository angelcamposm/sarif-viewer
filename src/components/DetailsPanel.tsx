import React, { useState, useMemo } from 'react';
import { NormalizedFinding } from '../types/viewer';
import { DataflowStepper } from './DataflowStepper';
import { FixDiffViewer } from './FixDiffViewer';
import { OverviewTab } from './details/OverviewTab';
import { RuleAndContextTab } from './details/RuleAndContextTab';
import {
  FileCode,
  Code2,
  BellOff,
  Bell,
  FileText,
  Zap,
  Wrench,
  BookOpen,
} from 'lucide-react';

export type DetailsTabId = 'overview' | 'dataflow' | 'fixes' | 'context';

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

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  finding,
  reportFileName,
  onToggleMute,
  onViewRawSarif,
}) => {
  const [activeTab, setActiveTab] = useState<DetailsTabId>('overview');
  const [prevFindingId, setPrevFindingId] = useState<string | undefined>(finding?.id);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (finding?.id !== prevFindingId) {
    setPrevFindingId(finding?.id);
    setActiveTab('overview');
  }

  const uniqueTags = useMemo(() => deduplicateTags(finding?.tags), [finding?.tags]);

  const hasDataflow = Boolean(finding?.codeFlows && finding.codeFlows.length > 0);
  const dataflowStepsCount = finding?.codeFlows
    ? finding.codeFlows.reduce((acc, cf) => acc + (cf.threadFlows?.[0]?.steps?.length || 0), 0)
    : 0;

  const hasFixes = Boolean(finding?.fixes && finding.fixes.length > 0);
  const fixesCount = finding?.fixes?.length || 0;

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
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xs overflow-hidden text-sm h-full flex flex-col transition-colors duration-200">
      <DetailsPanelHeader
        findingId={finding.id}
        isMuted={finding.isMuted}
        onToggleMute={() => onToggleMute(finding)}
        onViewRawSarif={onViewRawSarif ? () => onViewRawSarif(finding) : undefined}
      />

      {/* Underline Tabs Strip */}
      <div className="flex items-center gap-1 px-4 sm:px-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`inline-flex items-center gap-1.5 py-3 px-3 text-xs font-semibold transition-all border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        {hasDataflow && (
          <button
            type="button"
            onClick={() => setActiveTab('dataflow')}
            className={`inline-flex items-center gap-1.5 py-3 px-3 text-xs font-semibold transition-all border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
              activeTab === 'dataflow'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Dataflow</span>
            {dataflowStepsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/80">
                {dataflowStepsCount}
              </span>
            )}
          </button>
        )}

        {hasFixes && (
          <button
            type="button"
            onClick={() => setActiveTab('fixes')}
            className={`inline-flex items-center gap-1.5 py-3 px-3 text-xs font-semibold transition-all border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
              activeTab === 'fixes'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-blue-500" />
            <span>Remediation</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/80">
              {fixesCount}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('context')}
          className={`inline-flex items-center gap-1.5 py-3 px-3 text-xs font-semibold transition-all border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
            activeTab === 'context'
              ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Rule & Context</span>
        </button>
      </div>

      {/* Tab Panel Body */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewTab
            finding={finding}
            uniqueTags={uniqueTags}
            copiedField={copiedField}
            onCopy={handleCopy}
          />
        )}

        {activeTab === 'dataflow' && hasDataflow && (
          <DataflowStepper codeFlows={finding.codeFlows!} />
        )}

        {activeTab === 'fixes' && hasFixes && (
          <FixDiffViewer
            fixes={finding.fixes!}
            originalSnippet={finding.codeSnippet}
            findingFilePath={finding.filePath}
          />
        )}

        {activeTab === 'context' && (
          <RuleAndContextTab
            finding={finding}
            reportFileName={reportFileName}
          />
        )}
      </div>
    </div>
  );
};

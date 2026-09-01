import React from 'react';
import { NormalizedFinding } from '../../types/viewer';
import { RelatedLocationsList } from '../RelatedLocationsList';
import { formatVersion } from '../../utils/formatters';
import {
  ExternalLink,
  Toolbox,
  FileIcon,
  BookOpen,
  Info,
} from 'lucide-react';

interface RuleAndContextTabProps {
  finding: NormalizedFinding;
  reportFileName?: string;
}

const RuleDocumentationSection: React.FC<{ finding: NormalizedFinding }> = ({ finding }) => (
  <section className="space-y-3">
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
      <span>Rule Documentation</span>
    </div>

    <div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Rule Name</div>
      <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm sm:text-base">
        {finding.ruleName || finding.ruleId}
      </div>
    </div>

    {finding.ruleDescription && (
      <div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Summary</div>
        <div className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed bg-slate-50/60 dark:bg-zinc-950/40 p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800/80">
          {finding.ruleDescription}
        </div>
      </div>
    )}

    {finding.ruleFullDescription && finding.ruleFullDescription !== finding.ruleDescription && (
      <div>
        <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">In-depth Guidance</div>
        <div className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed bg-slate-50/40 dark:bg-zinc-950/30 p-3 rounded-lg border border-slate-200/60 dark:border-zinc-800/60">
          {finding.ruleFullDescription}
        </div>
      </div>
    )}

    {finding.ruleHelpUri && (
      <div className="pt-1">
        <a
          href={finding.ruleHelpUri}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline p-2 rounded-md bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50"
        >
          <span>Official Remediation Guide & Rule Docs</span>
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
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span>Metadata & Custom Properties</span>
      </div>
      <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
        {customProperties.map(([key, val]) => (
          <div key={key} className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-zinc-400 capitalize">{key.replaceAll('_', ' ')}:</span>
            <span className="font-mono text-slate-800 dark:text-zinc-200 font-medium truncate max-w-[220px]" title={String(val)}>
              {String(val)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const RuleAndContextTab: React.FC<RuleAndContextTabProps> = ({
  finding,
  reportFileName,
}) => {
  return (
    <div className="space-y-5">
      <RuleDocumentationSection finding={finding} />

      {finding.relatedLocations && finding.relatedLocations.length > 0 && (
        <section className="pt-4 border-t border-slate-200 dark:border-zinc-800">
          <RelatedLocationsList relatedLocations={finding.relatedLocations} />
        </section>
      )}

      <CustomPropertiesSection properties={finding.properties} />

      <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Tool & Report Context
        </div>

        {reportFileName && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
              <FileIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>SARIF Log Source</span>
            </div>
            <div className="font-mono text-slate-800 dark:text-zinc-200 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 p-2.5 rounded border border-slate-200 dark:border-zinc-800 break-all">
              {reportFileName}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
            <Toolbox className="w-3.5 h-3.5 text-slate-400" />
            <span>Analysis Driver</span>
          </div>
          <div className="font-medium text-slate-800 dark:text-zinc-200 text-sm bg-slate-50 dark:bg-zinc-950 p-2.5 rounded border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <span>{finding.toolName}</span>
            {finding.toolVersion && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {formatVersion(finding.toolVersion)}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

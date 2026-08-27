import React from 'react';
import { ParsedSarifReport } from '../types/viewer';
import {
  Layers,
  ShieldAlert,
  AlertTriangle,
  Info,
  CircleSlash,
  PlayCircle,
  BellOff,
} from 'lucide-react';

interface MetricsBarProps {
  report: ParsedSarifReport;
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
  muteStatus?: 'all' | 'active' | 'muted';
  onSelectMuteStatus?: (status: 'all' | 'active' | 'muted') => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  report,
  selectedLevel,
  onSelectLevel,
  muteStatus,
  onSelectMuteStatus,
}) => {
  const metricItems: Array<{
    key: string;
    label: string;
    count: number;
    color: string;
    iconBg: string;
    icon: React.ReactNode;
    isSelected: boolean;
    onClick?: () => void;
  }> = [
    {
      key: 'all',
      label: 'Total',
      count: report.totalFindings,
      color: 'text-slate-900 dark:text-zinc-100',
      iconBg: 'text-slate-700 dark:text-zinc-300',
      icon: <Layers className="w-10 h-10" strokeWidth={1} />,
      isSelected: selectedLevel === 'all' && (!muteStatus || muteStatus === 'all'),
      onClick: () => {
        onSelectLevel('all');
        if (onSelectMuteStatus) onSelectMuteStatus('all');
      },
    },
    {
      key: 'error',
      label: 'Errors',
      count: report.errorCount,
      color: 'text-rose-700 dark:text-rose-400',
      iconBg: 'text-rose-600 dark:text-rose-400',
      icon: <ShieldAlert className="w-10 h-10" strokeWidth={1} />,
      isSelected: selectedLevel === 'error',
      onClick: () => onSelectLevel(selectedLevel === 'error' ? 'all' : 'error'),
    },
    {
      key: 'warning',
      label: 'Warnings',
      count: report.warningCount,
      color: 'text-amber-800 dark:text-amber-400',
      iconBg: 'text-amber-700 dark:text-amber-400',
      icon: <AlertTriangle className="w-10 h-10" strokeWidth={1} />,
      isSelected: selectedLevel === 'warning',
      onClick: () => onSelectLevel(selectedLevel === 'warning' ? 'all' : 'warning'),
    },
    {
      key: 'note',
      label: 'Notes',
      count: report.noteCount,
      color: 'text-blue-800 dark:text-blue-400',
      iconBg: 'text-blue-700 dark:text-blue-400',
      icon: <Info className="w-10 h-10" strokeWidth={1} />,
      isSelected: selectedLevel === 'note',
      onClick: () => onSelectLevel(selectedLevel === 'note' ? 'all' : 'note'),
    },
    {
      key: 'none',
      label: 'None',
      count: report.noneCount,
      color: 'text-slate-600 dark:text-zinc-400',
      iconBg: 'text-slate-500 dark:text-zinc-400',
      icon: <CircleSlash className="w-10 h-10" strokeWidth={1} />,
      isSelected: selectedLevel === 'none',
      onClick: () => onSelectLevel(selectedLevel === 'none' ? 'all' : 'none'),
    },
    {
      key: 'runs',
      label: 'Runs',
      count: report.runsCount,
      color: 'text-slate-900 dark:text-zinc-100',
      iconBg: 'text-indigo-600 dark:text-indigo-400',
      icon: <PlayCircle className="w-10 h-10" strokeWidth={1} />,
      isSelected: false,
    },
  ];

  // When alerts are muted, include Muted as a metric sharing equal space with the rest
  if (report.mutedCount > 0) {
    metricItems.push({
      key: 'muted',
      label: 'Muted',
      count: report.mutedCount,
      color: 'text-amber-900 dark:text-amber-300',
      iconBg: 'text-amber-700 dark:text-amber-400',
      icon: <BellOff className="w-10 h-10" strokeWidth={1} />,
      isSelected: muteStatus === 'muted',
      onClick: () => {
        if (onSelectMuteStatus) {
          onSelectMuteStatus(muteStatus === 'muted' ? 'all' : 'muted');
        }
      },
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="w-full">
        {/* Full width grid filling 100% of the space dynamically across all columns */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr gap-6 items-stretch">
          {metricItems.map((m) => {
            const isClickable = !!m.onClick;
            return (
              <div
                key={m.label}
                onClick={m.onClick}
                className={`p-4 rounded-lg border transition-all flex items-center gap-3 ${
                  isClickable ? 'cursor-pointer hover:shadow-2xs' : 'cursor-default'
                } ${
                  m.isSelected
                    ? 'bg-blue-50/70 dark:bg-zinc-800 border-blue-300 dark:border-zinc-600 ring-1 ring-blue-200 dark:ring-zinc-600'
                    : m.key === 'muted'
                    ? 'bg-amber-50/40 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 hover:bg-amber-50/80 dark:hover:bg-amber-900/50'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/70'
                }`}
                title={isClickable ? `Click to filter by ${m.label}` : undefined}
              >
                {/* Left: Icon container */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${m.iconBg}`}>
                  {m.icon}
                </div>

                {/* Right: Text Label and Metric value */}
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-wider truncate ${
                      m.isSelected
                        ? 'text-blue-700 dark:text-blue-400 font-bold'
                        : m.key === 'muted'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {m.label}
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold tracking-tight leading-tight ${m.color}`}>
                    {m.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

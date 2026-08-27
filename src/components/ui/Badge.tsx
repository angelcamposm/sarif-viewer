import React from 'react';
import { SarifLevel } from '../../types/viewer';
import { ShieldAlert, AlertTriangle, Info, CircleSlash, Tag } from 'lucide-react';

interface SeverityBadgeProps {
  level: SarifLevel;
  isOverridden?: boolean;
  overrideTag?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  level,
  isOverridden,
  overrideTag,
  className = '',
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = '';
  let icon = null;

  switch (level) {
    case 'error':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/80 dark:hover:bg-rose-900/60';
      icon = <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-600 dark:text-rose-400 inline shrink-0" />;
      break;
    case 'warning':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80 dark:hover:bg-amber-900/60';
      icon = <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400 inline shrink-0" />;
      break;
    case 'note':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80 dark:hover:bg-blue-900/60';
      icon = <Info className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400 inline shrink-0" />;
      break;
    case 'none':
    default:
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700';
      icon = <CircleSlash className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-zinc-400 inline shrink-0" />;
      break;
  }

  // If overwritten: display only the overwritten detail (e.g. CRITICAL)
  // If not overwritten: display only the original level (e.g. warning, error)
  const displayText = isOverridden && overrideTag ? overrideTag : level;

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${sizeClasses} ${colorClasses} ${className}`}
      title={isOverridden ? `Overridden to ${level.toUpperCase()} by tag "${overrideTag}"` : `SARIF Level: ${level}`}
    >
      {icon}
      <span className={isOverridden ? 'font-bold uppercase tracking-wide' : 'lowercase'}>
        {displayText}
      </span>
    </span>
  );
};

interface TagChipProps {
  label: string;
  onClick?: () => void;
  selected?: boolean;
}

export const TagChip: React.FC<TagChipProps> = ({ label, onClick, selected }) => {
  const isCriticalTag = /^(critical|blocker|high|p0|p1)$/i.test(label);
  const isWarningTag = /^(medium|warning|moderate|p2)$/i.test(label);

  let tagStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700';
  if (isCriticalTag) {
    tagStyle = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/80 dark:hover:bg-rose-900/60';
  } else if (isWarningTag) {
    tagStyle = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80 dark:hover:bg-amber-900/60';
  }

  if (selected) {
    tagStyle = 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 dark:bg-blue-600 dark:border-blue-500';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono border transition-colors ${tagStyle} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Tag className="w-2.5 h-2.5 opacity-60 shrink-0" />
      <span>{label}</span>
    </button>
  );
};

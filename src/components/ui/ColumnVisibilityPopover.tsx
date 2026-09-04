import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  Columns3,
  Lock,
  RotateCcw,
  Check,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { TableColumnKey, ColumnVisibilityState, ColumnMetadata } from '../../types/viewer';

interface ColumnVisibilityPopoverProps {
  columns: ColumnMetadata[];
  columnVisibility: ColumnVisibilityState;
  onToggleColumn: (key: TableColumnKey) => void;
  onShowAll: () => void;
  onResetToDefault: () => void;
  visibleCount: number;
  totalCount: number;
  canToggleOff: (key: TableColumnKey) => boolean;
}

export const ColumnVisibilityPopover: React.FC<ColumnVisibilityPopoverProps> = ({
  columns,
  columnVisibility,
  onToggleColumn,
  onShowAll,
  onResetToDefault,
  visibleCount,
  totalCount,
  canToggleOff,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors shadow-2xs cursor-pointer font-medium select-none ${
            open
              ? 'bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 ring-1 ring-slate-300 dark:ring-zinc-600'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
          title="Customize visible table columns"
        >
          <Columns3 className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <span>Columns</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono text-slate-600 dark:text-zinc-400">
            {visibleCount}/{totalCount}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-3 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 focus:outline-hidden"
          sideOffset={6}
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 mb-2">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                Table Columns
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                {visibleCount} of {totalCount} columns visible
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onShowAll}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer font-medium"
                title="Show all available columns"
              >
                <Eye className="w-3 h-3" />
                <span>All</span>
              </button>

              <button
                type="button"
                onClick={onResetToDefault}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Reset columns to default layout"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Columns Checkbox List */}
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {columns.map((col) => {
              const isVisible = Boolean(columnVisibility[col.key]);
              const isLocked = !col.canHide;
              const isDisableUncheck = isVisible && !canToggleOff(col.key);

              return (
                <div
                  key={col.key}
                  onClick={() => {
                    if (!isLocked && (!isVisible || !isDisableUncheck)) {
                      onToggleColumn(col.key);
                    }
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors select-none ${
                    isLocked
                      ? 'bg-slate-50/70 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 cursor-not-allowed'
                      : isDisableUncheck
                      ? 'bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 cursor-not-allowed'
                      : 'hover:bg-slate-50 dark:hover:bg-zinc-800/70 text-slate-800 dark:text-zinc-200 cursor-pointer'
                  }`}
                  title={
                    isLocked
                      ? 'Actions column is required and cannot be hidden'
                      : isDisableUncheck
                      ? 'At least one identifying data column must remain visible'
                      : col.description
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${
                        isVisible
                          ? isLocked
                            ? 'bg-slate-200 dark:bg-zinc-700 border-slate-300 dark:border-zinc-600 text-slate-600 dark:text-zinc-300'
                            : 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                      }`}
                    >
                      {isVisible && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <span className="truncate font-medium">{col.label}</span>
                  </div>

                  {isLocked ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 dark:text-zinc-500 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Locked</span>
                    </span>
                  ) : (
                    col.defaultVisible && (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        Default
                      </span>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-500 text-center">
            Preferences are saved automatically in your browser
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

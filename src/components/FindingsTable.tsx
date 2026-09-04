import React, { useState, useMemo } from 'react';
import { NormalizedFinding } from '../types/viewer';
import { SeverityBadge, TagChip } from './ui/Badge';
import { TaxonomyBadge } from './ui/TaxonomyBadge';
import { sortFindings, SortField, SortDirection } from '../utils/findingSorter';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { ColumnVisibilityPopover } from './ui/ColumnVisibilityPopover';
import {
  BellOff,
  Bell,
  CheckCircle2,
  FileText,
  Code2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  Wrench,
  Globe,
  ShieldCheck,
} from 'lucide-react';

interface FindingsTableProps {
  findings: NormalizedFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (finding: NormalizedFinding) => void;
  onToggleMute: (finding: NormalizedFinding) => void;
  onViewRawSarif?: (finding: NormalizedFinding) => void;
}

function renderSortIcon(isCurrentSort: boolean, sortDirection: SortDirection) {
  if (!isCurrentSort) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 opacity-0 group-hover/th:opacity-100 transition-opacity" />;
  }
  if (sortDirection === 'asc') {
    return <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 font-bold" />;
  }
  return <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 font-bold" />;
}

function getFindingRowClass(isSelected: boolean, isMuted: boolean): string {
  if (isSelected) {
    return 'bg-blue-50/90 hover:bg-blue-50 dark:bg-zinc-800/90 dark:hover:bg-zinc-800 font-medium text-slate-900 dark:text-zinc-100 ring-1 ring-blue-200 dark:ring-zinc-600 inset-0';
  }
  if (isMuted) {
    return 'bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 text-slate-400 dark:text-zinc-500 opacity-75';
  }
  return 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300';
}

const TableSortHeaderCell: React.FC<{
  field: SortField;
  label: string;
  className: string;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}> = ({ field, label, className, sortField, sortDirection, onSort }) => {
  const isCurrentSort = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`${className} cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 transition-colors group/th`}
      title={`Click to sort by ${label}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span>{label}</span>
        {renderSortIcon(isCurrentSort, sortDirection)}
      </div>
    </th>
  );
};

const FindingRowBadges: React.FC<{ finding: NormalizedFinding }> = ({ finding }) => (
  <div className="flex items-center gap-1">
    {finding.codeFlows && finding.codeFlows.length > 0 && (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-mono"
        title="Interactive Dataflow Taint Trace Available"
      >
        <Activity className="w-2.5 h-2.5" />
        <span>Flow</span>
      </span>
    )}
    {finding.fixes && finding.fixes.length > 0 && (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono"
        title="Automated Fix & Code Diff Available"
      >
        <Wrench className="w-2.5 h-2.5" />
        <span>Fix</span>
      </span>
    )}
    {(finding.webRequest || finding.webResponse) && (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono"
        title="DAST HTTP Traffic Available"
      >
        <Globe className="w-2.5 h-2.5" />
        <span>DAST</span>
      </span>
    )}
    {finding.inSarifSuppressions && finding.inSarifSuppressions.length > 0 && (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-mono"
        title="Suppressed inside SARIF"
      >
        <ShieldCheck className="w-2.5 h-2.5" />
      </span>
    )}
  </div>
);

const FindingTableRow: React.FC<{
  finding: NormalizedFinding;
  isSelected: boolean;
  columnVisibility: Record<string, boolean>;
  onSelect: (f: NormalizedFinding) => void;
  onToggleMute: (f: NormalizedFinding) => void;
  onViewRawSarif?: (f: NormalizedFinding) => void;
}> = ({ finding, isSelected, columnVisibility, onSelect, onToggleMute, onViewRawSarif }) => {
  const rowClass = getFindingRowClass(isSelected, !!finding.isMuted);

  return (
    <tr
      onClick={() => onSelect(finding)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(finding);
        }
      }}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
      className={`cursor-pointer transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${rowClass}`}
    >
      {/* Rule ID Column */}
      {columnVisibility.rule && (
        <td className="py-3 px-4 whitespace-nowrap align-middle font-mono font-semibold text-slate-900 dark:text-zinc-100">
          <div className="flex flex-col gap-1">
            <span className="hover:underline">{finding.ruleId}</span>
            <FindingRowBadges finding={finding} />
          </div>
        </td>
      )}

      {/* Rule Name Column */}
      {columnVisibility.ruleName && (
        <td className="py-3 px-4 align-middle max-w-[220px]">
          <span
            className="text-xs text-slate-700 dark:text-zinc-300 font-medium truncate block"
            title={finding.ruleName || finding.ruleDescription}
          >
            {finding.ruleName || finding.ruleDescription || '—'}
          </span>
        </td>
      )}

      {/* Severity / Level Column */}
      {columnVisibility.level && (
        <td className="py-3 px-3 whitespace-nowrap align-middle">
          <SeverityBadge
            level={finding.effectiveLevel}
            isOverridden={finding.isLevelOverridden}
            overrideTag={finding.overrideTag}
          />
        </td>
      )}

      {/* Message Column */}
      {columnVisibility.message && (
        <td className="py-3 px-4 align-middle max-w-[450px]">
          <div className="leading-relaxed break-words whitespace-normal line-clamp-2">
            {finding.isMuted && (
              <span className="inline-flex items-center gap-0.5 mr-1.5 text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                [MUTED]
              </span>
            )}
            <span className={finding.isMuted ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-200'}>
              {finding.message}
            </span>
          </div>
        </td>
      )}

      {/* File Path Column */}
      {columnVisibility.file && (
        <td className="py-3 px-4 align-middle" title={finding.filePath}>
          <div className="flex items-center gap-1.5 max-w-[200px]">
            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
            <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-400 truncate">
              {finding.filePath || 'Not provided'}
            </span>
          </div>
        </td>
      )}

      {/* Line / Position Column */}
      {columnVisibility.line && (
        <td className="py-3 px-3 whitespace-nowrap align-middle font-mono text-[11px] text-slate-600 dark:text-zinc-400">
          {finding.line !== null ? (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">
              L{finding.line}{finding.column ? `:${finding.column}` : ''}
            </span>
          ) : (
            '—'
          )}
        </td>
      )}

      {/* Tool / Driver Column */}
      {columnVisibility.tool && (
        <td className="py-3 px-3 whitespace-nowrap align-middle">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{finding.toolName}</span>
            {finding.toolVersion && (
              <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                v{finding.toolVersion}
              </span>
            )}
          </div>
        </td>
      )}

      {/* Tags Column */}
      {columnVisibility.tags && (
        <td className="py-3 px-3 align-middle max-w-[180px]">
          {finding.tags && finding.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {finding.tags.slice(0, 2).map((t) => (
                <TagChip key={t} label={t} />
              ))}
              {finding.tags.length > 2 && (
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  +{finding.tags.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-zinc-600 text-xs">—</span>
          )}
        </td>
      )}

      {/* Taxonomies Column */}
      {columnVisibility.taxonomies && (
        <td className="py-3 px-3 align-middle max-w-[180px]">
          {finding.taxonomies && finding.taxonomies.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {finding.taxonomies.slice(0, 2).map((tax) => (
                <TaxonomyBadge key={`${tax.taxonomyName}:${tax.id}`} taxonomy={tax} />
              ))}
              {finding.taxonomies.length > 2 && (
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  +{finding.taxonomies.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-zinc-600 text-xs">—</span>
          )}
        </td>
      )}

      {/* Actions Column (Permanently Visible) */}
      <td className="py-3 px-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1">
          {onViewRawSarif && (
            <button
              type="button"
              onClick={() => onViewRawSarif(finding)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
              title="View Raw SARIF JSON"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleMute(finding)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              finding.isMuted
                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
            title={finding.isMuted ? `Muted: ${finding.muteRecord?.reason || 'Suppressed'}. Click to unmute.` : 'Mute this finding'}
          >
            {finding.isMuted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );
};

const FindingsPagination: React.FC<{
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
  isAll: boolean;
  sortField: SortField | null;
  sortDirection: SortDirection;
}> = ({
  totalItems,
  startIndex,
  endIndex,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  totalPages,
  isAll,
  sortField,
  sortDirection,
}) => (
  <div className="p-3 sm:px-4 bg-slate-50/75 dark:bg-zinc-950/80 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-zinc-400">
    <div className="text-slate-500 dark:text-zinc-400">
      Showing <span className="font-semibold text-slate-800 dark:text-zinc-200">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
      <span className="font-semibold text-slate-800 dark:text-zinc-200">{endIndex}</span> of{' '}
      <span className="font-semibold text-slate-800 dark:text-zinc-200">{totalItems}</span> findings
      {sortField && (
        <span className="ml-2 text-slate-400 dark:text-zinc-500 text-[11px]">
          (Sorted by <strong className="text-slate-600 dark:text-zinc-300 capitalize">{sortField}</strong> {sortDirection === 'asc' ? '↑' : '↓'})
        </span>
      )}
    </div>

    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500 dark:text-zinc-400">Per page:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="py-1 px-2 text-xs bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 rounded-md shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={-1}>All</option>
        </select>
      </div>

      {!isAll && totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer text-slate-700 dark:text-zinc-300"
            title="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer text-slate-700 dark:text-zinc-300"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer text-slate-700 dark:text-zinc-300"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer text-slate-700 dark:text-zinc-300"
            title="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  </div>
);

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding,
  onToggleMute,
  onViewRawSarif,
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const {
    columnVisibility,
    columns,
    toggleColumn,
    showAllColumns,
    resetToDefault,
    visibleCount,
    totalColumnsCount,
    canToggleOff,
  } = useColumnPreferences();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection(field === 'level' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const sortedFindings = useMemo(
    () => sortFindings(findings, sortField, sortDirection),
    [findings, sortField, sortDirection]
  );

  // Reset page to 1 whenever findings list changes (e.g. user filter updates)
  const prevFindingsRef = React.useRef(findings);
  React.useEffect(() => {
    if (prevFindingsRef.current !== findings) {
      prevFindingsRef.current = findings;
      setCurrentPage(1);
    }
  }, [findings]);

  const totalItems = sortedFindings.length;
  const isAll = pageSize === -1;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedFindings = useMemo(() => {
    if (isAll) return sortedFindings;
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedFindings.slice(start, start + pageSize);
  }, [sortedFindings, safeCurrentPage, pageSize, isAll]);

  useKeyboardNavigation(
    sortedFindings,
    selectedFindingId,
    (id) => {
      const idx = sortedFindings.findIndex((f) => f.id === id);
      if (idx !== -1) {
        onSelectFinding(sortedFindings[idx]);
        if (!isAll) {
          const targetPage = Math.floor(idx / pageSize) + 1;
          if (targetPage !== safeCurrentPage) {
            setCurrentPage(targetPage);
          }
        }
      }
    }
  );

  const startIndex = isAll ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = isAll ? totalItems : Math.min(startIndex + pageSize, totalItems);

  if (findings.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-12 text-center shadow-2xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No findings matched your criteria</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
          Try clearing some filters or searching with different keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col transition-colors duration-200">
      {/* Table Toolbar: Finding counter + Column Customizer Popover */}
      <div className="p-3 sm:px-4 bg-slate-50/75 dark:bg-zinc-950/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-zinc-200">
            Findings ({totalItems})
          </span>
          {sortField && (
            <span className="text-slate-400 dark:text-zinc-500 text-[11px] hidden sm:inline">
              Sorted by <strong className="text-slate-600 dark:text-zinc-300 capitalize">{sortField}</strong> ({sortDirection.toUpperCase()})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ColumnVisibilityPopover
            columns={columns}
            columnVisibility={columnVisibility}
            onToggleColumn={toggleColumn}
            onShowAll={showAllColumns}
            onResetToDefault={resetToDefault}
            visibleCount={visibleCount}
            totalCount={totalColumnsCount}
            canToggleOff={canToggleOff}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/80 text-slate-600 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px] select-none">
              {columnVisibility.rule && (
                <TableSortHeaderCell
                  field="rule"
                  label="Rule"
                  className="py-3 px-4 w-36"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {columnVisibility.ruleName && (
                <TableSortHeaderCell
                  field="ruleName"
                  label="Rule Name"
                  className="py-3 px-4 min-w-[160px] max-w-[220px]"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {columnVisibility.level && (
                <TableSortHeaderCell
                  field="level"
                  label="Level"
                  className="py-3 px-3 w-32"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {columnVisibility.message && (
                <TableSortHeaderCell
                  field="message"
                  label="Message"
                  className="py-3 px-4 max-w-[450px]"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {columnVisibility.file && (
                <TableSortHeaderCell
                  field="file"
                  label="File"
                  className="py-3 px-4 min-w-[180px]"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {columnVisibility.line && (
                <TableSortHeaderCell
                  field="line"
                  label="Line"
                  className="py-3 px-3 w-24"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {columnVisibility.tool && (
                <TableSortHeaderCell
                  field="tool"
                  label="Driver"
                  className="py-3 px-3 min-w-[120px]"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {columnVisibility.tags && (
                <TableSortHeaderCell
                  field="tags"
                  label="Tags"
                  className="py-3 px-3 min-w-[140px]"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {columnVisibility.taxonomies && (
                <TableSortHeaderCell
                  field="taxonomies"
                  label="Standards"
                  className="py-3 px-3 min-w-[140px]"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {/* Actions Header (Locked) */}
              <th className="py-3 px-3 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {paginatedFindings.map((f) => (
              <FindingTableRow
                key={f.id}
                finding={f}
                isSelected={selectedFindingId === f.id}
                columnVisibility={columnVisibility}
                onSelect={onSelectFinding}
                onToggleMute={onToggleMute}
                onViewRawSarif={onViewRawSarif}
              />
            ))}
          </tbody>
        </table>
      </div>

      <FindingsPagination
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
        currentPage={safeCurrentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        isAll={isAll}
        sortField={sortField}
        sortDirection={sortDirection}
      />
    </div>
  );
};

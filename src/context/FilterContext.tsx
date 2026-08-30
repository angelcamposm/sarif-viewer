import React, { useState, useMemo, useCallback, ReactNode } from 'react';
import { FilterState, ParsedSarifReport } from '../types/viewer';
import { LevelOption } from '../components/FilterBar';
import { useReport } from '../hooks/useReport';
import { FilterContext } from './FilterContextDef';
import { matchesAllFilters } from '../utils/filterPredicates';

const initialFilters: FilterState = {
  searchQuery: '',
  selectedLevel: 'all',
  selectedRule: 'all',
  selectedTag: 'all',
  muteStatus: 'all',
};

const BASE_LEVEL_OPTIONS: LevelOption[] = [
  { value: 'all', label: 'All levels' },
  { value: 'error', label: 'Errors' },
  { value: 'warning', label: 'Warnings' },
  { value: 'note', label: 'Notes' },
  { value: 'none', label: 'None' },
];

/**
 * Computes available level options including baseline and overridden tags.
 */
function computeLevelOptions(report: ParsedSarifReport | null): LevelOption[] {
  if (!report) return BASE_LEVEL_OPTIONS;

  const overrideTags = Array.from(
    new Set(
      report.findings
        .filter((f) => f.isLevelOverridden && f.overrideTag)
        .map((f) => f.overrideTag!)
    )
  ).sort();

  const overrideOptions: LevelOption[] = overrideTags.map((tag) => ({
    value: `override:${tag}`,
    label: `${tag} (Overwritten)`,
    isOverride: true,
  }));

  return [...BASE_LEVEL_OPTIONS, ...overrideOptions];
}

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { report, rawSarif } = useReport();
  const [prevReportKey, setPrevReportKey] = useState<string | undefined>(rawSarif?.filename);
  const [filters, setFiltersState] = useState<FilterState>(initialFilters);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Synchronize state during render when active report changes
  if (rawSarif?.filename !== prevReportKey) {
    setPrevReportKey(rawSarif?.filename);
    setFiltersState(initialFilters);
    setSelectedFindingId(null);
  }

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, []);

  const levelOptions = useMemo(() => computeLevelOptions(report), [report]);

  const filteredFindings = useMemo(() => {
    if (!report) return [];
    return report.findings.filter((finding) => matchesAllFilters(finding, filters));
  }, [report, filters]);

  const selectedFinding = useMemo(() => {
    if (!report || report.findings.length === 0) return null;
    if (selectedFindingId) {
      const match = report.findings.find((f) => f.id === selectedFindingId);
      if (match) return match;
    }
    return filteredFindings[0] || report.findings[0] || null;
  }, [report, selectedFindingId, filteredFindings]);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      clearFilters,
      filteredFindings,
      selectedFindingId,
      setSelectedFindingId,
      selectedFinding,
      levelOptions,
    }),
    [
      filters,
      setFilters,
      clearFilters,
      filteredFindings,
      selectedFindingId,
      selectedFinding,
      levelOptions,
    ]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

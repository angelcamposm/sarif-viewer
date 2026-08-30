import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReportProvider } from '../ReportContext';
import { FilterProvider } from '../FilterContext';
import { useReport } from '../../hooks/useReport';
import { useFilters } from '../../hooks/useFilters';
import { SAMPLE_REPORTS } from '../../data/sampleReports';

describe('FilterContext Provider', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ReportProvider>
      <FilterProvider>{children}</FilterProvider>
    </ReportProvider>
  );

  it('filters findings by search query and level', () => {
    const { result } = renderHook(
      () => ({
        report: useReport(),
        filters: useFilters(),
      }),
      { wrapper }
    );

    const sample = SAMPLE_REPORTS[0]; // 2 findings: sql-injection (error), path-injection (warning)
    act(() => {
      result.current.report.loadFile(JSON.stringify(sample.data), sample.filename);
    });

    expect(result.current.filters.filteredFindings.length).toBe(2);

    // Filter by text search
    act(() => {
      result.current.filters.setFilters({ searchQuery: 'sql-injection' });
    });
    expect(result.current.filters.filteredFindings.length).toBe(1);
    expect(result.current.filters.filteredFindings[0].ruleId).toBe('java/sql-injection');

    // Filter by level
    act(() => {
      result.current.filters.setFilters({ searchQuery: '', selectedLevel: 'warning' });
    });
    expect(result.current.filters.filteredFindings.length).toBe(1);
    expect(result.current.filters.filteredFindings[0].ruleId).toBe('java/path-injection');

    // Clear filters
    act(() => {
      result.current.filters.clearFilters();
    });
    expect(result.current.filters.filteredFindings.length).toBe(2);
  });
});

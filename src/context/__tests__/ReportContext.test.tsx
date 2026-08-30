import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReportProvider } from '../ReportContext';
import { useReport } from '../../hooks/useReport';
import { SAMPLE_REPORTS } from '../../data/sampleReports';
import { muteStorage } from '../../services/muteStorage';

describe('ReportContext Provider', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    muteStorage.clearAll();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ReportProvider>{children}</ReportProvider>
  );

  it('loads valid SARIF and exposes parsed report', () => {
    const { result } = renderHook(() => useReport(), { wrapper });

    expect(result.current.report).toBeNull();
    const sample = SAMPLE_REPORTS[0];

    act(() => {
      const success = result.current.loadFile(JSON.stringify(sample.data), sample.filename);
      expect(success).toBe(true);
    });

    expect(result.current.report).not.toBeNull();
    expect(result.current.report?.fileName).toBe('codeql_taint_dataflow_sqli.sarif');
    expect(result.current.report?.totalFindings).toBe(2);
  });

  it('updates muted counts reactively without re-parsing raw JSON', () => {
    const { result } = renderHook(() => useReport(), { wrapper });
    const sample = SAMPLE_REPORTS[0];

    act(() => {
      result.current.loadFile(JSON.stringify(sample.data), sample.filename);
    });

    expect(result.current.report?.mutedCount).toBe(0);

    const findingId = result.current.report!.findings[0].id;

    act(() => {
      muteStorage.mute({
        id: findingId,
        ruleId: 'java/sql-injection',
        reason: 'False Positive',
        mutedAt: new Date().toISOString(),
      });
    });

    expect(result.current.report?.mutedCount).toBe(1);
    expect(result.current.report?.findings[0].isMuted).toBe(true);
  });

  it('closes active report and clears state', () => {
    const { result } = renderHook(() => useReport(), { wrapper });
    const sample = SAMPLE_REPORTS[0];

    act(() => {
      result.current.loadFile(JSON.stringify(sample.data), sample.filename);
    });

    expect(result.current.report).not.toBeNull();

    act(() => {
      result.current.closeReport();
    });

    expect(result.current.report).toBeNull();
    expect(result.current.rawSarif).toBeNull();
  });
});

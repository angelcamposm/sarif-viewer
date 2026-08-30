import React, { useState, useMemo, useCallback, ReactNode } from 'react';
import { ParsedSarifReport } from '../types/viewer';
import { SarifLog } from '../types/sarif';
import { parseSarifJson } from '../services/sarifParser';
import { useMuteStorage } from '../hooks/useMuteStorage';
import { ReportContext } from './ReportContextDef';

const SESSION_REPORT_KEY = 'sarif_viewer_active_report_v1';

export const ReportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { mutedRecords } = useMuteStorage();
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [rawSarif, setRawSarif] = useState<{ content: string; filename: string } | null>(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const saved = sessionStorage.getItem(SESSION_REPORT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.content === 'string' && typeof parsed.filename === 'string') {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore session report:', e);
    }
    return null;
  });

  // Base report: Parsed once when rawSarif changes
  const baseReport = useMemo(() => {
    if (!rawSarif) return null;
    try {
      const parsedJson = JSON.parse(rawSarif.content) as SarifLog;
      return parseSarifJson(parsedJson, rawSarif.filename, {});
    } catch (err: any) {
      console.error('Failed to parse SARIF:', err);
      return null;
    }
  }, [rawSarif]);

  // Derived report with active mute records applied in O(N) without full JSON re-parsing
  const report: ParsedSarifReport | null = useMemo(() => {
    if (!baseReport) return null;

    let mutedCount = 0;
    const updatedFindings = baseReport.findings.map((f) => {
      const muteRec = mutedRecords[f.id];
      const isMuted = !!muteRec || f.inSarifSuppressions?.some((s) => s.status === 'accepted') || false;
      if (isMuted) mutedCount++;

      if (f.isMuted === isMuted && f.muteRecord === muteRec) {
        return f;
      }

      return {
        ...f,
        isMuted,
        muteRecord: muteRec,
      };
    });

    return {
      ...baseReport,
      mutedCount,
      findings: updatedFindings,
    };
  }, [baseReport, mutedRecords]);

  const loadFile = useCallback((fileContent: string, fileName: string): boolean => {
    setIsLoading(true);
    setParseError(null);
    try {
      const parsedJson = JSON.parse(fileContent);
      if (!parsedJson || typeof parsedJson !== 'object' || (!parsedJson.runs && !parsedJson.version)) {
        const msg = 'Invalid SARIF file: Missing runs array or SARIF version header.';
        setParseError(msg);
        alert(msg);
        setIsLoading(false);
        return false;
      }

      const reportPayload = { content: fileContent, filename: fileName };
      setRawSarif(reportPayload);

      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem(SESSION_REPORT_KEY, JSON.stringify(reportPayload));
        }
      } catch (storageErr) {
        console.warn('Report too large for sessionStorage quota, caching skipped:', storageErr);
      }

      setIsLoading(false);
      return true;
    } catch (e: any) {
      const msg = `Invalid JSON format: ${e.message}`;
      setParseError(msg);
      alert(msg);
      setIsLoading(false);
      return false;
    }
  }, []);

  const closeReport = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(SESSION_REPORT_KEY);
      }
    } catch (e) {
      console.warn('Failed to clear sessionStorage report:', e);
    }
    setRawSarif(null);
    setParseError(null);
  }, []);

  const value = useMemo(
    () => ({
      rawSarif,
      report,
      baseReport,
      isLoading,
      parseError,
      loadFile,
      closeReport,
    }),
    [rawSarif, report, baseReport, isLoading, parseError, loadFile, closeReport]
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};


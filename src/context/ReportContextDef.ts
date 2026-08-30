import { createContext } from 'react';
import { ParsedSarifReport } from '../types/viewer';

export interface ReportContextValue {
  rawSarif: { content: string; filename: string } | null;
  report: ParsedSarifReport | null;
  baseReport: ParsedSarifReport | null;
  isLoading: boolean;
  parseError: string | null;
  loadFile: (fileContent: string, fileName: string) => boolean;
  closeReport: () => void;
}

export const ReportContext = createContext<ReportContextValue | null>(null);

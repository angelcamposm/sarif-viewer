import { useContext } from 'react';
import { ReportContext, ReportContextValue } from '../context/ReportContextDef';

export function useReport(): ReportContextValue {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}

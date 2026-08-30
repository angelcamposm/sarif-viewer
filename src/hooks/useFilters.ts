import { useContext } from 'react';
import { FilterContext, FilterContextValue } from '../context/FilterContextDef';

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

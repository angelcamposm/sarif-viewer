import { createContext } from 'react';
import { FilterState, NormalizedFinding } from '../types/viewer';
import { LevelOption } from '../components/FilterBar';

export interface FilterContextValue {
  filters: FilterState;
  setFilters: (newFilters: Partial<FilterState>) => void;
  clearFilters: () => void;
  filteredFindings: NormalizedFinding[];
  selectedFindingId: string | null;
  setSelectedFindingId: (id: string | null) => void;
  selectedFinding: NormalizedFinding | null;
  levelOptions: LevelOption[];
}

export const FilterContext = createContext<FilterContextValue | null>(null);

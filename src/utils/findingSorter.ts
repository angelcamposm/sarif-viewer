import { NormalizedFinding, SarifLevel } from '../types/viewer';

export type SortField = 'rule' | 'level' | 'message' | 'file';
export type SortDirection = 'asc' | 'desc';

const SEVERITY_WEIGHT: Record<SarifLevel, number> = {
  error: 4,
  warning: 3,
  note: 2,
  none: 1,
};

function compareFindingsByField(a: NormalizedFinding, b: NormalizedFinding, field: SortField): number {
  switch (field) {
    case 'rule':
      return a.ruleId.localeCompare(b.ruleId);
    case 'level':
      return (SEVERITY_WEIGHT[a.effectiveLevel] || 0) - (SEVERITY_WEIGHT[b.effectiveLevel] || 0);
    case 'message':
      return a.message.localeCompare(b.message);
    case 'file':
      return (a.filePath || '').localeCompare(b.filePath || '');
    default:
      return 0;
  }
}

/**
 * Pure function to sort findings by field and direction.
 */
export function sortFindings(
  findings: NormalizedFinding[],
  sortField: SortField | null,
  sortDirection: SortDirection
): NormalizedFinding[] {
  if (!sortField) return findings;

  return [...findings].sort((a, b) => {
    const comparison = compareFindingsByField(a, b, sortField);
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

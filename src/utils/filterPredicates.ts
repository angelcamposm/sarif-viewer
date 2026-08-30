import { NormalizedFinding, FilterState } from '../types/viewer';

/**
 * Checks if a finding matches the given search query string across multiple fields.
 */
export function matchesSearchQuery(finding: NormalizedFinding, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  if (finding.ruleId.toLowerCase().includes(query)) return true;
  if (finding.ruleName && finding.ruleName.toLowerCase().includes(query)) return true;
  if (finding.message.toLowerCase().includes(query)) return true;
  if (finding.filePath.toLowerCase().includes(query)) return true;
  if (finding.effectiveLevel.toLowerCase().includes(query)) return true;
  if (finding.overrideTag && finding.overrideTag.toLowerCase().includes(query)) return true;
  if (finding.tags.some((t) => t.toLowerCase().includes(query))) return true;

  return false;
}

/**
 * Checks if a finding matches the selected severity level or override tag filter.
 */
export function matchesLevelFilter(finding: NormalizedFinding, selectedLevel: string): boolean {
  if (selectedLevel === 'all') return true;

  if (selectedLevel.startsWith('override:')) {
    const targetTag = selectedLevel.replace('override:', '').toLowerCase();
    return finding.isLevelOverridden && finding.overrideTag?.toLowerCase() === targetTag;
  }

  return finding.effectiveLevel === selectedLevel || finding.originalLevel === selectedLevel;
}

/**
 * Checks if a finding matches the selected rule filter.
 */
export function matchesRuleFilter(finding: NormalizedFinding, selectedRule: string): boolean {
  if (selectedRule === 'all') return true;
  return finding.ruleId === selectedRule;
}

/**
 * Checks if a finding matches the selected tag filter.
 */
export function matchesTagFilter(finding: NormalizedFinding, selectedTag: string): boolean {
  if (selectedTag === 'all') return true;
  return finding.tags.includes(selectedTag);
}

/**
 * Checks if a finding matches the selected mute status filter.
 */
export function matchesMuteStatus(finding: NormalizedFinding, muteStatus: string): boolean {
  if (muteStatus === 'active') return !finding.isMuted;
  if (muteStatus === 'muted') return finding.isMuted;
  return true;
}

/**
 * Checks if a finding satisfies all active filters.
 */
export function matchesAllFilters(finding: NormalizedFinding, filters: FilterState): boolean {
  return (
    matchesSearchQuery(finding, filters.searchQuery) &&
    matchesLevelFilter(finding, filters.selectedLevel) &&
    matchesRuleFilter(finding, filters.selectedRule) &&
    matchesTagFilter(finding, filters.selectedTag) &&
    matchesMuteStatus(finding, filters.muteStatus)
  );
}

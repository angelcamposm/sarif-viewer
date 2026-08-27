import { SarifLevel } from '../types/viewer';

export interface OverrideResult {
  effectiveLevel: SarifLevel;
  isOverridden: boolean;
  hasCriticalityTag: boolean;
  overrideTag?: string;
  overrideReason?: string;
}

// Criticality keyword map to standard SARIF 4-tier levels
const CRITICALITY_MAP: Array<{ regex: RegExp; level: SarifLevel; displayTag: string; weight: number }> = [
  { regex: /^(critical|blocker|p0|severity[_\s-]?critical|criticality[_\s-]?critical)$/i, level: 'error', displayTag: 'CRITICAL', weight: 100 },
  { regex: /^(high|error|p1|severity[_\s-]?high|criticality[_\s-]?high)$/i, level: 'error', displayTag: 'HIGH', weight: 90 },
  { regex: /^(medium|warning|moderate|p2|severity[_\s-]?medium|criticality[_\s-]?medium)$/i, level: 'warning', displayTag: 'WARNING', weight: 50 },
  { regex: /^(low|note|minor|p3|severity[_\s-]?low|criticality[_\s-]?low)$/i, level: 'note', displayTag: 'NOTE', weight: 20 },
  { regex: /^(info|informational|none|p4|p5|severity[_\s-]?info|criticality[_\s-]?none)$/i, level: 'none', displayTag: 'NONE', weight: 10 },
];

/**
 * Evaluates tags and properties to detect criticality overrides.
 * If a tag matches a criticality keyword, it overrides the baseline SARIF level.
 */
export function resolveEffectiveLevel(
  originalLevel: SarifLevel,
  tags: string[]
): OverrideResult {
  let highestMatch: { level: SarifLevel; displayTag: string; weight: number; matchedTag: string } | null = null;

  for (const tag of tags) {
    const cleanTag = tag.trim();
    for (const entry of CRITICALITY_MAP) {
      if (entry.regex.test(cleanTag)) {
        if (!highestMatch || entry.weight > highestMatch.weight) {
          highestMatch = {
            level: entry.level,
            displayTag: entry.displayTag,
            weight: entry.weight,
            matchedTag: cleanTag,
          };
        }
      }
    }
  }

  if (highestMatch) {
    const isDifferent = highestMatch.level !== originalLevel || highestMatch.displayTag === 'CRITICAL';
    return {
      effectiveLevel: highestMatch.level,
      isOverridden: isDifferent,
      hasCriticalityTag: true,
      overrideTag: highestMatch.matchedTag,
      overrideReason: isDifferent
        ? `Level overridden by tag "${highestMatch.matchedTag}" to ${highestMatch.level.toUpperCase()}`
        : undefined,
    };
  }

  return {
    effectiveLevel: originalLevel,
    isOverridden: false,
    hasCriticalityTag: false,
  };
}

/**
 * Normalize level string from SARIF to SarifLevel ('error' | 'warning' | 'note' | 'none')
 */
export function normalizeSarifLevel(level?: string): SarifLevel {
  if (!level) return 'warning'; // SARIF 2.1.0 standard default is warning
  const lower = level.toLowerCase();
  if (lower === 'error') return 'error';
  if (lower === 'warning') return 'warning';
  if (lower === 'note') return 'note';
  if (lower === 'none') return 'none';
  return 'warning';
}

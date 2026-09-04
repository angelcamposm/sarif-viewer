import { describe, it, expect } from 'vitest';
import {
  matchesSearchQuery,
  matchesLevelFilter,
  matchesRuleFilter,
  matchesTagFilter,
  matchesMuteStatus,
  matchesAllFilters,
} from '../filterPredicates';
import { NormalizedFinding, FilterState } from '../../types/viewer';

const mockFinding = (overrides: Partial<NormalizedFinding> = {}): NormalizedFinding => ({
  id: 'test-report.sarif#r0_res0_find_123',
  runIndex: 0,
  resultIndex: 0,
  toolName: 'CodeQL',
  ruleId: 'js/sql-injection',
  ruleName: 'SQL Injection',
  message: 'Potential SQL injection via user input',
  originalLevel: 'warning',
  effectiveLevel: 'error',
  isLevelOverridden: true,
  overrideTag: 'CRITICAL',
  overrideReason: 'Level overridden by tag "CRITICAL" to ERROR',
  filePath: 'src/controllers/auth.ts',
  fileName: 'auth.ts',
  line: 42,
  column: 15,
  endLine: null,
  endColumn: null,
  properties: {},
  tags: ['security', 'sql', 'CRITICAL'],
  isMuted: false,
  rawResult: { message: { text: 'Potential SQL injection' } } as any,
  ...overrides,
} as NormalizedFinding);

describe('filterPredicates', () => {
  describe('matchesLevelFilter', () => {
    it('returns true when selectedLevel is all', () => {
      const finding = mockFinding();
      expect(matchesLevelFilter(finding, 'all')).toBe(true);
    });

    it('matches strictly against effectiveLevel, not originalLevel', () => {
      // originalLevel is warning, but effectiveLevel is error
      const finding = mockFinding({ originalLevel: 'warning', effectiveLevel: 'error' });

      // Filtering by warning must NOT match
      expect(matchesLevelFilter(finding, 'warning')).toBe(false);

      // Filtering by error MUST match
      expect(matchesLevelFilter(finding, 'error')).toBe(true);
    });

    it('matches override tag filters', () => {
      const finding = mockFinding({
        isLevelOverridden: true,
        overrideTag: 'CRITICAL',
      });
      expect(matchesLevelFilter(finding, 'override:critical')).toBe(true);
      expect(matchesLevelFilter(finding, 'override:high')).toBe(false);
    });
  });

  describe('matchesSearchQuery', () => {
    const finding = mockFinding();

    it('matches query against ruleId', () => {
      expect(matchesSearchQuery(finding, 'sql-injection')).toBe(true);
    });

    it('matches query against ruleName', () => {
      expect(matchesSearchQuery(finding, 'SQL Injection')).toBe(true);
    });

    it('matches query against message', () => {
      expect(matchesSearchQuery(finding, 'user input')).toBe(true);
    });

    it('matches query against filePath', () => {
      expect(matchesSearchQuery(finding, 'auth.ts')).toBe(true);
    });

    it('matches query against tags', () => {
      expect(matchesSearchQuery(finding, 'security')).toBe(true);
    });

    it('returns false when query does not match any field', () => {
      expect(matchesSearchQuery(finding, 'buffer-overflow')).toBe(false);
    });
  });

  describe('matchesRuleFilter', () => {
    const finding = mockFinding({ ruleId: 'js/sql-injection' });

    it('matches all rules or specific ruleId', () => {
      expect(matchesRuleFilter(finding, 'all')).toBe(true);
      expect(matchesRuleFilter(finding, 'js/sql-injection')).toBe(true);
      expect(matchesRuleFilter(finding, 'js/xss')).toBe(false);
    });
  });

  describe('matchesTagFilter', () => {
    const finding = mockFinding({ tags: ['security', 'sql'] });

    it('matches all tags or specific tag', () => {
      expect(matchesTagFilter(finding, 'all')).toBe(true);
      expect(matchesTagFilter(finding, 'security')).toBe(true);
      expect(matchesTagFilter(finding, 'crypto')).toBe(false);
    });
  });

  describe('matchesMuteStatus', () => {
    it('filters active findings', () => {
      const active = mockFinding({ isMuted: false });
      const muted = mockFinding({ isMuted: true });

      expect(matchesMuteStatus(active, 'active')).toBe(true);
      expect(matchesMuteStatus(muted, 'active')).toBe(false);
    });

    it('filters muted findings', () => {
      const active = mockFinding({ isMuted: false });
      const muted = mockFinding({ isMuted: true });

      expect(matchesMuteStatus(active, 'muted')).toBe(false);
      expect(matchesMuteStatus(muted, 'muted')).toBe(true);
    });

    it('returns true for all status', () => {
      const active = mockFinding({ isMuted: false });
      expect(matchesMuteStatus(active, 'all')).toBe(true);
    });
  });

  describe('matchesAllFilters', () => {
    it('evaluates full filter state combinatorially', () => {
      const finding = mockFinding({
        effectiveLevel: 'error',
        ruleId: 'js/sql-injection',
        tags: ['security'],
        isMuted: false,
      });

      const filters: FilterState = {
        searchQuery: 'auth.ts',
        selectedLevel: 'error',
        selectedRule: 'js/sql-injection',
        selectedTag: 'security',
        muteStatus: 'active',
      };

      expect(matchesAllFilters(finding, filters)).toBe(true);

      expect(
        matchesAllFilters(finding, {
          ...filters,
          selectedLevel: 'warning',
        })
      ).toBe(false);
    });
  });
});

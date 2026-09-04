import { describe, it, expect } from 'vitest';
import { sortFindings } from '../findingSorter';
import { NormalizedFinding } from '../../types/viewer';

const mockFindings: NormalizedFinding[] = [
  {
    id: 'f1',
    runIndex: 0,
    resultIndex: 0,
    toolName: 'CodeQL',
    ruleId: 'rule-b',
    ruleName: 'Zebra Rule',
    effectiveLevel: 'warning',
    originalLevel: 'warning',
    isLevelOverridden: false,
    message: 'Second message',
    filePath: 'src/b.ts',
    fileName: 'b.ts',
    line: 50,
    column: 1,
    endLine: 50,
    endColumn: 10,
    tags: ['database'],
    taxonomies: [{ taxonomyName: 'CWE', id: 'CWE-89' }],
    properties: {},
    isMuted: false,
    rawResult: {} as any,
  },
  {
    id: 'f2',
    runIndex: 0,
    resultIndex: 1,
    toolName: 'SonarQube',
    ruleId: 'rule-a',
    ruleName: 'Alpha Rule',
    effectiveLevel: 'error',
    originalLevel: 'error',
    isLevelOverridden: false,
    message: 'First message',
    filePath: 'src/a.ts',
    fileName: 'a.ts',
    line: 10,
    column: 5,
    endLine: 10,
    endColumn: 15,
    tags: ['auth', 'jwt'],
    taxonomies: [{ taxonomyName: 'CWE', id: 'CWE-287' }],
    properties: {},
    isMuted: false,
    rawResult: {} as any,
  },
];

describe('Finding Sorter with Extended Columns', () => {
  it('sorts by ruleId asc and desc', () => {
    const asc = sortFindings(mockFindings, 'rule', 'asc');
    expect(asc[0].ruleId).toBe('rule-a');

    const desc = sortFindings(mockFindings, 'rule', 'desc');
    expect(desc[0].ruleId).toBe('rule-b');
  });

  it('sorts by ruleName asc and desc', () => {
    const asc = sortFindings(mockFindings, 'ruleName', 'asc');
    expect(asc[0].ruleName).toBe('Alpha Rule');

    const desc = sortFindings(mockFindings, 'ruleName', 'desc');
    expect(desc[0].ruleName).toBe('Zebra Rule');
  });

  it('sorts by line number asc and desc', () => {
    const asc = sortFindings(mockFindings, 'line', 'asc');
    expect(asc[0].line).toBe(10);

    const desc = sortFindings(mockFindings, 'line', 'desc');
    expect(desc[0].line).toBe(50);
  });

  it('sorts by tool name asc and desc', () => {
    const asc = sortFindings(mockFindings, 'tool', 'asc');
    expect(asc[0].toolName).toBe('CodeQL');

    const desc = sortFindings(mockFindings, 'tool', 'desc');
    expect(desc[0].toolName).toBe('SonarQube');
  });

  it('sorts by tags and taxonomies', () => {
    const tagAsc = sortFindings(mockFindings, 'tags', 'asc');
    expect(tagAsc[0].tags[0]).toBe('auth');

    const taxAsc = sortFindings(mockFindings, 'taxonomies', 'asc');
    expect(taxAsc[0].taxonomies?.[0].id).toBe('CWE-287');
  });
});

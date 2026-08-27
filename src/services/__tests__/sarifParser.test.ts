import { describe, it, expect, beforeEach } from 'vitest';
import { parseSarifJson } from '../sarifParser';
import { SAMPLE_REPORTS } from '../../data/sampleReports';
import { muteStorage } from '../muteStorage';

describe('SARIF Parser & Normalizer', () => {
  beforeEach(() => {
    // Clear localStorage mockup
    localStorage.clear();
  });

  it('correctly parses sample benchmark matching Image 1', () => {
    const sample = SAMPLE_REPORTS[0];
    const report = parseSarifJson(sample.data, sample.filename);

    expect(report.fileName).toBe('sarif_viewer_test_sample.sarif');
    expect(report.runsCount).toBe(2);
    expect(report.totalFindings).toBe(7);
    expect(report.errorCount).toBe(1); // SEC001 overridden by CRITICAL tag
    expect(report.warningCount).toBe(3);
    expect(report.noteCount).toBe(2);
    expect(report.noneCount).toBe(1);
    expect(report.mutedCount).toBe(0);

    // Finding 1 checks
    const f1 = report.findings[0];
    expect(f1.ruleId).toBe('SEC001');
    expect(f1.originalLevel).toBe('warning');
    expect(f1.effectiveLevel).toBe('error');
    expect(f1.isLevelOverridden).toBe(true);
    expect(f1.filePath).toBe('src/ConfigService.cs');
    expect(f1.line).toBe(42);

    // Finding 3 checks (STYLE101)
    const f3 = report.findings[2];
    expect(f3.ruleId).toBe('STYLE101');
    expect(f3.ruleName).toBe('UnusedVariable');
    expect(f3.effectiveLevel).toBe('note');
    expect(f3.filePath).toBe('src/ReportBuilder.cs');
    expect(f3.line).toBe(88);
  });

  it('correctly extracts Application Details matching Image 3', () => {
    const sample = SAMPLE_REPORTS[0];
    const report = parseSarifJson(sample.data, sample.filename);

    expect(report.globalMetadata.businessCriticality).toBe('Mission-critical');
    expect(report.globalMetadata.language).toBe('Java 17');
    expect(report.globalMetadata.framework).toBe('Spring Framework 3');
    expect(report.globalMetadata.team).toBe('Leslie Hills');
    expect(report.globalMetadata.businessDomain).toBe('Strategy & Governance / Risk');
    expect(report.globalMetadata.lifecycle).toBe('Obsolete');
  });

  it('reflects muted findings in counts and finding flags', () => {
    const sample = SAMPLE_REPORTS[0];
    // Pre-mute the first finding
    const reportInitial = parseSarifJson(sample.data, sample.filename);
    const targetFinding = reportInitial.findings[0];

    muteStorage.mute({
      id: targetFinding.id,
      ruleId: targetFinding.ruleId,
      filePath: targetFinding.filePath,
      line: targetFinding.line ?? undefined,
      reason: 'False Positive',
      justification: 'Mock key used in unit test harness',
      mutedAt: new Date().toISOString(),
    });

    const reportAfterMute = parseSarifJson(sample.data, sample.filename);
    expect(reportAfterMute.mutedCount).toBe(1);
    expect(reportAfterMute.findings[0].isMuted).toBe(true);
    expect(reportAfterMute.findings[0].muteRecord?.reason).toBe('False Positive');
  });

  it('deduplicates tags and omits duplicate tags', () => {
    const sarifWithDuplicateTags: any = {
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'ToolWithDuplicateTags',
              rules: [
                {
                  id: 'DUP001',
                  properties: {
                    tags: ['security', 'cwe-89', 'SECURITY', 'database'],
                  },
                },
              ],
            },
          },
          results: [
            {
              ruleId: 'DUP001',
              message: { text: 'Duplicate tags test' },
              properties: {
                tags: ['cwe-89', 'custom-tag', 'security', 'custom-tag'],
              },
            },
          ],
        },
      ],
    };

    const report = parseSarifJson(sarifWithDuplicateTags, 'dup.sarif');
    const finding = report.findings[0];
    // Check that tags are unique
    const lowerTags = finding.tags.map((t) => t.toLowerCase());
    const uniqueLowerTags = Array.from(new Set(lowerTags));
    expect(finding.tags.length).toBe(uniqueLowerTags.length);
    expect(finding.tags).toEqual(['cwe-89', 'custom-tag', 'security', 'database']);
  });
});

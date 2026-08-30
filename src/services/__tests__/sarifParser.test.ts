import { describe, it, expect, beforeEach } from 'vitest';
import { parseSarifJson } from '../sarifParser';
import { SAMPLE_REPORTS } from '../../data/sampleReports';
import { muteStorage } from '../muteStorage';

describe('SARIF Parser & Normalizer', () => {
  beforeEach(() => {
    // Clear localStorage mockup
    localStorage.clear();
  });

  it('correctly parses CodeQL sample with dataflow codeFlows and fixes', () => {
    const sample = SAMPLE_REPORTS[0]; // CodeQL Taint & Dataflow Stepper
    const report = parseSarifJson(sample.data, sample.filename);

    expect(report.fileName).toBe('codeql_taint_dataflow_sqli.sarif');
    expect(report.runsCount).toBe(1);
    expect(report.totalFindings).toBe(2);
    expect(report.errorCount).toBe(1);
    expect(report.warningCount).toBe(1);

    // Finding 1 checks (SQL injection with codeFlows & fixes)
    const f1 = report.findings[0];
    expect(f1.ruleId).toBe('java/sql-injection');
    expect(f1.effectiveLevel).toBe('error');
    expect(f1.filePath).toBe('src/main/java/com/corp/payments/repository/AccountRepository.java');
    expect(f1.line).toBe(112);

    // Verify Taxonomies
    expect(f1.taxonomies).toBeDefined();
    expect(f1.taxonomies?.length).toBeGreaterThanOrEqual(1);
    expect(f1.taxonomies?.some((t) => t.id === 'CWE-89')).toBe(true);

    // Verify CodeFlows & ThreadFlows
    expect(f1.codeFlows).toBeDefined();
    expect(f1.codeFlows?.[0].threadFlows[0].steps.length).toBe(4);
    const step1 = f1.codeFlows?.[0].threadFlows[0].steps[0];
    expect(step1?.step).toBe(1);
    expect(step1?.kinds).toContain('source');
    expect(step1?.state?.['rawAccountId']).toBeDefined();

    // Verify Fixes
    expect(f1.fixes).toBeDefined();
    expect(f1.fixes?.[0].artifactChanges[0].replacements[0].insertedContent).toContain('PreparedStatement');
  });

  it('correctly parses Semgrep sample with automated fixes & secondary locations', () => {
    const sample = SAMPLE_REPORTS[1]; // Semgrep Auto-Remediation
    const report = parseSarifJson(sample.data, sample.filename);

    expect(report.fileName).toBe('semgrep_autofix_remediation.sarif');
    expect(report.totalFindings).toBe(2);

    const f1 = report.findings[0];
    expect(f1.ruleId).toBe('python.lang.security.hardcoded-jwt-secret');
    expect(f1.effectiveLevel).toBe('error');
    expect(f1.fixes).toBeDefined();
    expect(f1.fixes?.[0].artifactChanges[0].replacements[0].insertedContent).toContain('os.environ');

    // Verify Related Locations
    expect(f1.relatedLocations).toBeDefined();
    expect(f1.relatedLocations?.length).toBe(1);
    expect(f1.relatedLocations?.[0].filePath).toBe('src/config/settings.py');
  });

  it('correctly parses OWASP ZAP DAST sample with webRequest & webResponse', () => {
    const sample = SAMPLE_REPORTS[2]; // OWASP ZAP DAST
    const report = parseSarifJson(sample.data, sample.filename);

    expect(report.fileName).toBe('owasp_zap_dast_report.sarif');
    expect(report.totalFindings).toBe(2);

    const f1 = report.findings[0];
    expect(f1.webRequest).toBeDefined();
    expect(f1.webRequest?.method).toBe('GET');
    expect(f1.webRequest?.headers?.['Host']).toBe('target-app.internal');

    expect(f1.webResponse).toBeDefined();
    expect(f1.webResponse?.statusCode).toBe(200);
    expect(f1.webResponse?.body).toContain('<script>alert(document.domain)</script>');
  });

  it('correctly parses In-SARIF Suppressions and tool invocations', () => {
    const sample = SAMPLE_REPORTS[3]; // Multi-tool compliance
    const report = parseSarifJson(sample.data, sample.filename);

    expect(report.fileName).toBe('multi_tool_compliance_audit.sarif');
    expect(report.runsCount).toBe(2);
    expect(report.totalFindings).toBe(2);

    const f1 = report.findings[0];
    expect(f1.isMuted).toBe(true); // Suppressed by in-SARIF suppression
    expect(f1.inSarifSuppressions).toBeDefined();
    expect(f1.inSarifSuppressions?.[0].status).toBe('accepted');
    expect(f1.inSarifSuppressions?.[0].justification).toContain('Rate limiting');
  });

  it('reflects muted findings in counts and finding flags from browser storage', () => {
    const sample = SAMPLE_REPORTS[0];
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

    const reportAfterMute = parseSarifJson(sample.data, sample.filename, muteStorage.getAll());
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
    const lowerTags = finding.tags.map((t) => t.toLowerCase());
    const uniqueLowerTags = Array.from(new Set(lowerTags));
    expect(finding.tags).toHaveLength(uniqueLowerTags.length);
    expect(finding.tags).toEqual(['cwe-89', 'custom-tag', 'security', 'database']);
  });
});

import Papa from 'papaparse';
import { NormalizedFinding, ParsedSarifReport, SarifRunSummary, ApplicationMetadata } from '../types/viewer';
import { formatVersion } from '../utils/formatters';

/**
 * Downloads a file to the user's browser securely with shift-left privacy (no server involved).
 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Maps a NormalizedFinding into a flat CSV record dictionary.
 */
function mapFindingToCsvRow(f: NormalizedFinding): Record<string, string | number> {
  const dataflowStepsCount = f.codeFlows
    ? f.codeFlows.reduce((acc, cf) => acc + cf.threadFlows.reduce((tAcc, tf) => tAcc + tf.steps.length, 0), 0)
    : 0;

  const muteReason = f.muteRecord?.reason || (f.inSarifSuppressions?.[0]?.justification ? `In-SARIF: ${f.inSarifSuppressions[0].kind}` : '');

  return {
    'Rule ID': f.ruleId,
    'Rule Name': f.ruleName || '',
    'Effective Level': f.effectiveLevel.toUpperCase(),
    'Original Level': f.originalLevel.toUpperCase(),
    'Overridden By Tag': f.isLevelOverridden ? (f.overrideTag || 'Yes') : 'No',
    'Message': f.message,
    'File Path': f.filePath,
    'Line': f.line ?? '',
    'Column': f.column ?? '',
    'Tags': f.tags.join('; '),
    'Taxonomies': f.taxonomies ? f.taxonomies.map((t) => t.id).join('; ') : '',
    'Dataflow Steps': dataflowStepsCount,
    'Automated Fixes': f.fixes ? f.fixes.length : 0,
    'Tool': f.toolName + (f.toolVersion ? ` ${formatVersion(f.toolVersion)}` : ''),
    'Status': f.isMuted ? 'MUTED' : 'ACTIVE',
    'Mute Reason': muteReason,
    'Mute Justification': f.muteRecord?.justification || '',
    'Muted At': f.muteRecord?.mutedAt || '',
  };
}

/**
 * Builds a valid SARIF run object with preserved results and external suppression annotations.
 */
function buildSarifRunExport(runSummary: SarifRunSummary, findingsToExport: NormalizedFinding[]) {
  const runFindings = findingsToExport.filter((f) => f.runIndex === runSummary.runIndex);

  return {
    tool: {
      driver: {
        name: runSummary.toolName,
        version: runSummary.toolVersion,
        informationUri: runSummary.toolInformationUri,
      },
    },
    properties: runSummary.properties,
    results: runFindings.map((f) => {
      const res = { ...f.rawResult };
      if (f.isMuted && f.muteRecord) {
        res.suppressions = [
          ...(res.suppressions || []),
          {
            kind: 'external',
            status: 'accepted',
            justification: `${f.muteRecord.reason}: ${f.muteRecord.justification || ''}`.trim(),
          },
        ];
      }
      return res;
    }),
  };
}

/**
 * Builds Markdown summary table for findings.
 */
function buildMarkdownSummaryMetrics(findings: NormalizedFinding[]): string {
  const errors = findings.filter((f) => f.effectiveLevel === 'error');
  const warnings = findings.filter((f) => f.effectiveLevel === 'warning');
  const notes = findings.filter((f) => f.effectiveLevel === 'note');
  const none = findings.filter((f) => f.effectiveLevel === 'none');
  const muted = findings.filter((f) => f.isMuted);

  return `## Summary Metrics\n\n` +
    `| Severity | Count |\n` +
    `| :--- | :--- |\n` +
    `| 🔴 **Error / Critical** | ${errors.length} |\n` +
    `| 🟡 **Warning** | ${warnings.length} |\n` +
    `| 🔵 **Note** | ${notes.length} |\n` +
    `| ⚪ **None / Info** | ${none.length} |\n` +
    `| 🔇 **Muted** | ${muted.length} |\n\n`;
}

/**
 * Builds Markdown application metadata section.
 */
function buildMarkdownApplicationDetails(metadata: ApplicationMetadata): string {
  if (!metadata.businessCriticality) return '';

  let md = `## Application Details\n\n`;
  md += `- **Business Criticality**: ${metadata.businessCriticality}\n`;
  if (metadata.language) md += `- **Language**: ${metadata.language}\n`;
  if (metadata.framework) md += `- **Framework**: ${metadata.framework}\n`;
  if (metadata.team) md += `- **Team**: ${metadata.team}\n`;
  if (metadata.businessDomain) md += `- **Business Domain**: ${metadata.businessDomain}\n\n`;
  return md;
}

/**
 * Formats a single finding as a Markdown section.
 */
function buildMarkdownFindingEntry(f: NormalizedFinding, index: number): string {
  const levelUpper = f.effectiveLevel.toUpperCase();
  const title = f.ruleName || f.message.substring(0, 60);
  const locationSuffix = f.line ? `:${f.line}` : '';
  const toolVersionStr = f.toolVersion ? ` ${formatVersion(f.toolVersion)}` : '';

  let md = `### ${index + 1}. [${levelUpper}] ${f.ruleId}: ${title}\n\n`;
  md += `- **Location**: \`${f.filePath}${locationSuffix}\`\n`;
  md += `- **Tool**: ${f.toolName}${toolVersionStr}\n`;

  if (f.taxonomies && f.taxonomies.length > 0) {
    const taxList = f.taxonomies.map((t) => `\`${t.id}\``).join(', ');
    md += `- **Standards**: ${taxList}\n`;
  }
  if (f.tags.length > 0) {
    md += `- **Tags**: \`${f.tags.join('`, `')}\`\n`;
  }
  if (f.isMuted) {
    const muteReason = f.muteRecord?.reason || 'Suppressed';
    md += `- **Mute Status**: 🔇 Muted (${muteReason})\n`;
  }

  if (f.codeFlows && f.codeFlows.length > 0) {
    const stepCount = f.codeFlows[0].threadFlows[0]?.steps.length || 0;
    md += `- **Dataflow Trace**: ⚡ ${stepCount} step(s) recorded\n`;
  }
  if (f.fixes && f.fixes.length > 0) {
    md += `- **Automated Fix**: 🔧 ${f.fixes.length} remediation patch(es) available\n`;
  }

  md += `\n**Message**:\n> ${f.message.replaceAll('\n', '\n> ')}\n\n`;
  if (f.ruleDescription) {
    md += `**Rule Description**:\n${f.ruleDescription}\n\n`;
  }
  md += `---\n\n`;
  return md;
}

export const exportService = {
  /**
   * Export findings to CSV format.
   */
  exportToCsv(findings: NormalizedFinding[], reportName: string = 'sarif-findings'): void {
    const csvData = findings.map(mapFindingToCsvRow);
    const csvString = Papa.unparse(csvData);
    const cleanName = reportName.replace(/\.[^/.]+$/, '');
    triggerDownload(csvString, `${cleanName}-findings.csv`, 'text/csv;charset=utf-8;');
  },

  /**
   * Export findings as a valid SARIF 2.1.0 document.
   */
  exportToSarif(report: ParsedSarifReport, findingsToExport: NormalizedFinding[]): void {
    const sarifLog = {
      $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: report.runs.map((run) => buildSarifRunExport(run, findingsToExport)),
    };

    const cleanName = report.fileName.replace(/\.[^/.]+$/, '');
    triggerDownload(JSON.stringify(sarifLog, null, 2), `${cleanName}-filtered.sarif`, 'application/json');
  },

  /**
   * Export Markdown Summary Security Report.
   */
  exportToMarkdown(report: ParsedSarifReport, findings: NormalizedFinding[]): void {
    const muted = findings.filter((f) => f.isMuted);

    let md = `# Static Security Analysis Report\n\n`;
    md += `**Report File**: \`${report.fileName}\`  \n`;
    md += `**Generated**: ${new Date().toUTCString()}  \n`;
    md += `**Total Analyzed Findings**: ${findings.length} (${muted.length} muted)\n\n`;

    md += buildMarkdownSummaryMetrics(findings);
    md += buildMarkdownApplicationDetails(report.globalMetadata);

    md += `## Findings List\n\n`;
    findings.forEach((f, idx) => {
      md += buildMarkdownFindingEntry(f, idx);
    });

    const cleanName = report.fileName.replace(/\.[^/.]+$/, '');
    triggerDownload(md, `${cleanName}-report.md`, 'text/markdown;charset=utf-8;');
  },
};

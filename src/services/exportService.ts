import Papa from 'papaparse';
import { NormalizedFinding, ParsedSarifReport } from '../types/viewer';

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
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export const exportService = {
  /**
   * Export findings to CSV format.
   */
  exportToCsv(findings: NormalizedFinding[], reportName: string = 'sarif-findings'): void {
    const csvData = findings.map((f) => ({
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
      'Dataflow Steps': f.codeFlows ? f.codeFlows.reduce((acc, cf) => acc + cf.threadFlows.reduce((tAcc, tf) => tAcc + tf.steps.length, 0), 0) : 0,
      'Automated Fixes': f.fixes ? f.fixes.length : 0,
      'Tool': f.toolName + (f.toolVersion ? ` ${f.toolVersion}` : ''),
      'Status': f.isMuted ? 'MUTED' : 'ACTIVE',
      'Mute Reason': f.muteRecord?.reason || (f.inSarifSuppressions?.[0]?.justification ? `In-SARIF: ${f.inSarifSuppressions[0].kind}` : ''),
      'Mute Justification': f.muteRecord?.justification || '',
      'Muted At': f.muteRecord?.mutedAt || '',
    }));

    const csvString = Papa.unparse(csvData);
    const cleanName = reportName.replace(/\.[^/.]+$/, '');
    triggerDownload(csvString, `${cleanName}-findings.csv`, 'text/csv;charset=utf-8;');
  },

  /**
   * Export findings as a valid SARIF 2.1.0 document (including suppression records for muted items).
   */
  exportToSarif(report: ParsedSarifReport, findingsToExport: NormalizedFinding[]): void {
    const sarifLog = {
      $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/schemas/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: report.runs.map((runSummary) => {
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
      }),
    };

    const cleanName = report.fileName.replace(/\.[^/.]+$/, '');
    triggerDownload(JSON.stringify(sarifLog, null, 2), `${cleanName}-filtered.sarif`, 'application/json');
  },

  /**
   * Export Markdown Summary Security Report.
   */
  exportToMarkdown(report: ParsedSarifReport, findings: NormalizedFinding[]): void {
    const errors = findings.filter((f) => f.effectiveLevel === 'error');
    const warnings = findings.filter((f) => f.effectiveLevel === 'warning');
    const notes = findings.filter((f) => f.effectiveLevel === 'note');
    const none = findings.filter((f) => f.effectiveLevel === 'none');
    const muted = findings.filter((f) => f.isMuted);

    let md = `# Static Security Analysis Report\n\n`;
    md += `**Report File**: \`${report.fileName}\`  \n`;
    md += `**Generated**: ${new Date().toUTCString()}  \n`;
    md += `**Total Analyzed Findings**: ${findings.length} (${muted.length} muted)\n\n`;

    md += `## Summary Metrics\n\n`;
    md += `| Severity | Count |\n`;
    md += `| :--- | :--- |\n`;
    md += `| 🔴 **Error / Critical** | ${errors.length} |\n`;
    md += `| 🟡 **Warning** | ${warnings.length} |\n`;
    md += `| 🔵 **Note** | ${notes.length} |\n`;
    md += `| ⚪ **None / Info** | ${none.length} |\n`;
    md += `| 🔇 **Muted** | ${muted.length} |\n\n`;

    if (report.globalMetadata.businessCriticality) {
      md += `## Application Details\n\n`;
      md += `- **Business Criticality**: ${report.globalMetadata.businessCriticality}\n`;
      if (report.globalMetadata.language) md += `- **Language**: ${report.globalMetadata.language}\n`;
      if (report.globalMetadata.framework) md += `- **Framework**: ${report.globalMetadata.framework}\n`;
      if (report.globalMetadata.team) md += `- **Team**: ${report.globalMetadata.team}\n`;
      if (report.globalMetadata.businessDomain) md += `- **Business Domain**: ${report.globalMetadata.businessDomain}\n\n`;
    }

    md += `## Findings List\n\n`;
    findings.forEach((f, idx) => {
      md += `### ${idx + 1}. [${f.effectiveLevel.toUpperCase()}] ${f.ruleId}: ${f.ruleName || f.message.substring(0, 60)}\n\n`;
      md += `- **Location**: \`${f.filePath}${f.line ? `:${f.line}` : ''}\`\n`;
      md += `- **Tool**: ${f.toolName} ${f.toolVersion || ''}\n`;
      if (f.taxonomies && f.taxonomies.length > 0) {
        md += `- **Standards**: ${f.taxonomies.map((t) => `\`${t.id}\``).join(', ')}\n`;
      }
      if (f.tags.length > 0) md += `- **Tags**: \`${f.tags.join('`, `')}\`\n`;
      if (f.isMuted) md += `- **Mute Status**: 🔇 Muted (${f.muteRecord?.reason || 'Suppressed'})\n`;
      if (f.codeFlows && f.codeFlows.length > 0) {
        const stepCount = f.codeFlows[0].threadFlows[0]?.steps.length || 0;
        md += `- **Dataflow Trace**: ⚡ ${stepCount} step(s) recorded\n`;
      }
      if (f.fixes && f.fixes.length > 0) {
        md += `- **Automated Fix**: 🔧 ${f.fixes.length} remediation patch(es) available\n`;
      }
      md += `\n**Message**:\n> ${f.message.replace(/\n/g, '\n> ')}\n\n`;
      if (f.ruleDescription) {
        md += `**Rule Description**:\n${f.ruleDescription}\n\n`;
      }
      md += `---\n\n`;
    });

    const cleanName = report.fileName.replace(/\.[^/.]+$/, '');
    triggerDownload(md, `${cleanName}-report.md`, 'text/markdown;charset=utf-8;');
  },
};

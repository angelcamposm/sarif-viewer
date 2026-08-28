import { SarifLog, Run, Result, ReportingDescriptor } from '../types/sarif';
import {
  ParsedSarifReport,
  NormalizedFinding,
  SarifRunSummary,
  SarifLevel,
  MuteRecord,
} from '../types/viewer';
import { resolveEffectiveLevel, normalizeSarifLevel } from './criticalityEngine';
import { extractApplicationMetadata } from './metadataExtractor';
import { muteStorage } from './muteStorage';
import { generateDeterministicHash } from '../utils/hash';

/**
 * Normalizes and parses a SARIF 2.1.0 JSON object into structured, indexed viewer models.
 */
export function parseSarifJson(
  sarif: SarifLog,
  fileName: string = 'report.sarif',
  customMutedRecords?: Record<string, MuteRecord>
): ParsedSarifReport {
  if (!sarif || typeof sarif !== 'object') {
    throw new Error('Invalid SARIF file: content must be a valid JSON object.');
  }

  const runs = Array.isArray(sarif.runs) ? sarif.runs : [];
  const allFindings: NormalizedFinding[] = [];
  const runSummaries: SarifRunSummary[] = [];

  const ruleCountMap = new Map<string, { id: string; name?: string; count: number }>();
  const tagCountMap = new Map<string, number>();

  const mutedRecords = customMutedRecords || muteStorage.getAll();

  runs.forEach((run: Run, runIndex: number) => {
    const driver = run.tool?.driver || { name: 'Static Analysis Tool' };
    const driverRules: ReportingDescriptor[] = Array.isArray(driver.rules) ? driver.rules : [];
    
    // Map rule IDs and indices to rules
    const ruleMapById = new Map<string, ReportingDescriptor>();
    const ruleMapByIndex = new Map<number, ReportingDescriptor>();

    driverRules.forEach((rule, idx) => {
      if (rule.id) ruleMapById.set(rule.id, rule);
      ruleMapByIndex.set(idx, rule);
    });

    // Also check tool extensions for rules
    if (Array.isArray(run.tool?.extensions)) {
      run.tool.extensions.forEach((ext) => {
        if (Array.isArray(ext.rules)) {
          ext.rules.forEach((rule) => {
            if (rule.id) ruleMapById.set(rule.id, rule);
          });
        }
      });
    }

    const runResults = Array.isArray(run.results) ? run.results : [];
    const runMetadata = extractApplicationMetadata(run, sarif.properties);

    runResults.forEach((result: Result, resultIndex: number) => {
      // Find associated rule
      let matchedRule: ReportingDescriptor | undefined;
      if (result.ruleId && ruleMapById.has(result.ruleId)) {
        matchedRule = ruleMapById.get(result.ruleId);
      } else if (result.ruleIndex !== undefined && ruleMapByIndex.has(result.ruleIndex)) {
        matchedRule = ruleMapByIndex.get(result.ruleIndex);
      }

      const ruleId = result.ruleId || matchedRule?.id || `RULE-${runIndex + 1}-${resultIndex + 1}`;
      const ruleName = matchedRule?.name || matchedRule?.shortDescription?.text;
      const ruleDescription = matchedRule?.shortDescription?.text || matchedRule?.fullDescription?.text;
      const ruleFullDescription = matchedRule?.fullDescription?.text || matchedRule?.shortDescription?.text;
      const ruleHelpUri = matchedRule?.helpUri;

      // Extract message
      let messageText = result.message?.text || '';
      const messageMarkdown = result.message?.markdown;

      // If message uses placeholders or rule message string
      if (!messageText && result.message?.id && matchedRule?.messageStrings?.[result.message.id]) {
        messageText = matchedRule.messageStrings[result.message.id].text;
      }
      if (!messageText) {
        messageText = ruleDescription || 'No message provided by analyzer';
      }

      // Location details
      const primaryLoc = result.locations?.[0];
      const physLoc = primaryLoc?.physicalLocation;
      const rawUri = physLoc?.artifactLocation?.uri || '';
      const filePath = rawUri || (result.analysisTarget?.uri || 'Not provided');
      const fileNameOnly = filePath !== 'Not provided' ? filePath.split(/[/\\]/).pop() || filePath : 'Not provided';
      const line = physLoc?.region?.startLine ?? null;
      const column = physLoc?.region?.startColumn ?? null;
      const endLine = physLoc?.region?.endLine ?? null;
      const endColumn = physLoc?.region?.endColumn ?? null;
      const codeSnippet = physLoc?.region?.snippet?.text;

      // Tags extraction from result properties, rule properties, taxa, etc.
      const resultTags: string[] = [];
      if (Array.isArray(result.properties?.tags)) {
        result.properties.tags.forEach((t) => typeof t === 'string' && resultTags.push(t.trim()));
      }
      if (typeof result.properties?.tags === 'string') {
        result.properties.tags.split(',').forEach((t) => resultTags.push(t.trim()));
      }
      if (result.properties?.criticality) {
        resultTags.push(String(result.properties.criticality));
      }

      const ruleTags: string[] = [];
      if (Array.isArray(matchedRule?.properties?.tags)) {
        matchedRule.properties.tags.forEach((t) => typeof t === 'string' && ruleTags.push(t.trim()));
      }
      if (matchedRule?.properties?.category) {
        ruleTags.push(String(matchedRule.properties.category));
      }

      const allTagsList = [...resultTags, ...ruleTags];
      const seenTagKeys = new Set<string>();
      const tags: string[] = [];
      for (const t of allTagsList) {
        const trimmed = typeof t === 'string' ? t.trim() : String(t);
        if (!trimmed) continue;
        const lowerKey = trimmed.toLowerCase();
        if (!seenTagKeys.has(lowerKey)) {
          seenTagKeys.add(lowerKey);
          tags.push(trimmed);
        }
      }

      // Determine baseline SARIF level
      const baselineLevel: SarifLevel = normalizeSarifLevel(
        result.level || matchedRule?.defaultConfiguration?.level
      );

      // Apply Criticality Tag Override Engine (Result-level tags take precedence over Rule-level tags)
      let overrideResult = resolveEffectiveLevel(baselineLevel, resultTags);
      if (!overrideResult.hasCriticalityTag && ruleTags.length > 0) {
        overrideResult = resolveEffectiveLevel(baselineLevel, ruleTags);
      }
      const { effectiveLevel, isOverridden, overrideTag, overrideReason } = overrideResult;

      // Stable deterministic fingerprint for cross-scan muting
      const fingerprint =
        result.correlationGuid ||
        result.guid ||
        result.fingerprints?.guid ||
        result.partialFingerprints?.primaryLocationLineHash ||
        generateDeterministicHash([ruleId, filePath, line, column, messageText.substring(0, 40)]);

      // Unique finding ID per report file and result index to guarantee zero React key collisions across records
      const findingId = `${fileName}#r${runIndex}_res${resultIndex}_${fingerprint}`;

      const muteRec = mutedRecords[findingId] || mutedRecords[fingerprint];
      const isMuted = !!muteRec;

      const normalized: NormalizedFinding = {
        id: findingId,
        runIndex,
        resultIndex,
        toolName: driver.name || 'Static Analysis Tool',
        toolVersion: driver.version || driver.semanticVersion,
        ruleId,
        ruleIndex: result.ruleIndex,
        ruleName,
        ruleDescription,
        ruleFullDescription,
        ruleHelpUri,
        message: messageText,
        messageMarkdown,
        originalLevel: baselineLevel,
        effectiveLevel,
        isLevelOverridden: isOverridden,
        overrideTag,
        overrideReason,
        filePath,
        fileName: fileNameOnly,
        line,
        column,
        endLine,
        endColumn,
        codeSnippet,
        tags,
        properties: {
          ...(matchedRule?.properties || {}),
          ...(result.properties || {}),
        },
        isMuted,
        muteRecord: muteRec,
        rawResult: result,
        rawRule: matchedRule,
      };

      allFindings.push(normalized);

      // Aggregate rule count
      const existingRule = ruleCountMap.get(ruleId) || { id: ruleId, name: ruleName, count: 0 };
      existingRule.count++;
      ruleCountMap.set(ruleId, existingRule);

      // Aggregate tags count
      tags.forEach((tag) => {
        tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
      });
    });

    runSummaries.push({
      runIndex,
      toolName: driver.name || 'Static Analysis Tool',
      toolVersion: driver.version || driver.semanticVersion,
      toolInformationUri: driver.informationUri,
      rulesCount: driverRules.length,
      findingsCount: runResults.length,
      invocations: run.invocations,
      metadata: runMetadata,
      properties: run.properties,
    });
  });

  // Calculate counts based on effective levels
  let errorCount = 0;
  let warningCount = 0;
  let noteCount = 0;
  let noneCount = 0;
  let mutedCount = 0;

  allFindings.forEach((f) => {
    if (f.isMuted) mutedCount++;
    if (f.effectiveLevel === 'error') errorCount++;
    else if (f.effectiveLevel === 'warning') warningCount++;
    else if (f.effectiveLevel === 'note') noteCount++;
    else if (f.effectiveLevel === 'none') noneCount++;
  });

  const allRules = Array.from(ruleCountMap.values()).sort((a, b) => b.count - a.count);
  const allTags = Array.from(tagCountMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const globalMetadata = extractApplicationMetadata(runs[0], sarif.properties);

  return {
    fileName,
    schemaVersion: sarif.version || '2.1.0',
    totalFindings: allFindings.length,
    errorCount,
    warningCount,
    noteCount,
    noneCount,
    runsCount: runs.length,
    mutedCount,
    runs: runSummaries,
    findings: allFindings,
    allRules,
    allTags,
    allLevels: ['error', 'warning', 'note', 'none'],
    globalMetadata,
  };
}

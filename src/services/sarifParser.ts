import {
  SarifLog,
  Run,
  Result,
  ReportingDescriptor,
  CodeFlow,
  ThreadFlow,
  ThreadFlowLocation,
  Fix,
  Location,
  Suppression,
} from '../types/sarif';
import {
  ParsedSarifReport,
  NormalizedFinding,
  SarifRunSummary,
  SarifLevel,
  MuteRecord,
  NormalizedCodeFlow,
  NormalizedCodeFlowStep,
  NormalizedFix,
  NormalizedRelatedLocation,
  NormalizedInSarifSuppression,
  NormalizedWebRequest,
  NormalizedWebResponse,
} from '../types/viewer';
import { resolveEffectiveLevel, normalizeSarifLevel } from './criticalityEngine';
import { extractApplicationMetadata } from './metadataExtractor';
import { muteStorage } from './muteStorage';
import { generateDeterministicHash } from '../utils/hash';
import { resolveArtifactPath } from './uriResolver';
import { resolveTaxonomies } from './taxonomyResolver';
import { extractSnippetFromArtifacts } from './snippetExtractor';

/**
 * Normalizes and parses a SARIF 2.1.0 JSON object into rich, indexed viewer models.
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
  const taxonomyCountMap = new Map<string, { taxonomyName: string; id: string; count: number; name?: string }>();

  const mutedRecords = customMutedRecords || muteStorage.getAll();

  runs.forEach((run: Run, runIndex: number) => {
    const driver = run.tool?.driver || { name: 'Static Analysis Tool' };
    const driverRules: ReportingDescriptor[] = Array.isArray(driver.rules) ? driver.rules : [];
    const artifacts = Array.isArray(run.artifacts) ? run.artifacts : [];
    const taxonomiesCatalog = Array.isArray(run.taxonomies) ? run.taxonomies : [];
    
    // Map rule IDs and indices to rules
    const ruleMapById = new Map<string, ReportingDescriptor>();
    const ruleMapByIndex = new Map<number, ReportingDescriptor>();

    driverRules.forEach((rule, idx) => {
      if (rule.id) ruleMapById.set(rule.id, rule);
      ruleMapByIndex.set(idx, rule);
    });

    // Check tool extensions for additional rules
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

      if (!messageText && result.message?.id && matchedRule?.messageStrings?.[result.message.id]) {
        messageText = matchedRule.messageStrings[result.message.id].text;
      }
      if (!messageText) {
        messageText = ruleDescription || 'No message provided by analyzer';
      }

      // Location details with URI resolution
      const primaryLoc = result.locations?.[0];
      const physLoc = primaryLoc?.physicalLocation;
      const { filePath, fileName: fileNameOnly } = resolveArtifactPath(
        physLoc?.artifactLocation,
        run.originalUriBaseIds,
        result.analysisTarget?.uri
      );

      const line = physLoc?.region?.startLine ?? null;
      const column = physLoc?.region?.startColumn ?? null;
      const endLine = physLoc?.region?.endLine ?? null;
      const endColumn = physLoc?.region?.endColumn ?? null;

      // Code snippet extraction with fallback to run.artifacts
      let codeSnippet = physLoc?.region?.snippet?.text;
      if (!codeSnippet && physLoc?.region) {
        codeSnippet = extractSnippetFromArtifacts(
          artifacts,
          physLoc.artifactLocation?.index,
          filePath,
          physLoc.region
        );
      }

      // Logical locations (e.g. Class / Method)
      const logicalLocations: string[] = [];
      if (Array.isArray(primaryLoc?.logicalLocations)) {
        primaryLoc.logicalLocations.forEach((ll) => {
          const name = ll.fullyQualifiedName || ll.name;
          if (name) {
            logicalLocations.push(ll.kind ? `${ll.kind}: ${name}` : name);
          }
        });
      }

      // Tags extraction
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

      // Taxonomies Resolution (CWE, OWASP, NIST)
      const taxonomies = resolveTaxonomies(
        result.taxa,
        taxonomiesCatalog,
        matchedRule?.relationships || [],
        tags
      );

      // Determine baseline SARIF level
      const baselineLevel: SarifLevel = normalizeSarifLevel(
        result.level || matchedRule?.defaultConfiguration?.level
      );

      // Criticality Tag Override Engine
      let overrideResult = resolveEffectiveLevel(baselineLevel, resultTags);
      if (!overrideResult.hasCriticalityTag && ruleTags.length > 0) {
        overrideResult = resolveEffectiveLevel(baselineLevel, ruleTags);
      }
      const { effectiveLevel, isOverridden, overrideTag, overrideReason } = overrideResult;

      // Deterministic fingerprint for cross-scan muting
      const fingerprint =
        result.correlationGuid ||
        result.guid ||
        result.fingerprints?.guid ||
        result.partialFingerprints?.primaryLocationLineHash ||
        generateDeterministicHash([ruleId, filePath, line, column, messageText.substring(0, 40)]);

      // Unique finding ID per report file and result index
      const findingId = `${fileName}#r${runIndex}_res${resultIndex}_${fingerprint}`;

      // In-SARIF Suppressions
      const inSarifSuppressions: NormalizedInSarifSuppression[] = [];
      if (Array.isArray(result.suppressions) && result.suppressions.length > 0) {
        result.suppressions.forEach((sup: Suppression) => {
          inSarifSuppressions.push({
            kind: sup.kind || 'inSource',
            status: sup.status || 'accepted',
            justification: sup.justification || sup.properties?.justification,
            location: sup.location?.physicalLocation?.artifactLocation?.uri,
          });
        });
      }

      const muteRec = mutedRecords[findingId] || mutedRecords[fingerprint];
      const isMuted = !!muteRec || inSarifSuppressions.some((s) => s.status === 'accepted');

      // Parse CodeFlows & ThreadFlows (Taint / Dataflow Analysis)
      let parsedCodeFlows: NormalizedCodeFlow[] | undefined;
      if (Array.isArray(result.codeFlows) && result.codeFlows.length > 0) {
        parsedCodeFlows = result.codeFlows.map((cf: CodeFlow) => {
          const threadFlows = (cf.threadFlows || []).map((tf: ThreadFlow) => {
            const steps: NormalizedCodeFlowStep[] = (tf.locations || []).map((tfl: ThreadFlowLocation, stepIdx: number) => {
              const loc = tfl.location?.physicalLocation;
              const stepPath = resolveArtifactPath(loc?.artifactLocation, run.originalUriBaseIds);
              
              let stepSnippet = loc?.region?.snippet?.text;
              if (!stepSnippet && loc?.region) {
                stepSnippet = extractSnippetFromArtifacts(artifacts, loc.artifactLocation?.index, stepPath.filePath, loc.region);
              }

              // Extract variable states at this step if available
              const stepState: Record<string, string> = {};
              if (tfl.properties?.state && typeof tfl.properties.state === 'object') {
                Object.entries(tfl.properties.state).forEach(([k, v]) => {
                  stepState[k] = String(v);
                });
              }

              return {
                step: tfl.step ?? stepIdx + 1,
                importance: tfl.importance || 'important',
                message: tfl.location?.message?.text || tfl.properties?.message,
                filePath: stepPath.filePath,
                fileName: stepPath.fileName,
                line: loc?.region?.startLine ?? null,
                column: loc?.region?.startColumn ?? null,
                endLine: loc?.region?.endLine ?? null,
                endColumn: loc?.region?.endColumn ?? null,
                codeSnippet: stepSnippet,
                kinds: tfl.kinds,
                executionOrder: tfl.executionOrder,
                state: Object.keys(stepState).length > 0 ? stepState : undefined,
                module: tfl.module,
              };
            });

            return {
              id: tf.id,
              message: tf.message?.text,
              steps,
            };
          });

          return {
            message: cf.message?.text,
            threadFlows,
          };
        });
      }

      // Parse Fixes & ArtifactChanges (Automated Code Remediation)
      let parsedFixes: NormalizedFix[] | undefined;
      if (Array.isArray(result.fixes) && result.fixes.length > 0) {
        parsedFixes = result.fixes.map((fx: Fix) => {
          const artifactChanges = (fx.artifactChanges || []).map((ac) => {
            const acPath = resolveArtifactPath(ac.artifactLocation, run.originalUriBaseIds);
            const replacements = (ac.replacements || []).map((rep) => ({
              deletedRegion: {
                startLine: rep.deletedRegion.startLine || 1,
                startColumn: rep.deletedRegion.startColumn,
                endLine: rep.deletedRegion.endLine || rep.deletedRegion.startLine || 1,
                endColumn: rep.deletedRegion.endColumn,
              },
              insertedContent: rep.insertedContent?.text,
            }));

            return {
              filePath: acPath.filePath,
              fileName: acPath.fileName,
              replacements,
            };
          });

          return {
            description: fx.description?.text,
            artifactChanges,
          };
        });
      }

      // Parse RelatedLocations (Secondary & Multi-site locations)
      let parsedRelatedLocations: NormalizedRelatedLocation[] | undefined;
      if (Array.isArray(result.relatedLocations) && result.relatedLocations.length > 0) {
        parsedRelatedLocations = result.relatedLocations.map((relLoc: Location) => {
          const relPath = resolveArtifactPath(relLoc.physicalLocation?.artifactLocation, run.originalUriBaseIds);
          let relSnippet = relLoc.physicalLocation?.region?.snippet?.text;
          if (!relSnippet && relLoc.physicalLocation?.region) {
            relSnippet = extractSnippetFromArtifacts(
              artifacts,
              relLoc.physicalLocation.artifactLocation?.index,
              relPath.filePath,
              relLoc.physicalLocation.region
            );
          }

          return {
            id: relLoc.id,
            message: relLoc.message?.text,
            filePath: relPath.filePath,
            fileName: relPath.fileName,
            line: relLoc.physicalLocation?.region?.startLine ?? null,
            column: relLoc.physicalLocation?.region?.startColumn ?? null,
            codeSnippet: relSnippet,
          };
        });
      }

      // Parse WebRequest & WebResponse (DAST / API Traffic)
      let parsedWebRequest: NormalizedWebRequest | undefined;
      if (result.webRequest) {
        const req = result.webRequest as any;
        parsedWebRequest = {
          method: req.method,
          target: req.target,
          protocol: req.protocol,
          version: req.version,
          headers: req.headers,
          parameters: req.parameters,
          body: typeof req.body === 'string' ? req.body : req.body?.text,
        };
      }

      let parsedWebResponse: NormalizedWebResponse | undefined;
      if (result.webResponse) {
        const res = result.webResponse as any;
        parsedWebResponse = {
          statusCode: res.statusCode,
          reasonPhrase: res.reasonPhrase,
          protocol: res.protocol,
          version: res.version,
          headers: res.headers,
          body: typeof res.body === 'string' ? res.body : res.body?.text,
          noResponseReceived: res.noResponseReceived,
        };
      }

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
        taxonomies,
        properties: {
          ...(matchedRule?.properties || {}),
          ...(result.properties || {}),
        },
        isMuted,
        muteRecord: muteRec,
        rawResult: result,
        rawRule: matchedRule,
        codeFlows: parsedCodeFlows,
        fixes: parsedFixes,
        relatedLocations: parsedRelatedLocations,
        inSarifSuppressions: inSarifSuppressions.length > 0 ? inSarifSuppressions : undefined,
        webRequest: parsedWebRequest,
        webResponse: parsedWebResponse,
        baselineState: result.baselineState,
        logicalLocations: logicalLocations.length > 0 ? logicalLocations : undefined,
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

      // Aggregate taxonomies count
      taxonomies.forEach((tax) => {
        const taxKey = `${tax.taxonomyName}:${tax.id}`;
        const existingTax = taxonomyCountMap.get(taxKey) || {
          taxonomyName: tax.taxonomyName,
          id: tax.id,
          count: 0,
          name: tax.name,
        };
        existingTax.count++;
        taxonomyCountMap.set(taxKey, existingTax);
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
  const allTaxonomies = Array.from(taxonomyCountMap.values()).sort((a, b) => b.count - a.count);

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
    allTaxonomies,
    allLevels: ['error', 'warning', 'note', 'none'],
    globalMetadata,
  };
}

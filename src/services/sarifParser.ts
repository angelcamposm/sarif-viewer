import {
  SarifLog,
  Run,
  Result,
  ReportingDescriptor,
  Location,
  CodeFlow,
  ThreadFlow,
  ThreadFlowLocation,
  Fix,
  Suppression,
  Artifact,
  ToolComponent,
  WebRequest,
  WebResponse,
  ArtifactChange,
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
import { generateDeterministicHash } from '../utils/hash';
import { resolveArtifactPath } from './uriResolver';
import { resolveTaxonomies } from './taxonomyResolver';
import { extractSnippetFromArtifacts } from './snippetExtractor';

interface RuleIndexes {
  ruleMapById: Map<string, ReportingDescriptor>;
  ruleMapByIndex: Map<number, ReportingDescriptor>;
}

/**
 * Builds indexing maps for tool driver and extension rules.
 */
function buildRuleIndexes(driverRules: ReportingDescriptor[], extensions?: ToolComponent[]): RuleIndexes {
  const ruleMapById = new Map<string, ReportingDescriptor>();
  const ruleMapByIndex = new Map<number, ReportingDescriptor>();

  driverRules.forEach((rule, idx) => {
    if (rule.id) ruleMapById.set(rule.id, rule);
    ruleMapByIndex.set(idx, rule);
  });

  if (Array.isArray(extensions)) {
    extensions.forEach((ext) => {
      if (Array.isArray(ext.rules)) {
        ext.rules.forEach((rule) => {
          if (rule.id) ruleMapById.set(rule.id, rule);
        });
      }
    });
  }

  return { ruleMapById, ruleMapByIndex };
}

/**
 * Resolves the rule descriptor and identifiers associated with a result.
 */
function resolveFindingRule(
  result: Result,
  indexes: RuleIndexes,
  runIndex: number,
  resultIndex: number
) {
  let matchedRule: ReportingDescriptor | undefined;
  if (result.ruleId && indexes.ruleMapById.has(result.ruleId)) {
    matchedRule = indexes.ruleMapById.get(result.ruleId);
  } else if (result.ruleIndex !== undefined && indexes.ruleMapByIndex.has(result.ruleIndex)) {
    matchedRule = indexes.ruleMapByIndex.get(result.ruleIndex);
  }

  const defaultRuleId = `RULE-${runIndex + 1}-${resultIndex + 1}`;
  const ruleId = result.ruleId || matchedRule?.id || defaultRuleId;
  const ruleName = matchedRule?.name || matchedRule?.shortDescription?.text;
  const ruleDescription = matchedRule?.shortDescription?.text || matchedRule?.fullDescription?.text;
  const ruleFullDescription = matchedRule?.fullDescription?.text || matchedRule?.shortDescription?.text;
  const ruleHelpUri = matchedRule?.helpUri;

  return { ruleId, matchedRule, ruleName, ruleDescription, ruleFullDescription, ruleHelpUri };
}

/**
 * Extracts plain-text and markdown messages for a finding.
 */
function extractFindingMessage(
  result: Result,
  matchedRule?: ReportingDescriptor,
  fallbackDescription?: string
) {
  let messageText = result.message?.text || '';
  const messageMarkdown = result.message?.markdown;

  if (!messageText && result.message?.id && matchedRule?.messageStrings?.[result.message.id]) {
    messageText = matchedRule.messageStrings[result.message.id].text;
  }
  if (!messageText) {
    messageText = fallbackDescription || 'No message provided by analyzer';
  }

  return { messageText, messageMarkdown };
}

/**
 * Extracts, cleans, and deduplicates tags from finding and rule properties.
 */
function extractFindingTags(result: Result, matchedRule?: ReportingDescriptor) {
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

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const t of [...resultTags, ...ruleTags]) {
    const trimmed = typeof t === 'string' ? t.trim() : String(t);
    if (!trimmed) continue;
    const lowerKey = trimmed.toLowerCase();
    if (!seen.has(lowerKey)) {
      seen.add(lowerKey);
      tags.push(trimmed);
    }
  }

  return { tags, resultTags, ruleTags };
}

/**
 * Extracts logical locations names (classes, methods).
 */
function extractLogicalLocations(locations?: Location[]): string[] {
  const primaryLoc = locations?.[0];
  const logicalLocations: string[] = [];
  if (Array.isArray(primaryLoc?.logicalLocations)) {
    primaryLoc.logicalLocations.forEach((ll) => {
      const name = ll.fullyQualifiedName || ll.name;
      if (name) {
        logicalLocations.push(ll.kind ? `${ll.kind}: ${name}` : name);
      }
    });
  }
  return logicalLocations;
}

/**
 * Extracts physical and logical location information with URI and snippet resolution.
 */
function extractFindingLocation(result: Result, run: Run, artifacts: Artifact[]) {
  const primaryLoc = result.locations?.[0];
  const physLoc = primaryLoc?.physicalLocation;
  const { filePath, fileName } = resolveArtifactPath(
    physLoc?.artifactLocation,
    run.originalUriBaseIds,
    result.analysisTarget?.uri
  );

  const region = physLoc?.region;
  const line = region?.startLine ?? null;
  const column = region?.startColumn ?? null;
  const endLine = region?.endLine ?? null;
  const endColumn = region?.endColumn ?? null;

  let codeSnippet = region?.snippet?.text;
  if (!codeSnippet && region) {
    codeSnippet = extractSnippetFromArtifacts(
      artifacts,
      physLoc?.artifactLocation?.index,
      filePath,
      region
    );
  }

  const logicalLocations = extractLogicalLocations(result.locations);

  return { filePath, fileName, line, column, endLine, endColumn, codeSnippet, logicalLocations };
}

/**
 * Maps a ThreadFlowLocation into a NormalizedCodeFlowStep.
 */
function mapThreadFlowLocationToStep(
  tfl: ThreadFlowLocation,
  stepIdx: number,
  run?: Run,
  artifacts?: Artifact[]
): NormalizedCodeFlowStep {
  const loc = tfl.location?.physicalLocation;
  const stepPath = resolveArtifactPath(loc?.artifactLocation, run?.originalUriBaseIds);

  let stepSnippet = loc?.region?.snippet?.text;
  if (!stepSnippet && loc?.region) {
    stepSnippet = extractSnippetFromArtifacts(artifacts, loc.artifactLocation?.index, stepPath.filePath, loc.region);
  }

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
}

/**
 * Maps a ThreadFlow into a normalized model.
 */
function mapThreadFlow(tf: ThreadFlow, run?: Run, artifacts?: Artifact[]) {
  const steps = (tf.locations || []).map((tfl, stepIdx) =>
    mapThreadFlowLocationToStep(tfl, stepIdx, run, artifacts)
  );

  return {
    id: tf.id,
    message: tf.message?.text,
    steps,
  };
}

/**
 * Parses CodeFlows and ThreadFlows execution steps for dataflow/taint tracking.
 */
function parseResultCodeFlows(
  codeFlows?: CodeFlow[],
  run?: Run,
  artifacts?: Artifact[]
): NormalizedCodeFlow[] | undefined {
  if (!Array.isArray(codeFlows) || codeFlows.length === 0) return undefined;

  return codeFlows.map((cf) => ({
    message: cf.message?.text,
    threadFlows: (cf.threadFlows || []).map((tf) => mapThreadFlow(tf, run, artifacts)),
  }));
}

/**
 * Maps an ArtifactChange into a normalized fix container.
 */
function mapArtifactChange(ac: ArtifactChange, run?: Run) {
  const acPath = resolveArtifactPath(ac.artifactLocation, run?.originalUriBaseIds);
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
}

/**
 * Parses automated code remediation fixes.
 */
function parseResultFixes(fixes?: Fix[], run?: Run): NormalizedFix[] | undefined {
  if (!Array.isArray(fixes) || fixes.length === 0) return undefined;

  return fixes.map((fx) => ({
    description: fx.description?.text,
    artifactChanges: (fx.artifactChanges || []).map((ac) => mapArtifactChange(ac, run)),
  }));
}

/**
 * Maps a secondary Location to a NormalizedRelatedLocation.
 */
function mapRelatedLocation(relLoc: Location, run?: Run, artifacts?: Artifact[]): NormalizedRelatedLocation {
  const relPath = resolveArtifactPath(relLoc.physicalLocation?.artifactLocation, run?.originalUriBaseIds);
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
}

/**
 * Parses secondary and multi-site locations.
 */
function parseResultRelatedLocations(
  relatedLocations?: Location[],
  run?: Run,
  artifacts?: Artifact[]
): NormalizedRelatedLocation[] | undefined {
  if (!Array.isArray(relatedLocations) || relatedLocations.length === 0) return undefined;
  return relatedLocations.map((relLoc) => mapRelatedLocation(relLoc, run, artifacts));
}

/**
 * Parses DAST WebRequest payload.
 */
function parseResultWebRequest(webRequest?: WebRequest): NormalizedWebRequest | undefined {
  if (!webRequest) return undefined;
  const req = webRequest as any;
  return {
    method: req.method,
    target: req.target,
    protocol: req.protocol,
    version: req.version,
    headers: req.headers,
    parameters: req.parameters,
    body: typeof req.body === 'string' ? req.body : req.body?.text,
  };
}

/**
 * Parses DAST WebResponse payload.
 */
function parseResultWebResponse(webResponse?: WebResponse): NormalizedWebResponse | undefined {
  if (!webResponse) return undefined;
  const res = webResponse as any;
  return {
    statusCode: res.statusCode,
    reasonPhrase: res.reasonPhrase,
    protocol: res.protocol,
    version: res.version,
    headers: res.headers,
    body: typeof res.body === 'string' ? res.body : res.body?.text,
    noResponseReceived: res.noResponseReceived,
  };
}

/**
 * Parses in-SARIF tool suppression objects.
 */
function parseResultSuppressions(suppressions?: Suppression[]): NormalizedInSarifSuppression[] {
  if (!Array.isArray(suppressions) || suppressions.length === 0) return [];

  return suppressions.map((sup) => ({
    kind: sup.kind || 'inSource',
    status: sup.status || 'accepted',
    justification: sup.justification || sup.properties?.justification,
    location: sup.location?.physicalLocation?.artifactLocation?.uri,
  }));
}

/**
 * Generates a stable deterministic fingerprint for cross-scan muting.
 */
function generateFindingFingerprint(
  result: Result,
  ruleId: string,
  filePath: string,
  line: number | null,
  column: number | null,
  messageText: string
): string {
  return (
    result.correlationGuid ||
    result.guid ||
    result.fingerprints?.guid ||
    result.partialFingerprints?.primaryLocationLineHash ||
    generateDeterministicHash([ruleId, filePath, line, column, messageText.substring(0, 40)])
  );
}

/**
 * Normalizes a single SARIF Result into a NormalizedFinding viewer model.
 */
function normalizeSingleResult(
  result: Result,
  resultIndex: number,
  run: Run,
  runIndex: number,
  ruleIndexes: RuleIndexes,
  fileName: string,
  mutedRecords: Record<string, MuteRecord>
): NormalizedFinding {
  const driver = run.tool?.driver || { name: 'Static Analysis Tool' };
  const artifacts = Array.isArray(run.artifacts) ? run.artifacts : [];
  const taxonomiesCatalog = Array.isArray(run.taxonomies) ? run.taxonomies : [];

  const { ruleId, matchedRule, ruleName, ruleDescription, ruleFullDescription, ruleHelpUri } =
    resolveFindingRule(result, ruleIndexes, runIndex, resultIndex);

  const { messageText, messageMarkdown } = extractFindingMessage(result, matchedRule, ruleDescription);
  const { tags, resultTags, ruleTags } = extractFindingTags(result, matchedRule);
  const location = extractFindingLocation(result, run, artifacts);

  const taxonomies = resolveTaxonomies(
    result.taxa,
    taxonomiesCatalog,
    matchedRule?.relationships || [],
    tags
  );

  const baselineLevel: SarifLevel = normalizeSarifLevel(
    result.level || matchedRule?.defaultConfiguration?.level
  );

  let overrideResult = resolveEffectiveLevel(baselineLevel, resultTags);
  if (!overrideResult.hasCriticalityTag && ruleTags.length > 0) {
    overrideResult = resolveEffectiveLevel(baselineLevel, ruleTags);
  }

  const fingerprint = generateFindingFingerprint(
    result,
    ruleId,
    location.filePath,
    location.line,
    location.column,
    messageText
  );

  const findingId = `${fileName}#r${runIndex}_res${resultIndex}_${fingerprint}`;
  const inSarifSuppressions = parseResultSuppressions(result.suppressions);
  const muteRec = mutedRecords[findingId] || mutedRecords[fingerprint];
  const isMuted = !!muteRec || inSarifSuppressions.some((s) => s.status === 'accepted');

  return {
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
    effectiveLevel: overrideResult.effectiveLevel,
    isLevelOverridden: overrideResult.isOverridden,
    overrideTag: overrideResult.overrideTag,
    overrideReason: overrideResult.overrideReason,
    filePath: location.filePath,
    fileName: location.fileName,
    line: location.line,
    column: location.column,
    endLine: location.endLine,
    endColumn: location.endColumn,
    codeSnippet: location.codeSnippet,
    tags,
    taxonomies,
    properties: {
      ...matchedRule?.properties,
      ...result.properties,
    },
    isMuted,
    muteRecord: muteRec,
    rawResult: result,
    rawRule: matchedRule,
    codeFlows: parseResultCodeFlows(result.codeFlows, run, artifacts),
    fixes: parseResultFixes(result.fixes, run),
    relatedLocations: parseResultRelatedLocations(result.relatedLocations, run, artifacts),
    inSarifSuppressions: inSarifSuppressions.length > 0 ? inSarifSuppressions : undefined,
    webRequest: parseResultWebRequest(result.webRequest),
    webResponse: parseResultWebResponse(result.webResponse),
    baselineState: result.baselineState,
    logicalLocations: location.logicalLocations.length > 0 ? location.logicalLocations : undefined,
  };
}

/**
 * Normalizes and parses a SARIF 2.1.0 JSON object into rich, indexed viewer models.
 * 100% pure domain function with zero side-effects.
 */
export function parseSarifJson(
  sarif: SarifLog,
  fileName: string = 'report.sarif',
  mutedRecords: Record<string, MuteRecord> = {}
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

  runs.forEach((run: Run, runIndex: number) => {
    const driver = run.tool?.driver || { name: 'Static Analysis Tool' };
    const driverRules: ReportingDescriptor[] = Array.isArray(driver.rules) ? driver.rules : [];
    const ruleIndexes = buildRuleIndexes(driverRules, run.tool?.extensions);
    const runResults = Array.isArray(run.results) ? run.results : [];
    const runMetadata = extractApplicationMetadata(run, sarif.properties);

    runResults.forEach((result: Result, resultIndex: number) => {
      const normalized = normalizeSingleResult(
        result,
        resultIndex,
        run,
        runIndex,
        ruleIndexes,
        fileName,
        mutedRecords
      );

      allFindings.push(normalized);

      // Aggregate rule count
      const existingRule = ruleCountMap.get(normalized.ruleId) || {
        id: normalized.ruleId,
        name: normalized.ruleName,
        count: 0,
      };
      existingRule.count++;
      ruleCountMap.set(normalized.ruleId, existingRule);

      // Aggregate tags count
      normalized.tags.forEach((tag) => {
        tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
      });

      // Aggregate taxonomies count
      normalized.taxonomies?.forEach((tax) => {
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

  const errorCount = allFindings.filter((f) => f.effectiveLevel === 'error').length;
  const warningCount = allFindings.filter((f) => f.effectiveLevel === 'warning').length;
  const noteCount = allFindings.filter((f) => f.effectiveLevel === 'note').length;
  const noneCount = allFindings.filter((f) => f.effectiveLevel === 'none').length;
  const mutedCount = allFindings.filter((f) => f.isMuted).length;

  const allRules = Array.from(ruleCountMap.values()).sort((a, b) => b.count - a.count);
  const allTags = Array.from(tagCountMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  const allTaxonomies = Array.from(taxonomyCountMap.values()).sort((a, b) => b.count - a.count);

  const globalMetadata = extractApplicationMetadata(runs[0], sarif.properties);

  return {
    fileName,
    totalFindings: allFindings.length,
    errorCount,
    warningCount,
    noteCount,
    noneCount,
    mutedCount,
    runsCount: runs.length,
    runs: runSummaries,
    findings: allFindings,
    allRules,
    allTags,
    allTaxonomies,
    allLevels: ['error', 'warning', 'note', 'none'],
    globalMetadata,
  };
}

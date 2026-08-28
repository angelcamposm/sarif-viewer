import { Result, ReportingDescriptor, Invocation, PropertyBag } from './sarif';

export type SarifLevel = 'error' | 'warning' | 'note' | 'none';

export interface MuteRecord {
  id: string; // finding fingerprint
  ruleId: string;
  filePath?: string;
  line?: number;
  reason: 'False Positive' | 'Accepted Risk' | 'Compensating Control' | 'Fix Pending' | 'Other';
  justification?: string;
  mutedBy?: string;
  mutedAt: string; // ISO timestamp
}

export interface NormalizedCodeFlowStep {
  step: number;
  importance: 'essential' | 'important' | 'unimportant';
  message?: string;
  filePath: string;
  fileName: string;
  line: number | null;
  column: number | null;
  endLine?: number | null;
  endColumn?: number | null;
  codeSnippet?: string;
  kinds?: string[];
  executionOrder?: number;
  state?: Record<string, string>;
  module?: string;
}

export interface NormalizedThreadFlow {
  id?: string;
  message?: string;
  steps: NormalizedCodeFlowStep[];
}

export interface NormalizedCodeFlow {
  message?: string;
  threadFlows: NormalizedThreadFlow[];
}

export interface NormalizedReplacement {
  deletedRegion: {
    startLine: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
  };
  insertedContent?: string;
}

export interface NormalizedArtifactChange {
  filePath: string;
  fileName: string;
  replacements: NormalizedReplacement[];
}

export interface NormalizedFix {
  description?: string;
  artifactChanges: NormalizedArtifactChange[];
}

export interface NormalizedTaxonomyReference {
  taxonomyName: string; // e.g. 'CWE', 'OWASP Top 10', 'NIST', 'PCI-DSS'
  id: string;          // e.g. 'CWE-89', 'A03:2021'
  name?: string;       // e.g. 'Improper Neutralization of Special Elements used in an SQL Command'
  url?: string;        // e.g. 'https://cwe.mitre.org/data/definitions/89.html'
  category?: string;
}

export interface NormalizedRelatedLocation {
  id?: number;
  message?: string;
  filePath: string;
  fileName: string;
  line: number | null;
  column: number | null;
  codeSnippet?: string;
}

export interface NormalizedInSarifSuppression {
  kind: 'inSource' | 'external';
  status: 'accepted' | 'underReview' | 'rejected';
  justification?: string;
  location?: string;
}

export interface NormalizedWebRequest {
  method?: string;
  target?: string;
  protocol?: string;
  version?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, string>;
  body?: string;
}

export interface NormalizedWebResponse {
  statusCode?: number;
  reasonPhrase?: string;
  protocol?: string;
  version?: string;
  headers?: Record<string, string>;
  body?: string;
  noResponseReceived?: boolean;
}

export interface NormalizedFinding {
  id: string; // unique deterministic hash / fingerprint
  runIndex: number;
  resultIndex: number;
  toolName: string;
  toolVersion?: string;
  ruleId: string;
  ruleIndex?: number;
  ruleName?: string;
  ruleDescription?: string;
  ruleFullDescription?: string;
  ruleHelpUri?: string;
  message: string;
  messageMarkdown?: string;
  originalLevel: SarifLevel;
  effectiveLevel: SarifLevel;
  isLevelOverridden: boolean;
  overrideTag?: string;
  overrideReason?: string;
  filePath: string;
  fileName: string;
  line: number | null;
  column: number | null;
  endLine: number | null;
  endColumn: number | null;
  codeSnippet?: string;
  tags: string[];
  properties: PropertyBag;
  isMuted: boolean;
  muteRecord?: MuteRecord;
  rawResult: Result;
  rawRule?: ReportingDescriptor;

  // Rich OASIS SARIF 2.1.0 Capabilities
  codeFlows?: NormalizedCodeFlow[];
  fixes?: NormalizedFix[];
  taxonomies?: NormalizedTaxonomyReference[];
  relatedLocations?: NormalizedRelatedLocation[];
  inSarifSuppressions?: NormalizedInSarifSuppression[];
  webRequest?: NormalizedWebRequest;
  webResponse?: NormalizedWebResponse;
  baselineState?: 'new' | 'unchanged' | 'updated' | 'absent';
  logicalLocations?: string[];
}

export interface ApplicationMetadata {
  businessCriticality?: string; // e.g. 'Mission-critical', 'High', 'Medium', 'Low'
  businessCriticalityDescription?: string;
  language?: string;
  framework?: string;
  team?: string;
  businessDomain?: string;
  lifecycle?: string;
  customLabels: Array<{ key: string; value: string }>;
}

export interface SarifRunSummary {
  runIndex: number;
  toolName: string;
  toolVersion?: string;
  toolInformationUri?: string;
  rulesCount: number;
  findingsCount: number;
  invocations?: Invocation[];
  metadata: ApplicationMetadata;
  properties?: PropertyBag;
}

export interface ParsedSarifReport {
  fileName: string;
  schemaVersion?: string;
  totalFindings: number;
  errorCount: number;
  warningCount: number;
  noteCount: number;
  noneCount: number;
  runsCount: number;
  mutedCount: number;
  runs: SarifRunSummary[];
  findings: NormalizedFinding[];
  allRules: Array<{ id: string; name?: string; count: number }>;
  allTags: Array<{ tag: string; count: number }>;
  allTaxonomies?: Array<{ taxonomyName: string; id: string; count: number; name?: string }>;
  allLevels: SarifLevel[];
  globalMetadata: ApplicationMetadata;
}

export interface FilterState {
  searchQuery: string;
  selectedLevel: string; // 'all' | 'error' | 'warning' | 'note' | 'none'
  selectedRule: string;  // 'all' | ruleId
  selectedTag: string;   // 'all' | tag
  muteStatus: 'all' | 'active' | 'muted';
}

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

/**
 * TypeScript definitions for Static Analysis Results Interchange Format (SARIF) Version 2.1.0
 * OASIS Standard: https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/sarif-v2.1.0-os.html
 */

export interface SarifLog {
  $schema?: string;
  version: string;
  runs: Run[];
  properties?: PropertyBag;
  inlineExternalProperties?: any[];
}

export interface Run {
  tool: Tool;
  invocations?: Invocation[];
  conversion?: Conversion;
  language?: string;
  versionControlProvenance?: VersionControlDetails[];
  originalUriBaseIds?: Record<string, ArtifactLocation>;
  artifacts?: Artifact[];
  logicalLocations?: LogicalLocation[];
  graphs?: Graph[];
  results?: Result[];
  automationDetails?: RunAutomationDetails;
  columnKind?: 'utf16CodeUnits' | 'unicodeCodePoints';
  properties?: PropertyBag;
  taxonomies?: ToolComponent[];
  defaultEncoding?: string;
  defaultSourceLanguage?: string;
}

export interface Tool {
  driver: ToolComponent;
  extensions?: ToolComponent[];
  properties?: PropertyBag;
}

export interface ToolComponent {
  guid?: string;
  name: string;
  organization?: string;
  product?: string;
  productSuite?: string;
  shortDescription?: MultiformatMessageString;
  fullDescription?: MultiformatMessageString;
  fullName?: string;
  version?: string;
  semanticVersion?: string;
  dottedQuadFileVersion?: string;
  releaseDateUtc?: string;
  downloadUri?: string;
  informationUri?: string;
  globalMessageStrings?: Record<string, MultiformatMessageString>;
  notifications?: ReportingDescriptor[];
  rules?: ReportingDescriptor[];
  taxa?: ReportingDescriptor[];
  locations?: ArtifactLocation[];
  language?: string;
  properties?: PropertyBag;
}

export interface ReportingDescriptor {
  id: string;
  deprecatedIds?: string[];
  guid?: string;
  name?: string;
  shortDescription?: MultiformatMessageString;
  fullDescription?: MultiformatMessageString;
  messageStrings?: Record<string, MultiformatMessageString>;
  defaultConfiguration?: ReportingConfiguration;
  helpUri?: string;
  help?: MultiformatMessageString;
  properties?: PropertyBag;
  relationships?: ReportingDescriptorRelationship[];
}

export interface ReportingDescriptorRelationship {
  target: ReportingDescriptorReference;
  kinds?: string[];
  description?: Message;
  properties?: PropertyBag;
}

export interface ReportingDescriptorReference {
  id?: string;
  index?: number;
  guid?: string;
  toolComponent?: ToolComponentReference;
  properties?: PropertyBag;
}

export interface ToolComponentReference {
  name?: string;
  index?: number;
  guid?: string;
  properties?: PropertyBag;
}

export interface ReportingConfiguration {
  enabled?: boolean;
  level?: 'none' | 'note' | 'warning' | 'error';
  rank?: number;
  parameters?: PropertyBag;
  properties?: PropertyBag;
}

export interface Result {
  ruleId?: string;
  ruleIndex?: number;
  rule?: ReportingDescriptorReference;
  kind?: 'notApplicable' | 'pass' | 'fail' | 'review' | 'open' | 'informational';
  level?: 'none' | 'note' | 'warning' | 'error';
  message: Message;
  analysisTarget?: ArtifactLocation;
  locations?: Location[];
  guid?: string;
  correlationGuid?: string;
  occurrenceCount?: number;
  partialFingerprints?: Record<string, string>;
  fingerprints?: Record<string, string>;
  stacks?: Stack[];
  codeFlows?: CodeFlow[];
  graphs?: Graph[];
  graphTraversals?: GraphTraversal[];
  relatedLocations?: Location[];
  suppressions?: Suppression[];
  baselineState?: 'new' | 'unchanged' | 'updated' | 'absent';
  rank?: number;
  attachments?: Attachment[];
  workItemUris?: string[];
  hostedViewerUri?: string;
  properties?: PropertyBag;
  taxa?: ReportingDescriptorReference[];
  webRequest?: WebRequest;
  webResponse?: WebResponse;
  fixes?: Fix[];
}

export interface Message {
  text?: string;
  markdown?: string;
  id?: string;
  arguments?: string[];
  properties?: PropertyBag;
}

export interface MultiformatMessageString {
  text: string;
  markdown?: string;
  properties?: PropertyBag;
}

export interface Location {
  id?: number;
  physicalLocation?: PhysicalLocation;
  logicalLocations?: LogicalLocation[];
  message?: Message;
  annotations?: Region[];
  relationships?: LocationRelationship[];
  properties?: PropertyBag;
}

export interface PhysicalLocation {
  address?: Address;
  artifactLocation?: ArtifactLocation;
  region?: Region;
  contextRegion?: Region;
  properties?: PropertyBag;
}

export interface ArtifactLocation {
  uri?: string;
  uriBaseId?: string;
  index?: number;
  description?: Message;
  properties?: PropertyBag;
}

export interface Region {
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
  charOffset?: number;
  charLength?: number;
  byteOffset?: number;
  byteLength?: number;
  snippet?: ArtifactContent;
  message?: Message;
  sourceLanguage?: string;
  properties?: PropertyBag;
}

export interface ArtifactContent {
  text?: string;
  binary?: string;
  rendered?: MultiformatMessageString;
  properties?: PropertyBag;
}

export interface LogicalLocation {
  name?: string;
  index?: number;
  fullyQualifiedName?: string;
  decoratedName?: string;
  parentIndex?: number;
  kind?: string;
  properties?: PropertyBag;
}

export interface LocationRelationship {
  target: number;
  kinds?: string[];
  description?: Message;
  properties?: PropertyBag;
}

export interface Address {
  absoluteAddress?: number;
  relativeAddress?: number;
  length?: number;
  kind?: string;
  name?: string;
  fullyQualifiedName?: string;
  offsetFromParent?: number;
  index?: number;
  parentIndex?: number;
  properties?: PropertyBag;
}

export interface Invocation {
  commandLine?: string;
  arguments?: string[];
  responseFiles?: ArtifactLocation[];
  startTimeUtc?: string;
  endTimeUtc?: string;
  executionSuccessful: boolean;
  autoGeneratedCodeDetectors?: ToolComponentReference[];
  processId?: number;
  executableLocation?: ArtifactLocation;
  workingDirectory?: ArtifactLocation;
  environmentVariables?: Record<string, string>;
  stdin?: ArtifactLocation;
  stdout?: ArtifactLocation;
  stderr?: ArtifactLocation;
  stdoutStderr?: ArtifactLocation;
  exitCode?: number;
  exitSignalName?: string;
  exitSignalNumber?: number;
  exitCodeDescription?: string;
  exitException?: ExceptionDetails;
  properties?: PropertyBag;
}

export interface ExceptionDetails {
  kind?: string;
  message?: string;
  stack?: Stack;
  innerExceptions?: ExceptionDetails[];
}

export interface Stack {
  message?: Message;
  frames: StackFrame[];
  properties?: PropertyBag;
}

export interface StackFrame {
  location?: Location;
  module?: string;
  threadId?: number;
  parameters?: string[];
  properties?: PropertyBag;
}

export interface CodeFlow {
  message?: Message;
  threadFlows: ThreadFlow[];
  properties?: PropertyBag;
}

export interface ThreadFlow {
  id?: string;
  message?: Message;
  locations: ThreadFlowLocation[];
  properties?: PropertyBag;
}

export interface ThreadFlowLocation {
  step?: number;
  location?: Location;
  stack?: Stack;
  kinds?: string[];
  taxa?: ReportingDescriptorReference[];
  module?: string;
  executionOrder?: number;
  executionTimeUtc?: string;
  importance?: 'important' | 'essential' | 'unimportant';
  properties?: PropertyBag;
}

export interface Graph {
  description?: Message;
  nodes?: Node[];
  edges?: Edge[];
  properties?: PropertyBag;
}

export interface Node {
  id: string;
  label?: Message;
  location?: Location;
  children?: Node[];
  properties?: PropertyBag;
}

export interface Edge {
  id: string;
  label?: Message;
  sourceNodeId: string;
  targetNodeId: string;
  properties?: PropertyBag;
}

export interface GraphTraversal {
  runGraphIndex?: number;
  resultGraphIndex?: number;
  description?: Message;
  initialState?: Record<string, MultiformatMessageString>;
  immutableState?: Record<string, MultiformatMessageString>;
  edgeTraversals?: EdgeTraversal[];
  properties?: PropertyBag;
}

export interface EdgeTraversal {
  edgeId: string;
  message?: Message;
  finalState?: Record<string, MultiformatMessageString>;
  stepOverEdgeCount?: number;
  properties?: PropertyBag;
}

export interface Artifact {
  description?: Message;
  location?: ArtifactLocation;
  parentIndex?: number;
  offset?: number;
  length?: number;
  roles?: string[];
  mimeType?: string;
  contents?: ArtifactContent;
  encoding?: string;
  sourceLanguage?: string;
  hashes?: Record<string, string>;
  lastModifiedTimeUtc?: string;
  properties?: PropertyBag;
}

export interface Suppression {
  guid?: string;
  kind: 'inSource' | 'external';
  status?: 'accepted' | 'underReview' | 'rejected';
  justification?: string;
  location?: Location;
  properties?: PropertyBag;
}

export interface RunAutomationDetails {
  description?: Message;
  id?: string;
  guid?: string;
  correlationGuid?: string;
  properties?: PropertyBag;
}

export interface VersionControlDetails {
  repositoryUri: string;
  revisionId?: string;
  branch?: string;
  topic?: string;
  revisionTag?: string;
  asOfTimeUtc?: string;
  mappedTo?: ArtifactLocation;
  properties?: PropertyBag;
}

export interface Conversion {
  tool: Tool;
  invocation?: Invocation;
  properties?: PropertyBag;
}

export interface Attachment {
  description?: Message;
  artifactLocation: ArtifactLocation;
  regions?: Region[];
  rectangles?: Rectangle[];
  properties?: PropertyBag;
}

export interface Rectangle {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  message?: Message;
  properties?: PropertyBag;
}

export interface WebRequest {
  index?: number;
  protocol?: string;
  version?: string;
  target?: string;
  method?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, string>;
  body?: ArtifactContent;
  properties?: PropertyBag;
}

export interface WebResponse {
  index?: number;
  protocol?: string;
  version?: string;
  statusCode?: number;
  reasonPhrase?: string;
  headers?: Record<string, string>;
  body?: ArtifactContent;
  noResponseReceived?: boolean;
  properties?: PropertyBag;
}

export interface Fix {
  description?: Message;
  artifactChanges: ArtifactChange[];
  properties?: PropertyBag;
}

export interface ArtifactChange {
  artifactLocation: ArtifactLocation;
  replacements: Replacement[];
  properties?: PropertyBag;
}

export interface Replacement {
  deletedRegion: Region;
  insertedContent?: ArtifactContent;
  properties?: PropertyBag;
}

export type PropertyBag = Record<string, any>;

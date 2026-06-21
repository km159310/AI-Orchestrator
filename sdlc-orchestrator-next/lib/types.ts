export type PhaseId = "req" | "design" | "dev" | "test" | "pr" | "par" | "deploy" | "review" | "monitor";

export type PrStageStatus = "idle" | "running" | "done";

export interface PrPipelineState {
  featureStarted: boolean;
  featureStages: PrStageStatus[];   // length matches FEATURE_STAGES
  peerReviewed: boolean;
  masterStarted: boolean;
  masterStages: PrStageStatus[];    // length matches MASTER_STAGES
}
export type PhaseStatus = "locked" | "active" | "running" | "pending" | "done" | "rejected";

export interface Phase {
  id: PhaseId;
  label: string;
  icon: string; // tabler icon class — e.g. "ti-file-description"
  group?: { id: string; label?: string };
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  color: string;  // rgba background
  border: string; // rgba border
  desc: string;   // one-line role description shown under the agent name
}

export type AgentStatus = "idle" | "running" | "done";

export interface AgentState {
  status: AgentStatus;
  progress: number; // 0-100
  lines: string[];
}

export interface Signoff {
  name: string;
  role: string;
  av: string;     // initials
  color: string;  // avatar bg
  tc: string;     // text color (CSS var)
  comment: string;
}

export interface PortConfig {
  port: string;
  label: string;
  cmd: string;
}

export interface Requirement {
  id: string;
  text: string;
  pri: "must" | "should" | "nice";
}

export interface DetectedFeature {
  key: string;   // e.g. "fico"
  label: string; // human title shown in the UI
  icon: string;  // tabler icon class
  desc: string;  // one-line description
}

export interface ExtractedBrd {
  reqCount: number;
  riskCount: number;
  ports: PortConfig[];
  requirements: Requirement[];
  stakeholders: string[];
  detectedFeatures?: DetectedFeature[];
}

export interface BrdState {
  file: File | null;
  fileName: string | null;
  fileSize: string | null;
  pasteText: string;
  parseStep: number;       // 0..5
  extracted: ExtractedBrd | null;
}

export interface BankAppState {
  generated: boolean;
  generating: boolean;
  launching: number | null;
  ports: number[];
  files: string[] | null;
  path: string | null;
  lastError: string | null;
}

export interface JenkinsStage {
  name: string;
  status: string; // IN_PROGRESS | SUCCESS | FAILED | ABORTED | NOT_EXECUTED | UNSTABLE | …
}
export interface JenkinsBuild {
  ok: boolean;
  queued: boolean;
  building: boolean;
  result: string | null;          // SUCCESS | FAILURE | ABORTED | null while building
  buildNumber: number | null;
  url: string | null;
  stages: JenkinsStage[];
  error?: string;
  stagesError?: string | null;
  mock?: boolean;                 // true when running against the in-process mock
}

export interface PrState {
  branch: string;
  triggering: boolean;
  queueUrl: string | null;
  build: JenkinsBuild | null;
  jenkinsUrl: string | null;      // base URL for the "View in Jenkins" link
  error: string | null;
}

export interface Rejection {
  reason: string;
  verified: boolean;
}

export type LogTag = "info" | "success" | "warn" | "danger";

export interface LogEntry {
  id: number;
  t: string;     // formatted timestamp
  m: string;     // message
  tag: LogTag;
  phase: PhaseId | "system";  // captured at log time for per-phase grouping
}

export type ProjectType = "new" | "old" | null;
export type TechStack = "java" | "python" | "dotnet" | null;
export type DeployEnv = "local" | "fargate" | null;

export type WireframeName =
  | "login"
  | "dashboard"
  | "transfer"
  | "transactions"
  | "admin";

export interface WireframeSpec {
  name: WireframeName;
  caption?: string;
}

export interface DocSection {
  h: string;
  p?: string;
  list?: string[];
  table?: { cols: string[]; rows: string[][] };
  wireframes?: WireframeSpec[];
}

export interface DocPage {
  title: string;
  meta: { date: string; author: string; status: string; ver: string };
  sections: DocSection[];
}

export interface DocsForPhase {
  tabs: string[];
  contents: DocPage[];
}

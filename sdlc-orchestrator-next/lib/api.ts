// Thin wrappers over the Python backend at /api/*.
// All requests are proxied through next.config.ts → http://localhost:3000
import type { ExtractedBrd, JenkinsBuild } from "./types";

export interface GenerateAppResponse {
  ok: boolean;
  path: string;
  files: string[];
  features?: string[];
}

export interface LaunchResponse {
  ok: boolean;
  port?: number;
  pid?: number;
  alreadyRunning?: boolean;
  error?: string;
}

export interface StopResponse {
  ok: boolean;
  port: number;
  stopped: boolean;
}

export interface StatusResponse {
  ports: number[];
}

export interface ExtractResponse {
  ok: boolean;
  extracted?: ExtractedBrd;
  error?: string;
}

export interface ObservabilityPort {
  port: number;
  up: boolean;
  uptimeS: number;
  probeCount: number;
  lastProbeMs: number;
  lastProbeAt: string;
}

export interface ObservabilityResponse {
  ok: boolean;
  ports: ObservabilityPort[];
}

export type PrUiState = "open" | "inProgress" | "merged" | "closed";

export interface PrSummary {
  number: number;
  title: string;
  branch: string;
  url: string;
  author: string;
  avatarUrl: string;
  updatedAt: string;
  state: PrUiState;
  draft: boolean;
}

export interface PrCounts {
  open: number;
  inProgress: number;
  closed: number;
  merged: number;
}

export interface PrListResponse {
  ok: boolean;
  mock?: boolean;
  repo?: string;
  counts?: PrCounts;
  recent?: PrSummary[];
  error?: string;
}

export interface GithubPushResponse {
  ok: boolean;
  mock?: boolean;
  repo?: string;
  branch?: string;
  commitSha?: string;
  prUrl?: string | null;
  prNumber?: number | null;
  prAlready?: boolean;
  filesCount?: number;
  message?: string;
  error?: string;
}

export interface JenkinsTriggerResponse {
  ok: boolean;
  queueUrl?: string;
  job?: string;
  branch?: string;
  jenkinsUrl?: string;
  error?: string;
}

export interface JenkinsInfoResponse {
  url: string;
  job: string;
  branchParam: string;
  authConfigured: boolean;
}

export interface AwsDeployStage {
  name: string;
  status: "idle" | "running" | "done" | "failed";
  line: string;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface AwsDeployOutputs {
  alb_url?: string;
  ecr_repository_url?: string;
  ecs_cluster_name?: string;
  ecs_service_name?: string;
  log_group?: string;
  region?: string;
}

export interface AwsDeployState {
  running: boolean;
  finished: boolean;
  ok: boolean | null;
  startedAt: number | null;
  finishedAt: number | null;
  error: string | null;
  imageTag?: string | null;
  stages: AwsDeployStage[];
  outputs: AwsDeployOutputs;
}

export interface AwsDeployStartResponse {
  ok: boolean;
  imageTag?: string;
  state?: AwsDeployState;
  error?: string;
}

export interface AwsDeployDestroyResponse {
  ok: boolean;
  error?: string;
}

export interface AwsPreflightCheck {
  name: string;
  ok: boolean;
  label: string;
  detail: string;
  hint: string;
}

export interface AwsPreflightResponse {
  ok: boolean;
  checks: AwsPreflightCheck[];
  region: string;
}

async function _post<T>(path: string): Promise<T> {
  const r = await fetch(path, { method: "POST" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

async function _get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

async function _postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (data as { error?: string }).error ?? `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  generateApp: (features?: string[]) =>
    features && features.length
      ? _postJson<GenerateAppResponse>("/api/generate-app", { features })
      : _post<GenerateAppResponse>("/api/generate-app"),
  launch:      (port: number) => _post<LaunchResponse>(`/api/launch?port=${port}`),
  stop:        (port: number) => _post<StopResponse>(`/api/stop?port=${port}`),
  status:      () => _get<StatusResponse>("/api/status"),
  observability: () => _get<ObservabilityResponse>("/api/observability"),
  extract:     (text: string) => _postJson<ExtractResponse>("/api/extract", { text }),
  githubPush:  () => _post<GithubPushResponse>("/api/github/push"),
  listPrs:     () => _get<PrListResponse>("/api/github/prs"),

  // ── Jenkins ───────────────────────────────────────────
  jenkinsInfo:    () => _get<JenkinsInfoResponse>("/api/jenkins/info"),
  jenkinsTrigger: (branch: string) =>
    _postJson<JenkinsTriggerResponse>("/api/jenkins/trigger", { branch }),
  jenkinsStatus:  (params: { queueUrl?: string | null; buildNumber?: number | null }) => {
    const qp = new URLSearchParams();
    if (params.queueUrl)    qp.set("queueUrl", params.queueUrl);
    if (params.buildNumber) qp.set("buildNumber", String(params.buildNumber));
    return _get<JenkinsBuild>(`/api/jenkins/status?${qp.toString()}`);
  },

  // ── AWS ECS Fargate deploy pipeline ───────────────────
  awsDeployStart:    () => _post<AwsDeployStartResponse>("/api/deploy/aws"),
  awsDeployStatus:   () => _get<AwsDeployState>("/api/deploy/aws/status"),
  awsDeployDestroy:  () => _post<AwsDeployDestroyResponse>("/api/deploy/aws/destroy"),
  awsDeployPreflight: () => _get<AwsPreflightResponse>("/api/deploy/aws/preflight"),
};

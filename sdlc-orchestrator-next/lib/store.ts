import { create } from "zustand";
import type {
  AgentState, BankAppState, BrdState, DeployEnv,
  LogEntry, LogTag, PhaseId, PhaseStatus, PrPipelineState, PrStageStatus,
  PrState, ProjectType, Rejection, TechStack,
} from "./types";
import { PHASES } from "@/data/phases";
import { AGENTS } from "@/data/agents";
import { INIT_PASTE } from "@/data/brd";
import { FEATURE_STAGES, MASTER_STAGES } from "@/data/prStages";

interface StoreState {
  cur: number;
  statuses: PhaseStatus[];
  agState: Partial<Record<PhaseId, Record<string, AgentState>>>;
  docTab: Partial<Record<PhaseId, number>>;
  projectType: ProjectType;
  techStack: TechStack;
  lob: string;
  bizApp: string;
  project: string;
  deployEnv: DeployEnv;
  pr: PrState;
  approvers: Partial<Record<PhaseId, Record<string, boolean>>>;
  autoTriggered: Partial<Record<PhaseId, boolean>>;
  rejections: Partial<Record<PhaseId, Rejection>>;
  log: LogEntry[];
  logCounter: number;
  brd: BrdState;
  bankApp: BankAppState;
  devRunCount: number;
  prPipeline: PrPipelineState;
}

interface StoreActions {
  jumpPhase: (i: number) => void;
  setStatus: (i: number, st: PhaseStatus) => void;
  setProjectType: (t: ProjectType) => void;
  setTechStack: (s: TechStack) => void;
  setLob: (v: string) => void;
  setBizApp: (v: string) => void;
  setProject: (v: string) => void;
  setDeployEnv: (e: DeployEnv) => void;
  setPr: (patch: Partial<PrState>) => void;
  setDocTab: (pid: PhaseId, i: number) => void;
  toggleApprover: (pid: PhaseId, name: string) => void;
  setApprovers: (pid: PhaseId, value: Record<string, boolean>) => void;
  setAutoTriggered: (pid: PhaseId, value: boolean) => void;
  setRejection: (pid: PhaseId, patch: Partial<Rejection>) => void;
  clearRejection: (pid: PhaseId) => void;

  initAgents: (pid: PhaseId) => void;
  resetAgents: (pid: PhaseId) => void;
  updateAgent: (pid: PhaseId, aid: string, patch: Partial<AgentState>) => void;
  appendAgentLine: (pid: PhaseId, aid: string, line: string) => void;

  setBrd: (patch: Partial<BrdState>) => void;
  setBankApp: (patch: Partial<BankAppState>) => void;

  addLog: (msg: string, tag?: LogTag) => void;

  incrementDevRunCount: () => void;

  viewMonitor: () => void;

  setPrFeatureStarted: (v: boolean) => void;
  setPrFeatureStage: (index: number, status: PrStageStatus) => void;
  setPrPeerReviewed: (v: boolean) => void;
  setPrMasterStarted: (v: boolean) => void;
  setPrMasterStage: (index: number, status: PrStageStatus) => void;
  resetPrPipeline: () => void;

  reset: () => void;
}

function emptyAgents(): StoreState["agState"] {
  const out: StoreState["agState"] = {};
  return out;
}

function initialAgentsFor(pid: PhaseId): Record<string, AgentState> {
  const rec: Record<string, AgentState> = {};
  (AGENTS[pid] || []).forEach(a => {
    rec[a.id] = { status: "idle", progress: 0, lines: [] };
  });
  return rec;
}

const _statuses: PhaseStatus[] = ["active", "locked", "locked", "locked", "locked", "locked", "locked", "locked", "locked"];

const _initial: StoreState = {
  cur: 0,
  statuses: _statuses.slice(),
  agState: emptyAgents(),
  docTab: {},
  projectType: null,
  techStack: null,
  lob: "",
  bizApp: "",
  project: "",
  deployEnv: null,
  pr: {
    branch: "Application/branch",
    triggering: false,
    queueUrl: null,
    build: null,
    jenkinsUrl: null,
    error: null,
  },
  approvers: {},
  autoTriggered: {},
  rejections: {},
  log: [],
  logCounter: 0,
  brd: {
    file: null, fileName: null, fileSize: null,
    pasteText: INIT_PASTE,
    parseStep: 0,
    extracted: null,
  },
  bankApp: {
    generated: false,
    generating: false,
    launching: null,
    ports: [],
    files: null,
    path: null,
    lastError: null,
  },
  devRunCount: 0,
  prPipeline: {
    featureStarted: false,
    featureStages: FEATURE_STAGES.map(() => "idle" as PrStageStatus),
    peerReviewed: false,
    masterStarted: false,
    masterStages: MASTER_STAGES.map(() => "idle" as PrStageStatus),
  },
};

function ts(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  ..._initial,

  jumpPhase: (i) => {
    const st = get().statuses[i];
    if (st === "locked") return;
    set({ cur: i });
  },

  setStatus: (i, st) => {
    const statuses = get().statuses.slice();
    statuses[i] = st;
    set({ statuses });
  },

  setProjectType: (t) => set({ projectType: t }),
  setTechStack:  (s) => set({ techStack: s }),
  setLob:        (v) => set({ lob: v }),
  setBizApp:     (v) => set({ bizApp: v }),
  setProject:    (v) => set({ project: v }),
  setDeployEnv:  (e) => set({ deployEnv: e }),
  setPr: (patch) => set({ pr: { ...get().pr, ...patch } }),

  setDocTab: (pid, i) => set({ docTab: { ...get().docTab, [pid]: i } }),

  toggleApprover: (pid, name) => {
    const cur = get().approvers[pid] || {};
    set({ approvers: { ...get().approvers, [pid]: { ...cur, [name]: !cur[name] } } });
  },
  setApprovers: (pid, value) => {
    set({ approvers: { ...get().approvers, [pid]: value } });
  },
  setAutoTriggered: (pid, value) => {
    set({ autoTriggered: { ...get().autoTriggered, [pid]: value } });
  },

  setRejection: (pid, patch) => {
    const cur = get().rejections[pid] ?? { reason: "", verified: false };
    set({ rejections: { ...get().rejections, [pid]: { ...cur, ...patch } } });
  },
  clearRejection: (pid) => {
    const next = { ...get().rejections };
    delete next[pid];
    set({ rejections: next });
  },

  initAgents: (pid) => {
    const cur = get().agState[pid];
    if (cur && Object.keys(cur).length) return;
    set({ agState: { ...get().agState, [pid]: initialAgentsFor(pid) } });
  },

  resetAgents: (pid) => {
    set({ agState: { ...get().agState, [pid]: initialAgentsFor(pid) } });
  },

  updateAgent: (pid, aid, patch) => {
    const pidState = get().agState[pid];
    if (!pidState) return;
    const ag = pidState[aid];
    if (!ag) return;
    const newAg = { ...ag, ...patch };
    set({ agState: { ...get().agState, [pid]: { ...pidState, [aid]: newAg } } });
  },

  appendAgentLine: (pid, aid, line) => {
    const pidState = get().agState[pid];
    if (!pidState) return;
    const ag = pidState[aid];
    if (!ag) return;
    const newAg = { ...ag, lines: [...ag.lines, line] };
    set({ agState: { ...get().agState, [pid]: { ...pidState, [aid]: newAg } } });
  },

  setBrd: (patch) => set({ brd: { ...get().brd, ...patch } }),

  setBankApp: (patch) => set({ bankApp: { ...get().bankApp, ...patch } }),

  addLog: (msg, tag = "info") => {
    const id = get().logCounter + 1;
    const ph = PHASES[get().cur]?.id ?? "system";
    const entry: LogEntry = { id, t: ts(), m: msg, tag, phase: ph };
    set({ log: [entry, ...get().log].slice(0, 200), logCounter: id });
  },

  incrementDevRunCount: () => set({ devRunCount: get().devRunCount + 1 }),

  // Observation jump — bypasses the locked gate that jumpPhase enforces,
  // because the Dashboard & Observability view is meant to be readable at
  // any point in the pipeline (it only surfaces logs/health, no approval).
  viewMonitor: () => {
    const idx = PHASES.findIndex(p => p.id === "monitor");
    if (idx >= 0) set({ cur: idx });
  },

  setPrFeatureStarted: (v) => set({ prPipeline: { ...get().prPipeline, featureStarted: v } }),
  setPrFeatureStage: (index, status) => {
    const cur = get().prPipeline.featureStages.slice();
    if (index < 0 || index >= cur.length) return;
    cur[index] = status;
    set({ prPipeline: { ...get().prPipeline, featureStages: cur } });
  },
  setPrPeerReviewed: (v) => set({ prPipeline: { ...get().prPipeline, peerReviewed: v } }),
  setPrMasterStarted: (v) => set({ prPipeline: { ...get().prPipeline, masterStarted: v } }),
  setPrMasterStage: (index, status) => {
    const cur = get().prPipeline.masterStages.slice();
    if (index < 0 || index >= cur.length) return;
    cur[index] = status;
    set({ prPipeline: { ...get().prPipeline, masterStages: cur } });
  },
  resetPrPipeline: () => set({
    prPipeline: {
      featureStarted: false,
      featureStages: FEATURE_STAGES.map(() => "idle" as PrStageStatus),
      peerReviewed: false,
      masterStarted: false,
      masterStages: MASTER_STAGES.map(() => "idle" as PrStageStatus),
    },
  }),

  reset: () => {
    set({
      ..._initial,
      statuses: _statuses.slice(),
      agState: {},
      docTab: {},
      approvers: {},
      autoTriggered: {},
      rejections: {},
      log: [],
      logCounter: 0,
      brd: { ..._initial.brd },
      bankApp: { ..._initial.bankApp, ports: [] },
      pr: { ..._initial.pr },
      devRunCount: 0,
      prPipeline: {
        featureStarted: false,
        featureStages: FEATURE_STAGES.map(() => "idle" as PrStageStatus),
        peerReviewed: false,
        masterStarted: false,
        masterStages: MASTER_STAGES.map(() => "idle" as PrStageStatus),
      },
    });
  },
}));

// Phase helpers — used in many places, kept here for convenience.
export function phaseAt(i: number) {
  return PHASES[i];
}

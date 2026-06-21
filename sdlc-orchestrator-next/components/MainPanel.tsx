"use client";
import { useStore } from "@/lib/store";
import { useLogAggregatorPulse } from "@/lib/useLogAggregatorPulse";
import { PHASES } from "@/data/phases";
import { RequirementsPhase } from "./phases/RequirementsPhase";
import { DevelopmentPhase } from "./phases/DevelopmentPhase";
import { PrPhase } from "./phases/PrPhase";
import { DeployPhase } from "./phases/DeployPhase";
import { GenericPhase } from "./phases/GenericPhase";
import { PhaseHero } from "./PhaseHero";
import type { PhaseStatus } from "@/lib/types";

const BADGE_MAP: Record<PhaseStatus, { cls: string; html: React.ReactNode }> = {
  active:   { cls: "b-active",   html: "● Active" },
  running:  { cls: "b-running",  html: (<><span className="spin" /> Running</>) },
  pending:  { cls: "b-pending",  html: "⏳ Pending Approval" },
  done:     { cls: "b-done",     html: "✓ Approved" },
  rejected: { cls: "b-rejected", html: "✗ Rejected" },
  locked:   { cls: "b-locked",   html: "Locked" },
};

const ICON_COLOR: Record<PhaseStatus, string> = {
  active:   "var(--cyan)",
  running:  "var(--amber)",
  pending:  "var(--amber)",
  done:     "var(--green)",
  rejected: "var(--red)",
  locked:   "var(--text3)",
};

export function MainPanel() {
  // Mount the Log Aggregator pulse once at the app shell so every
  // activity-log update triggers the agent — even when the user is on
  // a different phase than Dashboard & Observability.
  useLogAggregatorPulse();

  const cur = useStore(s => s.cur);
  const statuses = useStore(s => s.statuses);
  const viewMonitor = useStore(s => s.viewMonitor);
  const ph = PHASES[cur];
  const st = statuses[cur];
  // Dashboard & Observability is observation-only — it's continuously
  // aggregating logs and probing health, so always present it as "Live"
  // rather than going through Active → Running → Pending Approval.
  const badge = ph.id === "monitor"
    ? { cls: "b-live", html: (<><span className="dot up" /> Live</>) }
    : BADGE_MAP[st];

  const openLogAggregator = () => {
    viewMonitor();
    // Defer until the monitor view has mounted, then jump to the
    // Log Aggregator agent / activity log anchor.
    window.setTimeout(() => {
      const el = document.getElementById("log-aggregator-view");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <main className="main-panel" id="main-panel" aria-live="polite">
      <div className="panel-head">
        <div className="panel-head-icon">
          <i className={`ti ${ph.icon}`} style={{ fontSize: 15, color: ICON_COLOR[st] }} aria-hidden="true" />
        </div>
        <span className="panel-title">{ph.label} Phase</span>
        <span className={`badge ${badge.cls}`}>{badge.html}</span>
        {ph.id !== "monitor" && (
          <button
            type="button"
            className="panel-head-eye"
            onClick={openLogAggregator}
            title="View Log Aggregator — agent logs & activity log"
            aria-label="View Log Aggregator in Dashboard & Observability"
          >
            <i className="ti ti-eye" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="panel-body">
        <PhaseHero pid={ph.id} />
        {ph.id === "req"    && <RequirementsPhase status={st} />}
        {ph.id === "dev"    && <DevelopmentPhase status={st} />}
        {ph.id === "pr"     && <PrPhase status={st} />}
        {ph.id === "deploy" && <DeployPhase status={st} />}
        {ph.id !== "req" && ph.id !== "dev" && ph.id !== "pr" && ph.id !== "deploy" && <GenericPhase pid={ph.id} status={st} />}
      </div>
    </main>
  );
}

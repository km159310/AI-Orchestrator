"use client";
import { useStore } from "@/lib/store";
import { useActions } from "@/lib/useActions";
import { AgentGrid } from "../AgentGrid";
import { DocViewer } from "../DocViewer";
import { SignOff } from "../SignOff";
import { RejectControl } from "../RejectControl";
import { RejectedBanner, useRejectionGate } from "../RejectedBanner";
import { Observability } from "../Observability";
import { MonitorLogs } from "../MonitorLogs";
import { DOCS } from "@/data/documents";
import { PHASES } from "@/data/phases";
import type { PhaseId, PhaseStatus } from "@/lib/types";

const DESCRIPTIONS: Partial<Record<PhaseId, string>> = {
  design:  "Architect Agent, API, DB schema, and UI agents generate all design artefacts for ABC Bank.",
  test:    "Integration, load, UAT, and reporting agents validate the bank application.",
  par:     "Risk Synthesiser, Compliance Auditor, and CAB Coordinator agents prepare the Production Approval Request — stakeholder sign-off here unlocks Deployment.",
  deploy:  "Infra, container, CD pipeline, and smoke agents deploy across :3001 and :3002.",
  review:  "Post-mortem, metrics, lessons, and release-notes agents close the pipeline.",
  monitor: "Aggregates activity logs from every phase and probes live instances for health, uptime, and latency.",
};

interface Props { pid: PhaseId; status: PhaseStatus }

export function GenericPhase({ pid, status }: Props) {
  const cur = useStore(s => s.cur);
  const autoTriggered = useStore(s => s.autoTriggered[pid]);
  const { startAgents, approvePhase, backPhase } = useActions();
  const prev = PHASES[cur - 1];
  const gate = useRejectionGate(pid, status);

  if (status === "locked") {
    // Monitor is observation-only — let users preview activity logs and
    // live health any time, even before it's "unlocked" in the pipeline.
    if (pid === "monitor") {
      return (
        <>
          <div className="notif n-info" style={{ marginBottom: ".875rem" }}>
            <i className="ti ti-eye" aria-hidden="true" /> Preview — Dashboard & Observability becomes the active phase once Release Review is approved.
          </div>
          <div className="section-label">Phases</div>
          <AgentGrid pid={pid} showStream={false} />
          <Observability />
          <MonitorLogs />
        </>
      );
    }
    return (
      <div className="notif n-info">
        <i className="ti ti-lock" aria-hidden="true" /> Locked — approve the previous phase to unlock this one.
      </div>
    );
  }

  const nextLabel = PHASES[cur + 1]?.label ?? "pipeline";

  return (
    <>
      {status === "done" && (
        <div className="success-banner">
          <i className="ti ti-circle-check" style={{ fontSize: 16 }} aria-hidden="true" />
          Phase approved — {nextLabel} triggered automatically.
        </div>
      )}
      {status === "rejected" && <RejectedBanner pid={pid} />}
      {status === "running" && autoTriggered && (
        <div className="trigger-banner">
          <span className="spin" /> Auto-triggered from previous phase approval — agents running…
        </div>
      )}

      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: ".875rem", lineHeight: 1.6 }}>
        {DESCRIPTIONS[pid] || ""}
      </div>

      <div className="section-label">Phases</div>
      <AgentGrid pid={pid} showStream={status === "running"} />

      {(status === "active" || status === "rejected") && (
        <div className="appr-bar">
          <button className="btn btn-run" onClick={() => startAgents(pid)}
                  disabled={gate.gated && !gate.verified}
                  title={gate.gated && !gate.verified ? "Verify the rejection reason first" : undefined}>
            <i className="ti ti-player-play" aria-hidden="true" /> Run phases
          </button>
          {status === "rejected" && prev && (
            <button className="btn btn-ghost" onClick={backPhase}
                    disabled={gate.gated && !gate.verified}
                    title={gate.gated && !gate.verified ? "Verify the rejection reason first" : undefined}>
              <i className="ti ti-arrow-back-up" aria-hidden="true" /> Back to {prev.label}
            </button>
          )}
        </div>
      )}

      {status === "pending" && (
        DOCS[pid] ? (
          <><div className="dvdr" /><DocViewer pid={pid} /><SignOff pid={pid} /></>
        ) : (
          <>
            <div className="notif n-warn" style={{ marginTop: ".5rem" }}>
              <i className="ti ti-clock" aria-hidden="true" /> Agents complete — sign-off required.
            </div>
            <div className="appr-bar">
              <button className="btn btn-ok" onClick={approvePhase}>
                <i className="ti ti-circle-check" aria-hidden="true" /> Approve & advance
              </button>
              <RejectControl />
            </div>
          </>
        )
      )}

      {status === "done" && DOCS[pid] && <DocViewer pid={pid} />}

      {pid === "monitor" && (
        <>
          <Observability />
          <MonitorLogs />
        </>
      )}
    </>
  );
}

"use client";
import { useStore } from "@/lib/store";
import { PHASES } from "@/data/phases";
import type { LogEntry, PhaseId, PhaseStatus } from "@/lib/types";

const STATUS_META: Record<PhaseStatus, { lbl: string; cls: string }> = {
  active:   { lbl: "Active",   cls: "st-active"   },
  running:  { lbl: "Running",  cls: "st-running"  },
  pending:  { lbl: "Pending",  cls: "st-pending"  },
  done:     { lbl: "Approved", cls: "st-done"     },
  rejected: { lbl: "Rejected", cls: "st-rejected" },
  locked:   { lbl: "Locked",   cls: "st-locked"   },
};

function PipelineStatusBoard() {
  const cur      = useStore(s => s.cur);
  const statuses = useStore(s => s.statuses);

  return (
    <div className="mon-section">
      <div className="mon-section-head">
        <i className="ti ti-list-check" aria-hidden="true" />
        <span>Pipeline status</span>
      </div>
      <div className="mon-status-grid">
        {PHASES.map((p, i) => {
          const st  = statuses[i] ?? "locked";
          // Monitor is observation-only — present it as "Live" rather
          // than the pending-approval / running gate labels.
          const m   = p.id === "monitor"
            ? { lbl: "Live", cls: "st-live" }
            : STATUS_META[st];
          const cls = `mon-status-cell ${m.cls}${i === cur ? " is-current" : ""}`;
          return (
            <div key={p.id} className={cls}>
              <div className="mon-status-icon"><i className={`ti ${p.icon}`} aria-hidden="true" /></div>
              <div className="mon-status-body">
                <div className="mon-status-lbl">{p.label}</div>
                <div className="mon-status-state">{m.lbl}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityByPhase() {
  const log = useStore(s => s.log);

  const groups = new Map<PhaseId | "system", LogEntry[]>();
  log.forEach(e => {
    const arr = groups.get(e.phase) ?? [];
    arr.push(e);
    groups.set(e.phase, arr);
  });

  const order: (PhaseId | "system")[] = [...PHASES.map(p => p.id), "system"];
  const blocks = order
    .filter(k => (groups.get(k)?.length ?? 0) > 0)
    .map(k => {
      const ph    = PHASES.find(p => p.id === k);
      const label = ph?.label ?? "System";
      const icon  = ph?.icon  ?? "ti-settings";
      const rows  = groups.get(k)!;
      return (
        <div key={k} className="mon-log-group">
          <div className="mon-log-group-head">
            <i className={`ti ${icon}`} aria-hidden="true" />
            <span className="mon-log-group-title">{label}</span>
            <span className="mon-log-group-count">{rows.length}</span>
          </div>
          <div className="mon-log-group-body">
            {rows.map(e => (
              <div key={e.id} className="mon-log-row">
                <span className="log-t">{e.t}</span>
                <span className="log-m">
                  <span className={`ltag lt-${e.tag}`}>{e.tag}</span> {e.m}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    });

  return (
    <div className="mon-section" id="log-aggregator-view">
      <div className="mon-section-head">
        <i className="ti ti-stack" aria-hidden="true" />
        <span>Log Aggregator — agent logs &amp; activity log, grouped by phase</span>
      </div>
      {blocks.length === 0 ? (
        <div className="obs-empty">
          <i className="ti ti-inbox" aria-hidden="true" /> No activity captured yet.
        </div>
      ) : blocks}
    </div>
  );
}

export function MonitorLogs() {
  return <><PipelineStatusBoard /><ActivityByPhase /></>;
}

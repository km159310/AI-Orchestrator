"use client";
import { useStore } from "@/lib/store";
import { PHASES } from "@/data/phases";
import type { Phase } from "@/lib/types";
import React from "react";

function sameGroup(a?: Phase, b?: Phase) {
  return !!(a && b && a.group && b.group && a.group.id === b.group.id);
}

export function PipelineStrip() {
  const cur = useStore(s => s.cur);
  const statuses = useStore(s => s.statuses);
  const jump = useStore(s => s.jumpPhase);

  // Build the strip as a flat array of segments — phase nodes, connectors,
  // and group open/close markers — then fold the segments into nested JSX
  // so consecutive same-group phases share one <div class="ph-group">.
  type Segment =
    | { kind: "conn"; cls: string; key: string }
    | { kind: "node"; ph: Phase; idx: number; st: string }
    | { kind: "group-open"; groupId: string; groupLabel?: string; key: string }
    | { kind: "group-close" };

  const segments: Segment[] = [];
  let openGroup: { id: string; label?: string } | null = null;

  PHASES.forEach((ph, i) => {
    const prev = PHASES[i - 1];
    const next = PHASES[i + 1];
    const st = statuses[i];

    if (i > 0) {
      const prevSt = statuses[i - 1];
      const connCls =
        prevSt === "done" ? "ph-conn done" :
        cur === i ? "ph-conn active" :
        "ph-conn";
      const inGroup = sameGroup(prev, ph);
      if (!inGroup && openGroup) {
        // Connector belongs outside; close any open group first.
        segments.push({ kind: "group-close" });
        openGroup = null;
      }
      segments.push({ kind: "conn", cls: connCls, key: `c${i}` });
    }

    if (ph.group && !sameGroup(prev, ph)) {
      openGroup = ph.group;
      segments.push({ kind: "group-open", groupId: ph.group.id, groupLabel: ph.group.label, key: `g${i}` });
    }

    segments.push({ kind: "node", ph, idx: i, st });

    if (ph.group && !sameGroup(ph, next)) {
      segments.push({ kind: "group-close" });
      openGroup = null;
    }
  });

  // Render the segment stream by folding group-open/close markers into
  // wrapper <div>s.
  const out: React.ReactNode[] = [];
  let buf: React.ReactNode[] = [];
  let groupMeta: { groupId: string; groupLabel?: string; key: string } | null = null;

  const flushGroup = () => {
    if (!groupMeta) return;
    out.push(
      <div key={groupMeta.key} className="ph-group" data-group={groupMeta.groupId}>
        {groupMeta.groupLabel && <div className="ph-group-lbl">{groupMeta.groupLabel}</div>}
        {buf}
      </div>,
    );
    buf = [];
    groupMeta = null;
  };

  const pushNode = (node: React.ReactNode) => {
    (groupMeta ? buf : out).push(node);
  };

  segments.forEach(seg => {
    if (seg.kind === "group-open") {
      groupMeta = { groupId: seg.groupId, groupLabel: seg.groupLabel, key: seg.key };
      return;
    }
    if (seg.kind === "group-close") {
      flushGroup();
      return;
    }
    if (seg.kind === "conn") {
      pushNode(<div key={seg.key} className={seg.cls} />);
      return;
    }
    if (seg.kind === "node") {
      const { ph, idx, st } = seg;
      pushNode(
        <div
          key={ph.id}
          className="ph-node"
          role="button"
          aria-label={`${ph.label} – ${st}`}
          onClick={() => jump(idx)}
        >
          <div className={`ph-circle st-${st}`}>
            <i className={`ti ${ph.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
            {st !== "locked" && <div className={`ph-dot st-${st}`} />}
          </div>
          <div className={`ph-lbl st-${st}`}>{ph.label}</div>
        </div>,
      );
    }
  });
  flushGroup(); // safety: close any group still open at end of list

  return (
    <section className="pipeline-wrap" aria-label="Pipeline phases">
      <div className="pipeline">{out}</div>
    </section>
  );
}

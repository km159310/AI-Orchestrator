"use client";
import { useStore } from "@/lib/store";
import { AGENTS } from "@/data/agents";
import type { PhaseId } from "@/lib/types";
import { useEffect } from "react";

interface Props { pid: PhaseId; showStream?: boolean }

export function AgentGrid({ pid, showStream }: Props) {
  const initAgents = useStore(s => s.initAgents);
  const agState = useStore(s => s.agState[pid]);

  // Make sure the agent slice exists for this phase before rendering.
  useEffect(() => { initAgents(pid); }, [pid, initAgents]);

  const list = AGENTS[pid] || [];
  const states = agState || {};

  return (
    <>
      <div className="ag-grid">
        {list.map(a => {
          const s = states[a.id] || { status: "idle", progress: 0, lines: [] };
          const cls = ["ag-card", s.status === "running" ? "running" : "", s.status === "done" ? "done" : ""]
            .filter(Boolean).join(" ");
          const lastLine = s.lines[s.lines.length - 1] || "Awaiting trigger…";
          const progCls = ["prog-f",
            s.status === "done" ? "done" : s.status === "running" ? "amber" : ""
          ].filter(Boolean).join(" ");

          return (
            <div key={a.id} className={cls}>
              <div className="ag-head">
                <div className="ag-ico" style={{ background: a.color, borderColor: a.border }}>
                  <i className={`ti ${a.icon}`} aria-hidden="true" />
                </div>
                <div className="ag-name-wrap">
                  <div className="ag-name">{a.name}</div>
                  <div className="ag-desc" title={a.desc}>{a.desc}</div>
                </div>
                <div className={`ag-st ${s.status}`}>
                  {s.status === "running" ? "● Running" :
                   s.status === "done"    ? "✓ Done" :
                   "Idle"}
                </div>
              </div>
              <div className={`ag-out ${s.status === "running" ? "active" : ""}`}>{lastLine}</div>
              <div className="prog"><div className={progCls} style={{ width: `${s.progress}%` }} /></div>
            </div>
          );
        })}
      </div>

      {showStream && (
        <div className="sbox">
          {list.flatMap(a => {
            const s = states[a.id];
            if (!s) return [];
            return s.lines.map((line, idx) => (
              <div key={`${a.id}-${idx}`} className="sl b">
                <strong>{a.name}:</strong> {line}
              </div>
            ));
          })}
        </div>
      )}
    </>
  );
}

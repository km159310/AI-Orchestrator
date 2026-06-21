"use client";
import { useStore } from "@/lib/store";

export function ActivityLog() {
  const log = useStore(s => s.log);

  return (
    <aside className="log-panel" aria-label="Activity log">
      <div className="log-head">
        <span className="log-head-title">
          <i className="ti ti-terminal-2" style={{ fontSize: 11 }} aria-hidden="true" /> Activity log
        </span>
        <span className="log-count">{log.length} events</span>
      </div>
      <div className="log-box" role="log" aria-live="polite">
        {log.map(e => (
          <div key={e.id} className="log-row">
            <span className="log-t">{e.t}</span>
            <span className={`ltag lt-${e.tag}`}>{e.tag}</span>
            <span className="log-m">{e.m}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

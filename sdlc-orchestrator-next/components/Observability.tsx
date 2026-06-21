"use client";
import { useEffect, useRef, useState } from "react";
import { api, type ObservabilityPort } from "@/lib/api";

const POLL_MS = 4000;

function fmtUptime(s: number): string {
  if (s == null) return "—";
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export function Observability() {
  const [ports, setPorts]   = useState<ObservabilityPort[]>([]);
  const [err, setErr]       = useState<string | null>(null);
  const [stamp, setStamp]   = useState<string>("—");
  const inflight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (inflight.current) return;
      inflight.current = true;
      try {
        const j = await api.observability();
        if (cancelled) return;
        setPorts(j.ports || []);
        setErr(null);
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        inflight.current = false;
        if (!cancelled) setStamp(new Date().toLocaleTimeString());
      }
    };

    void tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const countTxt = ports.length
    ? `${ports.length} instance${ports.length === 1 ? "" : "s"} tracked`
    : "No running instances";

  return (
    <aside className="obs-panel" aria-label="Dashboard and Observability">
      <div className="obs-head">
        <span className="obs-head-title">
          <i className="ti ti-activity-heartbeat" aria-hidden="true" />
          Dashboard &amp; Observability
        </span>
        <span className="obs-head-meta">{countTxt} · refreshed {stamp}</span>
      </div>

      {err ? (
        <div className="obs-empty obs-err">
          <i className="ti ti-alert-triangle" aria-hidden="true" /> {err}
        </div>
      ) : ports.length === 0 ? (
        <div className="obs-empty">
          <i className="ti ti-plug-off" aria-hidden="true" />
          Launch an app instance from the Development phase to see live signals.
        </div>
      ) : (
        <div className="obs-grid">
          {ports.map(p => {
            const dotCls   = p.up ? "dot up" : "dot down";
            const stateTxt = p.up ? "Healthy" : "Down";
            const stateCls = p.up ? "ok" : "bad";
            return (
              <div key={p.port} className="obs-card">
                <div className="obs-card-head">
                  <span className={dotCls} />
                  <a className="obs-port"
                     href={`http://localhost:${p.port}/`}
                     target="_blank" rel="noopener">
                    :{p.port} <i className="ti ti-external-link" aria-hidden="true" />
                  </a>
                  <span className={`obs-state ${stateCls}`}>{stateTxt}</span>
                </div>
                <div className="obs-metrics">
                  <div className="obs-metric">
                    <div className="obs-metric-lbl">Uptime</div>
                    <div className="obs-metric-val">{fmtUptime(p.uptimeS)}</div>
                  </div>
                  <div className="obs-metric">
                    <div className="obs-metric-lbl">Hits</div>
                    <div className="obs-metric-val">{p.probeCount}</div>
                  </div>
                  <div className="obs-metric">
                    <div className="obs-metric-lbl">Latency</div>
                    <div className="obs-metric-val">{p.lastProbeMs} ms</div>
                  </div>
                  <div className="obs-metric">
                    <div className="obs-metric-lbl">Last hit</div>
                    <div className="obs-metric-val mono">{p.lastProbeAt}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

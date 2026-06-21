"use client";
import { useStore } from "@/lib/store";
import { useActions } from "@/lib/useActions";

const PORTS = [3001, 3002];

export function BankApp() {
  const b = useStore(s => s.bankApp);
  const detected = useStore(s => s.brd.extracted?.detectedFeatures ?? []);
  const { launchBankApp, stopBankApp } = useActions();

  if (!b.generated && !b.generating) return null;

  const subTxt = b.generating
    ? "Generating files…"
    : `Generated · ${(b.files || []).length} files${b.path ? " · " + b.path : ""}`;

  return (
    <div className="bank-app">
      <div className="bank-app-head">
        <div className="bank-app-ico"><i className="ti ti-building-bank" aria-hidden="true" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bank-app-title">ABC Bank application</div>
          <div className="bank-app-sub">{subTxt}</div>
        </div>
        {b.generating && <span className="spin" style={{ color: "var(--cyan)" }} />}
      </div>

      {detected.length > 0 && (
        <div className="bank-app-feats">
          <div className="bank-app-feats-h">
            <i className="ti ti-sparkles" aria-hidden="true" /> Deployed features ({detected.length})
          </div>
          <div className="bank-app-feats-row">
            {detected.map(f => (
              <span key={f.key} className="bank-app-feat-chip" title={f.desc}>
                <i className={`ti ${f.icon}`} aria-hidden="true" />
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {b.generated && (
        <>
          <div className="bank-app-ports">
            {PORTS.map(port => {
              const running = b.ports.includes(port);
              const launching = b.launching === port;
              const stateLbl = running ? "● Running" : launching ? "Launching…" : "Idle";
              const stateCls = running ? "on" : launching ? "busy" : "off";

              return (
                <div key={port} className={`bank-app-port ${running ? "running" : ""}`}>
                  <div className="bank-app-port-num">:{port}</div>
                  <div className="bank-app-port-mid">
                    <div className={`bank-app-port-status ${stateCls}`}>{stateLbl}</div>
                    {running ? (
                      <a className="bank-app-port-link" href={`http://localhost:${port}/`} target="_blank" rel="noopener noreferrer">
                        http://localhost:{port}/ <i className="ti ti-external-link" style={{ fontSize: 11 }} />
                      </a>
                    ) : (
                      <div className="bank-app-port-hint">python -m http.server {port}</div>
                    )}
                  </div>
                  <div className="bank-app-port-actions">
                    {running ? (
                      <button className="btn btn-no" onClick={() => void stopBankApp(port)}>
                        <i className="ti ti-player-stop" aria-hidden="true" /> Stop
                      </button>
                    ) : (
                      <button className="btn btn-run" onClick={() => void launchBankApp(port)} disabled={launching}>
                        <i className="ti ti-player-play" aria-hidden="true" /> Launch
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bank-app-hint">
            <i className="ti ti-info-circle" aria-hidden="true" />
            Demo login — <code>demo</code> / <code>demo123</code>
          </div>
        </>
      )}

      {b.lastError && (
        <div className="notif n-danger" style={{ marginTop: ".625rem" }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" /> {b.lastError}
        </div>
      )}
    </div>
  );
}

"use client";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 2500;

// Map Jenkins stage statuses to a CSS class our pipeline-pill uses.
function statusCls(status: string | undefined): "done" | "active" | "" {
  switch (status) {
    case "SUCCESS":       return "done";
    case "IN_PROGRESS":   return "active";
    case "FAILED":
    case "ABORTED":
    case "UNSTABLE":      return "active";
    default:              return "";
  }
}

export function PrAgent() {
  const pr = useStore(s => s.pr);
  const setPr = useStore(s => s.setPr);
  const addLog = useStore(s => s.addLog);
  const pollRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  function stopPoll() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function trigger() {
    if (pr.triggering) return;
    setPr({ triggering: true, build: null, queueUrl: null, error: null });
    addLog(`Jenkins: triggering build for ${pr.branch}…`, "info");
    try {
      const res = await api.jenkinsTrigger(pr.branch);
      if (!res.ok) {
        setPr({ triggering: false, error: res.error ?? "trigger failed" });
        addLog(`Jenkins trigger failed: ${res.error ?? "unknown error"}`, "danger");
        return;
      }
      setPr({
        triggering: false,
        queueUrl: res.queueUrl ?? null,
        jenkinsUrl: res.jenkinsUrl ?? null,
        error: null,
      });
      addLog(`Jenkins: queued ${res.job} @ ${res.branch}`, "info");
      startPolling(res.queueUrl ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPr({ triggering: false, error: msg });
      addLog(`Jenkins trigger error: ${msg}`, "danger");
    }
  }

  function startPolling(queueUrl: string | null) {
    stopPoll();
    if (!queueUrl) return;
    pollRef.current = window.setInterval(async () => {
      const s = useStore.getState().pr;
      try {
        const res = await api.jenkinsStatus({
          queueUrl: s.queueUrl,
          buildNumber: s.build?.buildNumber ?? null,
        });
        setPr({ build: res });
        if (res.ok && !res.building && !res.queued) {
          stopPoll();
          addLog(`Jenkins build #${res.buildNumber}: ${res.result ?? "DONE"}`,
            res.result === "SUCCESS" ? "success" : "warn");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setPr({ error: msg });
      }
    }, POLL_INTERVAL_MS);
  }

  const build = pr.build;
  const isBuilding = !!(build && (build.building || build.queued));
  const isDone = !!(build && !build.building && !build.queued && build.result);
  const failed = !!(build && build.result && build.result !== "SUCCESS");

  let action: React.ReactNode;
  if (pr.triggering) {
    action = <span style={{ fontSize: 11, color: "var(--amber)" }}><span className="spin" /> Triggering…</span>;
  } else if (isBuilding) {
    action = <span style={{ fontSize: 11, color: "var(--amber)" }}><span className="spin" /> Building…</span>;
  } else if (isDone && !failed) {
    action = <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>✓ {build?.result}</span>;
  } else if (isDone && failed) {
    action = <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 600 }}>✗ {build?.result}</span>;
  } else {
    action = (
      <button className="btn btn-run" onClick={() => void trigger()}
              style={{ fontSize: 11, padding: ".3rem .7rem" }}>
        <i className="ti ti-player-play" aria-hidden="true" /> Trigger Jenkins
      </button>
    );
  }

  return (
    <div className="pr-wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 240 }}>
          <i className="ti ti-git-branch" style={{ fontSize: 12, color: "var(--text2)" }} aria-hidden="true" />
          <input
            type="text"
            value={pr.branch}
            onChange={e => setPr({ branch: e.target.value })}
            disabled={isBuilding || pr.triggering}
            placeholder="Application/branch"
            className="pr-branch-input"
            style={{
              flex: 1, minWidth: 180,
              fontFamily: "var(--code)", fontSize: 12,
              padding: "5px 10px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--bg2)",
              color: "var(--cyan)",
              outline: "none",
            }}
          />
        </div>
        {action}
      </div>

      {/* Stage pills — dynamic when we have a build, placeholder otherwise */}
      {build && build.stages.length > 0 ? (
        <div className="pstages">
          {build.stages.map((stage, i) => {
            const cls = statusCls(stage.status);
            return (
              <span key={stage.name + i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span className={`ps ${cls}`}>{stage.name}</span>
                {i < build.stages.length - 1 && <span style={{ fontSize: 9, color: "var(--text3)" }}>›</span>}
              </span>
            );
          })}
        </div>
      ) : build && build.queued ? (
        <div style={{ fontSize: 11.5, color: "var(--text2)" }}>
          <span className="spin" /> Waiting for executor — build queued in Jenkins
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--code)" }}>
          No build yet · click <em>Trigger Jenkins</em> to start a pipeline run
        </div>
      )}

      {build && build.buildNumber && (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text2)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span><strong>Build</strong> #{build.buildNumber}</span>
          {build.result && <span>Result: <strong style={{ color: build.result === "SUCCESS" ? "var(--green)" : "var(--red)" }}>{build.result}</strong></span>}
          {build.url && !build.url.startsWith("mock://") && (
            <a href={build.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--cyan)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              View in Jenkins <i className="ti ti-external-link" style={{ fontSize: 11 }} />
            </a>
          )}
          {build.mock && (
            <span title="JENKINS_USER / JENKINS_TOKEN not set — running simulated pipeline"
                  style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", padding: "2px 7px", borderRadius: 999, background: "var(--amber2)", color: "var(--amber)", border: "1px solid rgba(217,119,6,.3)" }}>
              MOCK
            </span>
          )}
        </div>
      )}

      {build && build.stagesError && (
        <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--text3)" }}>
          ⓘ Install the <em>Pipeline: Stage View</em> plugin in Jenkins to see live stage status.
        </div>
      )}

      {pr.error && (
        <div className="notif n-danger" style={{ marginTop: 10 }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" /> {pr.error}
        </div>
      )}
    </div>
  );
}

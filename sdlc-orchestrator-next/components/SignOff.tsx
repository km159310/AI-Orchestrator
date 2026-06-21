"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { SIGNOFFS } from "@/data/signoffs";
import { useActions } from "@/lib/useActions";
import { api, type GithubPushResponse } from "@/lib/api";
import { RejectControl } from "./RejectControl";
import type { PhaseId } from "@/lib/types";

interface Props { pid: PhaseId }

// Stable empty-object reference for the selector fallback below.
// Using `|| {}` inline would create a new {} on every render call,
// which trips React's "getSnapshot should be cached" infinite loop.
const EMPTY_APPROVERS: Record<string, boolean> = Object.freeze({}) as Record<string, boolean>;

// Stage labels animated client-side while the real /api/github/push
// runs on the backend. The visible commit SHA / branch / PR number are
// taken from the API response once it resolves, falling back to these
// placeholders during the in-flight period and on local-only setups
// without GITHUB_TOKEN / GITHUB_REPO configured.
const FALLBACK_REPO   = "abc-bank/abc-bank-app";
const FALLBACK_BRANCH = "feature/abc-bank-v1.0";
const FALLBACK_SHA    = "a1b2c3d4";
const FALLBACK_PR_NUM = 142;
const PUSH_STAGES = [
  "Initialising git repository",
  "Staging files",
  "Creating commit",
  "Pushing branch to GitHub",
  "Opening pull request",
];

export function SignOff({ pid }: Props) {
  const approvers = useStore(s => s.approvers[pid] ?? EMPTY_APPROVERS);
  const toggle = useStore(s => s.toggleApprover);
  const addLog = useStore(s => s.addLog);
  const fileCount = useStore(s => s.bankApp.files?.length ?? null);
  const { approvePhase } = useActions();

  // pushIdx semantics: -1 = idle, 0..PUSH_STAGES.length-1 = ticking,
  //                    PUSH_STAGES.length = all done.
  const [pushIdx, setPushIdx]       = useState(-1);
  const [pushResult, setPushResult] = useState<GithubPushResponse | null>(null);
  const [pushError, setPushError]   = useState<string | null>(null);

  useEffect(() => {
    if (pushIdx < 0) return;                              // not pushing yet
    if (pushIdx > PUSH_STAGES.length) return;             // approvePhase already scheduled
    if (pushIdx === PUSH_STAGES.length) {
      // All client-side stages complete — but don't advance until the
      // backend /api/github/push call has actually resolved. This is
      // what stops the misleading "pushed to github.com/abc-bank/…"
      // success log from firing with placeholder values when the API
      // is still in flight or has errored.
      if (!pushResult && !pushError) return;
      if (pushError) {
        addLog(`GitHub: ✗ push failed — ${pushError}`, "danger");
        return;
      }
      const repo  = pushResult!.repo  ?? "(unknown)";
      const prNum = pushResult!.prNumber ?? "(none)";
      const tag   = pushResult!.mock ? "(mock)" : "";
      addLog(`GitHub: ✓ pushed to ${repo} · PR #${prNum} opened ${tag}`.trim(), "success");
      const t = window.setTimeout(() => {
        setPushIdx(i => i + 1); // mark scheduled to avoid double-call
        approvePhase();
      }, 900);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      addLog(`GitHub: ✓ ${PUSH_STAGES[pushIdx]}`, "info");
      setPushIdx(i => i + 1);
    }, 600);
    return () => window.clearTimeout(t);
  }, [pushIdx, addLog, approvePhase, pushResult, pushError]);

  const list = SIGNOFFS[pid] || [];
  const allSigned = list.length > 0 && list.every(p => approvers[p.name]);
  const isTest = pid === "test";

  // Testing phase auto-deploys once every stakeholder has signed off —
  // a short delay so the user sees the "all signed" state, then the
  // GitHub push starts on its own. Rejecting before the delay elapses
  // unmounts SignOff and cancels the timer.
  // (Declared above the early-return below to keep hook ordering stable.)
  useEffect(() => {
    if (!isTest) return;
    if (!allSigned) return;
    if (pushIdx >= 0) return; // push already started
    addLog("Testing: all stakeholders signed — committing & raising PR automatically", "info");
    const t = window.setTimeout(() => {
      addLog("GitHub: pushing ABC Bank scaffold…", "info");
      setPushIdx(0);
      // Fire the real backend push in parallel with the client-side
      // stage animation. The promise handlers always update local state
      // — we deliberately do not cancel them on effect re-run, because
      // setPushIdx(0) itself triggers a re-run and would otherwise drop
      // the real-push response on the floor.
      api.githubPush()
        .then(res => {
          if (!res.ok) {
            setPushError(res.error || "unknown error");
            return;
          }
          setPushResult(res);
          if (res.mock) {
            addLog(`GitHub: ${res.message || "running in mock mode (no GITHUB_TOKEN/GITHUB_REPO set)"}`, "warn");
          } else {
            addLog(`GitHub: real push complete · commit ${res.commitSha} on ${res.branch}`, "success");
          }
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setPushError(msg);
        });
    }, 600);
    return () => window.clearTimeout(t);
  }, [isTest, allSigned, pushIdx, addLog]);

  if (!list.length) return null;

  // The Testing phase advances by committing + raising a PR — relabel
  // the approve button and stage a mock GitHub push before approvePhase
  // is invoked.
  const approveLabel = isTest ? "Commit and Raise PR Request" : "Approve & advance";
  const approveIcon  = isTest ? "ti-git-pull-request" : "ti-circle-check";
  const pushing      = isTest && pushIdx >= 0 && pushIdx < PUSH_STAGES.length;
  const pushed       = isTest && pushIdx >= PUSH_STAGES.length;
  const apiFiles     = pushResult?.filesCount;
  const filesNote    = apiFiles && apiFiles > 0
    ? String(apiFiles)
    : fileCount && fileCount > 0 ? String(fileCount) : "47";
  // Show placeholder dashes while the API is still in flight so the
  // card never displays a stale "abc-bank/abc-bank-app" type value.
  const placeholder  = "—";
  const repoDisplay  = pushResult?.repo   ?? (pushError ? placeholder : "awaiting backend…");
  const branchShown  = pushResult?.branch ?? (pushError ? placeholder : FALLBACK_BRANCH);
  const shaShown     = pushResult?.commitSha ?? (pushError ? placeholder : "…");
  const prNumShown   = pushResult?.prNumber ?? (pushError ? placeholder : "…");
  const prUrl        = pushResult?.prUrl ?? null;
  const isMock       = pushResult?.mock === true;

  const onApprove = () => {
    if (!isTest) { approvePhase(); return; }
    if (pushIdx >= 0) return; // already in flight
    addLog("GitHub: pushing ABC Bank scaffold…", "info");
    setPushIdx(0);
    api.githubPush()
      .then(res => {
        if (!res.ok) {
          setPushError(res.error || "unknown error");
          return;
        }
        setPushResult(res);
        if (res.mock) {
          addLog(`GitHub: ${res.message || "running in mock mode (no GITHUB_TOKEN/GITHUB_REPO set)"}`, "warn");
        } else {
          addLog(`GitHub: real push complete · commit ${res.commitSha} on ${res.branch}`, "success");
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setPushError(msg);
      });
  };

  return (
    <>
      <div className="section-label">Stakeholder sign-off</div>
      {list.map(p => {
        const ok = approvers[p.name];
        return (
          <div key={p.name} className={`sign-box ${ok ? "signed" : ""}`}>
            <div className="sign-row">
              <div className="sign-av" style={{ background: p.color, color: p.tc }}>{p.av}</div>
              <div style={{ flex: 1 }}>
                <div className="sign-name">{p.name}</div>
                <div className="sign-role">{p.role}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 600, color: ok ? "var(--green)" : "var(--text3)" }}>
                {ok ? "✓ Approved" : "Pending"}
              </div>
              <button className={`btn ${ok ? "btn-ok" : "btn-ghost"}`} style={{ marginLeft: 8 }} onClick={() => toggle(pid, p.name)}>
                {ok ? "Approved" : "Approve"}
              </button>
            </div>
            {ok && <div className="sign-comment">{p.comment}</div>}
          </div>
        );
      })}
      <div className="appr-bar">
        <button className="btn btn-ok" disabled={!allSigned || pushing || pushed} onClick={onApprove}>
          {pushing ? (<><span className="spin" /> Pushing to GitHub…</>)
            : pushed ? (<>✓ Pushed — advancing to PR…</>)
            : (<><i className={`ti ${approveIcon}`} aria-hidden="true" /> {approveLabel}</>)}
        </button>
        <RejectControl />
      </div>

      {isTest && pushIdx >= 0 && (
        <div className="gh-push-card">
          <div className="gh-push-head">
            <i className="ti ti-brand-github" aria-hidden="true" />
            <span>{pushed ? "Pushed to " : "Pushing to "}
              {pushResult ? (
                <a href={`https://${repoDisplay}`} target="_blank" rel="noopener" className="gh-push-link">{repoDisplay}</a>
              ) : (
                <em className="gh-push-link" style={{ fontStyle: "italic", color: "var(--text3)" }}>{repoDisplay}</em>
              )}
            </span>
            {pushed && pushResult && prUrl && (
              <a href={prUrl} target="_blank" rel="noopener" className="gh-push-pill" style={{ textDecoration: "none" }}>
                PR #{prNumShown} ↗
              </a>
            )}
            {pushed && pushResult && !prUrl && <span className="gh-push-pill">PR #{prNumShown}</span>}
            {pushed && isMock && <span className="gh-push-pill" style={{ marginLeft: 6, background: "var(--amber2)", color: "var(--amber)", borderColor: "rgba(217,119,6,.3)" }}>MOCK</span>}
          </div>
          {pushError && (
            <div className="notif n-danger" style={{ marginBottom: 8, fontSize: 11 }}>
              <i className="ti ti-alert-triangle" aria-hidden="true" /> {pushError}
            </div>
          )}
          <div className="gh-push-stages">
            {PUSH_STAGES.map((name, i) => {
              const cls = i < pushIdx ? "done" : i === pushIdx ? "running" : "idle";
              const mark = cls === "done" ? "✓" : cls === "running" ? "●" : "○";
              return (
                <div key={i} className={`gh-push-stage ${cls}`}>
                  <span className={`gh-push-dot ${cls}`} />
                  <span className="gh-push-name">{name === "Staging files" ? `Staging ${filesNote} files` : name}</span>
                  <span className="gh-push-mark">{mark}</span>
                </div>
              );
            })}
          </div>
          <div className="gh-push-meta">
            <span><strong>Repo:</strong> {repoDisplay}</span>
            <span><strong>Branch:</strong> {branchShown}</span>
            <span><strong>Commit:</strong> {shaShown}</span>
            <span><strong>Files:</strong> {filesNote}</span>
          </div>
        </div>
      )}
    </>
  );
}

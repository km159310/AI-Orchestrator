"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useActions } from "@/lib/useActions";
import { api, type AwsDeployStage, type AwsDeployState, type AwsPreflightResponse } from "@/lib/api";
import { DocViewer } from "../DocViewer";
import { RejectedBanner, useRejectionGate } from "../RejectedBanner";
import { DOCS } from "@/data/documents";
import { PHASES } from "@/data/phases";
import type { PhaseStatus } from "@/lib/types";

interface Props { status: PhaseStatus }

const STAGE_LABELS: Record<string, string> = {
  terraform_init:  "Terraform init",
  terraform_apply: "Terraform apply (VPC · ALB · ECS · ECR)",
  docker_build:    "Docker build (generated-app/)",
  ecr_login:       "Docker login to ECR",
  docker_push:     "Docker push",
  ecs_update:      "ECS update-service (--force-new-deployment)",
  wait_stable:     "Wait for service stable",
  smoke:           "Smoke check (GET ALB URL)",
};

function StageRow({ stage }: { stage: AwsDeployStage }) {
  const lbl = STAGE_LABELS[stage.name] || stage.name;
  const dur = stage.startedAt && stage.finishedAt
    ? `${(stage.finishedAt - stage.startedAt).toFixed(1)}s` : "";
  const isFailed = stage.status === "failed";
  const rowCls = isFailed
    ? "pr-stage-row aws-stage"
    : `pr-stage-row aws-stage ${stage.status === "done" ? "done" : stage.status === "running" ? "running" : ""}`;
  const dotCls = isFailed ? "pr-stage-dot idle" :
    stage.status === "done" ? "pr-stage-dot done" :
    stage.status === "running" ? "pr-stage-dot running" : "pr-stage-dot idle";
  const stateCls = isFailed ? "pr-stage-state idle" :
    stage.status === "done" ? "pr-stage-state done" :
    stage.status === "running" ? "pr-stage-state running" : "pr-stage-state idle";
  const stateTxt = stage.status === "done" ? "✓ Done" :
    stage.status === "running" ? "● Running" :
    stage.status === "failed" ? "✗ Failed" : "Pending";
  const failedStyle = isFailed
    ? { borderColor: "rgba(220,38,38,.4)", background: "var(--red2)" } : undefined;
  return (
    <div className={rowCls} style={failedStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
        <span className={dotCls} />
        <span className="pr-stage-name">{lbl}</span>
        {dur && <span className="aws-stage-dur">{dur}</span>}
        <span className={stateCls}>{stateTxt}</span>
      </div>
      {stage.line && <div className="aws-stage-line">{stage.line}</div>}
    </div>
  );
}

export function DeployPhase({ status }: Props) {
  const cur          = useStore(s => s.cur);
  const setStatus    = useStore(s => s.setStatus);
  const setRejection = useStore(s => s.setRejection);
  const clearReject  = useStore(s => s.clearRejection);
  const addLog       = useStore(s => s.addLog);
  const setAutoTriggered = useStore(s => s.setAutoTriggered);
  const jumpPhase    = useStore(s => s.jumpPhase);
  const { backPhase } = useActions();
  const gate = useRejectionGate("deploy", status);
  const prev = PHASES[cur - 1];

  const [state, setState] = useState<AwsDeployState | null>(null);
  const [destroying, setDestroying] = useState(false);
  const [preflight, setPreflight] = useState<AwsPreflightResponse | null>(null);
  const [preflightBusy, setPreflightBusy] = useState(false);
  const startedRef   = useRef(false);
  const advancedRef  = useRef(false);
  const pollRef      = useRef<number | null>(null);
  const preflightedRef = useRef(false);

  const runPreflight = async () => {
    if (preflightBusy) return;
    setPreflightBusy(true);
    try {
      const j = await api.awsDeployPreflight();
      setPreflight(j);
      if (j.ok) {
        addLog("AWS preflight: all checks green", "success");
      } else {
        const fails = j.checks.filter(c => !c.ok).map(c => c.label).join(", ");
        addLog(`AWS preflight: failing — ${fails}`, "warn");
      }
    } catch (e) {
      addLog("Preflight request failed: " + (e as Error).message, "danger");
      setPreflight({
        ok: false,
        region: "",
        checks: [{ name: "preflight", ok: false, label: "Preflight call", detail: (e as Error).message, hint: "" }],
      });
    }
    setPreflightBusy(false);
  };

  // Auto-run preflight once when the phase becomes active.
  useEffect(() => {
    if (status !== "active" && status !== "running") return;
    if (preflightedRef.current) return;
    preflightedRef.current = true;
    void runPreflight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const kickoff = () => {
    if (startedRef.current) return;
    if (!preflight || !preflight.ok) {
      addLog("Deploy blocked — fix the preflight checks first", "warn");
      return;
    }
    startedRef.current = true;
    addLog("AWS Fargate deploy starting — terraform apply + docker build/push + ECS update", "info");
    api.awsDeployStart()
      .then(j => {
        if (!j.ok) {
          addLog(`Deploy could not start: ${j.error || "unknown"}`, "danger");
          startedRef.current = false;
          return;
        }
        addLog(`Image tag for this run: ${j.imageTag}`, "info");
        if (j.state) setState(j.state);
      })
      .catch(e => {
        addLog("Deploy request failed: " + (e as Error).message, "danger");
        startedRef.current = false;
      });
  };

  // Auto-kickoff once preflight is green and the phase is active.
  useEffect(() => {
    if (status !== "active" && status !== "running") return;
    if (startedRef.current) return;
    if (!preflight || !preflight.ok) return;
    kickoff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preflight, status]);

  // Poll status while running.
  useEffect(() => {
    if (!startedRef.current) return;
    if (status === "done" || status === "rejected") return;
    if (pollRef.current) return;
    const tick = () => {
      api.awsDeployStatus()
        .then(j => {
          setState(j);
          if (j.finished && !advancedRef.current) {
            advancedRef.current = true;
            if (j.ok) {
              const alb = j.outputs.alb_url ?? "";
              addLog(`AWS Fargate deploy succeeded · ${alb}`, "success");
              setStatus(cur, "done");
              clearReject("deploy");
              const next = cur + 1;
              if (next < PHASES.length) {
                setStatus(next, "active");
                addLog(`→ Auto-triggering ${PHASES[next].label}…`, "info");
                window.setTimeout(() => {
                  jumpPhase(next);
                  setAutoTriggered(PHASES[next].id, true);
                }, 800);
              }
            } else {
              addLog(`AWS Fargate deploy failed: ${j.error || "unknown"}`, "danger");
              setStatus(cur, "rejected");
              setRejection("deploy", { reason: j.error || "AWS deploy failed", verified: false });
            }
            if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
          }
        })
        .catch(() => { /* swallow */ });
    };
    tick();
    pollRef.current = window.setInterval(tick, 2000);
    return () => {
      if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [status, cur, addLog, setStatus, clearReject, setRejection, jumpPhase, setAutoTriggered]);

  const retry = () => {
    startedRef.current = false;
    advancedRef.current = false;
    setState(null);
    preflightedRef.current = false;  // re-run preflight on retry
    setPreflight(null);
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    clearReject("deploy");
    setStatus(cur, "running");
    void runPreflight();
  };

  const destroy = async () => {
    if (destroying) return;
    if (!window.confirm("Tear down the AWS Fargate deployment (VPC, ALB, ECS, ECR)? This runs `terraform destroy` and can take several minutes.")) return;
    setDestroying(true);
    addLog("AWS Fargate teardown started — terraform destroy", "warn");
    try {
      const j = await api.awsDeployDestroy();
      if (j.ok) addLog("✓ AWS Fargate resources destroyed", "success");
      else      addLog(`Destroy failed: ${j.error || "unknown"}`, "danger");
    } catch (e) {
      addLog("Destroy request failed: " + (e as Error).message, "danger");
    }
    setDestroying(false);
  };

  const outputs = state?.outputs ?? {};
  const alb = outputs.alb_url ?? "";
  const ecr = outputs.ecr_repository_url ?? "";
  const tag = state?.imageTag ?? "";

  const metaBits: React.ReactNode[] = [];
  if (tag) metaBits.push(<span key="tag"><strong>Image tag:</strong> {tag}</span>);
  if (ecr) metaBits.push(<span key="ecr"><strong>ECR:</strong> {ecr}</span>);
  if (alb) metaBits.push(<span key="alb"><strong>ALB:</strong> <a href={alb} target="_blank" rel="noopener" className="gh-push-link">{alb}</a></span>);

  return (
    <>
      {status === "done" && (
        <div className="success-banner">
          <i className="ti ti-circle-check" style={{ fontSize: 16 }} aria-hidden="true" />
          Deployment complete — Release Review triggered.
        </div>
      )}
      {status === "rejected" && <RejectedBanner pid="deploy" />}

      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: ".875rem", lineHeight: 1.6 }}>
        Provisions VPC + ALB + ECS Fargate cluster via Terraform, builds and pushes the generated app
        image to ECR, then rolls out a new ECS service deployment in your AWS account.
      </div>

      {!startedRef.current && (
        <>
          <div className="section-label">Environment</div>
          <div className={`aws-preflight-card ${preflight ? (preflight.ok ? "all-ok" : "has-fail") : ""}`}>
            <div className="aws-preflight-head">
              <i className="ti ti-checkup-list" aria-hidden="true" />
              <span>Preflight checks</span>
              {preflightBusy && (
                <span className="aws-running-pill" style={{ marginLeft: "auto" }}>
                  <span className="spin" /> {preflight ? "re-checking" : "checking"}
                </span>
              )}
              {!preflightBusy && preflight && preflight.ok && (
                <span className="aws-done-pill" style={{ marginLeft: "auto" }}>✓ ready to deploy</span>
              )}
              {!preflightBusy && preflight && !preflight.ok && (
                <span className="aws-fail-pill" style={{ marginLeft: "auto" }}>✗ fix the red rows</span>
              )}
            </div>
            {preflight && (
              <div className="aws-preflight-rows">
                {preflight.checks.map(c => (
                  <div key={c.name} className={`aws-preflight-row ${c.ok ? "ok" : "fail"}`}>
                    <span className="aws-preflight-mark">{c.ok ? "✓" : "✗"}</span>
                    <span className="aws-preflight-label">{c.label}</span>
                    <span className="aws-preflight-detail">{c.detail}</span>
                    {!c.ok && c.hint && <div className="aws-preflight-hint">{c.hint}</div>}
                  </div>
                ))}
              </div>
            )}
            <div className="aws-preflight-actions">
              <button className="btn btn-ghost" onClick={() => void runPreflight()} disabled={preflightBusy}>
                <i className="ti ti-refresh" aria-hidden="true" /> Re-check
              </button>
              {preflight && preflight.ok && !startedRef.current && (
                <button className="btn btn-run" onClick={kickoff}>
                  <i className="ti ti-rocket" aria-hidden="true" /> Deploy now
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div className="section-label">AWS pipeline</div>
      {state && (
        <div className="aws-deploy-card">
          <div className="aws-deploy-head">
            <i className="ti ti-brand-aws" aria-hidden="true" />
            <span>AWS ECS Fargate deploy</span>
            {state.running && (
              <span className="aws-running-pill">
                <span className="spin" /> running
              </span>
            )}
            {state.finished && state.ok && <span className="aws-done-pill">✓ live</span>}
            {state.finished && !state.ok && <span className="aws-fail-pill">✗ failed</span>}
          </div>
          <div className="pr-pipeline aws-pipeline">
            {state.stages.map(s => <StageRow key={s.name} stage={s} />)}
          </div>
          {metaBits.length > 0 && <div className="gh-push-meta" style={{ marginTop: 8 }}>{metaBits}</div>}
          {state.finished && state.ok && alb && (
            <div className="notif n-info" style={{ marginTop: ".75rem" }}>
              <i className="ti ti-rocket" aria-hidden="true" />
              Deployed:&nbsp;
              <a href={alb} target="_blank" rel="noopener" className="gh-push-link" style={{ marginLeft: 6 }}>{alb}</a>
            </div>
          )}
          {state.finished && !state.ok && (
            <div className="notif n-danger" style={{ marginTop: ".75rem" }}>
              <i className="ti ti-alert-triangle" aria-hidden="true" />
              Deploy failed: {state.error || "unknown error"}
            </div>
          )}
        </div>
      )}

      {!state && (status === "active" || status === "running") && (
        <div className="notif n-info">
          <i className="ti ti-loader-2" aria-hidden="true" /> Kicking off Terraform…
        </div>
      )}

      {state && state.running && (
        <div style={{ fontSize: 9.5, color: "var(--text3)", marginTop: ".5rem" }}>
          Streaming live status every 2s · safe to navigate away
        </div>
      )}

      {status === "rejected" && (
        <div className="appr-bar">
          <button className="btn btn-run" onClick={retry}
                  disabled={gate.gated && !gate.verified}
                  title={gate.gated && !gate.verified ? "Verify the rejection reason first" : undefined}>
            <i className="ti ti-refresh" aria-hidden="true" /> Retry deploy
          </button>
          {prev && (
            <button className="btn btn-ghost" onClick={backPhase}>
              <i className="ti ti-arrow-back-up" aria-hidden="true" /> Back to {prev.label}
            </button>
          )}
        </div>
      )}

      {status === "done" && state?.finished && state.ok && (
        <div className="appr-bar">
          <button className="btn btn-no" onClick={destroy} disabled={destroying}>
            <i className="ti ti-flame" aria-hidden="true" /> {destroying ? "Destroying…" : "Destroy AWS resources"}
          </button>
        </div>
      )}

      {(status === "pending" || status === "done") && DOCS.deploy && (
        <><div className="dvdr" /><DocViewer pid="deploy" /></>
      )}
    </>
  );
}

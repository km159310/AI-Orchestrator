"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useActions } from "@/lib/useActions";
import { RejectControl } from "../RejectControl";
import { RejectedBanner, useRejectionGate } from "../RejectedBanner";
import { PrTracker } from "../PrTracker";
import { FEATURE_STAGES, MASTER_STAGES } from "@/data/prStages";
import { PHASES } from "@/data/phases";
import type { PhaseStatus, PrStageStatus } from "@/lib/types";

interface Props { status: PhaseStatus }

const STAGE_TICK_MS = 300;     // time each stage spends in "running" before flipping to "done"
const STAGE_START_DELAY_MS = 60;

function StageRow({ idx, name, status }: { idx: number; name: string; status: PrStageStatus }) {
  const dotCls   = status === "done" ? "pr-stage-dot done" : status === "running" ? "pr-stage-dot running" : "pr-stage-dot idle";
  const stateTxt = status === "done" ? "✓ Done" : status === "running" ? "● Running" : "Pending";
  const stateCls = status === "done" ? "pr-stage-state done" : status === "running" ? "pr-stage-state running" : "pr-stage-state idle";
  return (
    <div className={`pr-stage-row ${status}`}>
      <span className={dotCls} />
      <span className="pr-stage-idx">{String(idx + 1).padStart(2, "0")}</span>
      <span className="pr-stage-name">{name}</span>
      <span className={stateCls}>{stateTxt}</span>
    </div>
  );
}

export function PrPhase({ status }: Props) {
  const cur = useStore(s => s.cur);
  const prPipeline = useStore(s => s.prPipeline);
  const setStatus = useStore(s => s.setStatus);
  const addLog = useStore(s => s.addLog);
  const setPrFeatureStarted = useStore(s => s.setPrFeatureStarted);
  const setPrFeatureStage = useStore(s => s.setPrFeatureStage);
  const setPrPeerReviewed = useStore(s => s.setPrPeerReviewed);
  const setPrMasterStarted = useStore(s => s.setPrMasterStarted);
  const setPrMasterStage = useStore(s => s.setPrMasterStage);
  const { approvePhase, backPhase } = useActions();
  const gate = useRejectionGate("pr", status);
  const prev = PHASES[cur - 1];

  const featureDone = prPipeline.featureStages.every(s => s === "done");
  const masterDone  = prPipeline.masterStages.every(s => s === "done");
  const phaseReady  = prPipeline.peerReviewed && masterDone;

  // Phase entered → kick off feature-branch pipeline.
  useEffect(() => {
    if (status !== "active" && status !== "running" && status !== "rejected") return;
    if (gate.gated && !gate.verified) return;
    if (prPipeline.featureStarted) return;
    setPrFeatureStarted(true);
    setStatus(cur, "running");
    addLog("PR: feature branch pipeline started", "info");
  }, [status, gate.gated, gate.verified, prPipeline.featureStarted, setPrFeatureStarted, setStatus, cur, addLog]);

  // Advance the feature-branch stages one at a time.
  useEffect(() => {
    if (!prPipeline.featureStarted) return;
    if (status === "rejected") return;
    const idx = prPipeline.featureStages.findIndex(s => s !== "done");
    if (idx === -1) return; // all stages done — waiting for peer review
    const cur = prPipeline.featureStages[idx];
    if (cur === "idle") {
      const t = window.setTimeout(() => setPrFeatureStage(idx, "running"), STAGE_START_DELAY_MS);
      return () => window.clearTimeout(t);
    }
    if (cur === "running") {
      const t = window.setTimeout(() => {
        setPrFeatureStage(idx, "done");
        addLog(`PR feature ✓ ${FEATURE_STAGES[idx]}`, "success");
      }, STAGE_TICK_MS);
      return () => window.clearTimeout(t);
    }
  }, [prPipeline.featureStarted, prPipeline.featureStages, status, setPrFeatureStage, addLog]);

  // Peer review approved → start master-branch pipeline.
  useEffect(() => {
    if (!prPipeline.peerReviewed) return;
    if (prPipeline.masterStarted) return;
    setPrMasterStarted(true);
    addLog("PR: merged to main — master branch pipeline started", "info");
  }, [prPipeline.peerReviewed, prPipeline.masterStarted, setPrMasterStarted, addLog]);

  // Advance the master-branch stages one at a time.
  useEffect(() => {
    if (!prPipeline.masterStarted) return;
    if (status === "rejected") return;
    const idx = prPipeline.masterStages.findIndex(s => s !== "done");
    if (idx === -1) return; // all master stages done — waiting for human approve
    const cur = prPipeline.masterStages[idx];
    if (cur === "idle") {
      const t = window.setTimeout(() => setPrMasterStage(idx, "running"), STAGE_START_DELAY_MS);
      return () => window.clearTimeout(t);
    }
    if (cur === "running") {
      const t = window.setTimeout(() => {
        setPrMasterStage(idx, "done");
        addLog(`PR master ✓ ${MASTER_STAGES[idx]}`, "success");
      }, STAGE_TICK_MS);
      return () => window.clearTimeout(t);
    }
  }, [prPipeline.masterStarted, prPipeline.masterStages, status, setPrMasterStage, addLog]);

  // Flip the phase to "pending" once the master pipeline finishes,
  // so the badge + activity log accurately reflect "awaiting approval".
  useEffect(() => {
    if (!masterDone) return;
    if (status === "pending" || status === "done") return;
    setStatus(cur, "pending");
    addLog("PR: master pipeline complete — awaiting final approval", "warn");
  }, [masterDone, status, setStatus, cur, addLog]);

  const onPeerApprove = () => {
    setPrPeerReviewed(true);
    addLog("PR: peer review approved — merging feature → main", "success");
  };

  if (status === "locked") {
    return (
      <div className="notif n-info">
        <i className="ti ti-lock" aria-hidden="true" /> Locked — approve the previous phase to unlock this one.
      </div>
    );
  }

  return (
    <>
      {status === "done" && (
        <div className="success-banner">
          <i className="ti ti-circle-check" style={{ fontSize: 16 }} aria-hidden="true" />
          PR approved — PAR Approval triggered automatically.
        </div>
      )}
      {status === "rejected" && <RejectedBanner pid="pr" />}

      <PrTracker />

      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: ".875rem", lineHeight: 1.6 }}>
        Feature branch runs the CI pipeline, peer review gates the merge to main, then the master branch re-runs the pipeline plus a production-readiness check before the final approval.
      </div>

      <div className="section-label">
        <i className="ti ti-git-branch" aria-hidden="true" /> Feature branch pipeline
      </div>
      <div className="pr-pipeline">
        {FEATURE_STAGES.map((name, i) => (
          <StageRow key={`f-${i}`} idx={i} name={name} status={prPipeline.featureStages[i]} />
        ))}
      </div>

      {/* Peer review gate — between feature and master pipelines. */}
      {featureDone && !prPipeline.peerReviewed && (
        <>
          <div className="dvdr" />
          <div className="section-label">
            <i className="ti ti-user-check" aria-hidden="true" /> Peer review — Team Leader
          </div>
          <div className="sign-box">
            <div className="sign-row">
              <div className="sign-av" style={{ background: "rgba(37,99,235,.15)", color: "var(--cyan)" }}>TL</div>
              <div style={{ flex: 1 }}>
                <div className="sign-name">Team Leader</div>
                <div className="sign-role">Reviews PR diff, comments, and CI artefacts before merging feature → main.</div>
              </div>
              <button className="btn btn-ok" style={{ marginLeft: 8 }} onClick={onPeerApprove}>
                <i className="ti ti-git-merge" aria-hidden="true" /> Approve PR &amp; Merge
              </button>
            </div>
          </div>
          <div className="appr-bar">
            <RejectControl />
          </div>
        </>
      )}

      {prPipeline.peerReviewed && (
        <div className="notif n-info" style={{ marginTop: ".5rem" }}>
          <i className="ti ti-git-merge" aria-hidden="true" /> Merged feature → main — master pipeline running.
        </div>
      )}

      {prPipeline.masterStarted && (
        <>
          <div className="dvdr" />
          <div className="section-label">
            <i className="ti ti-git-commit" aria-hidden="true" /> Master branch pipeline
          </div>
          <div className="pr-pipeline">
            {MASTER_STAGES.map((name, i) => (
              <StageRow key={`m-${i}`} idx={i} name={name} status={prPipeline.masterStages[i]} />
            ))}
          </div>
        </>
      )}

      {phaseReady && status !== "done" && (
        <>
          <div className="dvdr" />
          <div className="notif n-warn" style={{ marginTop: ".5rem" }}>
            <i className="ti ti-clock" aria-hidden="true" /> Production readiness check passed — final approval required to advance to PAR Approval.
          </div>
          <div className="appr-bar">
            <button className="btn btn-ok" onClick={approvePhase}>
              <i className="ti ti-circle-check" aria-hidden="true" /> Approve &amp; advance to PAR
            </button>
            <RejectControl />
          </div>
        </>
      )}

      {status === "rejected" && prev && (
        <div className="appr-bar">
          <button className="btn btn-ghost" onClick={backPhase}
                  disabled={gate.gated && !gate.verified}
                  title={gate.gated && !gate.verified ? "Verify the rejection reason first" : undefined}>
            <i className="ti ti-arrow-back-up" aria-hidden="true" /> Back to {prev.label}
          </button>
        </div>
      )}
    </>
  );
}

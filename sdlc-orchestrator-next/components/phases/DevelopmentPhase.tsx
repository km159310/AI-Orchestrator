"use client";
import { useStore } from "@/lib/store";
import { useActions } from "@/lib/useActions";
import { AgentGrid } from "../AgentGrid";
import { BankApp } from "../BankApp";
import { DocViewer } from "../DocViewer";
import { SignOff } from "../SignOff";
import { RejectedBanner, useRejectionGate } from "../RejectedBanner";
import { PHASES } from "@/data/phases";
import type { DeployEnv, PhaseStatus } from "@/lib/types";

interface Props { status: PhaseStatus }

export function DevelopmentPhase({ status }: Props) {
  const cur = useStore(s => s.cur);
  const deployEnv = useStore(s => s.deployEnv);
  const { startAgents, selectEnv, backPhase } = useActions();
  const prev = PHASES[cur - 1];
  const gate = useRejectionGate("dev", status);

  const pickEnv = (env: NonNullable<DeployEnv>) => {
    selectEnv(env);
    if ((status === "active" || status === "rejected") && (!gate.gated || gate.verified)) {
      window.setTimeout(() => startAgents("dev"), 250);
    }
  };

  return (
    <>
      {status === "done" && (
        <div className="success-banner">
          <i className="ti ti-circle-check" style={{ fontSize: 16 }} aria-hidden="true" />
          Development approved — Testing phase triggered.
        </div>
      )}
      {status === "rejected" && <RejectedBanner pid="dev" />}

      <div className="section-label">Deployment environment</div>

      {!deployEnv && (status === "active" || status === "rejected") ? (
        <div className="ch-row">
          <button className="ch-btn" onClick={() => pickEnv("local")}>
            <div className="ch-ico"><i className="ti ti-device-laptop" aria-hidden="true" /></div>
            <div>
              <div className="ch-title">Localhost</div>
              <div className="ch-sub">PORT=3001 &amp; :3002 multi-port</div>
            </div>
          </button>
          <button className="ch-btn" onClick={() => pickEnv("fargate")}>
            <div className="ch-ico"><i className="ti ti-brand-aws" aria-hidden="true" /></div>
            <div>
              <div className="ch-title">AWS Fargate ECS</div>
              <div className="ch-sub">Containerised multi-port</div>
            </div>
          </button>
        </div>
      ) : deployEnv ? (
        <div className="notif n-info">
          <i className={`ti ${deployEnv === "fargate" ? "ti-brand-aws" : "ti-device-laptop"}`} aria-hidden="true" />
          {deployEnv === "fargate"
            ? "AWS Fargate ECS — multi-port task definitions"
            : "Localhost — PORT=3001 node server.js & PORT=3002 node server.js"}
        </div>
      ) : null}

      <div className="dvdr" />
      <div className="section-label">Phases</div>
      <AgentGrid pid="dev" showStream={status === "running"} />
      <BankApp />

      {(status === "active" || status === "rejected") && deployEnv && (
        <div className="appr-bar">
          <button className="btn btn-run" onClick={() => startAgents("dev")}
                  disabled={gate.gated && !gate.verified}
                  title={gate.gated && !gate.verified ? "Verify the rejection reason first" : undefined}>
            <i className="ti ti-player-play" aria-hidden="true" /> Run phases
          </button>
          {status === "rejected" && prev && (
            <button className="btn btn-ghost" onClick={backPhase}
                    disabled={gate.gated && !gate.verified}
                    title={gate.gated && !gate.verified ? "Verify the rejection reason first" : undefined}>
              <i className="ti ti-arrow-back-up" aria-hidden="true" /> Back to {prev.label}
            </button>
          )}
        </div>
      )}
      {status === "active" && !deployEnv && (
        <div style={{ fontSize: 9.5, color: "var(--text3)", marginTop: ".375rem" }}>
          ↑ Select environment first.
        </div>
      )}

      {status === "pending" && (
        <>
          <div className="notif n-warn" style={{ marginTop: ".5rem" }}>
            <i className="ti ti-clock" aria-hidden="true" /> Agents complete — human sign-off required.
          </div>
          <div className="dvdr" />
          <DocViewer pid="dev" />
          <div className="dvdr" />
          <SignOff pid="dev" />
        </>
      )}
      {status === "done" && (
        <>
          <div className="dvdr" />
          <DocViewer pid="dev" />
        </>
      )}
    </>
  );
}

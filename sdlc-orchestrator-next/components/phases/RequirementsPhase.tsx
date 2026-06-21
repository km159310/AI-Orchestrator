"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useActions } from "@/lib/useActions";
import { BrdInput } from "../BrdInput";
import { AgentGrid } from "../AgentGrid";
import { DocViewer } from "../DocViewer";
import { SignOff } from "../SignOff";
import { RejectedBanner, useRejectionGate } from "../RejectedBanner";
import { LOB_LIST, BIZ_APP_LIST, PROJECT_LIST } from "@/data/catalog";
import type { PhaseStatus, TechStack } from "@/lib/types";

interface Props { status: PhaseStatus }

const STACKS: { id: NonNullable<TechStack>; title: string; sub: string; icon: string }[] = [
  { id: "java",   title: "Java / J2EE", sub: "Spring · JPA · Tomcat",  icon: "ti-coffee" },
  { id: "python", title: "Python",      sub: "FastAPI / Django · pip", icon: "ti-brand-python" },
  { id: "dotnet", title: ".NET",        sub: "C# · ASP.NET · NuGet",   icon: "ti-brand-c-sharp" },
];

export function RequirementsPhase({ status }: Props) {
  const brd = useStore(s => s.brd);
  const projectType = useStore(s => s.projectType);
  const techStack = useStore(s => s.techStack);
  const lob = useStore(s => s.lob);
  const bizApp = useStore(s => s.bizApp);
  const project = useStore(s => s.project);
  const setLob = useStore(s => s.setLob);
  const setBizApp = useStore(s => s.setBizApp);
  const setProject = useStore(s => s.setProject);
  const { startAgents, selectProject, selectTechStack } = useActions();
  const gate = useRejectionGate("req", status);

  const isActiveOrRejected = status === "active" || status === "rejected";
  const stackReady = projectType !== "new" || !!techStack;
  const stackInfo = STACKS.find(s => s.id === techStack);
  const appIdentityReady =
    !!projectType &&
    lob.trim().length > 0 &&
    bizApp.trim().length > 0 &&
    (projectType !== "old" || project.trim().length > 0);
  const needsStack = !!brd.extracted && projectType === "new" && !techStack;
  const needsAppIdentity = !!brd.extracted && !!projectType && !appIdentityReady;

  const tryAutoStart = () => {
    if (!isActiveOrRejected) return;
    if (gate.gated && !gate.verified) return;
    const s = useStore.getState();
    const ready =
      !!s.projectType &&
      s.lob.trim().length > 0 &&
      s.bizApp.trim().length > 0 &&
      (s.projectType !== "old" || s.project.trim().length > 0);
    if (!ready) return;
    const stackOk = s.projectType !== "new" || !!s.techStack;
    if (!stackOk) return;
    window.setTimeout(() => startAgents("req"), 250);
  };

  const pickStack = (id: NonNullable<TechStack>) => {
    selectTechStack(id);
    window.setTimeout(tryAutoStart, 50);
  };

  // For existing projects, the requirement agents kick off automatically
  // once the BRD "Validate Requirement" submit completes (i.e. once
  // brd.extracted populates). Application identity is already captured
  // before BRD input in this flow, so we just gate on the phase status
  // and the rejection verification.
  useEffect(() => {
    if (projectType !== "old") return;
    if (!brd.extracted) return;
    if (!isActiveOrRejected) return;
    if (gate.gated && !gate.verified) return;
    if (!appIdentityReady) return;
    const t = window.setTimeout(() => startAgents("req"), 350);
    return () => window.clearTimeout(t);
  }, [brd.extracted, projectType, isActiveOrRejected, gate.gated, gate.verified, appIdentityReady, startAgents]);

  // Same Application identity form is rendered in two slots depending on
  // project type — before BRD input for existing projects, after BRD
  // extraction for new projects.
  const appIdentitySection = (
    <>
      <div className="dvdr" />
      <div className="section-label">Application identity</div>
      <div className="form-row">
        <label className="form-field">
          <span className="form-lbl">LOB</span>
          <select
            className="form-input"
            value={lob}
            onChange={e => {
              setLob(e.target.value);
              window.setTimeout(tryAutoStart, 50);
            }}
          >
            <option value="">— Select LOB —</option>
            {LOB_LIST.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span className="form-lbl">Business application</span>
          <select
            className="form-input"
            value={bizApp}
            onChange={e => {
              setBizApp(e.target.value);
              window.setTimeout(tryAutoStart, 50);
            }}
          >
            <option value="">— Select Business Application —</option>
            {BIZ_APP_LIST.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        {projectType === "old" && (
          <label className="form-field">
            <span className="form-lbl">Project</span>
            <select
              className="form-input"
              value={project}
              onChange={e => {
                setProject(e.target.value);
                window.setTimeout(tryAutoStart, 50);
              }}
            >
              <option value="">— Select Project —</option>
              {PROJECT_LIST.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        )}
      </div>
      {appIdentityReady && (
        <div className="notif n-info" style={{ marginTop: ".5rem" }}>
          <i className="ti ti-id-badge" aria-hidden="true" />
          <strong style={{ marginLeft: 4 }}>{lob}</strong>
          <span style={{ margin: "0 6px", color: "var(--text3)" }}>·</span>
          {bizApp}
          {projectType === "old" && project && (
            <>
              <span style={{ margin: "0 6px", color: "var(--text3)" }}>·</span>
              {project}
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {status === "done" && (
        <div className="success-banner">
          <i className="ti ti-circle-check" style={{ fontSize: 16 }} aria-hidden="true" />
          Requirements approved — Design phase triggered automatically.
        </div>
      )}
      {status === "rejected" && <RejectedBanner pid="req" />}

      {/* Project type — shown first, before BRD input */}
      <div className="section-label">Project type</div>
      {!projectType && isActiveOrRejected ? (
        <div className="ch-row">
          <button className="ch-btn" onClick={() => selectProject("new")}>
            <div className="ch-ico"><i className="ti ti-sparkles" aria-hidden="true" /></div>
            <div>
              <div className="ch-title">New project</div>
              <div className="ch-sub">Greenfield from scratch</div>
            </div>
          </button>
          <button className="ch-btn" onClick={() => selectProject("old")}>
            <div className="ch-ico"><i className="ti ti-git-branch" aria-hidden="true" /></div>
            <div>
              <div className="ch-title">Existing project</div>
              <div className="ch-sub">Feature branch + PR agent</div>
            </div>
          </button>
        </div>
      ) : projectType ? (
        <div className="notif n-info">
          <i className={`ti ${projectType === "new" ? "ti-sparkles" : "ti-git-branch"}`} aria-hidden="true" />
          {projectType === "new" ? "New project — greenfield" : "Existing project"}
        </div>
      ) : null}

      {/* Application identity — captured up-front before BRD input for both new and existing projects */}
      {projectType && appIdentitySection}

      <div className="dvdr" />
      <div className="section-label">BRD / Requirements input</div>
      <BrdInput />

      {/* Tech stack picker — only when "new project" is chosen, after requirements extracted */}
      {brd.extracted && projectType === "new" && (
        <>
          <div className="dvdr" />
          <div className="section-label">Technology stack</div>
          {!techStack && isActiveOrRejected ? (
            <div className="ch-row ch-row-3">
              {STACKS.map(t => (
                <button key={t.id} className="ch-btn" onClick={() => pickStack(t.id)}>
                  <div className="ch-ico"><i className={`ti ${t.icon}`} aria-hidden="true" /></div>
                  <div>
                    <div className="ch-title">{t.title}</div>
                    <div className="ch-sub">{t.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : techStack && stackInfo ? (
            <div className="notif n-info">
              <i className={`ti ${stackInfo.icon}`} aria-hidden="true" />
              Stack: <strong style={{ marginLeft: 4 }}>{stackInfo.title}</strong>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text3)" }}>{stackInfo.sub}</span>
            </div>
          ) : null}
        </>
      )}

      {brd.extracted && projectType && stackReady && appIdentityReady ? (
        <>
          <div className="dvdr" />
          <div className="section-label">Phases</div>
          <AgentGrid pid="req" showStream={status === "running"} />
          {isActiveOrRejected && (
            <div className="appr-bar">
              <button className="btn btn-run" onClick={() => startAgents("req")}
                      disabled={gate.gated && !gate.verified}
                      title={gate.gated && !gate.verified ? "Verify the rejection reason first" : undefined}>
                <i className="ti ti-player-play" aria-hidden="true" /> Run phases
              </button>
            </div>
          )}
        </>
      ) : brd.extracted && !projectType ? (
        <div style={{ fontSize: 9.5, color: "var(--text3)", marginTop: ".375rem" }}>
          ↑ Select project type to continue.
        </div>
      ) : needsAppIdentity ? (
        <div style={{ fontSize: 9.5, color: "var(--text3)", marginTop: ".375rem" }}>
          ↑ Select {projectType === "old" ? "LOB, Business application and Project" : "LOB and Business application"} to continue.
        </div>
      ) : needsStack ? (
        <div style={{ fontSize: 9.5, color: "var(--text3)", marginTop: ".375rem" }}>
          ↑ Select a technology stack to continue.
        </div>
      ) : null}

      {status === "pending" && (<><div className="dvdr" /><DocViewer pid="req" /><SignOff pid="req" /></>)}
      {status === "done" && <DocViewer pid="req" />}
    </>
  );
}

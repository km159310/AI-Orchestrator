import { useCallback } from "react";
import { useStore } from "./store";
import { useAgentRunner } from "./useAgentRunner";
import { api } from "./api";
import { PHASES } from "@/data/phases";
import { DEV_UNIT_TEST_RERUN_STREAM } from "@/data/streams";
import type { DeployEnv, PhaseId, ProjectType, TechStack } from "./types";

const TECH_LABEL: Record<NonNullable<TechStack>, string> = {
  java:   "Java / J2EE",
  python: "Python",
  dotnet: ".NET",
};

// Higher-level orchestration actions used by the UI. Wraps the store +
// agent-timer simulation + bank-app HTTP api into one cohesive set.
export function useActions() {
  const runner = useAgentRunner();

  const startAgents = useCallback((pid: PhaseId) => {
    const s = useStore.getState();
    const phaseIndex = PHASES.findIndex(p => p.id === pid);
    if (phaseIndex < 0) return;
    const label = PHASES.find(p => p.id === pid)?.label ?? pid;
    // Pin status changes to the agent-owning phase (phaseIndex), not the
    // currently-viewed phase (s.cur), so navigating away mid-run (e.g.
    // peeking at Dashboard & Observability via the eye icon) doesn't move
    // "running"/"pending" onto the wrong phase and hide its SignOff.
    s.setStatus(phaseIndex, "running");
    s.initAgents(pid);

    // Dev re-run after a rejection: keep the other dev agents as "done"
    // (their first-run artefacts still stand) and re-run only the Unit
    // Test agent with the higher-coverage stream + report.
    const isDevRerun = pid === "dev" && s.devRunCount >= 1;
    if (isDevRerun) {
      s.updateAgent(pid, "ut", { status: "idle", progress: 0, lines: [] });
    } else {
      s.resetAgents(pid);
    }
    if (pid === "dev") s.incrementDevRunCount();

    s.addLog(
      isDevRerun
        ? `${label}: re-running Unit Test agent only`
        : `${label}: agents started`,
      "info",
    );

    runner.run(
      pid,
      () => {
        const st = useStore.getState();
        // Release Review and Dashboard & Observability are fully automated
        // — no stakeholder sign-off, no Approve/Reject. Jump straight to
        // "done" and auto-trigger the next phase (if any). Deploy now
        // runs a real Terraform + ECR + ECS pipeline driven by
        // DeployPhase.tsx and the /api/deploy/aws endpoints.
        if (pid === "review" || pid === "monitor") {
          st.setStatus(phaseIndex, "done");
          st.clearRejection(pid);
          st.addLog(`${label}: all agents complete — auto-advancing (no sign-off required)`, "success");
          const next = phaseIndex + 1;
          if (next < PHASES.length) {
            st.setStatus(next, "active");
            st.addLog(`→ Auto-triggering ${PHASES[next].label}…`, "info");
            window.setTimeout(() => {
              const inner = useStore.getState();
              inner.jumpPhase(next);
              inner.setAutoTriggered(PHASES[next].id, true);
              window.setTimeout(() => startAgents(PHASES[next].id), 500);
            }, 500);
          } else {
            st.addLog("🎉 ABC Bank pipeline complete!", "success");
          }
          return;
        }
        st.setStatus(phaseIndex, "pending");
        st.addLog(`${label}: all agents complete — awaiting approval`, "warn");
        if (pid === "dev" && !isDevRerun) generateBankApp();
      },
      isDevRerun
        ? { onlyAgentIds: ["ut"], streamOverride: { ut: DEV_UNIT_TEST_RERUN_STREAM } }
        : undefined,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runner]);

  const approvePhase = useCallback(() => {
    const s = useStore.getState();
    const ph = PHASES[s.cur];
    s.setStatus(s.cur, "done");
    s.clearRejection(ph.id);
    s.addLog(`✓ ${ph.label} approved`, "success");

    const next = s.cur + 1;
    if (next < PHASES.length) {
      s.setStatus(next, "active");
      s.addLog(`→ Auto-triggering ${PHASES[next].label}…`, "info");
      // dev needs an env choice from the user; pr drives its own
      // pipeline animation inside PrPhase; deploy kicks off the real
      // Terraform/AWS pipeline from DeployPhase — none of these need
      // startAgents to fire fake agents.
      const needsChoice = PHASES[next].id === "dev" || PHASES[next].id === "pr" || PHASES[next].id === "deploy";
      if (!needsChoice) {
        window.setTimeout(() => {
          const inner = useStore.getState();
          inner.jumpPhase(next);
          inner.setAutoTriggered(PHASES[next].id, true);
          window.setTimeout(() => startAgents(PHASES[next].id), 500);
        }, 500);
      } else {
        window.setTimeout(() => {
          useStore.getState().jumpPhase(next);
        }, 500);
      }
    } else {
      s.addLog("🎉 ABC Bank pipeline complete!", "success");
    }
  }, [startAgents]);

  const rejectPhase = useCallback((reason?: string) => {
    const s = useStore.getState();
    const ph = PHASES[s.cur];
    const trimmed = (reason ?? "").trim();
    s.setStatus(s.cur, "rejected");
    s.setApprovers(ph.id, {});
    s.setRejection(ph.id, { reason: trimmed, verified: false });
    const suffix = trimmed ? `: ${trimmed}` : "";
    s.addLog(`✗ ${ph.label} rejected${suffix}`, "danger");
  }, []);

  const verifyRejection = useCallback((value: boolean) => {
    const s = useStore.getState();
    const ph = PHASES[s.cur];
    s.setRejection(ph.id, { verified: value });
    if (value) {
      s.addLog(`Rejection reason for ${ph.label} marked as verified`, "info");
    }
  }, []);

  const backPhase = useCallback(() => {
    const s = useStore.getState();
    if (s.cur === 0) return;
    const prev = s.cur - 1;
    s.setStatus(prev, "active");
    s.addLog(`↩ Back to ${PHASES[prev].label} — please revise`, "info");
    s.jumpPhase(prev);
  }, []);

  const selectProject = useCallback((t: ProjectType) => {
    const s = useStore.getState();
    s.setProjectType(t);
    if (t === "old") {
      s.setPr({ branch: "Application/branch" });
      s.addLog("PR: branch Application/branch created", "info");
    } else {
      // Switching to new clears any previously chosen stack.
      s.setTechStack(null);
    }
    s.addLog(`Project: ${t === "new" ? "Greenfield" : "Existing + PR agent"}`, "info");
  }, []);

  const selectTechStack = useCallback((stack: TechStack) => {
    const s = useStore.getState();
    s.setTechStack(stack);
    if (stack) s.addLog(`Stack: ${TECH_LABEL[stack]}`, "info");
  }, []);

  const selectEnv = useCallback((e: DeployEnv) => {
    const s = useStore.getState();
    s.setDeployEnv(e);
    s.addLog(`Env: ${e === "local" ? "Localhost (multi-port)" : "AWS Fargate ECS"}`, "info");
  }, []);

  const hardReset = useCallback(async () => {
    try {
      const ports = useStore.getState().bankApp.ports.slice();
      await Promise.all(ports.map(p => api.stop(p).catch(() => null)));
    } catch (_) { /* swallow */ }
    runner.clearAll();
    useStore.getState().reset();
    useStore.getState().addLog("Orchestrator reset — Requirements phase active", "info");
  }, [runner]);

  // ── Bank-app actions ──────────────────────────────────────
  const generateBankApp = useCallback(async () => {
    const s = useStore.getState();
    if (s.bankApp.generated || s.bankApp.generating) return;
    s.setBankApp({ generating: true, lastError: null });
    const detected = s.brd.extracted?.detectedFeatures ?? [];
    const featureKeys = detected.map(f => f.key);
    if (featureKeys.length) {
      s.addLog(
        `Materialising ABC Bank application with feature${featureKeys.length > 1 ? "s" : ""}: ${detected.map(f => f.label).join(", ")}…`,
        "info"
      );
    } else {
      s.addLog("Materialising ABC Bank application…", "info");
    }
    try {
      const res = await api.generateApp(featureKeys);
      useStore.getState().setBankApp({
        generating: false,
        generated: true,
        path: res.path,
        files: res.files || [],
      });
      const featSuffix = (res.features && res.features.length)
        ? ` (features: ${res.features.join(", ")})`
        : "";
      useStore.getState().addLog(
        `✓ ABC Bank app generated — ${(res.files || []).length} files${featSuffix}`,
        "success"
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      useStore.getState().setBankApp({ generating: false, lastError: msg });
      useStore.getState().addLog("App generation failed: " + msg, "danger");
    }
  }, []);

  const launchBankApp = useCallback(async (port: number) => {
    useStore.getState().setBankApp({ launching: port });
    try {
      const res = await api.launch(port);
      if (!res.ok) throw new Error(res.error || "launch failed");
      const ports = useStore.getState().bankApp.ports.slice();
      if (!ports.includes(port)) ports.push(port);
      ports.sort((a, b) => a - b);
      useStore.getState().setBankApp({ launching: null, ports });
      useStore.getState().addLog(`▶ ABC Bank running on http://localhost:${port}/`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      useStore.getState().setBankApp({ launching: null, lastError: msg });
      useStore.getState().addLog(`Launch failed on :${port} — ${msg}`, "danger");
    }
  }, []);

  const stopBankApp = useCallback(async (port: number) => {
    try {
      await api.stop(port);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      useStore.getState().addLog("Stop failed: " + msg, "warn");
    }
    const ports = useStore.getState().bankApp.ports.filter(p => p !== port);
    useStore.getState().setBankApp({ ports });
    useStore.getState().addLog(`■ Stopped ABC Bank on :${port}`, "info");
  }, []);

  const initBankApp = useCallback(async () => {
    try {
      const res = await api.status();
      if (res && Array.isArray(res.ports) && res.ports.length) {
        useStore.getState().setBankApp({
          generated: true,
          ports: res.ports.slice().sort((a, b) => a - b),
        });
      }
    } catch (_) { /* old http.server returns 404 — ignore */ }
  }, []);

  return {
    startAgents,
    approvePhase,
    rejectPhase,
    verifyRejection,
    backPhase,
    selectProject,
    selectTechStack,
    selectEnv,
    hardReset,
    generateBankApp,
    launchBankApp,
    stopBankApp,
    initBankApp,
  };
}

// src/app.js — Main orchestrator controller
const App = (() => {
  const BADGE_MAP = {
    active:   ['b-active',   '● Active'],
    running:  ['b-running',  '<span class="spin"></span> Running'],
    pending:  ['b-pending',  '⏳ Pending Approval'],
    done:     ['b-done',     '✓ Approved'],
    rejected: ['b-rejected', '✗ Rejected'],
    locked:   ['b-locked',   'Locked'],
  };
  const PH_ICON_COLOR = {
    active:   'var(--cyan)',
    running:  'var(--amber)',
    pending:  'var(--amber)',
    done:     'var(--green)',
    rejected: 'var(--red)',
    locked:   'var(--text3)',
  };

  const TECH_LABEL = { java: 'Java / J2EE', python: 'Python', dotnet: '.NET' };

  // ── Render panel ───────────────────────────────────────────
  function renderPanel() {
    const s  = State.get();
    const ph = PHASES[s.cur];
    const st = s.statuses[s.cur];
    State.initAgents(ph.id);

    const icon = document.getElementById('ph-icon');
    if (icon) { icon.className = `ti ${ph.icon}`; icon.style.color = PH_ICON_COLOR[st] || 'var(--cyan)'; }

    const titleEl = document.getElementById('panel-title');
    if (titleEl) titleEl.textContent = ph.label + ' Phase';

    // Monitor is observation-only — show as "Live" rather than the usual status badge.
    let bc, bt;
    if (ph.id === 'monitor') {
      bc = 'b-live';
      bt = '<span class="dot up"></span> Live';
    } else {
      const m = BADGE_MAP[st] || ['b-locked', 'Locked'];
      bc = m[0]; bt = m[1];
    }
    const badge = document.getElementById('panel-badge');
    if (badge) { badge.className = 'badge ' + bc; badge.innerHTML = bt; }

    // Hide the eye-peek button when already on the Monitor view.
    const eye = document.getElementById('panel-head-eye');
    if (eye) eye.style.display = ph.id === 'monitor' ? 'none' : '';

    const body = document.getElementById('panel-body');
    if (!body) return;

    if      (ph.id === 'req')    ReqPhase.render(body, st);
    else if (ph.id === 'dev')    DevPhase.render(body, st);
    else if (ph.id === 'pr')     PrPhase.render(body, st);
    else if (ph.id === 'deploy') DeployPhase.render(body, st);
    else                         GenericPhase.render(body, ph.id, st);

    if (ph.id === 'monitor') Observability.start();
    else                     Observability.stop();
  }

  // ── Jump to phase ──────────────────────────────────────────
  function jumpPhase(i) {
    const { statuses } = State.get();
    if (statuses[i] === 'locked') {
      // Monitor is observation-only — allow jumping into the preview
      // even when locked, so users can peek at activity logs / health.
      if (!PHASES[i] || PHASES[i].id !== 'monitor') return;
    }
    if (typeof RejectControl !== 'undefined') RejectControl.reset();
    State.set({ cur: i });
    Strip.render();
    renderPanel();
  }

  // ── Start agents ───────────────────────────────────────────
  function startAgents(pid) {
    const s  = State.get();
    const phIdx = PHASES.findIndex(p => p.id === pid);
    if (phIdx < 0) return;
    const ph = PHASES[phIdx];

    s.statuses[phIdx] = 'running';
    State.initAgents(pid);

    // Dev re-run after rejection: keep other dev agents "done"; re-run only
    // Unit Test with the higher-coverage stream.
    const isDevRerun = pid === 'dev' && (s.devRunCount || 0) >= 1;
    if (isDevRerun) {
      s.agState[pid].ut = { status: 'idle', progress: 0, lines: [] };
    } else {
      State.resetAgents(pid);
    }
    if (pid === 'dev') State.incrementDevRunCount();

    Logger.add(isDevRerun ? `${ph.label}: re-running Unit Test agent only` : `${ph.label}: agents started`, 'info');
    Strip.render();
    renderPanel();

    const opts = isDevRerun
      ? { onlyAgentIds: ['ut'], streamOverride: { ut: DEV_UNIT_TEST_RERUN_STREAM } }
      : undefined;

    AgentRunner.run(pid, () => {
      // Release Review and Dashboard & Observability are fully automated —
      // no sign-off, jump straight to "done" and auto-trigger the next
      // phase. Monitor is the last phase, so it just marks done.
      // Deploy is special — it kicks off a real Terraform/ECS pipeline
      // from DeployPhase.js, which flips the status when the real
      // /api/deploy/aws/status polling finishes.
      if (pid === 'review' || pid === 'monitor') {
        s.statuses[phIdx] = 'done';
        State.clearRejection(pid);
        Logger.add(`${ph.label}: all agents complete — auto-advancing (no sign-off required)`, 'success');
        const next = phIdx + 1;
        if (next < PHASES.length) {
          s.statuses[next] = 'active';
          Logger.add(`→ Auto-triggering ${PHASES[next].label}…`, 'info');
          setTimeout(() => {
            State.set({ cur: next });
            s.autoTriggered[PHASES[next].id] = true;
            Strip.render();
            renderPanel();
            // PR phase drives its own pipeline (feature/master CI ticks),
            // so we don't fire its agents the standard way. Everything else
            // — including Dashboard & Observability — auto-runs its agents
            // without waiting for a manual click.
            const nextId = PHASES[next].id;
            if (nextId !== 'pr') {
              setTimeout(() => startAgents(nextId), 500);
            }
          }, 500);
        } else {
          Logger.add('🎉 ABC Bank pipeline complete!', 'success');
          tearDownFeature();
        }
        Strip.render();
        renderPanel();
        return;
      }
      s.statuses[phIdx] = 'pending';
      Logger.add(`${ph.label}: all agents complete — awaiting approval`, 'warn');
      Strip.render();
      renderPanel();
      if (pid === 'dev' && !isDevRerun) BankApp.generate();
    }, opts);
  }

  // ── Approve phase ──────────────────────────────────────────
  function approvePhase() {
    const s  = State.get();
    const ph = PHASES[s.cur];
    s.statuses[s.cur] = 'done';
    State.clearRejection(ph.id);
    Logger.add(`✓ ${ph.label} approved`, 'success');

    const next = s.cur + 1;
    if (next < PHASES.length) {
      s.statuses[next] = 'active';
      Logger.add(`→ Auto-triggering ${PHASES[next].label}…`, 'info');
      // dev needs an env choice; pr drives its own pipeline; deploy
      // kicks off the real Terraform/AWS pipeline from DeployPhase.
      const nextId = PHASES[next].id;
      const needsChoice = nextId === 'dev' || nextId === 'pr' || nextId === 'deploy';
      if (!needsChoice) {
        setTimeout(() => {
          State.set({ cur: next });
          s.autoTriggered[nextId] = true;
          Strip.render();
          renderPanel();
          setTimeout(() => startAgents(nextId), 500);
        }, 500);
      } else {
        setTimeout(() => { State.set({ cur: next }); Strip.render(); renderPanel(); }, 500);
      }
    } else {
      Logger.add('🎉 ABC Bank pipeline complete!', 'success');
      const sl = document.getElementById('sys-label');
      if (sl) sl.textContent = 'Pipeline complete';
      Strip.render();
      renderPanel();
      tearDownFeature();
    }
  }

  // ── Reject phase ───────────────────────────────────────────
  function rejectPhase(reason) {
    const s  = State.get();
    const ph = PHASES[s.cur];
    const trimmed = (reason || '').trim();
    s.statuses[s.cur] = 'rejected';
    s.approvers[ph.id] = {};
    State.setRejection(ph.id, { reason: trimmed, verified: false });
    const suffix = trimmed ? `: ${trimmed}` : '';
    Logger.add(`✗ ${ph.label} rejected${suffix}`, 'danger');
    Strip.render();
    renderPanel();
  }

  // ── Verify rejection reason ────────────────────────────────
  function toggleRejectionVerified() {
    const s = State.get();
    const ph = PHASES[s.cur];
    const rej = s.rejections[ph.id];
    if (!rej) return;
    State.setRejection(ph.id, { verified: !rej.verified });
    if (!rej.verified) Logger.add(`Rejection reason for ${ph.label} marked as verified`, 'info');
    renderPanel();
  }

  // ── Back to previous phase ─────────────────────────────────
  function backPhase() {
    const s = State.get();
    if (s.cur === 0) return;
    const prev = s.cur - 1;
    s.statuses[prev] = 'active';
    Logger.add(`↩ Back to ${PHASES[prev].label} — please revise`, 'info');
    State.set({ cur: prev });
    Strip.render();
    renderPanel();
  }

  // ── Selection helpers ──────────────────────────────────────
  function selectProject(type) {
    const s = State.get();
    s.projectType = type;
    if (type === 'old') {
      State.setPr({ branch: 'Application/branch' });
      Logger.add('PR: branch Application/branch created', 'info');
    } else {
      // Switching to new clears any previously chosen stack
      s.techStack = null;
    }
    Logger.add(`Project: ${type === 'new' ? 'Greenfield' : 'Existing + PR agent'}`, 'info');
    renderPanel();
  }

  function _maybeAutoStartReq() {
    const s = State.get();
    if (!ReqPhase || !s) return;
    const reqIdx = PHASES.findIndex(p => p.id === 'req');
    const reqStatus = s.statuses[reqIdx];
    if (reqStatus !== 'active' && reqStatus !== 'rejected') return;
    if (RejectControl.gated('req', reqStatus)) return;
    const appIdentityReady =
      !!s.projectType &&
      (s.lob || '').trim() &&
      (s.bizApp || '').trim() &&
      (s.projectType !== 'old' || (s.project || '').trim());
    if (!appIdentityReady) return;
    if (s.projectType === 'new' && !s.techStack) return;
    if (!s.brd.extracted) return;
    setTimeout(() => startAgents('req'), 250);
  }

  function selectTechStack(stack) {
    const s = State.get();
    s.techStack = stack;
    Logger.add(`Stack: ${TECH_LABEL[stack] || stack}`, 'info');
    renderPanel();
    _maybeAutoStartReq();
  }

  function setLob(v)     { State.get().lob = v;     renderPanel(); _maybeAutoStartReq(); }
  function setBizApp(v)  { State.get().bizApp = v;  renderPanel(); _maybeAutoStartReq(); }
  function setProject(v) { State.get().project = v; renderPanel(); _maybeAutoStartReq(); }
  function afterBrdExtracted() { _maybeAutoStartReq(); }

  // Observation jump — bypass the locked gate so the monitor preview is
  // accessible from anywhere, then scroll to the Log Aggregator block.
  function viewMonitor() {
    const idx = PHASES.findIndex(p => p.id === 'monitor');
    if (idx < 0) return;
    if (typeof RejectControl !== 'undefined') RejectControl.reset();
    State.set({ cur: idx });
    Strip.render();
    renderPanel();
    setTimeout(() => {
      const el = document.getElementById('log-aggregator-view');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function selectEnv(env) {
    const s = State.get();
    s.deployEnv = env;
    Logger.add(`Env: ${env === 'local' ? 'Localhost (multi-port)' : 'AWS Fargate ECS'}`, 'info');
    renderPanel();

    const devIdx = PHASES.findIndex(p => p.id === 'dev');
    const devStatus = s.statuses[devIdx];
    const canRun = (devStatus === 'active' || devStatus === 'rejected') && !RejectControl.gated('dev', devStatus);
    if (canRun) {
      setTimeout(() => startAgents('dev'), 250);
    }
  }

  // ── Feature lifecycle ──────────────────────────────────────
  // Called once when the whole pipeline reaches its final phase. Reverts
  // generated-app/features.json on the server and clears state.feature so
  // the next run starts from the unmodified ABC Bank base. Phases stay
  // marked complete and ports stay running — the user can still inspect the
  // post-pipeline state. Use App.hardReset() for the full demo reset.
  async function tearDownFeature() {
    const f = State.get().feature;
    if (!f) return;
    Logger.add(`Pipeline complete — reverting feature "${f.title}" from ABC Bank…`, 'info');
    try {
      const r = await fetch('/api/reset-features', { method: 'POST' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (err) {
      Logger.add(`Failed to revert feature: ${err.message}`, 'danger');
      return;
    }
    State.clearFeature();
    // Restore the default PR branch so a fresh feature pick later in the
    // same session doesn't inherit the previous slug.
    State.setPr({ branch: 'Application/branch' });
    Logger.add(`✓ Feature "${f.title}" reverted — base ABC Bank app restored (refresh :3001/:3002 to confirm)`, 'success');
    renderFeatureBanner();
  }

  // Topbar chip showing the currently-active feature. Returns silently if
  // the banner container is absent (e.g. before index.html includes it).
  function renderFeatureBanner() {
    const el = document.getElementById('feature-banner');
    if (!el) return;
    const f = State.get().feature;
    if (!f) {
      el.innerHTML = '';
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.innerHTML = `
      <i class="ti ${f.icon || 'ti-sparkles'}" aria-hidden="true"></i>
      <span class="fb-label">Active feature</span>
      <span class="fb-title">${_escape(f.title)}</span>
      <span class="fb-branch">feature/${_escape(f.branchSlug)}</span>
    `;
  }

  function _escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Hard reset ─────────────────────────────────────────────
  async function hardReset() {
    try { await BankApp.stopAll(); } catch (_) {}
    try { await fetch('/api/reset-features', { method: 'POST' }); } catch (_) {}
    if (typeof AgentRunner !== 'undefined' && AgentRunner.clearAll) AgentRunner.clearAll();
    if (typeof PrPhase !== 'undefined' && PrPhase.reset) PrPhase.reset();
    if (typeof DeployPhase !== 'undefined' && DeployPhase.reset) DeployPhase.reset();
    if (typeof SignOff !== 'undefined' && SignOff._resetPushState) SignOff._resetPushState();
    State.reset();
    const sl = document.getElementById('sys-label');
    if (sl) sl.textContent = 'System online';
    Logger.add('Orchestrator reset — Requirements phase active', 'info');
    Strip.render();
    renderPanel();
    renderFeatureBanner();
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    Logger.add('AI Orchestrator online — ABC Bank project loaded', 'info');
    Strip.render();
    renderPanel();
    renderFeatureBanner();
    BankApp.init().then(() => renderPanel());
  }

  return {
    init, renderPanel, jumpPhase, startAgents, approvePhase, rejectPhase,
    toggleRejectionVerified, backPhase,
    selectProject, selectTechStack, selectEnv,
    setLob, setBizApp, setProject, afterBrdExtracted,
    viewMonitor,
    hardReset,
    tearDownFeature, renderFeatureBanner,
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);

// src/phases/generic.js
const GenericPhase = (() => {
  const DESCRIPTIONS = {
    design:  'Architect Agent, API, DB schema, and UI agents generate all design artefacts for ABC Bank.',
    test:    'Integration, load, UAT, and reporting agents validate the bank application.',
    par:     'Risk Synthesiser, Compliance Auditor, and CAB Coordinator agents prepare the Production Approval Request — stakeholder sign-off here unlocks Deployment.',
    deploy:  'Infra, container, CD pipeline, and smoke agents deploy across :3001 and :3002.',
    review:  'Post-mortem, metrics, lessons, and release-notes agents close the pipeline.',
    monitor: 'Aggregates activity logs from every phase and probes live instances for health, uptime, and latency.',
  };

  function render(body, id, st) {
    if (st === 'locked') {
      // Monitor is observation-only — let users preview activity logs and
      // live health any time, even before it's "unlocked" in the pipeline.
      if (id === 'monitor') {
        let h = Hero.render(id);
        h += `<div class="notif n-info" style="margin-bottom:.875rem">
          <i class="ti ti-eye" aria-hidden="true"></i> Preview — Dashboard & Observability becomes the active phase once Release Review is approved.
        </div>`;
        h += `<div class="section-label">Phases</div>`;
        h += AgentGrid.render(id);
        h += Observability.mount();
        h += MonitorLogs.render();
        body.innerHTML = h;
        return;
      }
      body.innerHTML = Hero.render(id) + `<div class="notif n-info"><i class="ti ti-lock" aria-hidden="true"></i> Locked — approve the previous phase to unlock this one.</div>`;
      return;
    }

    const s         = State.get();
    const nextLabel = PHASES[s.cur + 1] ? PHASES[s.cur + 1].label : 'pipeline';
    let h = Hero.render(id);

    if (st === 'done')     h += `<div class="success-banner"><i class="ti ti-circle-check" style="font-size:16px" aria-hidden="true"></i> Phase approved — ${nextLabel} triggered automatically.</div>`;
    if (st === 'rejected') h += RejectControl.renderBanner(id);
    if (st === 'running' && s.autoTriggered[id]) {
      h += `<div class="trigger-banner"><span class="spin"></span> Auto-triggered from previous phase approval — agents running…</div>`;
    }

    h += `<div style="font-size:10px;color:var(--text3);margin-bottom:.875rem;line-height:1.6">${DESCRIPTIONS[id] || ''}</div>`;
    h += `<div class="section-label">Phases</div>`;
    h += AgentGrid.render(id);
    if (st === 'running') h += AgentGrid.streamBox(id);

    if (st === 'active' || st === 'rejected') {
      const prev = PHASES[s.cur - 1];
      const disabled = RejectControl.gated(id, st) ? 'disabled title="Verify the rejection reason first"' : '';
      h += `<div class="appr-bar">
        <button class="btn btn-run" onclick="App.startAgents('${id}')" ${disabled}>
          <i class="ti ti-player-play" aria-hidden="true"></i> Run phases
        </button>
        ${st === 'rejected' && prev ? `<button class="btn btn-ghost" onclick="App.backPhase()" ${disabled}>
          <i class="ti ti-arrow-back-up" aria-hidden="true"></i> Back to ${prev.label}
        </button>` : ''}
      </div>`;
    }

    if (st === 'pending') {
      if (DOCS[id]) {
        h += `<div class="dvdr"></div>` + DocViewer.render(id) + SignOff.render(id);
      } else {
        h += `<div class="notif n-warn" style="margin-top:.5rem">
          <i class="ti ti-clock" aria-hidden="true"></i> Agents complete — sign-off required.
        </div>
        <div class="appr-bar">
          <button class="btn btn-ok" onclick="App.approvePhase()"><i class="ti ti-circle-check" aria-hidden="true"></i> Approve & advance</button>
          ${RejectControl.renderButton()}
        </div>`;
      }
    }

    if (st === 'done' && DOCS[id]) h += DocViewer.render(id);

    if (id === 'monitor') {
      h += Observability.mount();
      h += MonitorLogs.render();
    }

    body.innerHTML = h;
  }

  return { render };
})();

// src/phases/development.js
const DevPhase = (() => {
  function render(body, st) {
    const s = State.get();
    let h = Hero.render('dev');

    if (st === 'done')     h += `<div class="success-banner"><i class="ti ti-circle-check" style="font-size:16px" aria-hidden="true"></i> Development approved — Testing phase triggered.</div>`;
    if (st === 'rejected') h += RejectControl.renderBanner('dev');

    h += `<div class="section-label">Deployment environment</div>`;

    if (!s.deployEnv && (st === 'active' || st === 'rejected')) {
      h += `<div class="ch-row">
        <button class="ch-btn" onclick="App.selectEnv('local')">
          <div class="ch-ico"><i class="ti ti-device-laptop" aria-hidden="true"></i></div>
          <div><div class="ch-title">Localhost</div><div class="ch-sub">PORT=3001 &amp; :3002 multi-port</div></div>
        </button>
        <button class="ch-btn" onclick="App.selectEnv('fargate')">
          <div class="ch-ico"><i class="ti ti-brand-aws" aria-hidden="true"></i></div>
          <div><div class="ch-title">AWS Fargate ECS</div><div class="ch-sub">Containerised multi-port</div></div>
        </button>
      </div>`;
    } else if (s.deployEnv) {
      const isF = s.deployEnv === 'fargate';
      h += `<div class="notif n-info">
        <i class="ti ${isF ? 'ti-brand-aws' : 'ti-device-laptop'}" aria-hidden="true"></i>
        ${isF ? 'AWS Fargate ECS — multi-port task definitions' : 'Localhost — PORT=3001 node server.js &amp; PORT=3002 node server.js'}
      </div>`;
    }

    h += `<div class="dvdr"></div><div class="section-label">Phases</div>`;
    h += AgentGrid.render('dev');
    if (st === 'running') h += AgentGrid.streamBox('dev');
    h += BankApp.render();

    if ((st === 'active' || st === 'rejected') && s.deployEnv) {
      const prev = PHASES[s.cur - 1];
      const disabled = RejectControl.gated('dev', st) ? 'disabled title="Verify the rejection reason first"' : '';
      h += `<div class="appr-bar">
        <button class="btn btn-run" onclick="App.startAgents('dev')" ${disabled}>
          <i class="ti ti-player-play" aria-hidden="true"></i> Run phases
        </button>
        ${st === 'rejected' && prev ? `<button class="btn btn-ghost" onclick="App.backPhase()" ${disabled}>
          <i class="ti ti-arrow-back-up" aria-hidden="true"></i> Back to ${prev.label}
        </button>` : ''}
      </div>`;
    } else if (st === 'active' && !s.deployEnv) {
      h += `<div style="font-size:9.5px;color:var(--text3);margin-top:.375rem">↑ Select environment first.</div>`;
    }

    if (st === 'pending') {
      h += `<div class="notif n-warn" style="margin-top:.5rem">
        <i class="ti ti-clock" aria-hidden="true"></i> Agents complete — human sign-off required.
      </div>`;
      h += `<div class="dvdr"></div>` + DocViewer.render('dev');
      h += `<div class="dvdr"></div>` + SignOff.render('dev');
    } else if (st === 'done') {
      h += `<div class="dvdr"></div>` + DocViewer.render('dev');
    }

    body.innerHTML = h;
  }

  return { render };
})();

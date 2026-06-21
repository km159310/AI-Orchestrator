// src/phases/deploy.js
// Deployment phase — runs the REAL AWS pipeline via /api/deploy/aws:
//   terraform init  → terraform apply  → docker build  → ECR login →
//   docker push     → ecs update       → wait stable    → smoke.
// Polls /api/deploy/aws/status every 2s and re-renders.
const DeployPhase = (() => {
  const STAGE_LABELS = {
    terraform_init:  'Terraform init',
    terraform_apply: 'Terraform apply (VPC · ALB · ECS · ECR)',
    docker_build:    'Docker build (generated-app/)',
    ecr_login:       'Docker login to ECR',
    docker_push:     'Docker push',
    ecs_update:      'ECS update-service (--force-new-deployment)',
    wait_stable:     'Wait for service stable',
    smoke:           'Smoke check (GET ALB URL)',
  };

  let _pollTimer    = null;
  let _started      = false;   // have we POSTed /api/deploy/aws yet for the current phase entry?
  let _lastState    = null;    // last status snapshot
  let _advancing    = false;   // guard the once-only "mark done & advance" path
  let _destroying   = false;
  let _preflight    = null;    // last preflight payload
  let _preflightBusy = false;  // re-check in flight
  let _preflightRequested = false; // have we kicked off the very first preflight for this entry?

  function _escape(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _startPolling() {
    if (_pollTimer) return;
    const tick = async () => {
      try {
        const r = await fetch('/api/deploy/aws/status', { cache: 'no-store' });
        const j = await r.json();
        _lastState = j;
        App.renderPanel();
        if (j.finished && !_advancing) {
          _advancing = true;
          if (j.ok) {
            const alb = (j.outputs && j.outputs.alb_url) || '';
            Logger.add(`AWS Fargate deploy succeeded · ${alb}`, 'success');
            // Mark deploy phase done + auto-advance to Review.
            const s = State.get();
            const idx = PHASES.findIndex(p => p.id === 'deploy');
            if (idx >= 0) {
              s.statuses[idx] = 'done';
              State.clearRejection('deploy');
              const next = idx + 1;
              if (next < PHASES.length) {
                s.statuses[next] = 'active';
                Logger.add(`→ Auto-triggering ${PHASES[next].label}…`, 'info');
                setTimeout(() => {
                  State.set({ cur: next });
                  s.autoTriggered[PHASES[next].id] = true;
                  Strip.render();
                  App.renderPanel();
                  // Everything auto-runs except PR (drives its own pipeline).
                  const nextId = PHASES[next].id;
                  if (nextId !== 'pr') {
                    setTimeout(() => App.startAgents(nextId), 500);
                  }
                }, 800);
              }
              Strip.render();
              App.renderPanel();
            }
          } else {
            Logger.add(`AWS Fargate deploy failed: ${j.error || 'unknown error'}`, 'danger');
            const s = State.get();
            const idx = PHASES.findIndex(p => p.id === 'deploy');
            if (idx >= 0) {
              s.statuses[idx] = 'rejected';
              State.setRejection('deploy', { reason: j.error || 'AWS deploy failed', verified: false });
              Strip.render();
              App.renderPanel();
            }
          }
          _stopPolling();
        }
      } catch (e) {
        // Network blip — keep polling silently
      }
    };
    tick();
    // 1 s polling — fast enough that short stages (terraform_init, ecr_login)
    // visibly tick through instead of lingering on the screen.
    _pollTimer = setInterval(tick, 1000);
  }

  function _stopPolling() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  }

  async function _runPreflight(showBusy = true) {
    if (_preflightBusy) return;
    if (showBusy) { _preflightBusy = true; App.renderPanel(); }
    try {
      const r = await fetch('/api/deploy/aws/preflight', { cache: 'no-store' });
      const j = await r.json();
      _preflight = j;
      if (j.ok) {
        Logger.add('AWS preflight: all checks green', 'success');
      } else {
        const fails = (j.checks || []).filter(c => !c.ok).map(c => c.label).join(', ');
        Logger.add(`AWS preflight: failing — ${fails}`, 'warn');
      }
    } catch (e) {
      _preflight = { ok: false, checks: [{ name: 'preflight', ok: false, label: 'Preflight call', detail: e.message, hint: '' }] };
      Logger.add('Preflight request failed: ' + e.message, 'danger');
    }
    _preflightBusy = false;
    App.renderPanel();
  }

  function _recheck() { _runPreflight(true); }

  async function _kickoff() {
    if (_started) return;
    if (!_preflight || !_preflight.ok) {
      // Refuse to start until preflight is green.
      Logger.add('Deploy blocked — fix the preflight checks first', 'warn');
      return;
    }
    _started = true;
    _advancing = false;
    Logger.add('AWS Fargate deploy starting — terraform apply + docker build/push + ECS update', 'info');

    // Drive the deploy-phase agent grid alongside the real AWS work so the
    // phase reads like the other phases (Phases section with running cards).
    // The runner only animates the cards; deploy worker still owns the
    // phase status (running → done / rejected) via the polling loop above.
    State.initAgents('deploy');
    State.resetAgents('deploy');
    AgentRunner.run('deploy', () => {
      Logger.add('Deployment: all agents complete', 'info');
      App.renderPanel();
    });

    try {
      const r = await fetch('/api/deploy/aws', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await r.json();
      if (!j.ok) {
        Logger.add(`Deploy could not start: ${j.error || 'unknown'}`, 'danger');
        _started = false;
        return;
      }
      Logger.add(`Image tag for this run: ${j.imageTag}`, 'info');
      _lastState = j.state;
      _startPolling();
      App.renderPanel();
    } catch (e) {
      Logger.add('Deploy request failed: ' + e.message, 'danger');
      _started = false;
    }
  }

  function _retry() {
    // Wipe local state and re-kick. Backend will reset _aws_deploy_state.
    _started = false;
    _advancing = false;
    _lastState = null;
    _stopPolling();
    State.clearRejection('deploy');
    const s = State.get();
    const idx = PHASES.findIndex(p => p.id === 'deploy');
    if (idx >= 0) s.statuses[idx] = 'running';
    Strip.render();
    _kickoff();
  }

  async function _destroy() {
    if (_destroying) return;
    if (!confirm('Tear down the AWS Fargate deployment (VPC, ALB, ECS, ECR)? This runs `terraform destroy` and can take several minutes.')) return;
    _destroying = true;
    Logger.add('AWS Fargate teardown started — terraform destroy', 'warn');
    App.renderPanel();
    try {
      const r = await fetch('/api/deploy/aws/destroy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await r.json();
      if (j.ok) Logger.add('✓ AWS Fargate resources destroyed', 'success');
      else      Logger.add(`Destroy failed: ${j.error || 'unknown'}`, 'danger');
    } catch (e) {
      Logger.add('Destroy request failed: ' + e.message, 'danger');
    }
    _destroying = false;
    App.renderPanel();
  }

  function _stageRow(stage) {
    const lbl  = STAGE_LABELS[stage.name] || stage.name;
    const cls  = stage.status === 'done' ? 'done' : stage.status === 'running' ? 'running' : stage.status === 'failed' ? 'failed' : 'idle';
    const txt  = stage.status === 'done' ? '✓ Done' : stage.status === 'running' ? '● Running' : stage.status === 'failed' ? '✗ Failed' : 'Pending';
    const dot  = `pr-stage-dot ${cls === 'failed' ? 'idle' : cls}`;
    const sCls = `pr-stage-state ${cls === 'failed' ? 'idle' : cls}`;
    const line = stage.line ? `<div class="aws-stage-line">${_escape(stage.line)}</div>` : '';
    const dur  = (stage.startedAt && stage.finishedAt)
      ? `<span class="aws-stage-dur">${(stage.finishedAt - stage.startedAt).toFixed(1)}s</span>` : '';
    const rowCls = cls === 'failed' ? 'pr-stage-row' : `pr-stage-row ${cls}`;
    return `<div class="${rowCls} aws-stage" style="${cls === 'failed' ? 'border-color:rgba(220,38,38,.4);background:var(--red2)' : ''}">
      <div style="display:flex;align-items:center;gap:10px;width:100%">
        <span class="${dot}"></span>
        <span class="pr-stage-name">${_escape(lbl)}</span>
        ${dur}
        <span class="${sCls}">${txt}</span>
      </div>
      ${line}
    </div>`;
  }

  function _renderPipeline(state) {
    if (!state || !state.stages || !state.stages.length) return '';
    const rows = state.stages.map(_stageRow).join('');
    const outputs = state.outputs || {};
    const alb = outputs.alb_url;
    const ecr = outputs.ecr_repository_url;
    const tag = state.imageTag;

    let resultBlock = '';
    if (state.finished && state.ok && alb) {
      resultBlock = `<div class="notif n-info" style="margin-top:.75rem">
        <i class="ti ti-rocket" aria-hidden="true"></i>
        Deployed:
        <a href="${_escape(alb)}" target="_blank" rel="noopener" class="gh-push-link" style="margin-left:6px">${_escape(alb)}</a>
        <span style="margin-left:auto;font-size:10px;color:var(--text3)">image tag: ${_escape(tag || '')}</span>
      </div>`;
    }
    if (state.finished && !state.ok) {
      resultBlock = `<div class="notif n-danger" style="margin-top:.75rem">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
        Deploy failed: ${_escape(state.error || 'unknown error')}
      </div>`;
    }

    const metaBits = [];
    if (tag) metaBits.push(`<span><strong>Image tag:</strong> ${_escape(tag)}</span>`);
    if (ecr) metaBits.push(`<span><strong>ECR:</strong> ${_escape(ecr)}</span>`);
    if (alb) metaBits.push(`<span><strong>ALB:</strong> <a href="${_escape(alb)}" target="_blank" rel="noopener" class="gh-push-link">${_escape(alb)}</a></span>`);
    const meta = metaBits.length ? `<div class="gh-push-meta" style="margin-top:8px">${metaBits.join('')}</div>` : '';

    return `<div class="aws-deploy-card">
      <div class="aws-deploy-head">
        <i class="ti ti-brand-aws" aria-hidden="true"></i>
        <span>AWS ECS Fargate deploy</span>
        ${state.running ? '<span class="aws-running-pill"><span class="spin"></span> running</span>' : ''}
        ${state.finished && state.ok ? '<span class="aws-done-pill">✓ live</span>' : ''}
        ${state.finished && !state.ok ? '<span class="aws-fail-pill">✗ failed</span>' : ''}
      </div>
      <div class="pr-pipeline aws-pipeline">${rows}</div>
      ${meta}
      ${resultBlock}
    </div>`;
  }

  function _renderPreflight() {
    if (!_preflight && !_preflightBusy) {
      return `<div class="aws-preflight-card">
        <div class="aws-preflight-head">
          <i class="ti ti-checkup-list" aria-hidden="true"></i>
          <span>Preflight checks</span>
          <button class="btn btn-ghost" style="margin-left:auto" onclick="DeployPhase.recheck()">
            <i class="ti ti-refresh" aria-hidden="true"></i> Run preflight
          </button>
        </div>
      </div>`;
    }
    if (_preflightBusy && !_preflight) {
      return `<div class="aws-preflight-card">
        <div class="aws-preflight-head">
          <i class="ti ti-checkup-list" aria-hidden="true"></i>
          <span>Preflight checks</span>
          <span class="aws-running-pill" style="margin-left:auto"><span class="spin"></span> checking</span>
        </div>
      </div>`;
    }
    const checks = (_preflight && _preflight.checks) || [];
    const rows = checks.map(c => {
      const mark = c.ok ? '✓' : '✗';
      const cls  = c.ok ? 'ok' : 'fail';
      const hint = (!c.ok && c.hint) ? `<div class="aws-preflight-hint">${_escape(c.hint)}</div>` : '';
      return `<div class="aws-preflight-row ${cls}">
        <span class="aws-preflight-mark">${mark}</span>
        <span class="aws-preflight-label">${_escape(c.label)}</span>
        <span class="aws-preflight-detail">${_escape(c.detail || '')}</span>
        ${hint}
      </div>`;
    }).join('');
    const allOk  = _preflight && _preflight.ok;
    const pill   = allOk
      ? '<span class="aws-done-pill" style="margin-left:auto">✓ ready to deploy</span>'
      : '<span class="aws-fail-pill" style="margin-left:auto">✗ fix the red rows</span>';
    const busyPill = _preflightBusy
      ? '<span class="aws-running-pill" style="margin-left:auto"><span class="spin"></span> re-checking</span>'
      : pill;
    return `<div class="aws-preflight-card ${allOk ? 'all-ok' : 'has-fail'}">
      <div class="aws-preflight-head">
        <i class="ti ti-checkup-list" aria-hidden="true"></i>
        <span>Preflight checks</span>
        ${busyPill}
      </div>
      <div class="aws-preflight-rows">${rows}</div>
      <div class="aws-preflight-actions">
        <button class="btn btn-ghost" onclick="DeployPhase.recheck()" ${_preflightBusy ? 'disabled' : ''}>
          <i class="ti ti-refresh" aria-hidden="true"></i> Re-check
        </button>
        ${allOk && !_started
          ? `<button class="btn btn-run" onclick="DeployPhase.deployNow()">
              <i class="ti ti-rocket" aria-hidden="true"></i> Deploy now
            </button>`
          : ''}
      </div>
    </div>`;
  }

  function render(body, st) {
    let h = Hero.render('deploy');

    if (st === 'done')     h += `<div class="success-banner"><i class="ti ti-circle-check" style="font-size:16px" aria-hidden="true"></i> Deployment complete — Release Review triggered.</div>`;
    if (st === 'rejected') h += RejectControl.renderBanner('deploy');

    h += `<div style="font-size:10px;color:var(--text3);margin-bottom:.875rem;line-height:1.6">
      Provisions VPC + ALB + ECS Fargate cluster via Terraform, builds and pushes the generated app
      image to ECR, then rolls out a new ECS service deployment in your AWS account.
    </div>`;

    // Run preflight once the moment the phase becomes active/running.
    if ((st === 'active' || st === 'running') && !_preflightRequested) {
      _preflightRequested = true;
      setTimeout(() => _runPreflight(true), 50);
    }

    // Preflight checklist (always visible before the pipeline starts).
    if (!_started) {
      h += `<div class="section-label">Environment</div>`;
      h += _renderPreflight();
    }

    if (st === 'rejected') {
      _stopPolling();
    }

    // Auto-kickoff only if preflight green.
    if (st === 'active' && !_started && _preflight && _preflight.ok) {
      setTimeout(_kickoff, 50);
    }

    if (_started || (_lastState && _lastState.stages && _lastState.stages.length)) {
      // Match the other phases — agent grid first, then the underlying
      // AWS pipeline detail below.
      h += `<div class="section-label">Phases</div>`;
      h += AgentGrid.render('deploy');
      const liveRun = (_lastState && _lastState.running) ||
                      (State.get().agState.deploy &&
                       Object.values(State.get().agState.deploy).some(a => a.status === 'running'));
      if (liveRun) h += AgentGrid.streamBox('deploy');

      h += `<div class="section-label" style="margin-top:.875rem">AWS pipeline</div>`;
      h += _renderPipeline(_lastState);
    }

    if (st === 'active' && _lastState && _lastState.running) {
      h += `<div style="font-size:9.5px;color:var(--text3);margin-top:.5rem">Streaming live status every 2s · safe to navigate away</div>`;
    }

    if (st === 'rejected') {
      h += `<div class="appr-bar">
        <button class="btn btn-run" onclick="DeployPhase.retry()">
          <i class="ti ti-refresh" aria-hidden="true"></i> Retry deploy
        </button>
        <button class="btn btn-ghost" onclick="App.backPhase()">
          <i class="ti ti-arrow-back-up" aria-hidden="true"></i> Back to PAR Approval
        </button>
      </div>`;
    }

    if (st === 'done' && _lastState && _lastState.finished && _lastState.ok) {
      h += `<div class="appr-bar">
        <button class="btn btn-no" onclick="DeployPhase.destroy()" ${_destroying ? 'disabled' : ''}>
          <i class="ti ti-flame" aria-hidden="true"></i> ${_destroying ? 'Destroying…' : 'Destroy AWS resources'}
        </button>
      </div>`;
    }

    // Surface the matching support documents (Infra Manifest, Container
    // Build, Deployment Report, Smoke Test) as soon as the pipeline lands
    // — one tab per deploy agent.
    const showDocs = (st === 'pending' || st === 'done')
                  || (_lastState && _lastState.finished && _lastState.ok);
    if (showDocs && typeof DOCS !== 'undefined' && DOCS.deploy) {
      h += `<div class="dvdr"></div>` + DocViewer.render('deploy');
    }

    body.innerHTML = h;
  }

  function reset() {
    _stopPolling();
    _started = false;
    _advancing = false;
    _lastState = null;
    _destroying = false;
    _preflight = null;
    _preflightBusy = false;
    _preflightRequested = false;
  }

  function deployNow() {
    if (_started) return;
    if (!_preflight || !_preflight.ok) {
      Logger.add('Cannot deploy — preflight is not green', 'warn');
      return;
    }
    _kickoff();
  }

  return { render, retry: _retry, destroy: _destroy, reset, recheck: _recheck, deployNow };
})();

// src/phases/pr.js
// PR (Pull Request) phase — feature branch CI → peer review →
// merge to main → master branch CI → final approve.
const PrPhase = (() => {
  // Each pipeline stage spends STAGE_TICK_MS in the "running" state, with a
  // brief STAGE_START_DELAY_MS pre-roll where it ticks from idle → running.
  // 8 s per stage: feature pipeline (10 stages) ~80 s, master (11 stages) ~88 s.
  const STAGE_TICK_MS = 8000;
  const STAGE_START_DELAY_MS = 60;
  const _timers = [];
  // Guard against runaway timer chains: every render() of an in-flight
  // master pipeline used to kick a fresh _scheduleMasterTick, which itself
  // triggered renderPanel(), which kicked another tick — chains doubled
  // every cycle and races started showing up around stages 8–11.
  let _masterTickInFlight = false;

  function _setTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    _timers.push(id);
    return id;
  }

  function _clearTimers() {
    while (_timers.length) clearTimeout(_timers.pop());
  }

  function _stageRow(idx, name, status) {
    const dotCls   = status === 'done' ? 'pr-stage-dot done' : status === 'running' ? 'pr-stage-dot running' : 'pr-stage-dot idle';
    const stateTxt = status === 'done' ? '✓ Done' : status === 'running' ? '● Running' : 'Pending';
    const stateCls = status === 'done' ? 'pr-stage-state done' : status === 'running' ? 'pr-stage-state running' : 'pr-stage-state idle';
    return `<div class="pr-stage-row ${status}">
      <span class="${dotCls}"></span>
      <span class="pr-stage-idx">${String(idx + 1).padStart(2, '0')}</span>
      <span class="pr-stage-name">${name}</span>
      <span class="${stateCls}">${stateTxt}</span>
    </div>`;
  }

  function _kickFeatureIfNeeded(st) {
    if (!(st === 'active' || st === 'running' || st === 'rejected')) return;
    if (RejectControl.gated('pr', st)) return;
    const s = State.get();
    if (s.prPipeline.featureStarted) return;
    State.setPrPipeline({ featureStarted: true });
    s.statuses[s.cur] = 'running';
    Logger.add('PR: feature branch pipeline started', 'info');
    Strip.render();
    _scheduleFeatureTick();
  }

  function _scheduleFeatureTick() {
    const s = State.get();
    if (s.statuses[s.cur] === 'rejected') return;
    const stages = (s.prPipeline.featureStages || []).slice();
    const idx = stages.findIndex(x => x !== 'done');
    if (idx === -1) return;
    const cur = stages[idx];
    if (cur === 'idle') {
      _setTimeout(() => {
        State.setPrFeatureStage(idx, 'running');
        App.renderPanel();
        _scheduleFeatureTick();
      }, STAGE_START_DELAY_MS);
    } else if (cur === 'running') {
      _setTimeout(() => {
        State.setPrFeatureStage(idx, 'done');
        Logger.add(`PR feature ✓ ${FEATURE_STAGES[idx]}`, 'success');
        App.renderPanel();
        _scheduleFeatureTick();
      }, STAGE_TICK_MS);
    }
  }

  function _scheduleMasterTick() {
    // External entry-point: start a master chain only if one isn't already
    // running. Re-entrance from render() / approvePeer() is a no-op while
    // the chain is in flight.
    if (_masterTickInFlight) return;
    _masterTickInFlight = true;
    _masterTickStep();
  }

  function _masterTickStep() {
    // Continuation: assumes the in-flight lock is already held. Called by
    // _scheduleMasterTick (start) and by each timer callback (recurse).
    const s = State.get();
    if (s.statuses[s.cur] === 'rejected') { _masterTickInFlight = false; return; }
    const stages = (s.prPipeline.masterStages || []).slice();
    const idx = stages.findIndex(x => x !== 'done');
    if (idx === -1) {
      _masterTickInFlight = false;
      _maybeFinish();
      return;
    }
    const cur = stages[idx];
    if (cur === 'idle') {
      _setTimeout(() => {
        State.setPrMasterStage(idx, 'running');
        App.renderPanel();
        _masterTickStep();
      }, STAGE_START_DELAY_MS);
    } else if (cur === 'running') {
      _setTimeout(() => {
        State.setPrMasterStage(idx, 'done');
        Logger.add(`PR master ✓ ${MASTER_STAGES[idx]}`, 'success');
        App.renderPanel();
        _masterTickStep();
      }, STAGE_TICK_MS);
    } else {
      // Unknown stage status — nothing to do, drop the in-flight claim.
      _masterTickInFlight = false;
    }
  }

  function _maybeFinish() {
    const s = State.get();
    if (s.statuses[s.cur] === 'pending' || s.statuses[s.cur] === 'done') return;
    const masterDone = (s.prPipeline.masterStages || []).every(x => x === 'done');
    if (!masterDone) return;
    s.statuses[s.cur] = 'pending';
    Logger.add('PR: master pipeline complete — awaiting final approval', 'warn');
    Strip.render();
    App.renderPanel();
  }

  function approvePeer() {
    State.setPrPipeline({ peerReviewed: true, masterStarted: true });
    Logger.add('PR: peer review approved — merging feature → main', 'success');
    Logger.add('PR: merged to main — master branch pipeline started', 'info');
    App.renderPanel();
    _scheduleMasterTick();
  }

  function render(body, st) {
    const s = State.get();
    let h = Hero.render('pr');

    if (st === 'locked') {
      h += `<div class="notif n-info"><i class="ti ti-lock" aria-hidden="true"></i> Locked — approve the previous phase to unlock this one.</div>`;
      body.innerHTML = h;
      return;
    }

    if (st === 'done')     h += `<div class="success-banner"><i class="ti ti-circle-check" style="font-size:16px" aria-hidden="true"></i> PR approved — PAR Approval triggered automatically.</div>`;
    if (st === 'rejected') h += RejectControl.renderBanner('pr');

    h += `<div style="font-size:10px;color:var(--text3);margin-bottom:.875rem;line-height:1.6">
      Feature branch runs the CI pipeline, peer review gates the merge to main, then the master branch re-runs the pipeline plus a production-readiness check before the final approval.
    </div>`;

    // Auto-kick the feature pipeline on first render.
    _kickFeatureIfNeeded(st);

    const featureStages = s.prPipeline.featureStages || [];
    const masterStages  = s.prPipeline.masterStages || [];
    const featureDone   = featureStages.length > 0 && featureStages.every(x => x === 'done');
    const masterDone    = masterStages.length > 0 && masterStages.every(x => x === 'done');
    const phaseReady    = s.prPipeline.peerReviewed && masterDone;

    h += `<div class="section-label"><i class="ti ti-git-branch" aria-hidden="true"></i> Feature branch pipeline</div>`;
    h += `<div class="pr-pipeline">${FEATURE_STAGES.map((n, i) => _stageRow(i, n, featureStages[i] || 'idle')).join('')}</div>`;

    if (featureDone && !s.prPipeline.peerReviewed) {
      h += `<div class="dvdr"></div>
        <div class="section-label"><i class="ti ti-user-check" aria-hidden="true"></i> Peer review — Team Leader</div>
        <div class="sign-box">
          <div class="sign-row">
            <div class="sign-av" style="background:rgba(37,99,235,.15);color:var(--cyan)">TL</div>
            <div style="flex:1">
              <div class="sign-name">Team Leader</div>
              <div class="sign-role">Reviews PR diff, comments, and CI artefacts before merging feature → main.</div>
            </div>
            <button class="btn btn-ok" style="margin-left:8px" onclick="PrPhase.approvePeer()">
              <i class="ti ti-git-merge" aria-hidden="true"></i> Approve PR &amp; Merge
            </button>
          </div>
        </div>
        <div class="appr-bar">${RejectControl.renderButton()}</div>`;
    }

    if (s.prPipeline.peerReviewed) {
      h += `<div class="notif n-info" style="margin-top:.5rem">
        <i class="ti ti-git-merge" aria-hidden="true"></i> Merged feature → main — master pipeline running.
      </div>`;
    }

    if (s.prPipeline.masterStarted) {
      h += `<div class="dvdr"></div>
        <div class="section-label"><i class="ti ti-git-commit" aria-hidden="true"></i> Master branch pipeline</div>
        <div class="pr-pipeline">${MASTER_STAGES.map((n, i) => _stageRow(i, n, masterStages[i] || 'idle')).join('')}</div>`;
    }

    if (phaseReady && st !== 'done') {
      h += `<div class="dvdr"></div>
        <div class="notif n-warn" style="margin-top:.5rem">
          <i class="ti ti-clock" aria-hidden="true"></i> Production readiness check passed — final approval required to advance to PAR Approval.
        </div>
        <div class="appr-bar">
          <button class="btn btn-ok" onclick="App.approvePhase()">
            <i class="ti ti-circle-check" aria-hidden="true"></i> Approve &amp; advance to PAR
          </button>
          ${RejectControl.renderButton()}
        </div>`;
    }

    if (st === 'rejected') {
      const prev = PHASES[s.cur - 1];
      const disabled = RejectControl.gated('pr', st) ? 'disabled title="Verify the rejection reason first"' : '';
      if (prev) {
        h += `<div class="appr-bar">
          <button class="btn btn-ghost" onclick="App.backPhase()" ${disabled}>
            <i class="ti ti-arrow-back-up" aria-hidden="true"></i> Back to ${prev.label}
          </button>
        </div>`;
      }
    }

    // Re-kick the master tick ONLY if it's not already chained (e.g. user
    // navigated away and back into PR while the pipeline was paused).
    // Without the guard, every renderPanel() spawned another chain and
    // the chains doubled every stage transition.
    if (s.prPipeline.masterStarted && !masterDone && !_masterTickInFlight) _scheduleMasterTick();
    if (masterDone && st !== 'pending' && st !== 'done') _maybeFinish();

    body.innerHTML = h;
  }

  function reset() {
    _clearTimers();
    _masterTickInFlight = false;
    State.resetPrPipeline();
  }

  return { render, approvePeer, reset };
})();

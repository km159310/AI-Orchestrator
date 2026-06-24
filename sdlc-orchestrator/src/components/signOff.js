// src/components/signOff.js
const SignOff = (() => {
  const PUSH_STAGES = [
    'Initialising git repository',
    'Staging files',
    'Creating commit',
    'Pushing branch to GitHub',
    'Opening pull request',
  ];
  // Defaults for the GitHub commit fired from the Testing sign-off button.
  // The auth widget / repo picker / source toggle UI was removed, so these
  // are the values sent with every push. Override via GITHUB_REPO env var.
  const PUSH_SOURCE     = 'workspace';
  const PUSH_BRANCH     = 'import/from-orchestrator';
  const PUSH_COMMIT_MSG = 'AI Orchestrator project — initial import';

  // push state lives outside State.get() because it's transient render-only.
  // pushIdx semantics: -1 = idle, 0..PUSH_STAGES.length-1 = ticking,
  //                    PUSH_STAGES.length = animation done (waiting on backend).
  const _push = {
    idx: -1,
    result: null,
    error: null,
    scheduled: false,
    autoArmed: false,
  };

  function _resetPushState() {
    _push.idx = -1;
    _push.result = null;
    _push.error = null;
    _push.scheduled = false;
    _push.autoArmed = false;
  }

  function _escape(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(pid) {
    const defs = SIGNOFFS[pid];
    if (!defs) return '';
    const approved = State.get().approvers[pid] || {};
    const all      = defs.every(d => approved[d.name]);
    const isTest   = pid === 'test';

    // When the user re-enters Test after a reject, _push may still hold stale
    // state. Reset whenever we re-render and the phase is no longer pending.
    if (isTest && State.get().statuses[State.get().cur] !== 'pending' && _push.idx >= 0) {
      _resetPushState();
    }

    // (GitHub auth widget, repo picker, and source toggle were intentionally
    // removed from the Testing UI. Push still works via the GITHUB_TOKEN /
    // GITHUB_REPO env vars and the workspace-source default. The helper
    // functions are kept (unused) in case the UI is ever re-introduced.)

    // Test phase: when all signed, auto-arm the push pipeline once.
    // Skip auto-arm if a previous attempt left an error on the state —
    // we want the user to click Retry deliberately rather than spam GitHub.
    if (isTest && all && _push.idx < 0 && !_push.autoArmed && _push.error == null) {
      _push.autoArmed = true;
      setTimeout(() => _startPush(), 600);
      Logger.add('Testing: all stakeholders signed — committing & raising PR automatically', 'info');
    }

    let h = '';
    h += `<div class="section-label">Stakeholder sign-off</div>`;
    defs.forEach(d => {
      const ok = approved[d.name];
      h += `<div class="sign-box ${ok ? 'signed' : ''}">
        <div class="sign-row">
          <div class="sign-av" style="background:${d.color};color:${d.tc}">${d.av}</div>
          <div style="flex:1">
            <div class="sign-name">${d.name}</div>
            <div class="sign-role">${d.role}</div>
          </div>
          <div style="margin-left:auto;font-size:9.5px;font-weight:600;color:${ok ? 'var(--green)' : 'var(--text3)'}">${ok ? '✓ Approved' : 'Pending'}</div>
          <button class="btn ${ok ? 'btn-ok' : 'btn-ghost'}" style="margin-left:8px" onclick="SignOff.sign('${pid}','${_escape(d.name)}')">
            ${ok ? 'Approved' : 'Approve'}
          </button>
        </div>
        ${ok ? `<div class="sign-comment">${d.comment}</div>` : ''}
      </div>`;
    });

    const hasPushError = isTest && _push.error != null;
    const pushing = isTest && _push.idx >= 0 && _push.idx < PUSH_STAGES.length && !hasPushError;
    const pushed  = isTest && _push.idx >= PUSH_STAGES.length && _push.result && !hasPushError;
    const approveLabel = !isTest
      ? 'Approve & advance'
      : (hasPushError ? 'Retry — Commit and Raise PR' : 'Commit and Raise PR Request');
    const approveIcon  = !isTest
      ? 'ti-circle-check'
      : (hasPushError ? 'ti-refresh' : 'ti-git-pull-request');
    const disabled = !all || pushing || pushed;
    const onClick  = isTest ? 'SignOff.onApproveTest()' : 'App.approvePhase()';
    const disabledTitle = !all
      ? `Approve all ${defs.length} stakeholders above first`
      : pushing ? 'Push in progress…'
      : pushed  ? 'Push complete — advancing to PR phase'
      : '';

    let btnInner;
    if (pushing) btnInner = `<span class="spin"></span> Pushing to GitHub…`;
    else if (pushed) btnInner = `✓ Pushed — advancing to PR…`;
    else btnInner = `<i class="ti ${approveIcon}" aria-hidden="true"></i> ${approveLabel}`;

    h += `<div class="appr-bar">
      <button class="btn btn-ok" ${disabled ? 'disabled' : ''}${disabledTitle ? ` title="${_escape(disabledTitle)}"` : ''} onclick="${onClick}">${btnInner}</button>
      ${RejectControl.renderButton()}
    </div>`;
    if (isTest && !all) {
      h += `<div style="font-size:9.5px;color:var(--text3);margin-top:.375rem">↑ Approve all ${defs.length} stakeholders above to enable the commit &amp; PR step.</div>`;
    }

    if (isTest && _push.idx >= 0) {
      h += _renderPushCard();
    }

    return h;
  }

  function _renderPushCard() {
    const filesCount = (State.get().bankApp && State.get().bankApp.files && State.get().bankApp.files.length) || 47;
    const fileNote = _push.result && _push.result.filesCount ? _push.result.filesCount : filesCount;
    const repo   = _push.result && _push.result.repo   ? _push.result.repo   : (_push.error ? '—' : 'awaiting backend…');
    const branch = _push.result && _push.result.branch ? _push.result.branch : (_push.error ? '—' : PUSH_BRANCH);
    const sha    = _push.result && _push.result.commitSha ? _push.result.commitSha : (_push.error ? '—' : '…');
    const prNum  = _push.result && _push.result.prNumber  ? _push.result.prNumber  : (_push.error ? '—' : '…');
    const prUrl  = _push.result && _push.result.prUrl     ? _push.result.prUrl     : null;
    const mock   = _push.result && _push.result.mock === true;
    const pushed = _push.idx >= PUSH_STAGES.length;

    const pill = pushed && _push.result && prUrl
      ? `<a href="${_escape(prUrl)}" target="_blank" rel="noopener" class="gh-push-pill" style="text-decoration:none">PR #${_escape(prNum)} ↗</a>`
      : pushed && _push.result ? `<span class="gh-push-pill">PR #${_escape(prNum)}</span>` : '';
    const mockPill = pushed && mock
      ? `<span class="gh-push-pill" style="margin-left:6px;background:var(--amber2);color:var(--amber);border-color:rgba(217,119,6,.3)">MOCK</span>` : '';

    const repoLink = _push.result
      ? `<a href="https://${_escape(repo)}" target="_blank" rel="noopener" class="gh-push-link">${_escape(repo)}</a>`
      : `<em class="gh-push-link" style="font-style:italic;color:var(--text3)">${_escape(repo)}</em>`;

    const stages = PUSH_STAGES.map((name, i) => {
      const cls  = i < _push.idx ? 'done' : i === _push.idx ? 'running' : 'idle';
      const mark = cls === 'done' ? '✓' : cls === 'running' ? '●' : '○';
      const lbl  = name === 'Staging files' ? `Staging ${fileNote} files` : name;
      return `<div class="gh-push-stage ${cls}">
        <span class="gh-push-dot ${cls}"></span>
        <span class="gh-push-name">${lbl}</span>
        <span class="gh-push-mark">${mark}</span>
      </div>`;
    }).join('');

    const errBlock = _push.error
      ? `<div class="notif n-danger" style="margin-bottom:8px;font-size:11px"><i class="ti ti-alert-triangle" aria-hidden="true"></i> ${_escape(_push.error)}</div>`
      : '';

    return `<div class="gh-push-card">
      <div class="gh-push-head">
        <i class="ti ti-brand-github" aria-hidden="true"></i>
        <span>${pushed ? 'Pushed to ' : 'Pushing to '}${repoLink}</span>
        ${pill}${mockPill}
      </div>
      ${errBlock}
      <div class="gh-push-stages">${stages}</div>
      <div class="gh-push-meta">
        <span><strong>Repo:</strong> ${_escape(repo)}</span>
        <span><strong>Branch:</strong> ${_escape(branch)}</span>
        <span><strong>Commit:</strong> ${_escape(sha)}</span>
        <span><strong>Files:</strong> ${_escape(fileNote)}</span>
      </div>
    </div>`;
  }

  function _startPush() {
    // Reset any stale per-attempt state — covers both first-fire and the
    // retry-after-error path. Without this a retry click finds idx === 5
    // from the previous failed run and bails out.
    const isRetry = _push.error != null;
    _push.idx = 0;
    _push.result = null;
    _push.error = null;
    _push.scheduled = false;
    Logger.add(isRetry
      ? 'GitHub: retrying ABC Bank push…'
      : 'GitHub: pushing ABC Bank scaffold…', 'info');
    App.renderPanel();
    _tickPush();
    _firePushApi();
  }

  // PR push pipeline runs 5 stages and should land at ~30 seconds total
  // (feature-branch CI + master-branch / PR pipeline combined). 6 s per
  // stage × 5 stages = 30 s.
  const PUSH_STAGE_MS = 6000;

  function _tickPush() {
    if (_push.idx < 0) return;
    if (_push.idx >= PUSH_STAGES.length) {
      _maybeAdvance();
      return;
    }
    setTimeout(() => {
      Logger.add(`GitHub: ✓ ${PUSH_STAGES[_push.idx]}`, 'info');
      _push.idx++;
      App.renderPanel();
      _tickPush();
    }, PUSH_STAGE_MS);
  }

  function _firePushApi() {
    const body = JSON.stringify({
      source:    PUSH_SOURCE,
      branch:    PUSH_BRANCH,
      commitMsg: PUSH_COMMIT_MSG,
    });
    fetch('/api/github/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      .then(r => r.json().then(j => ({ ok: r.ok, body: j })))
      .then(({ ok, body }) => {
        if (!ok || !body || body.ok === false) {
          _push.error = (body && (body.error || body.message)) || 'push failed';
          App.renderPanel();
          _maybeAdvance();
          return;
        }
        _push.result = body;
        if (body.mock) {
          Logger.add(`GitHub: ${body.message || 'running in mock mode (no GITHUB_TOKEN/GITHUB_REPO set)'}`, 'warn');
        } else {
          Logger.add(`GitHub: real push complete · commit ${body.commitSha} on ${body.branch}`, 'success');
        }
        App.renderPanel();
        _maybeAdvance();
      })
      .catch(err => {
        _push.error = err && err.message ? err.message : String(err);
        App.renderPanel();
        _maybeAdvance();
      });
  }

  function _maybeAdvance() {
    if (_push.idx < PUSH_STAGES.length) return;
    if (!_push.result && !_push.error) return;
    if (_push.scheduled) return;
    _push.scheduled = true;
    if (_push.error) {
      Logger.add(`GitHub: ✗ push failed — ${_push.error}`, 'danger');
      return;
    }
    const repo  = _push.result.repo || '(unknown)';
    const prNum = _push.result.prNumber || '(none)';
    const tag   = _push.result.mock ? '(mock)' : '';
    Logger.add(`GitHub: ✓ pushed to ${repo} · PR #${prNum} opened ${tag}`.trim(), 'success');
    setTimeout(() => {
      App.approvePhase();
      _resetPushState();
    }, 900);
  }

  function onApproveTest() {
    // Block extra clicks only while a genuine push is in flight (no error).
    // After an error we treat the click as "retry".
    if (_push.idx >= 0 && _push.error == null) return;
    _startPush();
  }

  function sign(pid, name) {
    const s = State.get();
    if (!s.approvers[pid]) s.approvers[pid] = {};
    s.approvers[pid][name] = !s.approvers[pid][name];
    Logger.add(`${s.approvers[pid][name] ? '✓' : '↺'} ${name} ${s.approvers[pid][name] ? 'signed off' : 'unsigned'}`, s.approvers[pid][name] ? 'success' : 'info');
    App.renderPanel();
    const defs = SIGNOFFS[pid];
    if (defs && defs.every(d => s.approvers[pid][d.name])) {
      Logger.add(`All signed — ${pid} ready to advance`, 'warn');
    }
  }

  return { render, sign, onApproveTest, _resetPushState };
})();

// src/components/prAgent.js
// Triggers a real Jenkins pipeline via /api/jenkins/trigger and polls the
// build status until completion. Replaces the previous 5-stage timer mock.
const PrAgent = (() => {
  const POLL_MS = 2500;

  function _statusCls(status) {
    if (status === 'SUCCESS') return 'done';
    if (status === 'IN_PROGRESS' || status === 'FAILED' || status === 'ABORTED' || status === 'UNSTABLE') return 'active';
    return '';
  }

  function render() {
    const pr = State.get().pr;
    const build = pr.build;
    const isBuilding = !!(build && (build.building || build.queued));
    const isDone     = !!(build && !build.building && !build.queued && build.result);
    const failed     = !!(build && build.result && build.result !== 'SUCCESS');

    let action;
    if (pr.triggering) {
      action = `<span style="font-size:11px;color:var(--amber)"><span class="spin"></span> Triggering…</span>`;
    } else if (isBuilding) {
      action = `<span style="font-size:11px;color:var(--amber)"><span class="spin"></span> Building…</span>`;
    } else if (isDone && !failed) {
      action = `<span style="font-size:11px;color:var(--green);font-weight:600">✓ ${build.result}</span>`;
    } else if (isDone && failed) {
      action = `<span style="font-size:11px;color:var(--red);font-weight:600">✗ ${build.result}</span>`;
    } else {
      action = `<button class="btn btn-run" onclick="PrAgent.trigger()" style="font-size:11px;padding:.3rem .7rem">
        <i class="ti ti-player-play" aria-hidden="true"></i> Trigger Jenkins
      </button>`;
    }

    let stagesH;
    if (build && build.stages && build.stages.length > 0) {
      stagesH = '<div class="pstages">' + build.stages.map((stage, i) => {
        const cls = _statusCls(stage.status);
        return `<span style="display:inline-flex;align-items:center;gap:4px">
          <span class="ps ${cls}">${stage.name}</span>
          ${i < build.stages.length - 1 ? '<span style="font-size:9px;color:var(--text3)">›</span>' : ''}
        </span>`;
      }).join('') + '</div>';
    } else if (build && build.queued) {
      stagesH = `<div style="font-size:11.5px;color:var(--text2)"><span class="spin"></span> Waiting for executor — build queued in Jenkins</div>`;
    } else {
      stagesH = `<div style="font-size:11px;color:var(--text3);font-family:var(--code)">No build yet · click <em>Trigger Jenkins</em> to start a pipeline run</div>`;
    }

    let footer = '';
    if (build && build.buildNumber) {
      const resultColor = build.result === 'SUCCESS' ? 'var(--green)' : 'var(--red)';
      const realLink = (build.url && !build.url.startsWith('mock://'))
        ? `<a href="${build.url}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:none;display:inline-flex;align-items:center;gap:4px">
            View in Jenkins <i class="ti ti-external-link" style="font-size:11px"></i>
          </a>`
        : '';
      const mockBadge = build.mock
        ? `<span title="JENKINS_USER / JENKINS_TOKEN not set — running simulated pipeline"
                 style="font-size:9.5px;font-weight:700;letter-spacing:.06em;padding:2px 7px;border-radius:999px;background:var(--amber2);color:var(--amber);border:1px solid rgba(217,119,6,.3)">
             MOCK
           </span>`
        : '';
      footer = `<div style="margin-top:10px;font-size:11px;color:var(--text2);display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <span><strong>Build</strong> #${build.buildNumber}</span>
        ${build.result ? `<span>Result: <strong style="color:${resultColor}">${build.result}</strong></span>` : ''}
        ${realLink}
        ${mockBadge}
      </div>`;
    }

    let stagesNote = '';
    if (build && build.stagesError) {
      stagesNote = `<div style="margin-top:8px;font-size:10.5px;color:var(--text3)">
        ⓘ Install the <em>Pipeline: Stage View</em> plugin in Jenkins to see live stage status.
      </div>`;
    }

    const errorBox = pr.error
      ? `<div class="notif n-danger" style="margin-top:10px">
          <i class="ti ti-alert-triangle" aria-hidden="true"></i> ${pr.error}
        </div>`
      : '';

    const disabled = (pr.triggering || isBuilding) ? 'disabled' : '';

    return `<div class="pr-wrap">
      <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:240px">
          <i class="ti ti-git-branch" style="font-size:12px;color:var(--text2)" aria-hidden="true"></i>
          <input type="text" value="${pr.branch || ''}" ${disabled}
            placeholder="Application/branch"
            oninput="PrAgent.setBranch(this.value)"
            style="flex:1;min-width:180px;font-family:var(--code);font-size:12px;padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg2);color:var(--cyan);outline:none" />
        </div>
        ${action}
      </div>
      ${stagesH}
      ${footer}
      ${stagesNote}
      ${errorBox}
    </div>`;
  }

  function setBranch(v) { State.setPr({ branch: v }); }

  function trigger() {
    const pr = State.get().pr;
    if (pr.triggering) return;
    State.setPr({ triggering: true, build: null, queueUrl: null, error: null });
    Logger.add(`Jenkins: triggering build for ${pr.branch}…`, 'info');
    App.renderPanel();

    fetch('/api/jenkins/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch: pr.branch }),
    })
      .then(r => r.json())
      .then(res => {
        if (!res.ok) {
          State.setPr({ triggering: false, error: res.error || 'trigger failed' });
          Logger.add(`Jenkins trigger failed: ${res.error || 'unknown error'}`, 'danger');
          App.renderPanel();
          return;
        }
        State.setPr({
          triggering: false,
          queueUrl: res.queueUrl || null,
          jenkinsUrl: res.jenkinsUrl || null,
          error: null,
        });
        Logger.add(`Jenkins: queued ${res.job} @ ${res.branch}`, 'info');
        App.renderPanel();
        _startPolling();
      })
      .catch(err => {
        State.setPr({ triggering: false, error: err.message });
        Logger.add(`Jenkins trigger error: ${err.message}`, 'danger');
        App.renderPanel();
      });
  }

  function _startPolling() {
    const existing = State.get().pr.pollTimer;
    if (existing) clearInterval(existing);
    const timer = setInterval(() => {
      const pr = State.get().pr;
      const qp = new URLSearchParams();
      if (pr.queueUrl)               qp.set('queueUrl', pr.queueUrl);
      if (pr.build && pr.build.buildNumber) qp.set('buildNumber', String(pr.build.buildNumber));
      fetch(`/api/jenkins/status?${qp.toString()}`)
        .then(r => r.json())
        .then(res => {
          State.setPr({ build: res });
          if (res.ok && !res.building && !res.queued) {
            clearInterval(timer);
            State.setPr({ pollTimer: null });
            const tone = res.result === 'SUCCESS' ? 'success' : 'warn';
            Logger.add(`Jenkins build #${res.buildNumber}: ${res.result || 'DONE'}`, tone);
          }
          App.renderPanel();
        })
        .catch(err => {
          State.setPr({ error: err.message });
          App.renderPanel();
        });
    }, POLL_MS);
    State.setPr({ pollTimer: timer });
  }

  return { render, trigger, setBranch };
})();

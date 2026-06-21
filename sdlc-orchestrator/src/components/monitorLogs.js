// src/components/monitorLogs.js
// Renders the Monitoring phase widgets: pipeline status board + per-phase
// activity log groups. Pure read-only views over State.
const MonitorLogs = (() => {
  const STATUS_META = {
    active:   { lbl: 'Active',    cls: 'st-active'   },
    running:  { lbl: 'Running',   cls: 'st-running'  },
    pending:  { lbl: 'Pending',   cls: 'st-pending'  },
    done:     { lbl: 'Approved',  cls: 'st-done'     },
    rejected: { lbl: 'Rejected',  cls: 'st-rejected' },
    locked:   { lbl: 'Locked',    cls: 'st-locked'   },
  };

  function _pipelineStatus() {
    const s = State.get();
    const cards = PHASES.map((p, i) => {
      const st  = s.statuses[i] || 'locked';
      // Monitor is observation-only — present it as "Live" rather
      // than the pending-approval / running gate labels.
      const m   = p.id === 'monitor'
        ? { lbl: 'Live', cls: 'st-live' }
        : (STATUS_META[st] || STATUS_META.locked);
      const cur = (i === s.cur) ? ' is-current' : '';
      return `
        <div class="mon-status-cell ${m.cls}${cur}">
          <div class="mon-status-icon"><i class="ti ${p.icon}" aria-hidden="true"></i></div>
          <div class="mon-status-body">
            <div class="mon-status-lbl">${p.label}</div>
            <div class="mon-status-state">${m.lbl}</div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="mon-section">
        <div class="mon-section-head">
          <i class="ti ti-list-check" aria-hidden="true"></i>
          <span>Pipeline status</span>
        </div>
        <div class="mon-status-grid">${cards}</div>
      </div>`;
  }

  function _logsByPhase() {
    const s = State.get();
    const groups = {};
    s.log.forEach(e => {
      const k = e.phase || 'system';
      (groups[k] = groups[k] || []).push(e);
    });

    const order = PHASES.map(p => p.id).concat(['system']);
    const blocks = order
      .filter(k => groups[k] && groups[k].length)
      .map(k => {
        const ph    = PHASES.find(p => p.id === k);
        const label = ph ? ph.label : 'System';
        const icon  = ph ? ph.icon  : 'ti-settings';
        const rows  = groups[k].map(e => `
          <div class="mon-log-row">
            <span class="log-t">${e.time}</span>
            <span class="log-m"><span class="ltag lt-${e.tag}">${e.tag}</span> ${e.msg}</span>
          </div>`).join('');

        return `
          <div class="mon-log-group">
            <div class="mon-log-group-head">
              <i class="ti ${icon}" aria-hidden="true"></i>
              <span class="mon-log-group-title">${label}</span>
              <span class="mon-log-group-count">${groups[k].length}</span>
            </div>
            <div class="mon-log-group-body">${rows}</div>
          </div>`;
      })
      .join('');

    const body = blocks || `<div class="obs-empty"><i class="ti ti-inbox" aria-hidden="true"></i> No activity captured yet.</div>`;

    return `
      <div class="mon-section" id="log-aggregator-view">
        <div class="mon-section-head">
          <i class="ti ti-stack" aria-hidden="true"></i>
          <span>Log Aggregator — agent logs &amp; activity log, grouped by phase</span>
        </div>
        ${body}
      </div>`;
  }

  function render() {
    return _pipelineStatus() + _logsByPhase();
  }

  return { render };
})();

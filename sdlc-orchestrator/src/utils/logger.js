// src/utils/logger.js
const Logger = (() => {
  let _pulseRevertTimer = null;
  let _pulseBaseline = 'idle';
  let _pulseSeq = 0;

  // KB backend endpoint that mirrors every activity-log entry into ChromaDB.
  // Override via `window.KB_BASE_URL` before this script loads. Failures are
  // silenced so the dashboard works fine when the backend is down.
  const KB_BASE_URL = (typeof window !== 'undefined' && window.KB_BASE_URL) || 'http://127.0.0.1:8765';

  function _pushToKB(entry) {
    try {
      fetch(`${KB_BASE_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      }).catch(() => { /* backend offline — fine */ });
    } catch (_) { /* ignore */ }
  }

  function add(msg, tag = 'info') {
    const s = State.get();
    const c = s.lc;
    State.incrementClock();
    const h = String(9 + Math.floor(c / 60)).padStart(2, '0');
    const m = String(c % 60).padStart(2, '0');
    const ph = (typeof PHASES !== 'undefined' && PHASES[s.cur]) ? PHASES[s.cur].id : 'system';
    const id = ++_pulseSeq;
    const entry = { id, time: `${h}:${m}`, msg, tag, phase: ph };
    State.prependLog(entry);
    _render();
    _pulseAggregator({ phase: ph, msg, tag });
    _pushToKB({ time: entry.time, msg, tag, phase: ph });
  }

  // Global Log Aggregator pulse — every activity-log entry briefly pulses
  // the Monitor "agg" agent to "running" with the new line, then reverts
  // it to its previous baseline. Runs even when not viewing Monitor so
  // the agent feels alive when the user navigates over.
  function _pulseAggregator(entry) {
    if (typeof State === 'undefined') return;
    State.initAgents('monitor');
    const ag = State.get().agState.monitor && State.get().agState.monitor.agg;
    if (!ag) return;

    // Capture baseline only when no pulse is in flight, so bursts of logs
    // don't clobber a previously-stable "done" baseline.
    if (_pulseRevertTimer == null) _pulseBaseline = ag.status;

    const summary = entry.msg.length > 70 ? entry.msg.slice(0, 70) + '…' : entry.msg;
    const phMeta  = (typeof PHASES !== 'undefined') ? PHASES.find(p => p.id === entry.phase) : null;
    const source  = phMeta ? phMeta.label : 'System';

    ag.status   = 'running';
    ag.progress = Math.max(55, ag.progress || 0);
    ag.lines    = (ag.lines || []).concat(`[${entry.tag}] ${source}: ${summary}`);

    // Only re-render if the Monitor view is currently on screen — otherwise
    // we'd waste paints. The next jump to Monitor will pick up the state.
    if (typeof App !== 'undefined' && App.renderPanel && PHASES && PHASES[State.get().cur] && PHASES[State.get().cur].id === 'monitor') {
      App.renderPanel();
    }

    if (_pulseRevertTimer) clearTimeout(_pulseRevertTimer);
    _pulseRevertTimer = setTimeout(() => {
      _pulseRevertTimer = null;
      const cur = State.get().agState.monitor && State.get().agState.monitor.agg;
      if (!cur) return;
      const baseline = _pulseBaseline;
      cur.status   = baseline === 'done' ? 'done' : 'running';
      cur.progress = baseline === 'done' ? 100 : Math.min(95, cur.progress || 60);
      if (typeof App !== 'undefined' && App.renderPanel && PHASES && PHASES[State.get().cur] && PHASES[State.get().cur].id === 'monitor') {
        App.renderPanel();
      }
    }, 850);
  }

  function _render() {
    const el = document.getElementById('log-box');
    if (!el) return;
    const logs = State.get().log;
    el.innerHTML = logs.slice(0, 30).map(e =>
      `<div class="log-row">
        <span class="log-t">${e.time}</span>
        <span class="log-m"><span class="ltag lt-${e.tag}">${e.tag}</span> ${e.msg}</span>
      </div>`
    ).join('');
    const cnt = document.getElementById('log-count');
    if (cnt) cnt.textContent = `${logs.length} events`;
  }

  return { add, render: _render, _kbBaseUrl: () => KB_BASE_URL };
})();

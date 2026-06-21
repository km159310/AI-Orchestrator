// src/components/observability.js
// Persistent dashboard panel that polls /api/observability and renders
// live health, uptime, hit count, and latency for each running port.
const Observability = (() => {
  const POLL_MS = 4000;
  let _timer   = null;
  let _ports   = [];
  let _err     = null;
  let _lastFetchAt = null;

  function _fmtUptime(s) {
    if (s == null) return '—';
    if (s < 60)    return s + 's';
    if (s < 3600)  return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h + 'h ' + m + 'm';
  }

  async function _tick() {
    try {
      const r = await fetch('/api/observability', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      _ports = (j && j.ports) || [];
      _err   = null;
    } catch (e) {
      _err = e.message;
    }
    _lastFetchAt = new Date();
    _render();
  }

  function _portCard(p) {
    const dotCls   = p.up ? 'dot up' : 'dot down';
    const stateTxt = p.up ? 'Healthy' : 'Down';
    const stateCls = p.up ? 'ok' : 'bad';
    return `
      <div class="obs-card">
        <div class="obs-card-head">
          <span class="${dotCls}"></span>
          <a class="obs-port" href="http://localhost:${p.port}/" target="_blank" rel="noopener">
            :${p.port} <i class="ti ti-external-link" aria-hidden="true"></i>
          </a>
          <span class="obs-state ${stateCls}">${stateTxt}</span>
        </div>
        <div class="obs-metrics">
          <div class="obs-metric">
            <div class="obs-metric-lbl">Uptime</div>
            <div class="obs-metric-val">${_fmtUptime(p.uptimeS)}</div>
          </div>
          <div class="obs-metric">
            <div class="obs-metric-lbl">Hits</div>
            <div class="obs-metric-val">${p.probeCount}</div>
          </div>
          <div class="obs-metric">
            <div class="obs-metric-lbl">Latency</div>
            <div class="obs-metric-val">${p.lastProbeMs} ms</div>
          </div>
          <div class="obs-metric">
            <div class="obs-metric-lbl">Last hit</div>
            <div class="obs-metric-val mono">${p.lastProbeAt}</div>
          </div>
        </div>
      </div>`;
  }

  function _render() {
    const slot = document.getElementById('obs-panel');
    if (!slot) return;

    const countTxt = _ports.length
      ? `${_ports.length} instance${_ports.length === 1 ? '' : 's'} tracked`
      : 'No running instances';

    let body;
    if (_err) {
      body = `<div class="obs-empty obs-err">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i> ${_err}
      </div>`;
    } else if (!_ports.length) {
      body = `<div class="obs-empty">
        <i class="ti ti-plug-off" aria-hidden="true"></i>
        Launch an app instance from the Development phase to see live signals.
      </div>`;
    } else {
      body = `<div class="obs-grid">${_ports.map(_portCard).join('')}</div>`;
    }

    const stamp = _lastFetchAt ? _lastFetchAt.toLocaleTimeString() : '—';

    slot.innerHTML = `
      <div class="obs-head">
        <span class="obs-head-title">
          <i class="ti ti-activity-heartbeat" aria-hidden="true"></i>
          Dashboard &amp; Observability
        </span>
        <span class="obs-head-meta">${countTxt} · refreshed ${stamp}</span>
      </div>
      ${body}`;
  }

  function start() {
    if (_timer) return;
    _tick();
    _timer = setInterval(_tick, POLL_MS);
  }

  function stop() {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  }

  function mount() {
    return `<aside class="obs-panel" id="obs-panel" aria-label="Dashboard and Observability"></aside>`;
  }

  return { start, stop, mount };
})();

// src/components/bankApp.js
// Bridges the dev-phase UI to the backend that materialises and runs the
// generated ABC Bank application.
const BankApp = (() => {
  const PORTS = [3001, 3002];

  async function _post(path) {
    const r = await fetch(path, { method: 'POST' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  async function _get(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function generate() {
    const s = State.get();
    if (s.bankApp.generated || s.bankApp.generating) return;
    State.setBankApp({ generating: true, lastError: null });
    Logger.add('Materialising ABC Bank application…', 'info');
    App.renderPanel();
    try {
      const res = await _post('/api/generate-app');
      State.setBankApp({
        generating: false,
        generated: true,
        path: res.path,
        files: res.files || [],
      });
      Logger.add(`✓ ABC Bank app generated — ${(res.files || []).length} files`, 'success');
    } catch (e) {
      State.setBankApp({ generating: false, lastError: e.message });
      Logger.add('App generation failed: ' + e.message, 'danger');
    }
    App.renderPanel();
  }

  async function launch(port) {
    State.setBankApp({ launching: port });
    App.renderPanel();
    try {
      const res = await _post(`/api/launch?port=${port}`);
      if (!res.ok) throw new Error(res.error || 'launch failed');
      const ports = State.get().bankApp.ports.slice();
      if (!ports.includes(port)) ports.push(port);
      ports.sort((a, b) => a - b);
      State.setBankApp({ launching: null, ports });
      Logger.add(`▶ ABC Bank running on http://localhost:${port}/`, 'success');
    } catch (e) {
      State.setBankApp({ launching: null, lastError: e.message });
      Logger.add('Launch failed on :' + port + ' — ' + e.message, 'danger');
    }
    App.renderPanel();
  }

  async function stop(port) {
    try {
      await _post(`/api/stop?port=${port}`);
    } catch (e) {
      Logger.add('Stop failed: ' + e.message, 'warn');
    }
    const ports = State.get().bankApp.ports.filter(p => p !== port);
    State.setBankApp({ ports });
    Logger.add(`■ Stopped ABC Bank on :${port}`, 'info');
    App.renderPanel();
  }

  async function stopAll() {
    const ports = State.get().bankApp.ports.slice();
    await Promise.all(ports.map(p => _post(`/api/stop?port=${p}`).catch(() => null)));
    State.setBankApp({ ports: [] });
  }

  async function init() {
    try {
      const res = await _get('/api/status');
      if (res && Array.isArray(res.ports) && res.ports.length) {
        State.setBankApp({ generated: true, ports: res.ports.slice().sort((a, b) => a - b) });
      }
    } catch (_) { /* server may be old http.server — ignore */ }
  }

  function render() {
    const b = State.get().bankApp;
    if (!b.generated && !b.generating) return '';

    const subTxt = b.generating
      ? 'Generating files…'
      : `Generated · ${(b.files || []).length} files${b.path ? ' · ' + b.path : ''}`;

    let h = `<div class="bank-app">
      <div class="bank-app-head">
        <div class="bank-app-ico"><i class="ti ti-building-bank" aria-hidden="true"></i></div>
        <div style="flex:1;min-width:0">
          <div class="bank-app-title">ABC Bank application</div>
          <div class="bank-app-sub">${subTxt}</div>
        </div>
        ${b.generating ? '<span class="spin" style="color:var(--cyan)"></span>' : ''}
      </div>`;

    if (b.generated) {
      h += `<div class="bank-app-ports">`;
      PORTS.forEach(port => {
        const running   = b.ports.includes(port);
        const launching = b.launching === port;
        const stateLbl  = running ? '● Running' : launching ? 'Launching…' : 'Idle';
        const stateCls  = running ? 'on' : launching ? 'busy' : 'off';
        h += `<div class="bank-app-port ${running ? 'running' : ''}">
          <div class="bank-app-port-num">:${port}</div>
          <div class="bank-app-port-mid">
            <div class="bank-app-port-status ${stateCls}">${stateLbl}</div>
            ${running
              ? `<a class="bank-app-port-link" href="http://localhost:${port}/" target="_blank" rel="noopener">http://localhost:${port}/ <i class="ti ti-external-link" style="font-size:11px"></i></a>`
              : `<div class="bank-app-port-hint">python -m http.server ${port}</div>`}
          </div>
          <div class="bank-app-port-actions">
            ${running
              ? `<button class="btn btn-no" onclick="BankApp.stop(${port})"><i class="ti ti-player-stop" aria-hidden="true"></i> Stop</button>`
              : `<button class="btn btn-run" onclick="BankApp.launch(${port})" ${launching ? 'disabled' : ''}>
                  <i class="ti ti-player-play" aria-hidden="true"></i> Launch
                 </button>`}
          </div>
        </div>`;
      });
      h += `</div>`;

      h += `<div class="bank-app-hint"><i class="ti ti-info-circle" aria-hidden="true"></i>
        Demo login — <code>demo</code> / <code>demo123</code>
      </div>`;
    }

    if (b.lastError) {
      h += `<div class="notif n-danger" style="margin-top:.625rem">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i> ${b.lastError}
      </div>`;
    }

    h += `</div>`;
    return h;
  }

  return { generate, launch, stop, stopAll, init, render };
})();

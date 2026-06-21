// src/components/agentGrid.js
const AgentGrid = (() => {
  function render(pid) {
    const ags = AGENTS[pid] || [];
    const as  = State.get().agState[pid] || {};

    return `<div class="ag-grid">` + ags.map(a => {
      const s  = as[a.id] || { status: 'idle', progress: 0, lines: [] };
      const sl = { idle: 'Idle', running: 'Running…', done: 'Complete' }[s.status] || 'Idle';
      const p  = s.status === 'done' ? 100 : s.progress;
      const pCls = s.status === 'done' ? 'done' : s.status === 'running' ? 'amber' : '';

      return `
        <div class="ag-card ${s.status === 'done' ? 'done' : s.status === 'running' ? 'running' : ''}">
          <div class="ag-head">
            <div class="ag-ico" style="background:${a.color};border-color:${a.border}">
              <i class="ti ${a.icon}" style="font-size:12px;color:${a.border.replace('rgba', 'rgb').replace(',0.3)', ')')}" aria-hidden="true"></i>
            </div>
            <div class="ag-name-wrap">
              <div class="ag-name">${a.name}</div>
              ${a.desc ? `<div class="ag-desc" title="${a.desc.replace(/"/g, '&quot;')}">${a.desc}</div>` : ''}
              <div class="ag-st ${s.status}">
                ${s.status === 'running' ? '<span class="spin"></span> ' : s.status === 'done' ? '✓ ' : ''}${sl}
              </div>
            </div>
          </div>
          <div class="ag-out ${s.lines.length ? 'active' : ''}">
            ${s.lines.length ? s.lines[s.lines.length - 1] : `<span style="opacity:.5">${a.name} standing by…</span>`}
          </div>
          <div class="prog"><div class="prog-f ${pCls}" style="width:${p}%"></div></div>
        </div>`;
    }).join('') + `</div>`;
  }

  function streamBox(pid) {
    const lines = Object.values(State.get().agState[pid] || {}).flatMap(a => a.lines);
    if (!lines.length) return '';
    return `<div class="sbox">${lines.slice(-6).map(l =>
      `<div class="sl ${l.startsWith('✓') ? 'g' : l.startsWith('⚠') ? 'y' : l.startsWith('✗') ? 'r' : ''}">${l}</div>`
    ).join('')}</div>`;
  }

  return { render, streamBox };
})();

// src/components/docViewer.js
const DocViewer = (() => {
  function _docsFor(pid) {
    const base = DOCS[pid];
    if (!base) return null;
    // After a coverage rejection + re-run, swap the Dev Unit-Test tab (index 1)
    // with the green re-run report.
    const devRunCount = State.get().devRunCount || 0;
    if (pid === 'dev' && devRunCount >= 2 && typeof DEV_UNIT_TEST_REPORT_V2 !== 'undefined') {
      return {
        tabs: base.tabs,
        contents: base.contents.map((c, i) => (i === 1 ? DEV_UNIT_TEST_REPORT_V2 : c)),
      };
    }
    return base;
  }

  function render(pid) {
    const def = _docsFor(pid);
    if (!def) return '';
    const s = State.get();
    if (s.docTab[pid] == null) s.docTab[pid] = 0;
    const tab = s.docTab[pid] || 0;
    const c   = def.contents[tab] || def.contents[0];
    const tabsH = def.tabs.map((t, i) =>
      `<span class="doc-tab ${i === tab ? 'active' : ''}" onclick="DocViewer.setTab('${pid}',${i})">${t}</span>`
    ).join('');

    let body = `<div class="doc-title">${c.title}</div>
      <div class="doc-meta">
        <span><i class="ti ti-calendar" style="font-size:9px" aria-hidden="true"></i>${c.meta.date}</span>
        <span><i class="ti ti-user" style="font-size:9px" aria-hidden="true"></i>${c.meta.author}</span>
        <span style="color:var(--amber)">${c.meta.status}</span>
        <span>v${c.meta.ver}</span>
      </div>`;

    c.sections.forEach(sec => {
      body += `<div class="doc-section"><div class="doc-h2">${sec.h}</div>`;
      if (sec.p)     body += `<div class="doc-p">${sec.p}</div>`;
      if (sec.list)  body += `<ul class="doc-list">${sec.list.map(i => `<li>${i}</li>`).join('')}</ul>`;
      if (sec.table) body += `<table class="doc-table">
        <thead><tr>${sec.table.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${sec.table.rows.map(r => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
      if (sec.wireframes && typeof Wireframe !== 'undefined') {
        body += `<div class="wireframe-grid">${sec.wireframes.map(w => Wireframe.render(w.name, w.caption)).join('')}</div>`;
      }
      body += `</div>`;
    });

    return `<div class="doc-panel">
      <div class="doc-toolbar">
        <i class="ti ti-file-text" style="font-size:11px;color:var(--text3)" aria-hidden="true"></i>
        <span style="font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);flex:1">Generated Documents</span>
        ${tabsH}
      </div>
      <div class="doc-body">${body}</div>
    </div>`;
  }

  function setTab(pid, i) {
    State.get().docTab[pid] = i;
    App.renderPanel();
  }

  return { render, setTab };
})();

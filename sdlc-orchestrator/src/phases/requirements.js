// src/phases/requirements.js
const ReqPhase = (() => {
  function _escape(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function _appIdentitySection(s) {
    const lobField = `<select class="form-input" onchange="App.setLob(this.value)">
      <option value="">— Select LOB —</option>
      ${LOB_LIST.map(a => `<option value="${_escape(a)}" ${a === s.lob ? 'selected' : ''}>${_escape(a)}</option>`).join('')}
    </select>`;

    const bizAppField = `<select class="form-input" onchange="App.setBizApp(this.value)">
      <option value="">— Select Business Application —</option>
      ${BIZ_APP_LIST.map(b => `<option value="${_escape(b)}" ${b === s.bizApp ? 'selected' : ''}>${_escape(b)}</option>`).join('')}
    </select>`;

    const projectField = s.projectType === 'old'
      ? `<label class="form-field">
          <span class="form-lbl">Project</span>
          <select class="form-input" onchange="App.setProject(this.value)">
            <option value="">— Select Project —</option>
            ${PROJECT_LIST.map(p => `<option value="${_escape(p)}" ${p === s.project ? 'selected' : ''}>${_escape(p)}</option>`).join('')}
          </select>
        </label>`
      : '';

    const ready =
      !!s.projectType &&
      (s.lob || '').trim() &&
      (s.bizApp || '').trim() &&
      (s.projectType !== 'old' || (s.project || '').trim());

    let html = `<div class="dvdr"></div><div class="section-label">Application identity</div>
      <div class="form-row">
        <label class="form-field">
          <span class="form-lbl">LOB</span>
          ${lobField}
        </label>
        <label class="form-field">
          <span class="form-lbl">Business application</span>
          ${bizAppField}
        </label>
        ${projectField}
      </div>`;

    if (ready) {
      const projChunk = (s.projectType === 'old' && s.project)
        ? `<span style="margin:0 6px;color:var(--text3)">·</span>${_escape(s.project)}`
        : '';
      html += `<div class="notif n-info" style="margin-top:.5rem">
        <i class="ti ti-id-badge" aria-hidden="true"></i>
        <strong style="margin-left:4px">${_escape(s.lob)}</strong>
        <span style="margin:0 6px;color:var(--text3)">·</span>
        ${_escape(s.bizApp)}${projChunk}
      </div>`;
    }
    return html;
  }

  function _appIdentityReady(s) {
    return !!s.projectType &&
      (s.lob || '').trim() &&
      (s.bizApp || '').trim() &&
      (s.projectType !== 'old' || (s.project || '').trim());
  }

  function render(body, st) {
    const s = State.get();
    let h = Hero.render('req');

    if (st === 'done')     h += `<div class="success-banner"><i class="ti ti-circle-check" style="font-size:16px" aria-hidden="true"></i> Requirements approved — Design phase triggered automatically.</div>`;
    if (st === 'rejected') h += RejectControl.renderBanner('req');

    const appIdentityReady = _appIdentityReady(s);
    const isActiveOrRejected = st === 'active' || st === 'rejected';

    // Project type — shown first, before BRD input
    h += `<div class="section-label">Project type</div>`;
    if (!s.projectType && isActiveOrRejected) {
      h += `<div class="ch-row">
        <button class="ch-btn" onclick="App.selectProject('new')">
          <div class="ch-ico"><i class="ti ti-sparkles" aria-hidden="true"></i></div>
          <div><div class="ch-title">New project</div><div class="ch-sub">Greenfield from scratch</div></div>
        </button>
        <button class="ch-btn" onclick="App.selectProject('old')">
          <div class="ch-ico"><i class="ti ti-git-branch" aria-hidden="true"></i></div>
          <div><div class="ch-title">Existing project</div><div class="ch-sub">Feature branch + PR agent</div></div>
        </button>
      </div>`;
    } else if (s.projectType) {
      h += `<div class="notif n-info">
        <i class="ti ${s.projectType === 'new' ? 'ti-sparkles' : 'ti-git-branch'}" aria-hidden="true"></i>
        ${s.projectType === 'new' ? 'New project — greenfield' : 'Existing project'}
      </div>`;
    }

    // App identity comes BEFORE BRD input for both new and existing projects.
    if (s.projectType) {
      h += _appIdentitySection(s);
    }

    // BRD input
    h += `<div class="dvdr"></div><div class="section-label">BRD / Requirements input</div>`;
    h += BrdInput.render();

    // Tech stack — only for new projects, after BRD extracted
    if (s.brd.extracted && s.projectType === 'new') {
      h += `<div class="dvdr"></div><div class="section-label">Technology stack</div>`;
      const stacks = [
        { id: 'java',   title: 'Java / J2EE', sub: 'Spring · JPA · Tomcat',   icon: 'ti-coffee' },
        { id: 'python', title: 'Python',      sub: 'FastAPI / Django · pip',  icon: 'ti-brand-python' },
        { id: 'dotnet', title: '.NET',        sub: 'C# · ASP.NET · NuGet',    icon: 'ti-brand-c-sharp' },
      ];
      if (!s.techStack && isActiveOrRejected) {
        h += `<div class="ch-row ch-row-3">${stacks.map(t =>
          `<button class="ch-btn" onclick="App.selectTechStack('${t.id}')">
            <div class="ch-ico"><i class="ti ${t.icon}" aria-hidden="true"></i></div>
            <div><div class="ch-title">${t.title}</div><div class="ch-sub">${t.sub}</div></div>
          </button>`
        ).join('')}</div>`;
      } else if (s.techStack) {
        const t = stacks.find(x => x.id === s.techStack);
        h += `<div class="notif n-info">
          <i class="ti ${t ? t.icon : 'ti-stack-2'}" aria-hidden="true"></i>
          Stack: <strong style="margin-left:4px">${t ? t.title : s.techStack}</strong>
          <span style="margin-left:auto;font-size:10px;color:var(--text3)">${t ? t.sub : ''}</span>
        </div>`;
      }
    }

    // Agents — only when prerequisites satisfied
    const stackReady = s.projectType !== 'new' || !!s.techStack;
    if (s.brd.extracted && s.projectType && stackReady && appIdentityReady) {
      h += `<div class="dvdr"></div><div class="section-label">Phases</div>`;
      h += AgentGrid.render('req');
      if (st === 'running') h += AgentGrid.streamBox('req');
      if (isActiveOrRejected) {
        const disabled = RejectControl.gated('req', st) ? 'disabled title="Verify the rejection reason first"' : '';
        h += `<div class="appr-bar">
          <button class="btn btn-run" onclick="App.startAgents('req')" ${disabled}>
            <i class="ti ti-player-play" aria-hidden="true"></i> Run phases
          </button>
        </div>`;
      }
    } else if (s.brd.extracted && !s.projectType) {
      h += `<div style="font-size:9.5px;color:var(--text3);margin-top:.375rem">↑ Select project type to continue.</div>`;
    } else if (s.brd.extracted && s.projectType && !appIdentityReady) {
      const need = s.projectType === 'old' ? 'LOB, Business application and Project' : 'LOB and Business application';
      h += `<div style="font-size:9.5px;color:var(--text3);margin-top:.375rem">↑ Select ${need} to continue.</div>`;
    } else if (s.brd.extracted && s.projectType === 'new' && !s.techStack) {
      h += `<div style="font-size:9.5px;color:var(--text3);margin-top:.375rem">↑ Select a technology stack to continue.</div>`;
    }

    if (st === 'pending') { h += `<div class="dvdr"></div>` + DocViewer.render('req') + SignOff.render('req'); }
    if (st === 'done')    { h += DocViewer.render('req'); }

    body.innerHTML = h;
  }

  return { render };
})();

// src/components/brdInput.js
const BrdInput = (() => {
  function _htmlAttr(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render() {
    const b = State.get().brd;

    if (b.extracted) {
      return _extractedHTML(b) +
        `<button class="btn btn-ghost" onclick="BrdInput.clear()" style="font-size:9px;padding:.22rem .5rem;margin-top:4px">
          <i class="ti ti-pencil" aria-hidden="true"></i> Edit input
        </button>`;
    }
    if (b.parseStep > 0 && b.parseStep < 5) return _parseProgressHTML();

    return _chatHTML(b);
  }

  function _chatHTML(b) {
    const s = State.get();
    const isExisting = s.projectType === 'old';
    const identityReady = !!s.lob && !!s.bizApp && (!isExisting || !!s.project);
    const showSuggestions = isExisting && identityReady && typeof suggestFeatures === 'function';
    const chars = b.pasteText.length;
    const clr   = chars >= 80 ? 'var(--green)' : chars > 0 ? 'var(--amber)' : 'var(--text3)';
    const ready = chars >= 50 || !!b.file;
    const subtitle = isExisting
      ? 'Describe an enhancement for this existing app, or pick an AI-suggested idea below to seed the requirement — AI extracts structured requirements.'
      : 'Describe your project or upload a BRD — AI extracts structured requirements.';
    const placeholder = isExisting
      ? 'e.g. Add a FICO score report to the dashboard with monthly refresh and trend chart…'
      : 'e.g. I need a banking app with login, account balance, transactions running on port 3001…';

    const suggestionsHTML = showSuggestions
      ? (() => {
          const items = suggestFeatures(s.lob, s.bizApp);
          if (!items.length) return '';
          const chips = items.map(it => {
            const titleAttr  = _htmlAttr(it.title);
            const iconAttr   = _htmlAttr(it.icon);
            const promptAttr = _htmlAttr(it.prompt);
            return `<button type="button" class="ai-sugg-chip"
                data-title="${titleAttr}"
                data-icon="${iconAttr}"
                data-prompt="${promptAttr}"
                onclick="BrdInput.applySuggestion(this.dataset)"
                title="${promptAttr}">
              <i class="ti ${it.icon}" aria-hidden="true"></i>
              <span>${titleAttr}</span>
            </button>`;
          }).join('');
          return `<div class="chat-brd-suggest">
            <div class="chat-brd-suggest-lbl"><i class="ti ti-sparkles" aria-hidden="true"></i> Feature suggestion</div>
            <div class="ai-sugg-chips">${chips}</div>
          </div>`;
        })()
      : '';

    const chip = b.file
      ? `<div class="chat-brd-chip">
          <i class="ti ti-paperclip" style="font-size:12px" aria-hidden="true"></i>
          <div style="flex:1;min-width:0">
            <div class="chat-brd-chip-name">${b.fileName}</div>
            <div class="chat-brd-chip-sz">${b.fileSize}</div>
          </div>
          <button class="chat-brd-chip-x" onclick="BrdInput.clearFile()" aria-label="Remove file">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>`
      : '';

    const sendBtn = `<button class="btn btn-run" onclick="BrdInput.send()" ${ready ? '' : 'disabled title="Type 50+ characters or attach a BRD"'} style="margin-left:auto">
        <i class="ti ti-send" aria-hidden="true"></i> Generate Requirement
      </button>`;

    return `<div class="chat-brd" ondragover="BrdInput.dragOver(event)" ondragleave="BrdInput.dragLeave(event)" ondrop="BrdInput.dropFile(event)">
      <div class="chat-brd-head">
        <div class="chat-brd-bot"><i class="ti ti-robot" aria-hidden="true"></i></div>
        <div style="flex:1;min-width:0">
          <div class="chat-brd-title">Requirements Assistant</div>
          <div class="chat-brd-sub">${subtitle}</div>
          ${suggestionsHTML}
        </div>
      </div>
      ${chip}
      <textarea class="chat-brd-input" id="chat-brd-input"
        placeholder="${placeholder}"
        oninput="BrdInput.onPaste(this.value)"
        onkeydown="BrdInput.onKey(event)">${b.pasteText}</textarea>
      <div class="chat-brd-bar">
        <input type="file" id="brd-file-input" accept=".pdf,.doc,.docx,.txt,.md"
          onchange="BrdInput.fileSelected(event)" style="display:none" aria-label="Upload BRD" />
        <button class="chat-brd-attach" onclick="document.getElementById('brd-file-input').click()"
          title="Upload BRD (PDF, DOCX, TXT, MD)">
          <i class="ti ti-paperclip" aria-hidden="true"></i> Upload BRD
        </button>
        <span style="font-size:9px;color:${clr};margin-left:8px">${chars} chars${chars >= 80 ? ' — ready' : ''}</span>
        ${sendBtn}
      </div>
      <div class="chat-brd-hint">
        Tip: drag &amp; drop a file anywhere on this card · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to send
      </div>
    </div>`;
  }

  function _parseProgressHTML() {
    const steps = [
      'Reading description…',
      'Extracting functional requirements…',
      'Identifying NFRs, risks & port config…',
      'Structuring traceability matrix…',
    ];
    const ps = State.get().brd.parseStep;
    return `<div class="parse-box">
      <div style="font-size:10px;font-weight:600;color:var(--cyan);display:flex;align-items:center;gap:6px;margin-bottom:.625rem">
        <span class="spin"></span> AI extracting requirements…
      </div>
      <div class="parse-steps">${steps.map((s, i) => {
        const cls = i < ps - 1 ? 'done' : i === ps - 1 ? 'active' : 'idle';
        const ic  = i < ps - 1 ? 'ti-check' : i === ps - 1 ? 'ti-loader-2' : 'ti-circle';
        return `<div class="parse-step ${cls}">
          <i class="ti ${ic}" style="font-size:10px${i === ps - 1 ? ';animation:spin .6s linear infinite' : ''}" aria-hidden="true"></i> ${s}
        </div>`;
      }).join('')}</div>
    </div>`;
  }

  function _extractedHTML(b) {
    const ext = b.extracted;
    const priCls = { must: 'must', should: 'should', nice: 'nice' };
    const badge = b.fileName ? 'BRD file' : 'chat input';
    return `<div class="extract-card">
      <div class="extract-head">
        <i class="ti ti-circle-check" style="font-size:12px" aria-hidden="true"></i>
        Requirements extracted from your input
        <span style="margin-left:auto;font-size:10px;font-weight:600;background:var(--cyan4);color:var(--cyan);padding:3px 9px;border-radius:999px;border:1px solid rgba(37,99,235,.25)">${badge}</span>
      </div>
      <div class="extract-body">
        <div class="stat-grid">
          <div class="stat-box"><div class="stat-num" style="color:var(--cyan)">${ext.reqCount}</div><div class="stat-lbl">Requirements</div></div>
          <div class="stat-box"><div class="stat-num" style="color:var(--red)">${ext.riskCount}</div><div class="stat-lbl">Risks</div></div>
          <div class="stat-box"><div class="stat-num" style="color:var(--green)">${ext.ports.length}</div><div class="stat-lbl">Ports</div></div>
          <div class="stat-box"><div class="stat-num" style="color:var(--amber)">4</div><div class="stat-lbl">Sections</div></div>
        </div>
        <div class="section-label" style="margin-bottom:.25rem">Extracted requirements</div>
        <div class="pri-legend">
          <span class="pri-legend-item"><span class="pri must">MUST</span>Non-negotiable — release blocks without it</span>
          <span class="pri-legend-item"><span class="pri should">SHOULD</span>Important — can ship without it if needed</span>
          <span class="pri-legend-item"><span class="pri nice">NICE</span>Optional — drop first when scope tightens</span>
        </div>
        <ul class="req-list">${ext.requirements.map(r => {
          const tip = r.pri === 'must'   ? 'MUST — non-negotiable; the release blocks without it'
                    : r.pri === 'should' ? 'SHOULD — important but the release can ship without it'
                    :                      'NICE — optional; drop first when scope tightens';
          return `<li class="req-item">
            <span class="req-id">${r.id}</span>
            <span class="req-txt">${r.text}</span>
            <select class="pri pri-select ${priCls[r.pri]}"
                    onchange="BrdInput.setPri('${r.id}', this.value)"
                    aria-label="Priority for ${r.id}"
                    title="${tip}">
              <option value="must"${r.pri === 'must' ? ' selected' : ''} title="Must-have — non-negotiable, ship-blocking">MUST</option>
              <option value="should"${r.pri === 'should' ? ' selected' : ''} title="Should-have — important but not release-blocking">SHOULD</option>
              <option value="nice"${r.pri === 'nice' ? ' selected' : ''} title="Nice-to-have — drop first when scope tightens">NICE</option>
            </select>
          </li>`;
        }).join('')}</ul>
        <div style="margin-top:.625rem;font-size:9px;color:var(--text3)">Stakeholders: ${ext.stakeholders.join(' · ')}</div>
      </div>
    </div>`;
  }

  // ── Actions ────────────────────────────────────────────────
  function onPaste(v) { State.setBrd({ pasteText: v }); App.renderPanel(); }

  function onKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      const b = State.get().brd;
      if ((b.pasteText.length >= 50) || b.file) { e.preventDefault(); send(); }
    }
  }

  function clearFile() {
    State.setBrd({ file: null, fileName: null, fileSize: null });
    App.renderPanel();
  }

  function setPri(id, pri) {
    const ext = State.get().brd.extracted;
    if (!ext) return;
    const requirements = ext.requirements.map(r => r.id === id ? Object.assign({}, r, { pri }) : r);
    State.setBrd({ extracted: Object.assign({}, ext, { requirements }) });
    App.renderPanel();
  }

  function clear() {
    const { brd } = State.get();
    if (brd.parseTimer) clearInterval(brd.parseTimer);
    State.setBrd({ file: null, fileName: null, fileSize: null, pasteText: INIT_PASTE, extracted: null, parseStep: 0, parseTimer: null });
    App.renderPanel();
  }

  function _attach(f) {
    State.setBrd({
      file: f, fileName: f.name,
      fileSize: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
    });
    Logger.add(`BRD attached: ${f.name}`, 'info');
    App.renderPanel();
  }

  function fileSelected(e) {
    const f = e.target.files[0];
    if (!f) return;
    _attach(f);
    e.target.value = '';
  }

  function dragOver(e)  { e.preventDefault(); document.querySelector('.chat-brd')?.classList.add('drag-over'); }
  function dragLeave()  { document.querySelector('.chat-brd')?.classList.remove('drag-over'); }
  function dropFile(e) {
    e.preventDefault(); dragLeave();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    _attach(f);
  }

  function send() {
    const b = State.get().brd;
    if (b.file) {
      Logger.add('AI parsing BRD file…', 'info');
      const reader = new FileReader();
      reader.onload = e => _doExtract(String(e.target.result || ''));
      reader.onerror = () => Logger.add('Failed to read file as text', 'danger');
      reader.readAsText(b.file);
    } else {
      Logger.add('AI parsing pasted description…', 'info');
      _doExtract(b.pasteText || '');
    }
  }

  function _doExtract(text) {
    State.setBrd({ parseStep: 1 });
    App.renderPanel();
    const stepTimer = setInterval(() => {
      const ps = State.get().brd.parseStep;
      if (ps < 4) { State.setBrd({ parseStep: ps + 1 }); App.renderPanel(); }
    }, 600);
    State.setBrd({ parseTimer: stepTimer });

    fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then(r => r.json().then(b => ({ ok: r.ok, body: b })))
      .then(({ ok, body }) => {
        clearInterval(stepTimer);
        if (!ok || !body.ok) {
          State.setBrd({ parseStep: 0, parseTimer: null });
          Logger.add(`Extraction failed: ${body.error || 'unknown error'}`, 'danger');
          App.renderPanel();
          return;
        }
        const ext = body.extracted;
        State.setBrd({ parseStep: 5, parseTimer: null, extracted: ext });
        Logger.add(`✓ ${ext.reqCount} requirements extracted · ${ext.ports.length} port(s) · ${ext.riskCount} risk(s)`, 'success');
        App.renderPanel();
        if (typeof App.afterBrdExtracted === 'function') App.afterBrdExtracted();
      })
      .catch(err => {
        clearInterval(stepTimer);
        State.setBrd({ parseStep: 0, parseTimer: null });
        Logger.add(`Extraction error: ${err.message}`, 'danger');
        App.renderPanel();
      });
  }

  function applySuggestion(payload) {
    // Accepts a DOMStringMap (from this.dataset) or a plain {title, icon, prompt} object.
    const data = payload || {};
    const title  = (data.title  || '').toString();
    const icon   = (data.icon   || 'ti-sparkles').toString();
    const prompt = (data.prompt || '').toString();
    if (!title && !prompt) return;

    Logger.add(`Injecting feature "${title || prompt.slice(0, 40)}" into ABC Bank app…`, 'info');
    fetch('/api/inject-feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, icon, desc: prompt, prompt }),
    })
      .then(r => r.json().then(b => ({ ok: r.ok, body: b })))
      .then(({ ok, body }) => {
        if (!ok || !body.ok) {
          Logger.add(`Failed to inject feature: ${body.error || 'unknown error'}`, 'danger');
          return;
        }
        const count = (body.features || []).length;
        const branchSlug = _slug(title || prompt);
        // Persist the active feature in state so the rest of the pipeline
        // (PR branch naming, topbar banner, end-of-pipeline teardown) can
        // see it. Cleared by App.tearDownFeature() when the last phase ends.
        State.setFeature({
          title,
          icon,
          prompt,
          branchSlug,
          injectedAt: new Date().toISOString(),
        });
        // Update the PR branch name now so the PR phase shows the right
        // ref when it runs later. Hardcoded fallback stays for the
        // legacy "no feature selected" path.
        if (branchSlug) {
          State.setPr({ branch: `feature/${branchSlug}` });
        }
        if (typeof App !== 'undefined' && App.renderFeatureBanner) {
          App.renderFeatureBanner();
        }
        if (body.duplicate) {
          Logger.add(`Feature "${title}" already injected (${count} total) — refresh ABC Bank app to view.`, 'warn');
        } else {
          Logger.add(`✓ Feature "${title}" added to ABC Bank app on branch feature/${branchSlug} (${count} total) — refresh ports 3001/3002 to view.`, 'success');
        }
      })
      .catch(err => Logger.add(`Inject error: ${err.message}`, 'danger'));
  }

  function _slug(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'feature';
  }

  return { render, onPaste, onKey, clearFile, clear, fileSelected, dragOver, dragLeave, dropFile, send, setPri, applySuggestion };
})();

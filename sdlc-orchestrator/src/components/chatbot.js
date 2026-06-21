// src/components/chatbot.js
// Floating KB chatbot. Talks to the local FastAPI server at /chat which does
// retrieval against ChromaDB and answers with OpenAI. Same IIFE pattern as
// every other module — no bundler needed.
const Chatbot = (() => {
  const KB_BASE_URL = (typeof window !== 'undefined' && window.KB_BASE_URL) || 'http://127.0.0.1:8765';

  // Conversation history kept in-memory for the lifetime of the page. The
  // backend caps it at 8 turns when forwarding to OpenAI, so unbounded growth
  // here is harmless.
  const _history = [];
  let _open = false;
  let _busy = false;

  function mount() {
    if (document.getElementById('chatbot-toggle')) return;

    // Toggle button — injected into .topbar-right, immediately before the
    // Reset button so it sits in the same horizontal cluster.
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'chatbot-toggle';
    toggleBtn.type = 'button';
    toggleBtn.className = 'chatbot-toggle';
    toggleBtn.title = 'Ask the SDLC assistant';
    toggleBtn.setAttribute('aria-label', 'Open chatbot');
    toggleBtn.innerHTML = '<i class="ti ti-message-chatbot" aria-hidden="true"></i><span>Assistant</span>';

    const topbarRight = document.querySelector('.topbar-right');
    const resetBtn = topbarRight && topbarRight.querySelector('.reset-btn');
    if (topbarRight && resetBtn) {
      topbarRight.insertBefore(toggleBtn, resetBtn);
    } else if (topbarRight) {
      topbarRight.appendChild(toggleBtn);
    } else {
      // Fallback if topbar isn't present yet — append to body so the chatbot
      // is still reachable.
      document.body.appendChild(toggleBtn);
    }

    // Dropdown panel anchored to top-right of the viewport.
    const panel = document.createElement('section');
    panel.id = 'chatbot-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'SDLC assistant');
    panel.hidden = true;
    panel.innerHTML = `
      <header class="cb-head">
        <span class="cb-title">
          <i class="ti ti-robot" aria-hidden="true"></i>
          <span>SDLC Assistant</span>
        </span>
        <span class="cb-status" id="cb-status" title="Backend status">● checking</span>
        <button type="button" class="cb-close" id="cb-close" aria-label="Close">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>
      </header>
      <div class="cb-body" id="cb-body" aria-live="polite">
        <div class="cb-msg cb-msg-bot">
          Hi — I can answer questions about the agents, phases, generated
          documents, and the live activity log. Try: <em>“What does the Risk Agent do?”</em>
          or <em>“Summarise the last few activity log entries.”</em>
        </div>
      </div>
      <form class="cb-form" id="cb-form" autocomplete="off">
        <input type="text" id="cb-input" placeholder="Ask about agents, phases, logs…" aria-label="Message" />
        <button type="submit" id="cb-send" aria-label="Send">
          <i class="ti ti-send" aria-hidden="true"></i>
        </button>
      </form>
    `;
    document.body.appendChild(panel);

    toggleBtn.addEventListener('click', toggle);
    document.getElementById('cb-close').addEventListener('click', toggle);
    document.getElementById('cb-form').addEventListener('submit', onSubmit);

    // Close the panel when clicking outside it (but not on the toggle).
    document.addEventListener('click', (ev) => {
      if (!_open) return;
      if (panel.contains(ev.target) || toggleBtn.contains(ev.target)) return;
      _open = false;
      panel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    });

    _pingHealth();
  }

  function toggle() {
    _open = !_open;
    const panel = document.getElementById('chatbot-panel');
    const btn = document.getElementById('chatbot-toggle');
    panel.hidden = !_open;
    if (btn) btn.setAttribute('aria-expanded', String(_open));
    if (_open) {
      _pingHealth();
      setTimeout(() => document.getElementById('cb-input').focus(), 30);
    }
  }

  async function _pingHealth() {
    const el = document.getElementById('cb-status');
    if (!el) return;
    try {
      const r = await fetch(`${KB_BASE_URL}/health`);
      if (!r.ok) throw new Error('not ok');
      const j = await r.json();
      el.textContent = `● online · ${j.docs} docs · ${j.logs} logs`;
      el.classList.remove('cb-status-down');
      el.classList.add('cb-status-up');
    } catch (_) {
      el.textContent = '● offline — start kb/server.py';
      el.classList.add('cb-status-down');
      el.classList.remove('cb-status-up');
    }
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (_busy) return;
    const input = document.getElementById('cb-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    _appendMessage('user', text);
    _history.push({ role: 'user', content: text });

    _busy = true;
    const thinkingId = _appendMessage('bot', '<span class="cb-typing"><span></span><span></span><span></span></span>');

    try {
      const r = await fetch(`${KB_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: _history }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const answer = j.answer || '(no answer)';
      const sourcesHtml = _renderSources(j.sources || []);
      _replaceMessage(thinkingId, _escape(answer) + sourcesHtml);
      _history.push({ role: 'assistant', content: answer });
    } catch (err) {
      _replaceMessage(
        thinkingId,
        `<span class="cb-err">Could not reach the KB backend (${_escape(String(err))}). Make sure <code>python kb/server.py</code> is running.</span>`
      );
    } finally {
      _busy = false;
    }
  }

  function _appendMessage(who, html) {
    const body = document.getElementById('cb-body');
    const id = `cb-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = `cb-msg cb-msg-${who}`;
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return id;
  }

  function _replaceMessage(id, html) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
    const body = document.getElementById('cb-body');
    body.scrollTop = body.scrollHeight;
  }

  function _renderSources(sources) {
    if (!sources.length) return '';
    const rows = sources.slice(0, 5).map(s => {
      const meta = s.metadata || {};
      const label = meta.agent_name
        ? `${meta.phase_label || meta.phase_id || ''} / ${meta.agent_name}`
        : (meta.heading || meta.source || meta.kind || s.id);
      return `<li><span class="cb-src-tag">${_escape(s.source)}</span> ${_escape(label)}</li>`;
    }).join('');
    return `<details class="cb-sources"><summary>Sources (${sources.length})</summary><ul>${rows}</ul></details>`;
  }

  function _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  return { mount, toggle };
})();

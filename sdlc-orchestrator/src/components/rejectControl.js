// src/components/rejectControl.js
// Two-step reject UI: button → inline textarea + Confirm/Cancel.
// Also exports a renderer for the rejected-state banner (reason + verify checkbox).
const RejectControl = (() => {
  let _formOpen = false;
  let _draft = '';

  function _captureDraft() {
    const el = document.getElementById('rj-reason');
    if (el) _draft = el.value;
  }

  function renderButton() {
    if (!_formOpen) {
      return `<button class="btn btn-no" onclick="RejectControl.open()">
        <i class="ti ti-circle-x" aria-hidden="true"></i> Reject
      </button>`;
    }
    return `<div class="reject-form">
      <textarea id="rj-reason" class="reject-reason" rows="3"
        placeholder="Why is this being rejected? (optional)"
        oninput="RejectControl._onInput(this.value)">${_draft}</textarea>
      <div class="reject-form-actions">
        <button class="btn btn-no" onclick="RejectControl.confirm()">
          <i class="ti ti-circle-x" aria-hidden="true"></i> Confirm rejection
        </button>
        <button class="btn btn-ghost" onclick="RejectControl.cancel()">Cancel</button>
      </div>
    </div>`;
  }

  function renderBanner(pid) {
    const rej = (State.get().rejections || {})[pid] || { reason: '', verified: false };
    const reasonBlock = rej.reason
      ? `<div class="rejected-reason">
          <span class="rejected-reason-label">Reason:</span>
          <span class="rejected-reason-text">${_escape(rej.reason)}</span>
        </div>`
      : `<div class="rejected-reason"><em class="rejected-reason-empty">No reason was provided.</em></div>`;
    return `<div class="rejected-card">
      <div class="rejected-head">
        <i class="ti ti-circle-x" aria-hidden="true"></i> Phase rejected — revise and resubmit
      </div>
      ${reasonBlock}
      <label class="rejected-verify">
        <input type="checkbox" ${rej.verified ? 'checked' : ''} onchange="App.toggleRejectionVerified()" />
        <span><strong>Reason addressed</strong> — verified and ready to proceed</span>
      </label>
    </div>`;
  }

  function gated(pid, status) {
    if (status !== 'rejected') return false;
    const rej = (State.get().rejections || {})[pid];
    return !rej || !rej.verified;
  }

  function _escape(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function open() { _formOpen = true; _draft = ''; App.renderPanel(); }
  function cancel() { _formOpen = false; _draft = ''; App.renderPanel(); }
  function reset() { _formOpen = false; _draft = ''; }
  function _onInput(v) { _draft = v; }
  function confirm() {
    _captureDraft();
    const reason = _draft;
    _formOpen = false; _draft = '';
    App.rejectPhase(reason);
  }

  return { renderButton, renderBanner, gated, open, cancel, confirm, reset, _onInput };
})();

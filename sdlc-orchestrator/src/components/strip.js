// src/components/strip.js
const Strip = (() => {
  function _sameGroup(a, b) {
    return !!(a && b && a.group && b.group && a.group.id === b.group.id);
  }

  function _buildNode(ph, st, idx) {
    const nd = document.createElement('div');
    nd.className = 'ph-node';
    nd.setAttribute('role', 'button');
    nd.setAttribute('aria-label', `${ph.label} – ${st}`);
    nd.onclick = () => App.jumpPhase(idx);
    nd.innerHTML = `
      <div class="ph-circle st-${st}">
        <i class="ti ${ph.icon}" style="font-size:14px" aria-hidden="true"></i>
        ${st !== 'locked' ? `<div class="ph-dot st-${st}"></div>` : ''}
      </div>
      <div class="ph-lbl st-${st}">${ph.label}</div>
    `;
    return nd;
  }

  function _buildConn(prevSt, isCurrent) {
    const conn = document.createElement('div');
    conn.className = 'ph-conn ' + (prevSt === 'done' ? 'done' : isCurrent ? 'active' : '');
    return conn;
  }

  function _openGroup(ph) {
    const wrap = document.createElement('div');
    wrap.className = 'ph-group';
    wrap.setAttribute('data-group', ph.group.id);
    if (ph.group.label) {
      const lab = document.createElement('div');
      lab.className = 'ph-group-lbl';
      lab.textContent = ph.group.label;
      wrap.appendChild(lab);
    }
    return wrap;
  }

  function render() {
    const el = document.getElementById('strip');
    if (!el) return;
    const { cur, statuses } = State.get();
    el.innerHTML = '';

    let groupEl = null; // currently open group container, or null

    PHASES.forEach((ph, i) => {
      const prev = PHASES[i - 1];

      // Connector before this phase (lives inside the group iff prev and
      // this are in the same group; otherwise it sits on the outer strip).
      if (i > 0) {
        const conn = _buildConn(statuses[i - 1], cur === i);
        (_sameGroup(prev, ph) ? groupEl : el).appendChild(conn);
      }

      // Open a new group container if this is the first node of a group.
      if (ph.group && !_sameGroup(prev, ph)) {
        groupEl = _openGroup(ph);
        el.appendChild(groupEl);
      }

      // Append the phase node into the active container.
      const node = _buildNode(ph, statuses[i], i);
      (ph.group ? groupEl : el).appendChild(node);

      // Close the group if the next phase is in a different group / none.
      const next = PHASES[i + 1];
      if (ph.group && !_sameGroup(ph, next)) {
        groupEl = null;
      }
    });
  }

  return { render };
})();

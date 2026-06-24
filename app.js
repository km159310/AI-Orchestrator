(function () {
  var path = window.location.pathname;
  var port = window.location.port || '80';
  var FOOTER = 'ABC Bank · running on port ' + port + ' · build ' + new Date().toISOString().slice(0, 10);

  function setFooter() {
    var f = document.getElementById('footer');
    if (f) f.textContent = FOOTER;
  }

  function fmt(n) {
    var sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ── Dashboard ────────────────────────────────────────────
  if (/dashboard/.test(path)) {
    var u = sessionStorage.getItem('abc_user');
    if (!u || !ABC_USERS[u]) {
      sessionStorage.removeItem('abc_user');
      window.location.href = 'index.html';
      return;
    }
    var user = ABC_USERS[u];
    document.getElementById('welcome').textContent = 'Welcome, ' + user.name;
    document.getElementById('balance').textContent = fmt(user.balance).replace('-', '');
    document.getElementById('accountInfo').textContent = 'Account ' + user.accountNo;

    var body = document.getElementById('txBody');
    var txs = ABC_TRANSACTIONS[u] || [];
    if (!txs.length) {
      body.innerHTML = '<tr><td colspan="4" class="empty">No recent transactions</td></tr>';
    } else {
      txs.forEach(function (t) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + t.date + '</td>' +
          '<td>' + t.desc + '</td>' +
          '<td><span class="pill ' + t.type + '">' + t.type + '</span></td>' +
          '<td class="' + t.type + '">' + fmt(t.amount) + '</td>';
        body.appendChild(tr);
      });
    }

    document.getElementById('logoutBtn').addEventListener('click', function () {
      sessionStorage.removeItem('abc_user');
      window.location.href = 'index.html';
    });
    
    // FICO module — render credit score gauge, band and factors.
    (function () {
      if (typeof ABC_FICO === 'undefined') return;
      var sec = document.getElementById('ficoSection');
      if (!sec) return;
      var rec = ABC_FICO[u];
      if (!rec) { sec.hidden = true; return; }
      function band(s) {
        if (s >= 800) return { label: 'Exceptional', cls: 'fico-exc' };
        if (s >= 740) return { label: 'Very Good',   cls: 'fico-vg'  };
        if (s >= 670) return { label: 'Good',        cls: 'fico-good'};
        if (s >= 580) return { label: 'Fair',        cls: 'fico-fair'};
        return                { label: 'Poor',        cls: 'fico-poor'};
      }
      document.getElementById('ficoScore').textContent = rec.score;
      var b = band(rec.score);
      var bEl = document.getElementById('ficoBand');
      bEl.textContent = b.label;
      bEl.className = 'fico-band ' + b.cls;
      document.getElementById('ficoUpdated').textContent = 'Updated ' + rec.updated;
      var fl = document.getElementById('ficoFactors');
      fl.innerHTML = '';
      (rec.factors || []).forEach(function (f) {
        var li = document.createElement('li');
        li.textContent = f;
        fl.appendChild(li);
      });
      var arc = document.getElementById('ficoArcFill');
      if (arc) {
        var pct = Math.max(0, Math.min(1, (rec.score - 300) / (850 - 300)));
        // Arc path length is approx 251 (PI * 80).
        var len = 251;
        arc.setAttribute('stroke-dasharray', (pct * len).toFixed(1) + ' ' + len);
      }
    })();


    // Render features injected from the SDLC Orchestrator via /api/inject-feature.
    // The file features.json sits alongside this app and is rewritten on each
    // suggestion click — refresh to pick up new additions.
    fetch('features.json?ts=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; })
      .then(function (items) {
        if (!Array.isArray(items) || !items.length) return;
        var sec = document.getElementById('featuresSection');
        var grid = document.getElementById('featuresGrid');
        if (!sec || !grid) return;
        sec.hidden = false;
        items.forEach(function (it) {
          var card = document.createElement('div');
          card.className = 'feature-card';
          var icon = (it.icon || 'ti-sparkles').replace(/[^a-z0-9-]/gi, '');
          var title = String(it.title || '').slice(0, 80);
          var desc  = String(it.desc  || '').slice(0, 240);
          card.innerHTML =
            '<div class="feature-icon"><i class="ti ' + icon + '" aria-hidden="true"></i></div>' +
            '<div class="feature-text">' +
              '<div class="feature-title"></div>' +
              '<div class="feature-desc"></div>' +
            '</div>';
          card.querySelector('.feature-title').textContent = title;
          card.querySelector('.feature-desc').textContent  = desc;
          grid.appendChild(card);
        });
      });

    setFooter();
    return;
  }

  // ── Login ────────────────────────────────────────────────
  var form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = document.getElementById('username').value.trim().toLowerCase();
      var p = document.getElementById('password').value;
      var rec = ABC_USERS[u];
      var err = document.getElementById('err');
      if (rec && rec.password === p) {
        sessionStorage.setItem('abc_user', u);
        window.location.href = 'dashboard.html';
      } else {
        err.textContent = 'Invalid username or password';
      }
    });
  }
  setFooter();
})();

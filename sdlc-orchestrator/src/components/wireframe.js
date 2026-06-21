// src/components/wireframe.js
// SVG wireframe mocks rendered inline in the Design phase docs.
const Wireframe = (() => {
  const SVG_ATTRS = 'viewBox="0 0 480 320" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img"';
  const FONT = 'Inter, system-ui, sans-serif';

  function _chrome(url) {
    return `
      <rect x="0" y="0" width="480" height="24" fill="#e2e8f0" />
      <circle cx="12" cy="12" r="4" fill="#ef4444" />
      <circle cx="26" cy="12" r="4" fill="#f59e0b" />
      <circle cx="40" cy="12" r="4" fill="#10b981" />
      <rect x="60" y="6" width="380" height="12" rx="3" fill="#ffffff" stroke="#cbd5e1" />
      <text x="68" y="15" font-family="JetBrains Mono, monospace" font-size="8" fill="#64748b">${url}</text>`;
  }

  function _login() {
    return `<svg ${SVG_ATTRS} aria-label="Login screen wireframe">
      ${_chrome('https://abc-bank.local/login')}
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />
      <rect x="120" y="56" width="240" height="232" rx="10" fill="#ffffff" stroke="#cbd5e1" />
      <text x="240" y="86" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="700" fill="#0f172a">ABC Bank</text>
      <text x="240" y="102" text-anchor="middle" font-family="${FONT}" font-size="9" fill="#64748b">Sign in to your account</text>
      <rect x="140" y="116" width="200" height="20" rx="4" fill="#fee2e2" stroke="#fecaca" />
      <text x="148" y="129" font-family="${FONT}" font-size="9" fill="#b91c1c">⚠ Invalid credentials</text>
      <text x="140" y="152" font-family="${FONT}" font-size="9" fill="#64748b">Username</text>
      <rect x="140" y="156" width="200" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="140" y="198" font-family="${FONT}" font-size="9" fill="#64748b">Password</text>
      <rect x="140" y="202" width="200" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <rect x="140" y="244" width="200" height="30" rx="6" fill="#2563eb" />
      <text x="240" y="263" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="600" fill="#ffffff">Sign in →</text>
    </svg>`;
  }

  function _dashboard() {
    const rows = [200, 224, 248, 272].map((y, i) => {
      const fill = i % 2 === 0 ? '#ffffff' : '#f1f5f9';
      const dot  = i === 0 ? '#10b981' : '#94a3b8';
      const lbl  = i === 0 ? 'Deposit · Salary' : i === 1 ? 'Coffee Shop' : i === 2 ? 'Transfer · Jane Doe' : 'Utility Bill';
      const amt  = i === 0 ? '+ $3,420.00' : i === 1 ? '− $4.85' : i === 2 ? '− $200.00' : '− $86.40';
      const ac   = i === 0 ? '#10b981' : '#0f172a';
      return `<g>
        <rect x="16" y="${y}" width="448" height="20" rx="4" fill="${fill}" stroke="#e2e8f0" />
        <circle cx="28" cy="${y + 10}" r="4" fill="${dot}" />
        <text x="42" y="${y + 13}" font-family="${FONT}" font-size="9" fill="#0f172a">${lbl}</text>
        <text x="440" y="${y + 13}" text-anchor="end" font-family="${FONT}" font-size="9" font-weight="600" fill="${ac}">${amt}</text>
      </g>`;
    }).join('');
    return `<svg ${SVG_ATTRS} aria-label="Dashboard screen wireframe">
      ${_chrome('https://abc-bank.local/dashboard')}
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />
      <rect x="0" y="24" width="480" height="32" fill="#ffffff" stroke="#cbd5e1" />
      <circle cx="20" cy="40" r="8" fill="#2563eb" />
      <text x="36" y="44" font-family="${FONT}" font-size="11" font-weight="700" fill="#0f172a">ABC Bank</text>
      <circle cx="460" cy="40" r="9" fill="#cbd5e1" />
      <text x="460" y="44" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="#475569">DK</text>
      <rect x="16" y="72" width="448" height="84" rx="10" fill="#2563eb" />
      <text x="32" y="96" font-family="${FONT}" font-size="10" fill="#dbeafe">Current balance</text>
      <text x="32" y="132" font-family="${FONT}" font-size="28" font-weight="700" fill="#ffffff">$ 14,328.42</text>
      <rect x="370" y="116" width="80" height="26" rx="5" fill="#ffffff" />
      <text x="410" y="133" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="#2563eb">Transfer →</text>
      <text x="16" y="180" font-family="${FONT}" font-size="10" font-weight="700" fill="#0f172a">Recent transactions</text>
      ${rows}
    </svg>`;
  }

  function _transfer() {
    return `<svg ${SVG_ATTRS} aria-label="Transfer screen wireframe">
      ${_chrome('https://abc-bank.local/transfer')}
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />
      <rect x="80" y="56" width="320" height="240" rx="10" fill="#ffffff" stroke="#cbd5e1" />
      <text x="240" y="84" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="700" fill="#0f172a">New transfer</text>
      <text x="100" y="108" font-family="${FONT}" font-size="9" fill="#64748b">From account</text>
      <rect x="100" y="112" width="280" height="28" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="110" y="130" font-family="${FONT}" font-size="10" fill="#0f172a">Checking · ••• 4421</text>
      <text x="370" y="130" text-anchor="end" font-family="${FONT}" font-size="9" fill="#64748b">▾</text>
      <text x="100" y="156" font-family="${FONT}" font-size="9" fill="#64748b">To account</text>
      <rect x="100" y="160" width="280" height="28" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="110" y="178" font-family="${FONT}" font-size="10" fill="#0f172a">Savings · ••• 8810</text>
      <text x="370" y="178" text-anchor="end" font-family="${FONT}" font-size="9" fill="#64748b">▾</text>
      <text x="100" y="204" font-family="${FONT}" font-size="9" fill="#64748b">Amount</text>
      <rect x="100" y="208" width="280" height="32" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="112" y="230" font-family="${FONT}" font-size="14" font-weight="700" fill="#0f172a">$ 250.00</text>
      <rect x="100" y="254" width="130" height="30" rx="5" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="165" y="273" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="600" fill="#64748b">Cancel</text>
      <rect x="250" y="254" width="130" height="30" rx="5" fill="#2563eb" />
      <text x="315" y="273" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="600" fill="#ffffff">Confirm transfer</text>
    </svg>`;
  }

  function _transactions() {
    const data = [
      { d: '2026-06-09', desc: 'Salary deposit',     type: 'deposit',  amt: '+ $3,420.00', green: true },
      { d: '2026-06-08', desc: 'Coffee Shop',        type: 'debit',    amt: '− $4.85',     green: false },
      { d: '2026-06-07', desc: 'Transfer · Jane',    type: 'transfer', amt: '− $200.00',   green: false },
      { d: '2026-06-05', desc: 'Utility · Electric', type: 'debit',    amt: '− $86.40',    green: false },
      { d: '2026-06-03', desc: 'Refund · Amazon',    type: 'deposit',  amt: '+ $39.99',    green: true },
    ];
    const rows = data.map((row, i) => `<g>
      <rect x="16" y="${142 + i * 24}" width="448" height="22" fill="${i % 2 === 0 ? '#ffffff' : '#f8fafc'}" />
      <text x="28" y="${157 + i * 24}" font-family="JetBrains Mono" font-size="8" fill="#475569">${row.d}</text>
      <text x="120" y="${157 + i * 24}" font-family="${FONT}" font-size="9" fill="#0f172a">${row.desc}</text>
      <text x="290" y="${157 + i * 24}" font-family="${FONT}" font-size="9" fill="#64748b">${row.type}</text>
      <text x="452" y="${157 + i * 24}" text-anchor="end" font-family="${FONT}" font-size="9" font-weight="600" fill="${row.green ? '#10b981' : '#0f172a'}">${row.amt}</text>
    </g>`).join('');
    return `<svg ${SVG_ATTRS} aria-label="Transactions screen wireframe">
      ${_chrome('https://abc-bank.local/transactions')}
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />
      <rect x="0" y="24" width="480" height="32" fill="#ffffff" stroke="#cbd5e1" />
      <text x="20" y="44" font-family="${FONT}" font-size="11" font-weight="700" fill="#0f172a">Transactions</text>
      <rect x="16" y="72" width="448" height="34" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="24" y="80" width="100" height="18" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="32" y="92" font-family="${FONT}" font-size="8" fill="#64748b">From: 2026-05-01</text>
      <rect x="132" y="80" width="100" height="18" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="140" y="92" font-family="${FONT}" font-size="8" fill="#64748b">To: 2026-06-10</text>
      <rect x="240" y="80" width="80" height="18" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="248" y="92" font-family="${FONT}" font-size="8" fill="#64748b">All types ▾</text>
      <rect x="380" y="80" width="76" height="18" rx="3" fill="#2563eb" />
      <text x="418" y="92" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="600" fill="#ffffff">Apply</text>
      <rect x="16" y="118" width="448" height="22" fill="#e2e8f0" />
      <text x="28" y="133" font-family="${FONT}" font-size="9" font-weight="700" fill="#475569">Date</text>
      <text x="120" y="133" font-family="${FONT}" font-size="9" font-weight="700" fill="#475569">Description</text>
      <text x="290" y="133" font-family="${FONT}" font-size="9" font-weight="700" fill="#475569">Type</text>
      <text x="452" y="133" text-anchor="end" font-family="${FONT}" font-size="9" font-weight="700" fill="#475569">Amount</text>
      ${rows}
      <text x="16" y="298" font-family="${FONT}" font-size="9" fill="#64748b">Page 1 of 12</text>
      <rect x="380" y="288" width="30" height="18" rx="3" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="395" y="300" text-anchor="middle" font-family="${FONT}" font-size="9" fill="#475569">‹</text>
      <rect x="416" y="288" width="30" height="18" rx="3" fill="#2563eb" />
      <text x="431" y="300" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="600" fill="#ffffff">›</text>
    </svg>`;
  }

  function _admin() {
    const data = [
      { id: 'A-1042', user: 'Jane Doe',     bal: '$ 14,328.42', st: 'Active',   stClr: '#10b981' },
      { id: 'A-1087', user: 'John Smith',   bal: '$ 982.10',    st: 'Active',   stClr: '#10b981' },
      { id: 'A-1124', user: 'Priya Nair',   bal: '$ 0.00',      st: 'Frozen',   stClr: '#f59e0b' },
      { id: 'A-1156', user: 'Marcus Webb',  bal: '$ 28,401.55', st: 'Active',   stClr: '#10b981' },
      { id: 'A-1189', user: 'Alex Torres',  bal: '$ 7,612.00',  st: 'Closed',   stClr: '#dc2626' },
    ];
    const rows = data.map((row, i) => `<g>
      <rect x="16" y="${136 + i * 28}" width="448" height="26" fill="${i % 2 === 0 ? '#ffffff' : '#f8fafc'}" />
      <text x="28" y="${152 + i * 28}" font-family="JetBrains Mono" font-size="8" fill="#475569">${row.id}</text>
      <text x="80" y="${152 + i * 28}" font-family="${FONT}" font-size="9" fill="#0f172a">${row.user}</text>
      <text x="220" y="${152 + i * 28}" font-family="JetBrains Mono" font-size="9" font-weight="600" fill="#0f172a">${row.bal}</text>
      <rect x="316" y="${144 + i * 28}" width="44" height="14" rx="7" fill="${row.stClr}" opacity="0.18" />
      <text x="338" y="${154 + i * 28}" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="700" fill="${row.stClr}">${row.st}</text>
      <text x="425" y="${152 + i * 28}" font-family="${FONT}" font-size="8" font-weight="600" fill="#2563eb">View</text>
      <text x="450" y="${152 + i * 28}" font-family="${FONT}" font-size="8" font-weight="600" fill="#dc2626">Lock</text>
    </g>`).join('');
    return `<svg ${SVG_ATTRS} aria-label="Admin Console screen wireframe">
      ${_chrome('https://abc-bank.local/admin/accounts')}
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />
      <rect x="0" y="24" width="480" height="32" fill="#0f172a" />
      <text x="20" y="44" font-family="${FONT}" font-size="11" font-weight="700" fill="#ffffff">Admin Console</text>
      <rect x="380" y="32" width="76" height="16" rx="3" fill="#dc2626" />
      <text x="418" y="43" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="700" fill="#ffffff">ADMIN ROLE</text>
      <rect x="16" y="72" width="360" height="28" rx="5" fill="#ffffff" stroke="#cbd5e1" />
      <text x="28" y="91" font-family="${FONT}" font-size="10" fill="#64748b">🔍  Search accounts by user, balance, status…</text>
      <rect x="384" y="72" width="80" height="28" rx="5" fill="#2563eb" />
      <text x="424" y="90" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="#ffffff">+ New</text>
      <rect x="16" y="112" width="448" height="22" fill="#0f172a" />
      <text x="28" y="127" font-family="${FONT}" font-size="9" font-weight="700" fill="#ffffff">ID</text>
      <text x="80" y="127" font-family="${FONT}" font-size="9" font-weight="700" fill="#ffffff">User</text>
      <text x="220" y="127" font-family="${FONT}" font-size="9" font-weight="700" fill="#ffffff">Balance</text>
      <text x="320" y="127" font-family="${FONT}" font-size="9" font-weight="700" fill="#ffffff">Status</text>
      <text x="430" y="127" font-family="${FONT}" font-size="9" font-weight="700" fill="#ffffff">Actions</text>
      ${rows}
    </svg>`;
  }

  const FRAMES = {
    login: _login,
    dashboard: _dashboard,
    transfer: _transfer,
    transactions: _transactions,
    admin: _admin,
  };

  function render(name, caption) {
    const fn = FRAMES[name];
    if (!fn) return '';
    const svg = fn();
    const cap = caption ? `<figcaption class="wireframe-caption">${caption}</figcaption>` : '';
    return `<figure class="wireframe"><div class="wireframe-frame">${svg}</div>${cap}</figure>`;
  }

  return { render };
})();

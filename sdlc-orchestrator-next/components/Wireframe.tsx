import type { JSX } from "react";
import type { WireframeName } from "@/lib/types";

// Browser-chrome top bar shared by every wireframe.
function ChromeBar({ url }: { url: string }) {
  return (
    <g>
      <rect x="0" y="0" width="480" height="24" fill="#e2e8f0" />
      <circle cx="12" cy="12" r="4" fill="#ef4444" />
      <circle cx="26" cy="12" r="4" fill="#f59e0b" />
      <circle cx="40" cy="12" r="4" fill="#10b981" />
      <rect x="60" y="6" width="380" height="12" rx="3" fill="#ffffff" stroke="#cbd5e1" />
      <text x="68" y="15" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#64748b">{url}</text>
    </g>
  );
}

const SVG_PROPS = {
  viewBox: "0 0 480 320",
  width: "100%",
  preserveAspectRatio: "xMidYMid meet" as const,
  xmlns: "http://www.w3.org/2000/svg",
  role: "img",
};

const FONT = "Inter, system-ui, sans-serif";

const FRAMES: Record<WireframeName, JSX.Element> = {
  login: (
    <svg {...SVG_PROPS} aria-label="Login screen wireframe">
      <ChromeBar url="https://abc-bank.local/login" />
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />

      {/* Login card */}
      <rect x="120" y="56" width="240" height="232" rx="10" fill="#ffffff" stroke="#cbd5e1" />
      <text x="240" y="86" textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#0f172a">ABC Bank</text>
      <text x="240" y="102" textAnchor="middle" fontFamily={FONT} fontSize="9" fill="#64748b">Sign in to your account</text>

      {/* Error banner placeholder */}
      <rect x="140" y="116" width="200" height="20" rx="4" fill="#fee2e2" stroke="#fecaca" />
      <text x="148" y="129" fontFamily={FONT} fontSize="9" fill="#b91c1c">⚠ Invalid credentials</text>

      {/* Username field */}
      <text x="140" y="152" fontFamily={FONT} fontSize="9" fill="#64748b">Username</text>
      <rect x="140" y="156" width="200" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />

      {/* Password field */}
      <text x="140" y="198" fontFamily={FONT} fontSize="9" fill="#64748b">Password</text>
      <rect x="140" y="202" width="200" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />

      {/* Submit */}
      <rect x="140" y="244" width="200" height="30" rx="6" fill="#2563eb" />
      <text x="240" y="263" textAnchor="middle" fontFamily={FONT} fontSize="11" fontWeight="600" fill="#ffffff">Sign in →</text>
    </svg>
  ),

  dashboard: (
    <svg {...SVG_PROPS} aria-label="Dashboard screen wireframe">
      <ChromeBar url="https://abc-bank.local/dashboard" />
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />

      {/* Top nav */}
      <rect x="0" y="24" width="480" height="32" fill="#ffffff" stroke="#cbd5e1" />
      <circle cx="20" cy="40" r="8" fill="#2563eb" />
      <text x="36" y="44" fontFamily={FONT} fontSize="11" fontWeight="700" fill="#0f172a">ABC Bank</text>
      <circle cx="460" cy="40" r="9" fill="#cbd5e1" />
      <text x="460" y="44" textAnchor="middle" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#475569">DK</text>

      {/* Balance card */}
      <rect x="16" y="72" width="448" height="84" rx="10" fill="#2563eb" />
      <text x="32" y="96" fontFamily={FONT} fontSize="10" fill="#dbeafe">Current balance</text>
      <text x="32" y="132" fontFamily={FONT} fontSize="28" fontWeight="700" fill="#ffffff">$ 14,328.42</text>
      <rect x="370" y="116" width="80" height="26" rx="5" fill="#ffffff" />
      <text x="410" y="133" textAnchor="middle" fontFamily={FONT} fontSize="10" fontWeight="600" fill="#2563eb">Transfer →</text>

      {/* Recent transactions header */}
      <text x="16" y="180" fontFamily={FONT} fontSize="10" fontWeight="700" fill="#0f172a">Recent transactions</text>

      {/* Transaction rows */}
      {[200, 224, 248, 272].map((y, i) => (
        <g key={i}>
          <rect x="16" y={y} width="448" height="20" rx="4" fill={i % 2 === 0 ? "#ffffff" : "#f1f5f9"} stroke="#e2e8f0" />
          <circle cx="28" cy={y + 10} r="4" fill={i === 0 ? "#10b981" : "#94a3b8"} />
          <text x="42" y={y + 13} fontFamily={FONT} fontSize="9" fill="#0f172a">
            {i === 0 ? "Deposit · Salary" : i === 1 ? "Coffee Shop" : i === 2 ? "Transfer · Jane Doe" : "Utility Bill"}
          </text>
          <text x="440" y={y + 13} textAnchor="end" fontFamily={FONT} fontSize="9" fontWeight="600" fill={i === 0 ? "#10b981" : "#0f172a"}>
            {i === 0 ? "+ $3,420.00" : i === 1 ? "− $4.85" : i === 2 ? "− $200.00" : "− $86.40"}
          </text>
        </g>
      ))}
    </svg>
  ),

  transfer: (
    <svg {...SVG_PROPS} aria-label="Transfer screen wireframe">
      <ChromeBar url="https://abc-bank.local/transfer" />
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />

      {/* Modal */}
      <rect x="80" y="56" width="320" height="240" rx="10" fill="#ffffff" stroke="#cbd5e1" />
      <text x="240" y="84" textAnchor="middle" fontFamily={FONT} fontSize="13" fontWeight="700" fill="#0f172a">New transfer</text>

      {/* From */}
      <text x="100" y="108" fontFamily={FONT} fontSize="9" fill="#64748b">From account</text>
      <rect x="100" y="112" width="280" height="28" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="110" y="130" fontFamily={FONT} fontSize="10" fill="#0f172a">Checking · ••• 4421</text>
      <text x="370" y="130" textAnchor="end" fontFamily={FONT} fontSize="9" fill="#64748b">▾</text>

      {/* To */}
      <text x="100" y="156" fontFamily={FONT} fontSize="9" fill="#64748b">To account</text>
      <rect x="100" y="160" width="280" height="28" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="110" y="178" fontFamily={FONT} fontSize="10" fill="#0f172a">Savings · ••• 8810</text>
      <text x="370" y="178" textAnchor="end" fontFamily={FONT} fontSize="9" fill="#64748b">▾</text>

      {/* Amount */}
      <text x="100" y="204" fontFamily={FONT} fontSize="9" fill="#64748b">Amount</text>
      <rect x="100" y="208" width="280" height="32" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="112" y="230" fontFamily={FONT} fontSize="14" fontWeight="700" fill="#0f172a">$ 250.00</text>

      {/* Buttons */}
      <rect x="100" y="254" width="130" height="30" rx="5" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="165" y="273" textAnchor="middle" fontFamily={FONT} fontSize="11" fontWeight="600" fill="#64748b">Cancel</text>
      <rect x="250" y="254" width="130" height="30" rx="5" fill="#2563eb" />
      <text x="315" y="273" textAnchor="middle" fontFamily={FONT} fontSize="11" fontWeight="600" fill="#ffffff">Confirm transfer</text>
    </svg>
  ),

  transactions: (
    <svg {...SVG_PROPS} aria-label="Transactions screen wireframe">
      <ChromeBar url="https://abc-bank.local/transactions" />
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />

      {/* Top nav */}
      <rect x="0" y="24" width="480" height="32" fill="#ffffff" stroke="#cbd5e1" />
      <text x="20" y="44" fontFamily={FONT} fontSize="11" fontWeight="700" fill="#0f172a">Transactions</text>

      {/* Filter bar */}
      <rect x="16" y="72" width="448" height="34" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="24" y="80" width="100" height="18" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="32" y="92" fontFamily={FONT} fontSize="8" fill="#64748b">From: 2026-05-01</text>
      <rect x="132" y="80" width="100" height="18" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="140" y="92" fontFamily={FONT} fontSize="8" fill="#64748b">To: 2026-06-10</text>
      <rect x="240" y="80" width="80" height="18" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="248" y="92" fontFamily={FONT} fontSize="8" fill="#64748b">All types ▾</text>
      <rect x="380" y="80" width="76" height="18" rx="3" fill="#2563eb" />
      <text x="418" y="92" textAnchor="middle" fontFamily={FONT} fontSize="8" fontWeight="600" fill="#ffffff">Apply</text>

      {/* Table header */}
      <rect x="16" y="118" width="448" height="22" fill="#e2e8f0" />
      <text x="28" y="133" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#475569">Date</text>
      <text x="120" y="133" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#475569">Description</text>
      <text x="290" y="133" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#475569">Type</text>
      <text x="452" y="133" textAnchor="end" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#475569">Amount</text>

      {/* Rows */}
      {[
        { d: "2026-06-09", desc: "Salary deposit",     type: "deposit",  amt: "+ $3,420.00", green: true },
        { d: "2026-06-08", desc: "Coffee Shop",        type: "debit",    amt: "− $4.85",     green: false },
        { d: "2026-06-07", desc: "Transfer · Jane",    type: "transfer", amt: "− $200.00",   green: false },
        { d: "2026-06-05", desc: "Utility · Electric", type: "debit",    amt: "− $86.40",    green: false },
        { d: "2026-06-03", desc: "Refund · Amazon",    type: "deposit",  amt: "+ $39.99",    green: true },
      ].map((row, i) => (
        <g key={i}>
          <rect x="16" y={142 + i * 24} width="448" height="22" fill={i % 2 === 0 ? "#ffffff" : "#f8fafc"} />
          <text x="28" y={157 + i * 24} fontFamily="JetBrains Mono" fontSize="8" fill="#475569">{row.d}</text>
          <text x="120" y={157 + i * 24} fontFamily={FONT} fontSize="9" fill="#0f172a">{row.desc}</text>
          <text x="290" y={157 + i * 24} fontFamily={FONT} fontSize="9" fill="#64748b">{row.type}</text>
          <text x="452" y={157 + i * 24} textAnchor="end" fontFamily={FONT} fontSize="9" fontWeight="600" fill={row.green ? "#10b981" : "#0f172a"}>{row.amt}</text>
        </g>
      ))}

      {/* Pagination */}
      <text x="16" y="298" fontFamily={FONT} fontSize="9" fill="#64748b">Page 1 of 12</text>
      <rect x="380" y="288" width="30" height="18" rx="3" fill="#f1f5f9" stroke="#cbd5e1" />
      <text x="395" y="300" textAnchor="middle" fontFamily={FONT} fontSize="9" fill="#475569">‹</text>
      <rect x="416" y="288" width="30" height="18" rx="3" fill="#2563eb" />
      <text x="431" y="300" textAnchor="middle" fontFamily={FONT} fontSize="9" fontWeight="600" fill="#ffffff">›</text>
    </svg>
  ),

  admin: (
    <svg {...SVG_PROPS} aria-label="Admin Console screen wireframe">
      <ChromeBar url="https://abc-bank.local/admin/accounts" />
      <rect x="0" y="24" width="480" height="296" fill="#f8fafc" />

      {/* Top nav */}
      <rect x="0" y="24" width="480" height="32" fill="#0f172a" />
      <text x="20" y="44" fontFamily={FONT} fontSize="11" fontWeight="700" fill="#ffffff">Admin Console</text>
      <rect x="380" y="32" width="76" height="16" rx="3" fill="#dc2626" />
      <text x="418" y="43" textAnchor="middle" fontFamily={FONT} fontSize="8" fontWeight="700" fill="#ffffff">ADMIN ROLE</text>

      {/* Search bar */}
      <rect x="16" y="72" width="360" height="28" rx="5" fill="#ffffff" stroke="#cbd5e1" />
      <text x="28" y="91" fontFamily={FONT} fontSize="10" fill="#64748b">🔍  Search accounts by user, balance, status…</text>
      <rect x="384" y="72" width="80" height="28" rx="5" fill="#2563eb" />
      <text x="424" y="90" textAnchor="middle" fontFamily={FONT} fontSize="10" fontWeight="600" fill="#ffffff">+ New</text>

      {/* Table header */}
      <rect x="16" y="112" width="448" height="22" fill="#0f172a" />
      <text x="28" y="127" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#ffffff">ID</text>
      <text x="80" y="127" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#ffffff">User</text>
      <text x="220" y="127" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#ffffff">Balance</text>
      <text x="320" y="127" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#ffffff">Status</text>
      <text x="430" y="127" fontFamily={FONT} fontSize="9" fontWeight="700" fill="#ffffff">Actions</text>

      {/* Rows */}
      {[
        { id: "A-1042", user: "Jane Doe",     bal: "$ 14,328.42", st: "Active",   stClr: "#10b981" },
        { id: "A-1087", user: "John Smith",   bal: "$ 982.10",    st: "Active",   stClr: "#10b981" },
        { id: "A-1124", user: "Priya Nair",   bal: "$ 0.00",      st: "Frozen",   stClr: "#f59e0b" },
        { id: "A-1156", user: "Marcus Webb",  bal: "$ 28,401.55", st: "Active",   stClr: "#10b981" },
        { id: "A-1189", user: "Alex Torres",  bal: "$ 7,612.00",  st: "Closed",   stClr: "#dc2626" },
      ].map((row, i) => (
        <g key={i}>
          <rect x="16" y={136 + i * 28} width="448" height="26" fill={i % 2 === 0 ? "#ffffff" : "#f8fafc"} />
          <text x="28" y={152 + i * 28} fontFamily="JetBrains Mono" fontSize="8" fill="#475569">{row.id}</text>
          <text x="80" y={152 + i * 28} fontFamily={FONT} fontSize="9" fill="#0f172a">{row.user}</text>
          <text x="220" y={152 + i * 28} fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" fill="#0f172a">{row.bal}</text>
          <rect x="316" y={144 + i * 28} width="44" height="14" rx="7" fill={row.stClr} opacity="0.18" />
          <text x="338" y={154 + i * 28} textAnchor="middle" fontFamily={FONT} fontSize="8" fontWeight="700" fill={row.stClr}>{row.st}</text>
          <text x="425" y={152 + i * 28} fontFamily={FONT} fontSize="8" fontWeight="600" fill="#2563eb">View</text>
          <text x="450" y={152 + i * 28} fontFamily={FONT} fontSize="8" fontWeight="600" fill="#dc2626">Lock</text>
        </g>
      ))}
    </svg>
  ),
};

interface Props { name: WireframeName; caption?: string }

export function Wireframe({ name, caption }: Props) {
  const svg = FRAMES[name];
  if (!svg) return null;
  return (
    <figure className="wireframe">
      <div className="wireframe-frame">{svg}</div>
      {caption && <figcaption className="wireframe-caption">{caption}</figcaption>}
    </figure>
  );
}

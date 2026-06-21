// src/data/documents.js
// Each phase's report tabs map 1:1 to the agents listed in src/data/agents.js —
// so a stakeholder reviewing the phase report sees exactly one document per
// agent that ran.

// Second-run version of the Dev Unit-Test report, surfaced by the DocViewer
// once devRunCount ≥ 2 (i.e. after a coverage rejection + re-run). Coverage
// is now over the 80% gate at 90% lines, ready for stakeholder approval.
const DEV_UNIT_TEST_REPORT_V2 = {
  title: 'Unit-Test Report – ABC Bank (re-run)',
  meta: { date: 'Today', author: 'Unit Test', status: 'Green', ver: '1.0.1' },
  sections: [
    { h: 'Summary', p: 'Re-run after the first-run coverage rejection. 42 specs across 6 files — 14 new specs target the transactions edge cases (refund, partial debit, overdraft) plus the previously untested error branches. All 80% gates cleared.' },
    { h: 'Results by Module', table: { cols: ['Module', 'Specs', 'Passed', 'Lines %', 'Branches %'], rows: [
      ['auth',         '12', '12', '94%', '90%'],
      ['accounts',     '10', '10', '91%', '87%'],
      ['transactions', '10', '10', '92%', '88%'],
      ['middleware',   '6',  '6',  '90%', '86%'],
      ['repository',   '4',  '4',  '88%', '84%'],
    ]}},
    { h: 'Overall Coverage', table: { cols: ['Metric', 'Result', 'Target', 'Status'], rows: [
      ['Lines',      '90%', '≥ 80%', '✓'],
      ['Branches',   '88%', '≥ 80%', '✓'],
      ['Functions',  '94%', '≥ 80%', '✓'],
      ['Statements', '90%', '≥ 80%', '✓'],
    ]}},
    { h: 'Gaps Closed Since First Run', list: [
      'transactions: refund / partial debit / overdraft paths fully exercised',
      'repository: pool-exhaustion error branch now covered',
      'middleware: malformed-token branch now covered',
    ]},
    { h: 'Verdict', p: 'PASS — coverage clears the 80% gate on every metric. Ready for stakeholder approval.' },
  ],
};

const DOCS = {
  req: {
    tabs: ['SRS v1.0', 'User Stories', 'Validation Report', 'Risk Register'],
    contents: [
      {
        title: 'Software Requirements Specification – ABC Bank v1.0',
        meta: { date: 'Today', author: 'BA Agent', status: 'Draft – Pending Approval', ver: '1.0.0' },
        sections: [
          { h: 'Project Overview', p: 'ABC Bank is a web-based banking application providing login authentication, account management, and transaction history. Designed to auto-generate a runnable scaffold with multi-port deployment support.' },
          { h: 'Functional Requirements', table: { cols: ['ID', 'Requirement', 'Priority'], rows: [
            ['FR-001', 'User registration with username & password', 'MUST'],
            ['FR-002', 'Login with credential validation (JWT)',     'MUST'],
            ['FR-003', 'Clear error on invalid login',              'MUST'],
            ['FR-004', 'View account balance when authenticated',   'MUST'],
            ['FR-005', 'Auto-generate runnable bank app scaffold',  'MUST'],
            ['FR-006', 'Configurable port via PORT env var',        'MUST'],
            ['FR-007', 'Multiple instances on different ports',     'SHOULD'],
            ['FR-008', 'Admin view: all accounts & transactions',   'SHOULD'],
          ]}},
          { h: 'Non-Functional Requirements', table: { cols: ['Category', 'Requirement', 'Target'], rows: [
            ['Performance', 'Login API p95',   '< 150ms'],
            ['Security',    'Password storage','bcrypt cost 12'],
            ['Security',    'Session tokens',  'JWT 1hr expiry'],
            ['Portability', 'Deployment',      'PORT env, Docker-ready'],
          ]}},
        ],
      },
      {
        title: 'User-Story Catalogue – ABC Bank',
        meta: { date: 'Today', author: 'Doc Agent', status: 'Draft', ver: '1.0.0' },
        sections: [
          { h: 'Epic EP-001: Authentication', list: [
            'US-001: As a new user, I want to register so I can access my bank account. (5pts)',
            'US-002: As a registered user, I want to log in with my credentials. (3pts)',
            'US-003: As a user, I want a clear error if I enter wrong credentials. (2pts)',
            'US-004: As a user, I want to log out securely. (2pts)',
          ]},
          { h: 'Epic EP-002: Account Management', list: [
            'US-005: View account balance when logged in. (3pts)',
            'US-006: See transaction history. (5pts)',
            'US-007: Admin view of all accounts. (8pts)',
          ]},
          { h: 'Epic EP-003: Multi-Port Deployment', list: [
            'US-008: Run the app on any port via PORT env var. (2pts)',
            'US-009: Multiple instances on different ports simultaneously. (3pts)',
          ]},
          { h: 'Acceptance Criteria – Sample', p: 'US-002 "Login" accepted when: (a) valid creds return JWT and 200; (b) invalid creds return 401 with non-leaking error; (c) JWT expires after 1h.' },
        ],
      },
      {
        title: 'Validation Report – ABC Bank Requirements',
        meta: { date: 'Today', author: 'Validator Agent', status: 'Passed', ver: '1.0.0' },
        sections: [
          { h: 'Verdict', p: 'PASS — requirements meet the SRS template\'s completeness, testability and traceability thresholds. Ready to advance to Design.' },
          { h: 'Completeness', table: { cols: ['Check', 'Result', 'Target'], rows: [
            ['Functional requirements documented',      '8 / 8',      '≥ 8'],
            ['Non-functional requirements documented',  '4 / 4',      '≥ 4'],
            ['Stakeholders identified',                  '3',         '≥ 3'],
            ['Risks captured',                           '3',         '≥ 3'],
          ]}},
          { h: 'Testability', table: { cols: ['Check', 'Result', 'Target'], rows: [
            ['Each FR has measurable acceptance criteria', '9 / 9 stories', '9 / 9'],
            ['Each NFR has a numeric target',              '4 / 4',         '4 / 4'],
            ['Testability score',                           '91%',          '≥ 85%'],
          ]}},
          { h: 'Traceability Matrix', table: { cols: ['Story', 'FR', 'NFR'], rows: [
            ['US-001', 'FR-001', 'Security/password'],
            ['US-002', 'FR-002, FR-003', 'Performance/login p95'],
            ['US-005', 'FR-004', '—'],
            ['US-006', 'FR-004', '—'],
            ['US-007', 'FR-008', '—'],
            ['US-008', 'FR-006', 'Portability'],
            ['US-009', 'FR-007', 'Portability'],
          ]}},
          { h: 'Open Issues', p: 'None blocking. Minor: re-confirm session-timeout copy with Product.' },
        ],
      },
      {
        title: 'Risk Register – ABC Bank',
        meta: { date: 'Today', author: 'Risk Agent', status: 'Draft', ver: '1.0.0' },
        sections: [
          { h: 'Risks', table: { cols: ['ID', 'Risk', 'Likelihood', 'Impact', 'Mitigation'], rows: [
            ['R-001', 'JWT secret exposed in code',       'Low',    'Critical', 'Use .env, exclude from git'],
            ['R-002', 'Port collision between instances', 'Medium', 'High',     'PORT env + collision detection'],
            ['R-003', 'Weak password storage',            'Low',    'High',     'bcrypt cost factor ≥ 12'],
          ]}},
          { h: 'Top Mitigations Owned', list: [
            'R-001 — secrets externalised via process.env (Security Architect)',
            'R-002 — start-up scripts assert PORT not in use (DevOps Lead)',
            'R-003 — bcrypt cost reviewed in SAST stage (Security Architect)',
          ]},
        ],
      },
    ],
  },
  design: {
    tabs: ['Architecture', 'API Contract', 'DB Schema', 'UI Wireframes'],
    contents: [
      {
        title: 'System Architecture – ABC Bank v1.0',
        meta: { date: 'Today', author: 'Architect Agent', status: 'Draft', ver: '1.0.0' },
        sections: [
          { h: 'Tech Stack', table: { cols: ['Layer', 'Technology', 'Notes'], rows: [
            ['Frontend', 'React SPA',           'Login, Dashboard, Transfer'],
            ['Backend',  'Node.js + Express',   'REST API, JWT middleware'],
            ['Database', 'SQLite / PostgreSQL', 'Users, accounts, transactions'],
            ['Auth',     'JWT + bcrypt',        '1hr expiry, cost 12'],
            ['Runtime',  'Node.js 20 LTS',      'PORT env for multi-instance'],
          ]}},
          { h: 'Multi-Port Topology', p: 'Stateless Node.js processes reading PORT from env. PM2 or shell script spawns on :3001 and :3002. Optional nginx reverse proxy for load balancing.' },
          { h: 'Component Map', list: [
            'auth/ — register, login, logout, token middleware',
            'accounts/ — balance, transactions, admin overview',
            'db/ — schema, migrations, repository layer',
            'infra/ — Dockerfile, start.sh, healthz route',
          ]},
        ],
      },
      {
        title: 'API Contract – ABC Bank v1.0 (OpenAPI 3.1)',
        meta: { date: 'Today', author: 'API Agent', status: 'Draft', ver: '1.0.0' },
        sections: [
          { h: 'Auth Endpoints', table: { cols: ['Method', 'Path', 'Body / Response'], rows: [
            ['POST', '/auth/register', '{ username, password } → { userId, token }'],
            ['POST', '/auth/login',    '{ username, password } → { token, expiresIn }'],
            ['POST', '/auth/logout',   'Bearer token → { message }'],
          ]}},
          { h: 'Account Endpoints', table: { cols: ['Method', 'Path', 'Auth'], rows: [
            ['GET', '/accounts/me',               'Bearer JWT'],
            ['GET', '/accounts/me/transactions',  'Bearer JWT'],
            ['GET', '/admin/accounts',            'JWT (admin role)'],
          ]}},
          { h: 'Error Model', p: 'All error responses share { code, message, traceId }. Auth failures return 401 with a non-leaking message.' },
        ],
      },
      {
        title: 'Database Schema – ABC Bank v1.0',
        meta: { date: 'Today', author: 'DB Agent', status: 'Draft', ver: '1.0.0' },
        sections: [
          { h: 'Tables', table: { cols: ['Table', 'Columns', 'Notes'], rows: [
            ['users',         'id PK, username UNIQUE, password_hash, role, created_at', 'bcrypt cost 12; role IN (\'user\',\'admin\')'],
            ['accounts',      'id PK, user_id FK, balance, currency, opened_at',         '1:1 with users in v1'],
            ['transactions',  'id PK, account_id FK, amount, type, ts',                  'type IN (\'deposit\',\'withdrawal\',\'transfer\')'],
            ['audit_log',     'id PK, user_id FK, action, source_ip, ts',                'auth events + admin actions'],
          ]}},
          { h: 'Indexes', list: [
            'ux_users_username (UNIQUE) — login lookup',
            'ix_accounts_user_id — account fetch by owner',
            'ix_transactions_account_ts — paginated history (account_id, ts DESC)',
            'ix_audit_log_ts — recent activity feed',
          ]},
          { h: 'Migrations', table: { cols: ['Version', 'Description', 'Reversible'], rows: [
            ['0001_init',       'Create users, accounts, transactions', 'Yes'],
            ['0002_audit_log',  'Add audit_log table + indexes',        'Yes'],
            ['0003_role_col',   'Add users.role with default \'user\'', 'Yes'],
          ]}},
        ],
      },
      {
        title: 'UI Wireframes – ABC Bank v1.0',
        meta: { date: 'Today', author: 'UI Agent', status: 'Draft', ver: '1.0.0' },
        sections: [
          { h: 'Screens', table: { cols: ['Screen', 'Purpose', 'Key Components'], rows: [
            ['Login',          'Authenticate user',           'Username, password, error banner, submit'],
            ['Dashboard',      'Account snapshot',            'Balance card, recent transactions, transfer CTA'],
            ['Transfer',       'Initiate a transfer',         'From/To, amount, confirm dialog'],
            ['Transactions',   'Full transaction history',    'Filter by date, pagination'],
            ['Admin Console',  'Cross-account overview',      'Search, account list, drill-in'],
          ]}},
          { h: 'Wireframe Mocks', wireframes: [
            { name: 'login',        caption: 'Login — credentials card with error banner and submit.' },
            { name: 'dashboard',    caption: 'Dashboard — balance card, transfer CTA, recent transactions list.' },
            { name: 'transfer',     caption: 'Transfer — From / To accounts, amount field, confirm dialog.' },
            { name: 'transactions', caption: 'Transactions — date + type filters, paginated table.' },
            { name: 'admin',        caption: 'Admin Console — cross-account search, status chips, per-row actions.' },
          ]},
          { h: 'Accessibility (WCAG 2.1 AA)', table: { cols: ['Check', 'Result'], rows: [
            ['Text contrast ≥ 4.5:1',                 '✓ pass (12/12 components)'],
            ['Keyboard navigation on all flows',      '✓ pass'],
            ['Form-field labels + aria-describedby',  '✓ pass'],
            ['Error messages announced to screen-reader', '✓ pass'],
          ]}},
          { h: 'Design Tokens', list: [
            'Primary: var(--cyan); Success: var(--green); Danger: var(--red)',
            'Font: Inter 400/500/600; Mono: JetBrains Mono',
            'Radius scale: 4 / 8 / 12 / 16; Spacing scale: 4-px base',
          ]},
        ],
      },
    ],
  },
  dev: {
    tabs: ['Build Manifest', 'Unit-Test Report', 'Code-Quality Report', 'Developer Docs'],
    contents: [
      {
        title: 'Build Manifest – ABC Bank v1.0',
        meta: { date: 'Today', author: 'Code Agent', status: 'Built', ver: '1.0.0' },
        sections: [
          { h: 'Build Summary', p: 'Application scaffold materialised from the design artefacts. Multi-port server reads PORT env var; auth, accounts, and transactions endpoints implemented end-to-end.' },
          { h: 'Source Tree', table: { cols: ['Path', 'Lines', 'Purpose'], rows: [
            ['server.js',            '184', 'Express bootstrap + PORT binding'],
            ['routes/auth.js',       '212', 'Register, login, logout, refresh'],
            ['routes/accounts.js',   '178', 'Balance, transactions, admin view'],
            ['middleware/jwt.js',    '62',  'Token verification'],
            ['db/repository.js',     '146', 'SQL data access'],
            ['__tests__/',           '342', '42 unit-test specs'],
          ]}},
          { h: 'Dependencies Pinned', list: [
            'express ^4.21.0 · jsonwebtoken ^9.0.2 · bcrypt ^5.1.1 · sqlite3 ^5.1.7',
            'Dev: jest ^29 · supertest ^7 · eslint ^9 · prettier ^3',
          ]},
          { h: 'Outputs', list: [
            'Branch: Application/branch (pushed)',
            'Artifact: abc-bank-1.0.0.tar.gz · 14.2 MB',
            'Entry: node server.js (reads PORT env var)',
          ]},
        ],
      },
      {
        title: 'Unit-Test Report – ABC Bank',
        meta: { date: 'Today', author: 'Unit Test', status: 'Below threshold', ver: '1.0.0' },
        sections: [
          { h: 'Summary', p: '28 unit-test specs across 6 files. All passing, but overall line and branch coverage fall below the 80% gate. Transactions edge cases (refund, partial debit, overdraft) are not exercised.' },
          { h: 'Results by Module', table: { cols: ['Module', 'Specs', 'Passed', 'Lines %', 'Branches %'], rows: [
            ['auth',         '10', '10', '82%', '76%'],
            ['accounts',     '8',  '8',  '79%', '72%'],
            ['transactions', '4',  '4',  '61%', '48%'],
            ['middleware',   '4',  '4',  '78%', '70%'],
            ['repository',   '2',  '2',  '70%', '62%'],
          ]}},
          { h: 'Overall Coverage', table: { cols: ['Metric', 'Result', 'Target', 'Status'], rows: [
            ['Lines',      '75%', '≥ 80%', '✗ Below gate'],
            ['Branches',   '68%', '≥ 80%', '✗ Below gate'],
            ['Functions',  '81%', '≥ 80%', '✓'],
            ['Statements', '74%', '≥ 80%', '✗ Below gate'],
          ]}},
          { h: 'Gaps Identified', list: [
            'transactions: refund, partial debit, overdraft paths untested',
            'repository: error branch on connection-pool exhaustion untested',
            'middleware: malformed-token branch untested',
          ]},
          { h: 'Verdict', p: 'FAIL — coverage below the 80% gate. Recommend stakeholder rejection and a re-run of the Unit Test agent with the missing specs added.' },
        ],
      },
      {
        title: 'Code-Quality Report – ABC Bank',
        meta: { date: 'Today', author: 'Lint Agent', status: 'A', ver: '1.0.0' },
        sections: [
          { h: 'Static Analysis', table: { cols: ['Check', 'Errors', 'Warnings', 'Status'], rows: [
            ['ESLint (recommended + security)',   '0',  '3', '✓'],
            ['Prettier formatting',               '0',  '0', '✓'],
            ['TypeScript strict (if applicable)', '0',  '0', '✓'],
            ['No-unused-vars / no-shadow',        '0',  '0', '✓'],
          ]}},
          { h: 'Outstanding Warnings (non-blocking)', list: [
            'routes/auth.js: prefer-const on line 88 (will be addressed in v1.1)',
            'db/repository.js: unused-promise on line 142 (logged TODO)',
            'middleware/jwt.js: complexity 11 (threshold 10) — refactor backlog',
          ]},
          { h: 'Verdict', p: 'Grade A. No blocking findings. Bundle size: 312 KB. Cyclomatic complexity avg: 4.2.' },
        ],
      },
      {
        title: 'Developer Documentation – ABC Bank',
        meta: { date: 'Today', author: 'DocGen Agent', status: 'Published', ver: '1.0.0' },
        sections: [
          { h: 'Deliverables', list: [
            'README.md — quickstart, multi-port instructions, demo credentials',
            'JSDoc → docs/api/ — generated from source comments',
            'Swagger UI → /api-docs — live OpenAPI viewer mounted on the server',
            'CHANGELOG.md — versioned change log seeded for v1.0.0',
          ]},
          { h: 'Quickstart', list: [
            'git clone … && cd abc-bank && npm install',
            'PORT=3001 node server.js  # first instance',
            'PORT=3002 node server.js  # second instance',
            'Open http://localhost:3001 and log in as demo / demo123',
          ]},
          { h: 'Documentation Coverage', table: { cols: ['Surface', 'Documented', 'Target'], rows: [
            ['Public functions (JSDoc)',    '47 / 49', '≥ 95%'],
            ['REST endpoints (Swagger)',     '9 / 9',  '100%'],
            ['Environment variables',        '5 / 5',  '100%'],
          ]}},
        ],
      },
    ],
  },
  test: {
    tabs: ['Integration Report', 'Load Test Report', 'UAT Report', 'Test Summary'],
    contents: [
      {
        title: 'Integration Test Report – ABC Bank',
        meta: { date: 'Today', author: 'Integration', status: 'Passed', ver: '1.0.0' },
        sections: [
          { h: 'Summary', p: 'End-to-end integration suite executed against staging. 47 of 48 scenarios passed; 1 known flaky test re-ran and passed on retry.' },
          { h: 'Results by Suite', table: { cols: ['Suite', 'Total', 'Passed', 'Failed', 'Duration'], rows: [
            ['Auth flows',         '12', '12', '0', '00:42'],
            ['Account management', '18', '18', '0', '01:18'],
            ['Transactions',       '10', '10', '0', '00:56'],
            ['Admin endpoints',    '8',  '7',  '1', '00:31'],
          ]}},
          { h: 'Failed Cases', table: { cols: ['ID', 'Case', 'Root cause', 'Status'], rows: [
            ['IT-431', 'Admin · concurrent account list', 'Race in pagination cursor (intermittent)', 'Re-ran ✓ — flaky, ticket TST-219 filed'],
          ]}},
          { h: 'Coverage', list: [
            'API endpoint coverage: 100% (24/24)',
            'Critical user journeys: 6/6 verified',
            'Cross-instance test (:3001 ↔ :3002): passed',
          ]},
        ],
      },
      {
        title: 'Load Test Report – ABC Bank',
        meta: { date: 'Today', author: 'Load Test', status: 'Passed', ver: '1.0.0' },
        sections: [
          { h: 'Test Configuration', p: 'k6 load profile: 100 virtual users ramping over 30s, sustained for 5 minutes against /auth/login and /accounts/me. Target: p95 < 150ms (NFR-Performance).' },
          { h: 'Latency Results', table: { cols: ['Endpoint', 'p50', 'p95', 'p99', 'Max', 'Target met'], rows: [
            ['POST /auth/login',    '42ms',  '118ms', '182ms', '412ms', '✓'],
            ['GET /accounts/me',    '18ms',  '61ms',  '94ms',  '201ms', '✓'],
            ['GET /transactions',   '31ms',  '104ms', '156ms', '298ms', '✓'],
          ]}},
          { h: 'Throughput', table: { cols: ['Metric', 'Value'], rows: [
            ['Requests / second (peak)', '842'],
            ['Total requests',            '248,610'],
            ['Error rate',                '0.02% (49 / 248,610)'],
            ['Saturation point',          '~1,100 RPS (CPU-bound)'],
          ]}},
          { h: 'Resource Utilisation', list: [
            'Node.js CPU: peak 72% (single instance), 38% across :3001 + :3002',
            'Memory: stable at 184 MB, no leak detected over 5-min sustained load',
            'DB connection pool: 18/20 peak — within limits',
          ]},
        ],
      },
      {
        title: 'User Acceptance Test Report – ABC Bank',
        meta: { date: 'Today', author: 'UAT Agent', status: 'Accepted', ver: '1.0.0' },
        sections: [
          { h: 'UAT Scope', p: 'Business scenarios executed by simulated end-users against the staging deployment. 14 acceptance criteria from the SRS were exercised.' },
          { h: 'Acceptance Results', table: { cols: ['Story', 'Scenario', 'Outcome'], rows: [
            ['US-001', 'New user registration',                '✓ Accepted'],
            ['US-002', 'Login with valid credentials',         '✓ Accepted'],
            ['US-003', 'Error on invalid login',               '✓ Accepted'],
            ['US-004', 'Secure logout clears session',         '✓ Accepted'],
            ['US-005', 'View own account balance',             '✓ Accepted'],
            ['US-006', 'Browse transaction history',           '✓ Accepted'],
            ['US-007', 'Admin lists all accounts',             '✓ Accepted'],
            ['US-008', 'Run app on custom PORT',               '✓ Accepted'],
            ['US-009', 'Two instances on :3001 + :3002',       '✓ Accepted'],
          ]}},
          { h: 'Stakeholder Feedback', list: [
            'Product Owner: "Sign-in flow matches the brief — approving release candidate."',
            'Compliance: token expiry confirmed at 1 hour; bcrypt cost verified at 12.',
            'Ops: launch script on :3001 + :3002 verified, no port collisions.',
          ]},
          { h: 'Open Items', p: 'No blocking items. Minor UI polish requests deferred to backlog (UI-118, UI-119).' },
        ],
      },
      {
        title: 'Test Summary Report – ABC Bank',
        meta: { date: 'Today', author: 'Report', status: 'Final', ver: '1.0.0' },
        sections: [
          { h: 'Overall Verdict', p: 'PASS — all critical and high-severity acceptance criteria met. Application is recommended for promotion to the PR phase.' },
          { h: 'Headline Metrics', table: { cols: ['Metric', 'Result', 'Target'], rows: [
            ['Integration pass rate',    '99.8% (after retry)', '≥ 98%'],
            ['Login p95 latency',        '118ms',               '< 150ms'],
            ['Error rate under load',    '0.02%',               '< 0.1%'],
            ['UAT acceptance',           '9 / 9 stories',       '9 / 9'],
            ['Code coverage (combined)', '88%',                 '≥ 80%'],
          ]}},
          { h: 'Risks Cleared', list: [
            'R-002 Port collision — verified clean across :3001/:3002 under load.',
            'R-003 Weak password storage — bcrypt cost 12 confirmed in integration suite.',
          ]},
          { h: 'Outstanding Risks', list: [
            'R-001 JWT secret in .env still pending SecOps secrets-scan in next phase.',
          ]},
          { h: 'Sign-off', p: 'Ready for PR phase. Awaiting human approval to advance.' },
        ],
      },
    ],
  },
  par: {
    tabs: ['Risk Summary', 'Compliance Checklist', 'CAB Submission Package'],
    contents: [
      {
        title: 'Production Approval Request – Risk Summary',
        meta: { date: 'Today', author: 'Risk Synthesiser', status: 'Compiled', ver: '1.0.0' },
        sections: [
          { h: 'Overview', p: 'Consolidated risk view assembled from the Requirements risk register and Security findings. No critical or high risks outstanding. Three medium items tracked with owners and ETAs.' },
          { h: 'Risks Carried Forward', table: { cols: ['ID', 'Origin', 'Risk', 'Severity', 'Owner', 'Status'], rows: [
            ['R-001', 'Requirements', 'JWT secret exposure',                 'Critical', 'Security Architect', 'Mitigated — secrets externalised'],
            ['R-002', 'Requirements', 'Port collision between instances',    'High',     'DevOps Lead',        'Mitigated — collision detection'],
            ['R-003', 'Requirements', 'Weak password storage',               'High',     'Security Architect', 'Mitigated — bcrypt cost 12'],
            ['SA-019','Security',     'Express resource leak on shutdown',   'Medium',   'Engineering Lead',   'Fix scheduled v1.1'],
            ['SA-027','Security',     'JWT default algorithm unpinned',      'Medium',   'Security Architect', 'Fix scheduled v1.1'],
            ['PT-104','Security',     'Login endpoint lacks rate-limit',     'Medium',   'Engineering Lead',   'Fix scheduled v1.1 (WAF interim)'],
          ]}},
          { h: 'Verdict', p: 'No critical or high risks open. Three medium items have written mitigations and owners — approved to proceed to deployment subject to stakeholder sign-off.' },
        ],
      },
      {
        title: 'Production Approval Request – Compliance Checklist',
        meta: { date: 'Today', author: 'Compliance Auditor', status: 'All gates green', ver: '1.0.0' },
        sections: [
          { h: 'Scope', p: 'Compliance gates verified against SOC2 (CC controls), PCI-DSS scope, and the internal change-management policy. Evidence linked back to phase reports.' },
          { h: 'SOC2 Controls', table: { cols: ['Control', 'Requirement', 'Evidence', 'Status'], rows: [
            ['CC6.1',  'Logical access enforced',          'JWT auth + bcrypt 12 (Design §Auth)',       '✓'],
            ['CC7.2',  'Activity logging captured',         'Activity log board (Monitor phase)',        '✓'],
            ['CC8.1',  'Change management approvals',      'Phase sign-offs (this submission)',         '✓'],
            ['CC4.1',  'Vulnerability management',         'SAST + Dep Audit + Pen-test reports',       '✓'],
          ]}},
          { h: 'PCI-DSS Alignment', table: { cols: ['Requirement', 'Applicability', 'Status'], rows: [
            ['Req 6 — Secure development',   'In scope', '✓ SAST/Dep/Secrets reports clean'],
            ['Req 8 — Authentication',       'In scope', '✓ bcrypt + JWT, no shared accounts'],
            ['Req 10 — Logging & monitoring','In scope', '✓ Log Aggregator + Health Probe'],
            ['Req 11 — Security testing',    'In scope', '✓ Pen-test report, no high findings'],
          ]}},
          { h: 'Change Management Policy', list: [
            'Documented change description ✓',
            'Rollback plan attached ✓',
            'Approver chain identified (VP Eng, Compliance, Security, PO) ✓',
            'Release window declared ✓',
          ]},
        ],
      },
      {
        title: 'Production Approval Request – CAB Submission Package',
        meta: { date: 'Today', author: 'CAB Coordinator', status: 'Submitted', ver: '1.0.0' },
        sections: [
          { h: 'Change Summary', p: 'ABC Bank v1.0.0 — first production release. JWT-secured login, account balance, transaction history, admin overview. Multi-port deployment for blue/green and horizontal scaling.' },
          { h: 'Linked Artefacts', table: { cols: ['Artefact', 'Origin Phase', 'Reference'], rows: [
            ['SRS v1.0',                    'Requirements', 'Tab 1'],
            ['Architecture document',       'Design',       'Tab 1'],
            ['API contract (OpenAPI 3.1)',  'Design',       'Tab 2'],
            ['Build manifest',              'Development',  'Tab 1'],
            ['Unit-test report (90%)',      'Development',  'Tab 2'],
            ['Test summary (PASS)',         'Testing',      'Tab 4'],
            ['SAST report',                 'Security',     'Tab 1'],
            ['Pen-test report',             'Security',     'Tab 4'],
          ]}},
          { h: 'Deployment Plan', list: [
            'Strategy: blue/green across :3001 and :3002',
            'Cut-over: traffic switched after smoke success on :3002',
            'Rollback: revert symlink to previous image digest (≤ 30s)',
            'Release window: standard change — within next CAB window',
          ]},
          { h: 'Approver Chain', list: [
            'Helen Zhou — VP Engineering (engineering readiness)',
            'Olivia Brown — Compliance Officer (regulatory)',
            'David Kim — Security Architect (security clearance)',
            'Sarah Chen — Product Owner (business approval)',
          ]},
          { h: 'Verdict', p: 'Submission package complete and routed to approvers. Awaiting stakeholder sign-off to unlock the Deployment phase.' },
        ],
      },
    ],
  },
  deploy: {
    tabs: ['Infra Manifest', 'Container Build', 'Deployment Report', 'Smoke Test'],
    contents: [
      {
        title: 'Infrastructure Manifest – ABC Bank',
        meta: { date: 'Today', author: 'Infra Agent', status: 'Provisioned', ver: '1.0.0' },
        sections: [
          { h: 'Target Environment', p: 'Staging cluster. Two parallel instances at PORT=3001 and PORT=3002, fronted by an internal load balancer. Health-check route: /healthz.' },
          { h: 'Resources', table: { cols: ['Resource', 'Spec', 'Notes'], rows: [
            ['Compute',  '2 × 1 vCPU / 1 GB RAM',                 'blue/green friendly'],
            ['Network',  'internal VPC, port 80→3001/3002',       'TLS terminated at LB'],
            ['Secrets',  'JWT_SECRET, DB_URL via secret manager', 'scoped to service identity'],
            ['Database', 'Managed PostgreSQL (small)',            'connection pool max 20'],
            ['Logging',  'Stdout → central log sink',             '30-day retention'],
          ]}},
          { h: 'Health & Readiness', list: [
            'Liveness: GET /healthz every 10s, fail after 3 misses',
            'Readiness: GET /ready (checks DB pool ≥ 5 free)',
            'Graceful shutdown on SIGTERM, drain in 15s',
          ]},
        ],
      },
      {
        title: 'Container Build Report – ABC Bank',
        meta: { date: 'Today', author: 'Container Agent', status: 'Published', ver: '1.0.0' },
        sections: [
          { h: 'Build Output', table: { cols: ['Property', 'Value'], rows: [
            ['Image',      'registry.acme.local/abc-bank:1.0.0'],
            ['Digest',     'sha256:a1b2…f9e0'],
            ['Base image', 'node:20-alpine'],
            ['Image size', '142 MB'],
            ['Layers',     '7'],
            ['Build time', '2m 14s'],
          ]}},
          { h: 'Reproducibility', list: [
            'Multi-stage Dockerfile: build → prune → runtime',
            'Lockfile committed (package-lock.json) — deterministic install',
            'Build args: NODE_ENV=production, no secrets baked in',
          ]},
          { h: 'Image Scan', table: { cols: ['Scanner', 'Severity', 'Findings'], rows: [
            ['Trivy', 'Critical / High', '0 / 0'],
            ['Trivy', 'Medium',          '1 (alpine apk-tools — patch in next base bump)'],
            ['Trivy', 'Low',             '4 (informational)'],
          ]}},
        ],
      },
      {
        title: 'Deployment Report – ABC Bank',
        meta: { date: 'Today', author: 'CD Agent', status: 'Live', ver: '1.0.0' },
        sections: [
          { h: 'Pipeline Run', table: { cols: ['Stage', 'Result', 'Duration'], rows: [
            ['Checkout SCM',  '✓',  '00:08'],
            ['Build',         '✓',  '00:22'],
            ['Test',          '✓',  '01:04'],
            ['Deploy',        '✓',  '00:31'],
            ['Notify',        '✓',  '00:03'],
          ]}},
          { h: 'Approvals', list: [
            'DevOps Lead — approved at gate "Pre-deploy"',
            'Engineering Lead — approved at gate "Release"',
          ]},
          { h: 'Rollout', list: [
            'Strategy: blue/green across :3001 (current) and :3002 (new)',
            'Traffic switched after smoke success on :3002',
            'Rollback plan: revert symlink to previous image digest (≤ 30s)',
          ]},
        ],
      },
      {
        title: 'Smoke Test Report – ABC Bank',
        meta: { date: 'Today', author: 'Smoke Agent', status: 'Healthy', ver: '1.0.0' },
        sections: [
          { h: 'Checks', table: { cols: ['Check', ':3001', ':3002'], rows: [
            ['GET /healthz',                    '200 (42ms)',  '200 (38ms)'],
            ['GET /ready',                      '200',         '200'],
            ['POST /auth/login (demo creds)',   '200 (118ms)', '200 (124ms)'],
            ['GET /accounts/me (with JWT)',     '200 (61ms)',  '200 (58ms)'],
          ]}},
          { h: 'Synthetic Journey', p: 'End-to-end: anonymous → register → login → fetch balance → fetch transactions → logout. Completed under 1.4s on each instance.' },
          { h: 'Verdict', p: 'Both instances healthy. Service marked live in the registry. No rollback triggered.' },
        ],
      },
    ],
  },
  review: {
    tabs: ['Post-Mortem', 'Metrics', 'Lessons Learned', 'Release Notes'],
    contents: [
      {
        title: 'Release Post-Mortem – ABC Bank v1.0',
        meta: { date: 'Today', author: 'Post-mortem', status: 'Final', ver: '1.0.0' },
        sections: [
          { h: 'Release Summary', p: 'ABC Bank v1.0 shipped through the full SDLC pipeline in a single orchestrated run. Greenfield scaffold delivered, deployed to staging on :3001 + :3002, and promoted with zero blocking incidents.' },
          { h: 'Timeline', table: { cols: ['Phase', 'Duration', 'Outcome'], rows: [
            ['Requirements', '00:12', '9 functional + 4 non-functional requirements extracted from BRD'],
            ['Design',       '00:18', 'Architecture, API contract, schema, UI artefacts produced'],
            ['Development',  '00:34', 'Multi-port scaffold built, 88% unit-test coverage'],
            ['Testing',      '00:21', 'Integration 99.8%, UAT 9/9 accepted, load p95 118ms'],
            ['PR',           '00:14', 'Feature pipeline green, peer review merged, master pipeline + production-readiness clean'],
            ['Deployment',   '00:09', 'Containers built, smoke passed on :3001 + :3002'],
          ]}},
          { h: 'What Went Well', list: [
            'Auto-triggered transitions between phases — no idle time between agent runs.',
            'PR agent fired Jenkins pipeline immediately after Development completed.',
            'Stakeholder sign-offs collected in-app — full audit trail preserved.',
          ]},
          { h: 'What To Improve', list: [
            '1 flaky integration test (IT-431) — already tracked as TST-219.',
            'Login endpoint missed initial rate-limit middleware — flagged during PR phase and tracked as SEC-441.',
          ]},
        ],
      },
      {
        title: 'Release Metrics – ABC Bank v1.0',
        meta: { date: 'Today', author: 'Metrics', status: 'Final', ver: '1.0.0' },
        sections: [
          { h: 'Pipeline KPIs', table: { cols: ['Metric', 'This release', 'Baseline', 'Δ'], rows: [
            ['Lead time (BRD → deploy)',   '1h 48m',    '—',        'first run'],
            ['Phases auto-advanced',       '5 / 6',     '—',        'Dev requires env choice'],
            ['Agent runs (total)',         '28',        '—',        '—'],
            ['Human approvals collected',  '13 sign-offs across 5 phases', '—', '—'],
            ['Rejections / re-runs',       '0',         '—',        'clean run'],
          ]}},
          { h: 'Quality Metrics', table: { cols: ['Metric', 'Result', 'Target'], rows: [
            ['Code coverage',              '88%',        '≥ 80%'],
            ['Integration pass rate',      '99.8%',      '≥ 98%'],
            ['UAT acceptance',             '9 / 9',      '9 / 9'],
            ['SAST high findings',         '0',          '0'],
            ['Pen-test high findings',     '0',          '0'],
            ['Login p95 latency',          '118ms',      '< 150ms'],
          ]}},
          { h: 'Cost Estimates', list: [
            'Compute time (agent runtime): ~14 vCPU-minutes',
            'Tokens consumed (LLM agents): ~412k input, ~98k output',
            'Build minutes (Jenkins): 6m 22s',
          ]},
        ],
      },
      {
        title: 'Lessons Learned – ABC Bank v1.0',
        meta: { date: 'Today', author: 'Lessons', status: 'Final', ver: '1.0.0' },
        sections: [
          { h: 'Process Wins', list: [
            'Single chat input for BRD reduced ramp-up time — no template gymnastics required.',
            'Reports surfaced per phase made sign-off conversations concrete, not abstract.',
            'Auto-triggered dev agents after env selection eliminated a redundant click.',
          ]},
          { h: 'Process Frictions', list: [
            'Dev rejection-loop UX is functional but verbose — consolidate the verify step into the rejection banner.',
            'Jenkins fallback to mock pipeline is helpful for demos but should be louder about its mock state.',
          ]},
          { h: 'Technical Learnings', table: { cols: ['Area', 'Insight', 'Action'], rows: [
            ['Auth',          'jsonwebtoken 8.x carries a documented High CVE',            'Pin ≥ 9.0.2 in scaffolds going forward'],
            ['Rate limiting', 'Missing on /auth/login by default in our Express scaffold', 'Add express-rate-limit to template'],
            ['Observability', 'Source IP missing on auth-failure logs',                    'Update logger template'],
          ]}},
          { h: 'Carry-Forward Items', list: [
            'TST-219 — re-investigate flaky concurrent pagination test.',
            'SEC-441/442/443 — fold into next sprint\'s hardening backlog.',
            'Refine BRD prompt to capture admin-role flows earlier (US-007 was a late addition).',
          ]},
        ],
      },
      {
        title: 'Release Notes – ABC Bank v1.0.0',
        meta: { date: 'Today', author: 'Release', status: 'Published', ver: '1.0.0' },
        sections: [
          { h: 'Highlights', p: 'First production-ready release of ABC Bank. JWT-secured login, account balance, transaction history, and admin overview. Multi-port deployment for blue/green and horizontal scaling.' },
          { h: 'Features', list: [
            'User registration & login with bcrypt-hashed credentials (cost factor 12)',
            'JWT-based session management with 1-hour expiry',
            'Account balance & transaction history endpoints',
            'Admin endpoint for cross-account visibility',
            'PORT-configurable runtime — runs on :3001 and :3002 simultaneously',
          ]},
          { h: 'Security Improvements', list: [
            'jsonwebtoken upgraded 8.5.1 → 9.0.2 (CVE-2022-23529)',
            'express upgraded 4.17.3 → 4.21.0 (CVE-2024-29041)',
            'Secrets externalised — no credentials in source tree',
          ]},
          { h: 'Known Issues', table: { cols: ['ID', 'Description', 'Workaround'], rows: [
            ['SEC-441', 'Login lacks rate-limit middleware (Medium)',     'Behind WAF in production; middleware planned for v1.1'],
            ['TST-219', 'Concurrent admin pagination intermittent (Low)', 'Retry; resolved in v1.1 backlog'],
          ]}},
          { h: 'Deployment Notes', p: 'Run on any PORT via env var. For multi-instance: PORT=3001 node server.js & PORT=3002 node server.js. Container image tagged abc-bank:1.0.0.' },
          { h: 'Acknowledgements', p: 'Thanks to Sarah Chen (PO), Marcus Webb (Eng Lead), Priya Nair (QA Lead), David Kim (Security), Raj Patel (DevOps), and Alex Torres (Architecture).' },
        ],
      },
    ],
  },
  monitor: {
    tabs: ['Activity Log Board', 'Alert Manager Report'],
    contents: [
      {
        title: 'Activity Log Board – ABC Bank',
        meta: { date: 'Today', author: 'Log Aggregator', status: 'Live', ver: '1.0.0' },
        sections: [
          { h: 'Collection Summary', p: 'Stream tail collects events from every phase agent and from the running app instances. Buffer flushed to the central log sink every 2s; 30-day retention; grouped by source for stakeholder review.' },
          { h: 'Events by Source', table: { cols: ['Source', 'Events (24h)', 'Last seen', 'Status'], rows: [
            ['Requirements agents', '412',  '00:00:18 ago', '✓ streaming'],
            ['Design agents',       '538',  '00:00:14 ago', '✓ streaming'],
            ['Development agents',  '1,204','00:00:09 ago', '✓ streaming'],
            ['Testing agents',      '892',  '00:00:11 ago', '✓ streaming'],
            ['PR pipeline agents',  '346',  '00:00:22 ago', '✓ streaming'],
            ['Deployment agents',   '218',  '00:00:31 ago', '✓ streaming'],
            ['App instance :3001',  '1,847','00:00:02 ago', '✓ streaming'],
            ['App instance :3002',  '1,803','00:00:03 ago', '✓ streaming'],
          ]}},
          { h: 'Severity Breakdown', table: { cols: ['Tag', 'Count', 'Share'], rows: [
            ['info',    '6,418', '85.0%'],
            ['success', '742',   '9.8%'],
            ['warn',    '318',   '4.2%'],
            ['danger',  '82',    '1.0%'],
          ]}},
          { h: 'Notable Streams', list: [
            'auth · 2,104 events — login success/failure ratio 98.6% / 1.4%',
            'transactions · 1,492 events — peak 184 ev/min during smoke run',
            'agent.runtime · 3,460 events — all agents reported done within SLA',
          ]},
          { h: 'Verdict', p: 'Aggregator healthy. No gaps detected in stream tail. Per-phase grouping ready for sign-off review.' },
        ],
      },
      {
        title: 'Alert Manager Report – ABC Bank',
        meta: { date: 'Today', author: 'Alert Manager', status: 'Armed', ver: '1.0.0' },
        sections: [
          { h: 'Routing Configuration', p: 'SLO breach thresholds wired to the #abc-bank-oncall Slack channel and PagerDuty service "abc-bank-prod". Critical pages bypass quiet hours; warn-level batches into a digest.' },
          { h: 'Active Rules', table: { cols: ['ID', 'Signal', 'Threshold', 'Severity', 'Channel'], rows: [
            ['AL-001', 'Probe failure (any instance)',  '3 consecutive misses',     'Critical', 'PagerDuty + Slack'],
            ['AL-002', 'Login p95 latency',              '> 150 ms for 5 min',      'Warning',  'Slack'],
            ['AL-003', 'Error rate (5xx)',               '> 0.5% over 10 min',      'Critical', 'PagerDuty + Slack'],
            ['AL-004', 'Auth failure spike',             '> 50 fails / min',        'Warning',  'Slack'],
            ['AL-005', 'DB pool exhaustion',             'free < 2 for 2 min',      'Critical', 'PagerDuty + Slack'],
            ['AL-006', 'Instance memory',                '> 80% for 10 min',        'Warning',  'Slack'],
          ]}},
          { h: 'Recent Activity (24h)', table: { cols: ['Time', 'Rule', 'Severity', 'Outcome'], rows: [
            ['02:14', 'AL-004 Auth failure spike', 'Warning', 'Auto-resolved in 3m — pen-test fuzzer noise'],
            ['09:37', 'AL-002 Login p95',          'Warning', 'Auto-resolved in 1m — load-test ramp'],
          ]}},
          { h: 'On-Call Roster', list: [
            'Primary: Raj Patel (DevOps) — week of release',
            'Secondary: David Kim (Security) — escalation after 15 min',
            'Manager: Marcus Webb (Eng Lead) — paged on Critical only',
          ]},
          { h: 'Verdict', p: 'Alert manager armed. No open alerts. Rules synced with the SLOs declared in the Release Metrics report.' },
        ],
      },
    ],
  },
};

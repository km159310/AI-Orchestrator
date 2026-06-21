// src/data/streams.js
// Per-agent live stream lines. Each inner array matches the agents array
// for that phase, in the same order. Lines should read like meaningful
// sample report excerpts and end with an artifact the phase report references.

// Stream played for the Unit Test agent on a Development re-run (after the
// coverage rejection). Only this agent re-executes; the others stay marked
// as done from the first run.
const DEV_UNIT_TEST_RERUN_STREAM = [
  'Re-running unit suite after coverage rework…',
  'Added 14 specs covering transactions edge-cases (refund, partial debit, overdraft)…',
  'Coverage: 90% (lines), 88% (branches) — gate cleared',
  '✓ Unit-test suite green (re-run)',
];

const STREAMS = {
  req: [
    // BA Agent
    ['Parsing BRD: domain = Retail Banking…', 'Detected 8 functional + 4 non-functional requirements…', 'Applying MoSCoW priorities (5 MUST, 2 SHOULD, 1 NICE)…', '✓ Requirements catalogue → SRS §3'],
    // Doc Agent
    ['Drafting SRS v1.0 sections (Overview, FR, NFR)…', 'Generating 9 user stories across 3 epics…', '✓ SRS + User-Story catalogue published'],
    // Validator Agent
    ['Checking completeness against SRS template…', 'Traceability matrix: 9/9 stories mapped to FRs…', 'Testability score: 91% (target 85%)…', '✓ Validation passed'],
    // Risk Agent
    ['Scanning for security, ops, and scope risks…', 'R-001 JWT secret exposure — HIGH…', 'R-002 Port collision — MEDIUM…', 'R-003 Weak password storage — LOW…', '✓ Risk register + mitigations attached'],
  ],
  design: [
    // Architect Agent
    ['Selecting stack: Node 20 + React + SQLite…', 'Composing C4 component diagram…', 'Multi-port topology (:3001, :3002) confirmed…', '✓ Architecture document v1.0 ready'],
    // API Agent
    ['Drafting REST contract for auth + account endpoints…', 'POST /auth/login, /auth/logout, /auth/register…', 'GET /accounts/me, /accounts/me/transactions…', '✓ OpenAPI 3.1 spec finalised'],
    // DB Agent
    ['Designing schema: users, accounts, transactions…', 'Adding indexes on user_id, account_id, txn_ts…', 'Drafting migration scripts (3 versions)…', '✓ ERD + migrations published'],
    // UI Agent
    ['Wireframing Login, Dashboard, Transfer, Admin…', 'Running axe-core against the design tokens…', 'Contrast checks: AA on 12/12 components…', '✓ WCAG 2.1 AA compliant wireframes ready'],
  ],
  dev: [
    // Code Agent
    ['Scaffolding express server with PORT env var…', 'Implementing auth, account, transaction routes…', 'Wiring bcrypt (cost 12) + jsonwebtoken 9.0.2…', '✓ Application built — branch Application/branch'],
    // Unit Test (first run — coverage below the 80% gate, expected to be rejected)
    ['Writing tests for auth, account, transaction modules…', '28 specs across 6 files (transactions edge-cases skipped)…', 'Coverage: 75% (lines), 68% (branches) — below the 80% gate', '⚠ Unit-test coverage below threshold'],
    // Lint Agent
    ['Running ESLint with @typescript-eslint + security rules…', '0 errors, 3 warnings (non-blocking)…', 'Prettier formatting applied…', '✓ Code-style report: A'],
    // DocGen Agent
    ['Generating JSDoc from source comments…', 'Authoring README with PORT + Docker instructions…', 'Hosting Swagger UI at /api-docs…', '✓ Developer documentation complete'],
  ],
  test: [
    // Integration
    ['Spinning up staging on :3001 + :3002…', 'Running 48 integration scenarios across 4 suites…', '47 passed · 1 flaky (re-ran ✓)…', '✓ Integration report — 99.8% pass after retry'],
    // Load Test
    ['k6 profile: 100 VU ramp 30s, hold 5 min…', 'Endpoints: /auth/login, /accounts/me…', 'Login p95 = 118ms (target < 150ms)…', '✓ Load test passed — SLOs met'],
    // UAT Agent
    ['Executing 9 acceptance scenarios from the SRS…', 'US-001 to US-009 walked end-to-end…', 'Stakeholder feedback captured…', '✓ UAT report — 9/9 accepted'],
    // Report
    ['Aggregating integration, load, and UAT results…', 'Computing overall verdict…', 'Publishing pass/fail headline metrics…', '✓ Test summary — PASS'],
  ],
  pr: [],
  par: [
    // Risk Synthesiser
    ['Collating risks from Requirements register (R-001…R-003)…', 'Pulling Security findings (SAST medium x2, pen-test medium x1)…', 'Cross-checking outstanding mitigations and owners…', '✓ Risk summary compiled — 0 critical, 3 medium tracked'],
    // Compliance Auditor
    ['Checking SOC2 control gates (logging, access, change mgmt)…', 'Verifying PCI-DSS scope alignment for payment surfaces…', 'Confirming data-classification + retention policy…', '✓ Compliance checklist — all gates green'],
    // CAB Coordinator
    ['Packaging artefact links (SRS, API contract, test summary, SAST)…', 'Drafting change description + rollback plan…', 'Routing to CAB members for review…', '✓ CAB submission package ready for stakeholder approval'],
  ],
  deploy: [
    // Infra Agent
    ['Provisioning compute, networking, secrets…', 'Allocating PORT=3001 and PORT=3002…', 'Wiring health-check route /healthz…', '✓ Infrastructure ready'],
    // Container Agent
    ['Building abc-bank:1.0.0 via multi-stage Dockerfile…', 'Image size: 142 MB · layers: 7…', 'Pushing to registry.acme.local/abc-bank…', '✓ Image published'],
    // CD Agent
    ['Promoting through stages: build → test → deploy → notify…', 'Approval gates green…', 'Rolling out to :3001 and :3002…', '✓ Deployment live'],
    // Smoke Agent
    ['GET /healthz :3001 → 200 OK (42ms)…', 'GET /healthz :3002 → 200 OK (38ms)…', 'Login round-trip on both ports…', '✓ Smoke test — both instances healthy'],
  ],
  review: [
    // Post-mortem
    ['Reviewing phase timeline + agent runs…', 'What went well: auto-advance, sign-off audit trail…', 'What to improve: flaky IT-431, late rate-limit…', '✓ Post-mortem document published'],
    // Metrics
    ['Computing pipeline KPIs (lead time, runs, approvals)…', 'Quality: coverage 88%, p95 118ms, UAT 9/9…', 'Cost: 14 vCPU-min · 510k tokens · 6m 22s Jenkins…', '✓ Metrics report published'],
    // Lessons
    ['Distilling process wins + frictions…', 'Technical: pin jsonwebtoken ≥ 9, add rate-limit by default…', 'Carry-forwards: TST-219, SEC-441/442/443…', '✓ Lessons-learned document published'],
    // Release
    ['Compiling release notes from phase artefacts…', 'Tagging abc-bank:v1.0.0 + container digest…', 'Publishing known-issues list…', '✓ Release notes — ABC Bank v1.0.0 shipped'],
  ],
  monitor: [
    // Log Aggregator
    ['Indexing activity log across every phase…', 'Grouping events by phase id (req → review)…', 'Tagging events by severity (info/warn/danger)…', '✓ Activity log board ready'],
    // Alert Manager
    ['Wiring SLO thresholds: latency p95 < 150ms · error-rate < 1%…', 'Routing alerts to on-call channel #abc-bank-prod…', 'Quiet-hours window 22:00–07:00 configured…', '✓ Alert manager armed'],
  ],
};

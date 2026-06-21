import type { Agent, PhaseId } from "@/lib/types";

export const AGENTS: Record<PhaseId, Agent[]> = {
  req: [
    { id: "ba",   name: "BA Agent",    icon: "ti-clipboard-list",  color: "rgba(37,99,235,.15)",  border: "rgba(37,99,235,.3)",  desc: "Parses BRD into MoSCoW-prioritised requirements → produces the SRS." },
    { id: "doc",  name: "Doc Agent",   icon: "ti-file-text",       color: "rgba(5,150,105,.12)",  border: "rgba(5,150,105,.3)",  desc: "Authors user stories and acceptance criteria → produces the User-Story catalogue." },
    { id: "val",  name: "Validator Agent", icon: "ti-check",       color: "rgba(217,119,6,.12)",  border: "rgba(217,119,6,.3)",  desc: "Checks completeness, testability and traceability → produces the Validation report." },
    { id: "risk", name: "Risk Agent",  icon: "ti-alert-triangle",  color: "rgba(220,38,38,.12)",  border: "rgba(220,38,38,.3)",  desc: "Identifies delivery risks and mitigations → produces the Risk register." },
  ],
  design: [
    { id: "arch", name: "Architect Agent", icon: "ti-building",    color: "rgba(37,99,235,.15)",  border: "rgba(37,99,235,.3)",  desc: "Designs components and deployment topology → produces the Architecture document." },
    { id: "api",  name: "API Agent",   icon: "ti-plug",            color: "rgba(5,150,105,.12)",  border: "rgba(5,150,105,.3)",  desc: "Defines REST endpoints, payloads and auth → produces the OpenAPI 3.1 contract." },
    { id: "db",   name: "DB Agent",    icon: "ti-database",        color: "rgba(217,119,6,.12)",  border: "rgba(217,119,6,.3)",  desc: "Designs the relational schema, indexes and migrations → produces the DB schema document." },
    { id: "ui",   name: "UI Agent",    icon: "ti-layout",          color: "rgba(124,58,237,.12)", border: "rgba(124,58,237,.3)", desc: "Wireframes screens and validates WCAG 2.1 AA → produces the UI wireframes document." },
  ],
  dev: [
    { id: "code", name: "Code Agent",  icon: "ti-code",            color: "rgba(37,99,235,.15)",  border: "rgba(37,99,235,.3)",  desc: "Scaffolds the application and writes feature code → produces the Build manifest." },
    { id: "ut",   name: "Unit Test",   icon: "ti-test-pipe",       color: "rgba(5,150,105,.12)",  border: "rgba(5,150,105,.3)",  desc: "Authors unit tests targeting ≥ 80% coverage → produces the Unit-test report." },
    { id: "lint", name: "Lint Agent",  icon: "ti-scan",            color: "rgba(217,119,6,.12)",  border: "rgba(217,119,6,.3)",  desc: "Runs static analysis and style checks → produces the Code-quality report." },
    { id: "dgen", name: "DocGen Agent", icon: "ti-file-code",       color: "rgba(124,58,237,.12)", border: "rgba(124,58,237,.3)", desc: "Generates JSDoc, README and Swagger UI → produces the Developer documentation." },
  ],
  test: [
    { id: "int",  name: "Integration", icon: "ti-arrows-join",     color: "rgba(37,99,235,.15)",  border: "rgba(37,99,235,.3)",  desc: "Runs the end-to-end integration suite → produces the Integration report." },
    { id: "load", name: "Load Test",   icon: "ti-trending-up",     color: "rgba(5,150,105,.12)",  border: "rgba(5,150,105,.3)",  desc: "Executes a k6 load profile and verifies SLOs → produces the Load-test report." },
    { id: "uat",  name: "UAT Agent",   icon: "ti-user-check",      color: "rgba(217,119,6,.12)",  border: "rgba(217,119,6,.3)",  desc: "Walks each acceptance criterion as an end-user → produces the UAT report." },
    { id: "rep",  name: "Report",      icon: "ti-chart-bar",       color: "rgba(220,38,38,.12)",  border: "rgba(220,38,38,.3)",  desc: "Consolidates all test results with pass/fail verdict → produces the Test summary." },
  ],
  // PR (Pull Request) phase uses a custom pipeline UI (feature-branch
  // CI → peer review → master-branch CI → final approve), so it has no
  // standard agent grid.
  pr: [],
  par: [
    { id: "risk", name: "Risk Synthesiser", icon: "ti-alert-triangle", color: "rgba(220,38,38,.12)",  border: "rgba(220,38,38,.3)",  desc: "Collates risks and mitigations from every prior phase → produces the Risk summary." },
    { id: "comp", name: "Compliance Auditor", icon: "ti-shield-check", color: "rgba(217,119,6,.12)", border: "rgba(217,119,6,.3)",  desc: "Verifies SOC2 / PCI-DSS / change-policy gates → produces the Compliance checklist." },
    { id: "cab",  name: "CAB Coordinator", icon: "ti-clipboard-list", color: "rgba(37,99,235,.15)",  border: "rgba(37,99,235,.3)",  desc: "Packages the Change Advisory Board submission with artefact links → produces the CAB package." },
  ],
  deploy: [
    { id: "infra", name: "Infra Agent",     icon: "ti-server",     color: "rgba(37,99,235,.15)",  border: "rgba(37,99,235,.3)",  desc: "Provisions compute, networking and secrets → produces the Infrastructure manifest." },
    { id: "cont",  name: "Container Agent", icon: "ti-box",        color: "rgba(5,150,105,.12)",  border: "rgba(5,150,105,.3)",  desc: "Builds and pushes the reproducible image → produces the Container build report." },
    { id: "cd",    name: "CD Agent",        icon: "ti-rocket",     color: "rgba(217,119,6,.12)",  border: "rgba(217,119,6,.3)",  desc: "Drives the CD pipeline through approvals to live → produces the Deployment report." },
    { id: "smk",   name: "Smoke Agent",     icon: "ti-smoke",      color: "rgba(124,58,237,.12)", border: "rgba(124,58,237,.3)", desc: "Runs post-deploy smoke checks against each instance → produces the Smoke-test report." },
  ],
  review: [
    { id: "pm",   name: "Post-mortem", icon: "ti-report",          color: "rgba(37,99,235,.15)",  border: "rgba(37,99,235,.3)",  desc: "Captures what went well / to improve across the release → produces the Post-mortem." },
    { id: "met",  name: "Metrics",     icon: "ti-chart-line",      color: "rgba(5,150,105,.12)",  border: "rgba(5,150,105,.3)",  desc: "Publishes pipeline KPIs and quality metrics → produces the Metrics report." },
    { id: "les",  name: "Lessons",     icon: "ti-school",          color: "rgba(217,119,6,.12)",  border: "rgba(217,119,6,.3)",  desc: "Distils technical and process learnings → produces the Lessons-learned document." },
    { id: "rel",  name: "Release",     icon: "ti-tag",             color: "rgba(220,38,38,.12)",  border: "rgba(220,38,38,.3)",  desc: "Publishes release notes and the version tag → produces the Release notes." },
  ],
  monitor: [
    { id: "agg",  name: "Log Aggregator", icon: "ti-stack",        color: "rgba(37,99,235,.15)",  border: "rgba(37,99,235,.3)",  desc: "Collects activity from every phase and groups by source → produces the Activity log board." },
    { id: "alrt", name: "Alert Manager",  icon: "ti-bell-ringing", color: "rgba(217,119,6,.12)",  border: "rgba(217,119,6,.3)",  desc: "Wires SLO breach thresholds and routes alerts to the on-call channel." },
  ],
};

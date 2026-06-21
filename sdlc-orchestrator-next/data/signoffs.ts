import type { Signoff, PhaseId } from "@/lib/types";

export const SIGNOFFS: Partial<Record<PhaseId, Signoff[]>> = {
  req: [
    { name: "Sarah Chen",  role: "Product Owner",      av: "SC", color: "rgba(37,99,235,.15)",  tc: "var(--cyan)",   comment: "Requirements capture ABC Bank scope including multi-port deployment. Approved." },
    { name: "Marcus Webb", role: "Engineering Lead",   av: "MW", color: "rgba(5,150,105,.12)",  tc: "var(--green)",  comment: "Port config is clear. JWT auth approach is correct. Good to proceed." },
    { name: "Priya Nair",  role: "QA Lead",            av: "PN", color: "rgba(124,58,237,.12)", tc: "var(--purple)", comment: "All acceptance criteria are testable. Approved." },
  ],
  design: [
    { name: "Alex Torres", role: "Solutions Architect", av: "AT", color: "rgba(37,99,235,.15)",  tc: "var(--cyan)",   comment: "Architecture is clean for a banking MVP. Multi-port design is solid." },
    { name: "Sarah Chen",  role: "Product Owner",       av: "SC", color: "rgba(5,150,105,.12)",  tc: "var(--green)",  comment: "API contract covers all required endpoints." },
    { name: "David Kim",   role: "Security Architect",  av: "DK", color: "rgba(220,38,38,.12)",  tc: "var(--red)",    comment: "JWT implementation follows best practices. Approved." },
  ],
  dev: [
    { name: "Marcus Webb", role: "Engineering Lead",   av: "MW", color: "rgba(37,99,235,.15)",  tc: "var(--cyan)",   comment: "Build manifest is clean. Unit-test coverage clears the 80% gate; code-quality grade A. OK to advance to Testing." },
    { name: "Priya Nair",  role: "QA Lead",            av: "PN", color: "rgba(124,58,237,.12)", tc: "var(--purple)", comment: "Unit specs cover the critical paths. Linter green. Ready for the integration suite." },
    { name: "Raj Patel",   role: "DevOps Lead",        av: "RP", color: "rgba(5,150,105,.12)",  tc: "var(--green)",  comment: "PR branch builds reproducibly; Jenkins pipeline completed successfully. Approved." },
  ],
  test: [
    { name: "Priya Nair",  role: "QA Lead",            av: "PN", color: "rgba(124,58,237,.12)", tc: "var(--purple)", comment: "Integration suite passes after retry. UAT acceptance complete." },
    { name: "Sarah Chen",  role: "Product Owner",      av: "SC", color: "rgba(5,150,105,.12)",  tc: "var(--green)",  comment: "All 9 user stories accepted. Performance NFRs met." },
    { name: "Marcus Webb", role: "Engineering Lead",   av: "MW", color: "rgba(37,99,235,.15)",  tc: "var(--cyan)",   comment: "Load profile clean, no leaks. OK to advance to the PR pipeline." },
  ],
  par: [
    { name: "Helen Zhou",   role: "VP Engineering",      av: "HZ", color: "rgba(37,99,235,.15)",  tc: "var(--cyan)",   comment: "Risk summary and engineering readiness reviewed. Approving production release." },
    { name: "Olivia Brown", role: "Compliance Officer",  av: "OB", color: "rgba(217,119,6,.12)",  tc: "var(--amber)",  comment: "SOC2 and PCI-DSS gates green. Change-management policy satisfied." },
    { name: "David Kim",    role: "Security Architect",  av: "DK", color: "rgba(220,38,38,.12)",  tc: "var(--red)",    comment: "All medium findings have owners and ETAs. Cleared for deployment." },
    { name: "Sarah Chen",   role: "Product Owner",       av: "SC", color: "rgba(5,150,105,.12)",  tc: "var(--green)",  comment: "Business value and release window confirmed. CAB package complete. Approved." },
  ],
  // Deployment and Release Review have no stakeholder sign-off — both
  // auto-advance once their agents complete. PAR Approval is the last
  // human gate before the automated tail of the pipeline.
};

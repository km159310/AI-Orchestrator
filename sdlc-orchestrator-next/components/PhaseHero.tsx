import type { PhaseId } from "@/lib/types";

interface Scheme {
  title: string;
  tagline: string;
  icon: string;       // primary large icon
  deco: [string, string, string];  // 3 small decorative icons
  cls: string;        // CSS class with gradient
}

const SCHEMES: Record<PhaseId, Scheme> = {
  req: {
    title: "Requirements",
    tagline: "Capture · Validate · Document the business needs",
    icon: "ti-file-description",
    deco: ["ti-list-check", "ti-sparkles", "ti-clipboard-text"],
    cls: "hero-req",
  },
  design: {
    title: "Design",
    tagline: "Architecture · API contract · Database · UI wireframes",
    icon: "ti-vector-triangle",
    deco: ["ti-vector-bezier", "ti-blueprint", "ti-color-swatch"],
    cls: "hero-design",
  },
  dev: {
    title: "Development",
    tagline: "Generate the working application from your requirements",
    icon: "ti-code",
    deco: ["ti-brand-vscode", "ti-git-branch", "ti-terminal-2"],
    cls: "hero-dev",
  },
  test: {
    title: "Testing",
    tagline: "Integration · Load · UAT · Reports",
    icon: "ti-test-pipe",
    deco: ["ti-check", "ti-chart-line", "ti-bug-off"],
    cls: "hero-test",
  },
  pr: {
    title: "PR (Pull Request)",
    tagline: "Feature CI · Peer review · Merge to main · Master CI",
    icon: "ti-git-pull-request",
    deco: ["ti-git-branch", "ti-git-merge", "ti-git-commit"],
    cls: "hero-pr",
  },
  par: {
    title: "PAR Approval",
    tagline: "Production Approval Request · Risk · Compliance · CAB",
    icon: "ti-clipboard-check",
    deco: ["ti-alert-triangle", "ti-shield-check", "ti-clipboard-list"],
    cls: "hero-par",
  },
  deploy: {
    title: "Deployment",
    tagline: "Infrastructure · Containers · CD pipeline · Smoke",
    icon: "ti-rocket",
    deco: ["ti-server", "ti-cloud-upload", "ti-box"],
    cls: "hero-deploy",
  },
  review: {
    title: "Release Review",
    tagline: "Post-mortem · Metrics · Lessons · Release notes",
    icon: "ti-checkup-list",
    deco: ["ti-chart-bar", "ti-flag-check", "ti-tag"],
    cls: "hero-review",
  },
  monitor: {
    title: "Dashboard & Observability",
    tagline: "Activity logs · Live health · Pipeline status",
    icon: "ti-activity-heartbeat",
    deco: ["ti-broadcast", "ti-chart-dots", "ti-bell-ringing"],
    cls: "hero-monitor",
  },
};

export function PhaseHero({ pid }: { pid: PhaseId }) {
  const s = SCHEMES[pid];
  if (!s) return null;
  return (
    <div className={`phase-hero ${s.cls}`}>
      <div className="phase-hero-icon">
        <i className={`ti ${s.icon}`} aria-hidden="true" />
      </div>
      <div className="phase-hero-text">
        <div className="phase-hero-title">{s.title}</div>
        <div className="phase-hero-tagline">{s.tagline}</div>
      </div>
      <div className="phase-hero-deco" aria-hidden="true">
        <i className={`ti ${s.deco[0]}`} />
        <i className={`ti ${s.deco[1]}`} />
        <i className={`ti ${s.deco[2]}`} />
      </div>
    </div>
  );
}

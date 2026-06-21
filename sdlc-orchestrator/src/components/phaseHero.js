// src/components/phaseHero.js
// Hero banner shown at the top of every phase's panel body.
const Hero = (() => {
  const SCHEMES = {
    req: {
      title: 'Requirements',
      tagline: 'Capture · Validate · Document the business needs',
      icon: 'ti-file-description',
      deco: ['ti-list-check', 'ti-sparkles', 'ti-clipboard-text'],
      cls: 'hero-req',
    },
    design: {
      title: 'Design',
      tagline: 'Architecture · API contract · Database · UI wireframes',
      icon: 'ti-vector-triangle',
      deco: ['ti-vector-bezier', 'ti-blueprint', 'ti-color-swatch'],
      cls: 'hero-design',
    },
    dev: {
      title: 'Development',
      tagline: 'Generate the working application from your requirements',
      icon: 'ti-code',
      deco: ['ti-brand-vscode', 'ti-git-branch', 'ti-terminal-2'],
      cls: 'hero-dev',
    },
    test: {
      title: 'Testing',
      tagline: 'Integration · Load · UAT · Reports',
      icon: 'ti-test-pipe',
      deco: ['ti-check', 'ti-chart-line', 'ti-bug-off'],
      cls: 'hero-test',
    },
    pr: {
      title: 'PR (Pull Request)',
      tagline: 'Feature CI · Peer review · Merge to main · Master CI',
      icon: 'ti-git-pull-request',
      deco: ['ti-git-branch', 'ti-git-merge', 'ti-git-commit'],
      cls: 'hero-pr',
    },
    par: {
      title: 'PAR Approval',
      tagline: 'Production Approval Request · Risk · Compliance · CAB',
      icon: 'ti-clipboard-check',
      deco: ['ti-alert-triangle', 'ti-shield-check', 'ti-clipboard-list'],
      cls: 'hero-par',
    },
    deploy: {
      title: 'Deployment',
      tagline: 'Infrastructure · Containers · CD pipeline · Smoke',
      icon: 'ti-rocket',
      deco: ['ti-server', 'ti-cloud-upload', 'ti-box'],
      cls: 'hero-deploy',
    },
    review: {
      title: 'Release Review',
      tagline: 'Post-mortem · Metrics · Lessons · Release notes',
      icon: 'ti-checkup-list',
      deco: ['ti-chart-bar', 'ti-flag-check', 'ti-tag'],
      cls: 'hero-review',
    },
    monitor: {
      title: 'Dashboard & Observability',
      tagline: 'Activity logs · Live health · Pipeline status',
      icon: 'ti-activity-heartbeat',
      deco: ['ti-broadcast', 'ti-chart-dots', 'ti-bell-ringing'],
      cls: 'hero-monitor',
    },
  };

  function render(pid) {
    const s = SCHEMES[pid];
    if (!s) return '';
    return `
      <div class="phase-hero ${s.cls}">
        <div class="phase-hero-icon">
          <i class="ti ${s.icon}" aria-hidden="true"></i>
        </div>
        <div class="phase-hero-text">
          <div class="phase-hero-title">${s.title}</div>
          <div class="phase-hero-tagline">${s.tagline}</div>
        </div>
        <div class="phase-hero-deco" aria-hidden="true">
          <i class="ti ${s.deco[0]}"></i>
          <i class="ti ${s.deco[1]}"></i>
          <i class="ti ${s.deco[2]}"></i>
        </div>
      </div>
    `;
  }

  return { render };
})();

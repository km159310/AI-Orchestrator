// src/data/phases.js
const PHASES = [
  { id: 'req',    label: 'Requirements', icon: 'ti-file-description' },
  { id: 'design', label: 'Design',        icon: 'ti-vector-triangle'  },
  { id: 'dev',    label: 'Development',   icon: 'ti-code'             },
  { id: 'test',   label: 'Testing',       icon: 'ti-test-pipe'        },
  { id: 'pr',     label: 'PR (Pull Request)', icon: 'ti-git-pull-request', group: { id: 'gates', label: 'CI/CD process' } },
  { id: 'par',    label: 'PAR Approval',  icon: 'ti-clipboard-check',     group: { id: 'gates', label: 'CI/CD process' } },
  { id: 'deploy', label: 'Deployment',    icon: 'ti-rocket',             group: { id: 'gates', label: 'CI/CD process' } },
  { id: 'review', label: 'Release Review', icon: 'ti-checkup-list'    },
  { id: 'monitor', label: 'Dashboard & Observability', icon: 'ti-activity-heartbeat' },
];

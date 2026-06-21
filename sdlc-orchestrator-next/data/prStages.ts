// Pipeline stages for the PR (Pull Request) phase. The same first ten
// build/deploy/test stages run on the feature branch and again on the
// master branch after the peer-reviewed merge. Master adds a final
// "Check production readiness" stage before the human approves and
// advances to PAR Approval.

export const FEATURE_STAGES: string[] = [
  "Check Out code",
  "Build App",
  "Docker Build",
  "Deploy (Dev) core infrastructure",
  "Deploy App (dev-ecs-fargate-us-east-1)",
  "Deploy App (dev-ecs-fargate-us-west-2)",
  "Deploy (QA) core infrastructure",
  "Deploy App (qa-ecs-fargate-us-east-1)",
  "Deploy App (qa-ecs-fargate-us-west-2)",
  "Component Tests",
];

export const MASTER_STAGES: string[] = [
  ...FEATURE_STAGES,
  "Check production readiness",
];

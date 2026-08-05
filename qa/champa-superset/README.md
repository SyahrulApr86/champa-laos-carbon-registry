# Champa Superset Parity QA (W9)

This directory is the release-gate harness for F01–F25. It intentionally does
not make a feature pass merely because a route or component exists. The source
of truth remains the W0 data contract and feature manifest in the workspace
root.

All output is written below `qa/champa-superset/artifacts/` and is ignored by
Git. Evidence generated from this harness must retain the synthetic-demo
disclosure; it must never be presented as official Lao PDR data.

## Commands

Run these from the repository root. Set `CHAMPA_WORKSPACE_ROOT` when the
workspace root cannot be discovered from the worktree path.

```sh
node qa/champa-superset/scripts/evidence-index.mjs
node qa/champa-superset/scripts/policy-leakage-scan.mjs
node qa/champa-superset/scripts/ui-api-mismatch.mjs

# Requires a disposable demo API instance. Add --require-base in CI.
CHAMPA_BASE=http://localhost:3000/api \
  node qa/champa-superset/scripts/api-contract-smoke.mjs --require-base

# Requires Playwright to be installed by the environment. It captures desktop
# and mobile screenshots only; it does not claim SRN authenticated-page parity.
CHAMPA_WEB_BASE=http://localhost:3030 \
  node qa/champa-superset/scripts/browser-evidence.mjs --require-runner
```

## Release interpretation

- `pass`: the tested assertion succeeded against the specified demo instance.
- `fail`: the instance responded, but violates the W0 contract.
- `blocked`: a required handoff, seed, browser runner, endpoint, or policy
  decision is absent. This blocks final release approval.
- `not-run`: no disposable service URL was supplied. It is not a pass.

The W9 owner may integrate composition roots only after W1–W8 handoffs. Until
then, the generated evidence index is a task and acceptance template, not a
release approval.

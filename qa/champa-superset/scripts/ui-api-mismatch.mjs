import { readText, repositoryRoot, statusRow, writeArtifact } from "./common.mjs";

const checks = [
  {
    name: "analytics summary",
    frontend: ["web/src/Config/apiConfig.ts", /PUBLIC_ANALYTICS_SUMMARY:\s*"national\/analytics\/public\/summary"/],
    backend: ["backend/services/src/national-api/analytics.controller.ts", /@Get\("public\/summary"\)/],
  },
  {
    name: "certificate list",
    frontend: ["web/src/Config/apiConfig.ts", /PUBLIC_CERTIFICATES:/],
    backend: ["backend/services/src/national-api/programme.controller.ts", /@Get\("public\/certificates"\)/],
  },
  {
    name: "map summary",
    frontend: ["web/src/Config/apiConfig.ts", /PROJECT_MAP_SUMMARY:/],
    backend: ["backend/services/src/national-api/project-management.controller.ts", /@Get\("public\/mapSummary"\)/],
  },
  {
    name: "public programme search",
    frontend: ["web/src/Config/apiConfig.ts", /PUBLIC_PROJECT_SEARCH:/],
    backend: ["backend/services/src/national-api/project-management.controller.ts", /@Get\("public\/search"\)/],
  },
];

const results = checks.map((check) => {
  const [frontendFile, frontendPattern] = check.frontend;
  const [backendFile, backendPattern] = check.backend;
  const frontendMatches = frontendPattern.test(readText(frontendFile));
  const backendMatches = backendPattern.test(readText(backendFile));
  return {
    name: check.name,
    frontend_file: frontendFile,
    backend_file: backendFile,
    ...statusRow(frontendMatches && backendMatches ? "pass" : "fail", frontendMatches && backendMatches ? "Configured client endpoint matches a public controller endpoint." : "Client/controller endpoint mismatch or missing route."),
  };
});

const publicUiRoots = [
  "web/src/Components/Homepage",
  "web/src/Pages",
];
const disclosurePattern = /Synthetic demonstration data|demo_synthetic|not official Lao PDR/i;
const disclosurePresent = publicUiRoots.some((root) => {
  try { return disclosurePattern.test(readText(`${root}/CarbonDashboard.tsx`)); } catch { return false; }
});

const output = {
  generated_at: new Date().toISOString(),
  repository_root: repositoryRoot,
  endpoint_checks: results,
  disclosure_check: statusRow(disclosurePresent ? "pass" : "blocked", disclosurePresent ? "A public UI disclosure string was found." : "No shared public synthetic-demo disclosure component/string found; awaiting W3/W6/W9 composition handoff."),
  status: results.every((result) => result.status === "pass") && disclosurePresent ? "pass" : "blocked",
};
console.log(`UI/API mismatch report: ${writeArtifact("ui-api-mismatch.json", output)}`);
process.exitCode = output.status === "pass" ? 0 : 1;

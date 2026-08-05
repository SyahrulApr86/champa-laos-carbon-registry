import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";
import { repositoryRoot, statusRow, writeArtifact } from "./common.mjs";

const roots = ["web/src", "backend/services/src", "backend/services/libs/shared/src"];
const forbiddenPublicClaims = [
  /IDXCarbon/gi,
  /PTBAE-PU/gi,
  /official National Carbon Registry/gi,
  /Decree on Carbon Credits/gi,
];
const allowedNeutralTerms = ["Emission Ceiling & Trading", "carbon-market venue", "Synthetic demonstration"];
const findings = [];

function visit(directory) {
  for (const entry of readdirSync(directory)) {
    const target = resolve(directory, entry);
    const stat = statSync(target);
    if (stat.isDirectory()) visit(target);
    else if (/\.(ts|tsx|js|jsx|json|scss|css)$/.test(entry)) {
      const contents = readFileSync(target, "utf8");
      for (const pattern of forbiddenPublicClaims) {
        for (const match of contents.matchAll(pattern)) {
          const line = contents.slice(0, match.index).split("\n").length;
          findings.push({ file: relative(repositoryRoot, target), line, term: match[0] });
        }
      }
    }
  }
}

for (const root of roots) visit(resolve(repositoryRoot, root));
const output = {
  generated_at: new Date().toISOString(),
  status: findings.length ? "fail" : "pass",
  scope: roots,
  prohibited_public_claim_terms: forbiddenPublicClaims.map((pattern) => pattern.source),
  allowed_neutral_terms: allowedNeutralTerms,
  findings,
  note: "Review findings in public-facing copy. A finding is a release gate until the owner confirms it is not exposed publicly or replaces it with neutral, configured terminology.",
  result: statusRow(findings.length ? "fail" : "pass", findings.length ? `${findings.length} policy-sensitive term occurrence(s) found.` : "No configured policy-sensitive terms found."),
};
console.log(`policy scan: ${writeArtifact("policy-leakage-scan.json", output)}`);
process.exitCode = findings.length ? 1 : 0;

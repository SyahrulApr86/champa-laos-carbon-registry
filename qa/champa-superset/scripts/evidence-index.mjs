import { manifestPath, readManifest, statusRow, writeArtifact } from "./common.mjs";

const manifest = readManifest();
const features = manifest.features ?? [];
const ids = features.map((feature) => feature.id);
const expectedIds = Array.from({ length: 25 }, (_, index) => `F${String(index + 1).padStart(2, "0")}`);
const ordered = JSON.stringify(ids) === JSON.stringify(expectedIds);

const rows = features.map((feature) => ({
  feature_id: feature.id,
  title: feature.title,
  owner: feature.owner_workstream,
  routes: feature.current_champa?.routes ?? [],
  components: feature.current_champa?.components ?? [],
  public_apis: feature.current_champa?.apis ?? [],
  entities: feature.current_champa?.entities ?? [],
  seed_requirements: feature.seed_requirements ?? [],
  evidence: feature.evidence ?? {},
  acceptance_criteria: feature.acceptance_criteria ?? [],
  dependencies: feature.dependencies ?? [],
  required_states: ["populated", "empty", "loading", "error"],
  required_interactions: ["filters", "pagination"],
  desktop_screenshot: statusRow("blocked", "Awaiting owner handoff and disposable synthetic demo instance."),
  mobile_screenshot: statusRow("blocked", "Awaiting owner handoff and disposable synthetic demo instance."),
  api_contract: statusRow("blocked", "Awaiting W1–W8 API/seed handoff."),
  reconciliation: statusRow("blocked", "Awaiting W1/W2 ledger and analytics fixtures where applicable."),
  release_status: "blocked",
}));

const output = {
  generated_at: new Date().toISOString(),
  source_manifest: manifestPath,
  manifest_validation: {
    expected_feature_ids: expectedIds,
    observed_feature_ids: ids,
    status: ordered ? "pass" : "fail",
  },
  invariant_templates: {
    api_envelope: ["dataset_kind", "scenario", "as_of", "source", "unit", "scale", "filters", "availability", "disclosure"],
    certificate_conservation: "issued = available + assigned_to_exchange + withheld + retired + cancelled + other_explicit_non_circulating",
    map_counts: "received = plotted + excluded; excluded reasons sum to excluded",
    trading_boundary: "certificate balances do not include emission-ceiling trades",
  },
  rows,
  release_recommendation: "blocked_pending_w1_w8_handoffs",
};

const target = writeArtifact("evidence-index.json", output);
console.log(`evidence index: ${target}`);
console.log(`features: ${ids.length}; manifest order: ${output.manifest_validation.status}`);
process.exitCode = ordered ? 0 : 1;

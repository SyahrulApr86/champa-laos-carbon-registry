import { statusRow, writeArtifact } from "./common.mjs";

const requiredBase = process.argv.includes("--require-base");
const base = process.env.CHAMPA_BASE?.replace(/\/$/, "");
const disclosurePrefix = "Synthetic demonstration data";
const endpoints = [
  { name: "analytics_summary", path: "/national/analytics/public/summary", pagination: false, metricResponse: true },
  { name: "certificates_first_page", path: "/national/programme/public/certificate-registry?q=&page=1&pageSize=10", pagination: true, certificateResponse: true },
  { name: "certificates_last_page", path: "/national/programme/public/certificate-registry?q=__w9_empty__&page=999&pageSize=10", pagination: true },
  { name: "mitigation_map", path: "/national/projectManagement/public/mapSummary?activityType=mitigation", mapResponse: true },
];

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateEnvelope(payload, endpoint) {
  const failures = [];
  assert(object(payload), "response is not an object", failures);
  assert(Object.hasOwn(payload ?? {}, "data"), "missing data", failures);
  assert(object(payload?.meta), "missing meta envelope", failures);
  const meta = payload?.meta ?? {};
  for (const field of ["dataset_kind", "scenario", "as_of", "source", "unit", "scale", "filters", "availability", "disclosure"]) {
    assert(Object.hasOwn(meta, field), `missing meta.${field}`, failures);
  }
  assert(meta.dataset_kind === "demo_synthetic", "meta.dataset_kind must be demo_synthetic for this test scenario", failures);
  assert(typeof meta.disclosure === "string" && meta.disclosure.includes(disclosurePrefix), "missing synthetic demonstration disclosure", failures);
  if (endpoint.pagination) {
    assert(object(meta.pagination), "missing meta.pagination", failures);
    for (const field of ["page", "page_size", "total_items", "total_pages"]) {
      assert(Number.isFinite(meta.pagination?.[field]), `missing numeric meta.pagination.${field}`, failures);
    }
  }
  if (endpoint.mapResponse) {
    for (const field of ["received_count", "plotted_count", "excluded_count", "exclusions"]) {
      assert(Object.hasOwn(meta, field), `missing map meta.${field}`, failures);
    }
    const received = meta.received_count;
    const plotted = meta.plotted_count;
    const excluded = meta.excluded_count;
    assert(received === plotted + excluded, "map counts must satisfy received = plotted + excluded", failures);
    if (object(meta.exclusions)) {
      const reasons = Object.values(meta.exclusions);
      assert(reasons.every(Number.isFinite), "map exclusion reasons must be numeric", failures);
      assert(reasons.reduce((sum, count) => sum + count, 0) === excluded, "map exclusion reasons must sum to excluded_count", failures);
    }
  }
  if (endpoint.metricResponse) {
    const metrics = payload?.data?.metrics ?? payload?.data?.registry_overview?.certificate_metrics;
    assert(metrics !== undefined, "missing explicit metric collection", failures);
    if (Array.isArray(metrics)) {
      for (const metric of metrics) {
        assert(typeof metric.formula_id === "string", "metric missing formula_id", failures);
        assert(metric.unit !== undefined, "metric missing unit", failures);
      }
    }
  }
  if (endpoint.certificateResponse) {
    const row = Array.isArray(payload?.data) ? payload.data[0] : payload?.data;
    const balances = row?.certificate_balances ?? row?.balances;
    if (object(balances)) {
      const assigned = balances.assigned_to_exchange ?? balances.exchange_assigned;
      const values = [balances.available, assigned, balances.withheld, balances.retired, balances.cancelled];
      assert(values.every(Number.isFinite), "certificate balance fields must be numeric", failures);
      if (values.every(Number.isFinite)) {
        const conserved = balances.available + assigned + balances.withheld + balances.retired + balances.cancelled + (balances.other_explicit_non_circulating ?? 0);
        assert(Number(row?.issued_quantity) === conserved, "certificate conservation invariant failed", failures);
      }
    } else {
      failures.push("missing canonical certificate balance projection for conservation check");
    }
  }
  return failures;
}

if (!base) {
  const output = {
    generated_at: new Date().toISOString(),
    status: requiredBase ? "blocked" : "not-run",
    message: "Set CHAMPA_BASE to a disposable synthetic demo API instance.",
    endpoints,
  };
  console.log(`api smoke: ${writeArtifact("api-contract-smoke.json", output)}`);
  process.exitCode = requiredBase ? 2 : 0;
} else {
  const results = [];
  for (const endpoint of endpoints) {
    const url = `${base}${endpoint.path}`;
    try {
      const response = await fetch(url, { headers: { accept: "application/json" } });
      const body = await response.text();
      let payload;
      try { payload = JSON.parse(body); } catch { payload = null; }
      const failures = response.ok ? validateEnvelope(payload, endpoint) : [`HTTP ${response.status}`];
      results.push({ name: endpoint.name, url, http_status: response.status, ...statusRow(failures.length ? "fail" : "pass", failures.join("; ") || "Contract assertions passed."), failures, payload });
    } catch (error) {
      results.push({ name: endpoint.name, url, ...statusRow("blocked", `Request failed: ${error.message}`), failures: [error.message] });
    }
  }
  const status = results.every((result) => result.status === "pass") ? "pass" : "fail";
  console.log(`api smoke: ${writeArtifact("api-contract-smoke.json", { generated_at: new Date().toISOString(), base, status, results })}`);
  process.exitCode = status === "pass" ? 0 : 1;
}

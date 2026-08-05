import { buildDemoSeedScenario, DEMO_MINIMUMS, loadScenarioIdempotently, renderSeedCoverageReport } from "./scenario";
import { assertSafeDemoSeedEnvironment, DEMO_SEED_CONFIRMATION } from "./safety";

describe("W1 deterministic demo scenario", () => {
  it("is deterministic, production-scale, and covers every parity feature", () => {
    const first = buildDemoSeedScenario();
    const second = buildDemoSeedScenario();
    expect(first.hash).toBe(second.hash);
    expect(first.records.map((item) => item.record_id)).toEqual(second.records.map((item) => item.record_id));
    expect(first.counts.organisations).toBe(DEMO_MINIMUMS.organisations);
    expect(first.counts.programmes).toBe(DEMO_MINIMUMS.programmes);
    expect(first.counts.ledgerEvents).toBeGreaterThanOrEqual(2000);
    expect(Object.keys(first.featureCoverage)).toHaveLength(25);
    expect(first.records.every((item) => item.dataset_kind === "demo_synthetic" && item.as_of === "2026-08-05T00:00:00Z")).toBe(true);
  });

  it("requires two explicit demo safeguards and rejects production", () => {
    expect(() => assertSafeDemoSeedEnvironment({})).toThrow("CHAMPA_DEMO_DATABASE");
    expect(() => assertSafeDemoSeedEnvironment({ CHAMPA_DEMO_DATABASE: "true", CHAMPA_DEMO_SEED_CONFIRMATION: DEMO_SEED_CONFIRMATION, NODE_ENV: "production" })).toThrow("production");
    expect(() => assertSafeDemoSeedEnvironment({ CHAMPA_DEMO_DATABASE: "true", CHAMPA_DEMO_SEED_CONFIRMATION: DEMO_SEED_CONFIRMATION, NODE_ENV: "test" })).not.toThrow();
  });

  it("makes the future W2 loader retry-safe and reports every feature", async () => {
    let appliedHash: string | null = null;
    const loader = {
      getAppliedScenarioHash: jest.fn(async () => appliedHash),
      replaceSyntheticScenario: jest.fn(async (scenario) => {
        appliedHash = scenario.hash;
      }),
    };
    expect((await loadScenarioIdempotently(loader)).status).toBe("loaded");
    expect((await loadScenarioIdempotently(loader)).status).toBe("unchanged");
    expect(loader.replaceSyntheticScenario).toHaveBeenCalledTimes(1);
    expect(renderSeedCoverageReport()).toContain("F25:");
  });
});

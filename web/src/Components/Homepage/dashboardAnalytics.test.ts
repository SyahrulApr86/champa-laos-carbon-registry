import {
  adaptDashboardAnalytics,
  isChartReconciled,
  metricTotal,
} from "./dashboardAnalytics";

const chart = (metricId: string, points: Array<[string, number]>) => ({
  points: points.map(([label, value]) => ({ key: label, label, value })),
  metric: {
    metric_id: metricId,
    unit: "tCO2e",
    formula_id: `${metricId}_v1`,
    methodology_version: "demo-v1",
    additive: true,
    availability: "available",
    source_label: "Synthetic fixture",
    period_label: "2021-01-01–2026-12-31",
  },
});

describe("dashboard analytics reconciliation", () => {
  it("uses the sum of displayed canonical series as the chart total", () => {
    const view = adaptDashboardAnalytics({
      data: {
        registry_overview: {
          programme_count: 2,
          stage_counts: { New: 1, Approved: 1 },
          certificate_metrics: { issued: 120, available: 100 },
        },
        charts: {
          proponents_by_registry_scheme: chart("organisation_distinct_count", [["Configured scheme", 2]]),
          proponent_category_distribution: chart("organisation_distinct_count", [["Community", 2]]),
          issued_units_by_registry_scheme: chart("certificate_issued_total", [["Configured scheme", 120]]),
          verified_reduction_by_proponent_category: chart("verified_reduction", [["Community", 110]]),
          issued_units_by_sector: chart("certificate_issued_total", [["Energy", 120]]),
          verified_reduction_by_sector: chart("verified_reduction", [["Energy", 110]]),
        },
      },
      meta: {
        dataset_kind: "demo_synthetic",
        disclosure: "Synthetic demonstration data, not official Lao PDR data.",
      },
    });

    const issuedBySector = view.charts.find(
      (item) => item.id === "issued_units_by_sector"
    );
    expect(issuedBySector).toBeDefined();
    expect(metricTotal(issuedBySector!)).toBe(120);
    expect(isChartReconciled(issuedBySector!)).toBe(true);
  });

  it("does not transform absent registry-scheme values into zero buckets", () => {
    const view = adaptDashboardAnalytics({
      data: {
        totalProjects: 1,
        proponentsByCategory: { Community: 1 },
        credits: { issued: 10 },
      },
    });
    const byScheme = view.charts.find(
      (item) => item.id === "proponents_by_registry_scheme"
    );
    expect(byScheme?.points).toEqual([]);
    expect(byScheme?.metric.availability).toBe("not_configured");
    expect(metricTotal(byScheme!)).toBeNull();
  });
});

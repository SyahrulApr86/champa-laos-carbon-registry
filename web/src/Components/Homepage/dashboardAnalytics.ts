/**
 * W3 public-dashboard adapter.
 *
 * The canonical response expected from W2 is `{ data, meta }`, where every
 * chart has its own metric metadata.  The adapter deliberately supports the
 * older aggregate response while marking it `incomplete`; it never invents a
 * scheme bucket, provenance value, or missing metric as zero.
 */

export type Availability =
  | "available"
  | "not_available"
  | "withheld"
  | "not_configured";

export interface AnalyticsMeta {
  dataset_kind?: "demo_synthetic" | "authoritative" | "mixed_explicit";
  scenario?: string;
  as_of?: string;
  period?: { start?: string; end?: string };
  source?: { type?: string; label?: string };
  methodology_version?: string | null;
  filters?: Record<string, string | number | boolean | null | undefined>;
  pagination?: {
    page?: number;
    page_size?: number;
    total_items?: number;
    total_pages?: number;
  };
  disclosure?: string;
  availability?: Availability;
}

export interface MetricDescriptor {
  metric_id: string;
  unit: string | null;
  formula_id: string | null;
  methodology_version: string | null;
  additive: boolean | null;
  availability: Availability;
  source_label: string | null;
  period_label: string | null;
}

export interface BreakdownPoint {
  key: string;
  label: string;
  value: number | null;
  availability?: Availability;
}

export interface AnalyticsChart {
  id:
    | "proponents_by_registry_scheme"
    | "proponent_category_distribution"
    | "issued_units_by_registry_scheme"
    | "verified_reduction_by_proponent_category"
    | "issued_units_by_sector"
    | "verified_reduction_by_sector";
  title: string;
  points: BreakdownPoint[];
  metric: MetricDescriptor;
}

export interface RegistryOverview {
  programme_count: number | null;
  stage_counts: Record<string, number | null>;
  certificate_metrics: Record<string, number | null>;
}

export interface DashboardAnalyticsView {
  overview: RegistryOverview;
  charts: AnalyticsChart[];
  meta: AnalyticsMeta;
  isCanonical: boolean;
}

export interface PublicEnvelope<T> {
  data: T;
  meta?: AnalyticsMeta;
}

type LegacySummary = {
  totalProjects?: number;
  stageCounts?: Record<string, number>;
  credits?: Record<string, number>;
  proponentsByCategory?: Record<string, number>;
  verifiedEmissionReductionByProponentCategory?: Record<string, number>;
  speBySector?: Record<string, number>;
  verifiedEmissionReductionBySector?: Record<string, number>;
};

const CHART_DEFINITIONS: Array<Pick<AnalyticsChart, "id" | "title">> = [
  {
    id: "proponents_by_registry_scheme",
    title: "Proponents by Registry Scheme",
  },
  {
    id: "proponent_category_distribution",
    title: "Proponent Category Distribution",
  },
  {
    id: "issued_units_by_registry_scheme",
    title: "Issued Units by Registry Scheme",
  },
  {
    id: "verified_reduction_by_proponent_category",
    title: "Verified Reduction by Proponent Category",
  },
  { id: "issued_units_by_sector", title: "Issued Units by Sector" },
  {
    id: "verified_reduction_by_sector",
    title: "Verified Reduction by Sector",
  },
];

const legacyMetric = (
  metricId: string,
  unit: string | null,
  available: boolean
): MetricDescriptor => ({
  metric_id: metricId,
  unit,
  formula_id: available ? "legacy_projection_pending_w2" : null,
  methodology_version: null,
  additive: null,
  availability: available ? "not_available" : "not_configured",
  source_label: "Legacy public aggregate; W2 canonical metrics pending",
  period_label: null,
});

const toPoints = (values?: Record<string, number>): BreakdownPoint[] =>
  Object.entries(values ?? {})
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .map(([key, value]) => ({ key, label: key, value }));

const numberOrNull = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const metricFromCanonical = (raw: Record<string, unknown>): MetricDescriptor => ({
  metric_id: String(raw.metric_id ?? "not_configured"),
  unit: typeof raw.unit === "string" ? raw.unit : null,
  formula_id: typeof raw.formula_id === "string" ? raw.formula_id : null,
  methodology_version:
    typeof raw.methodology_version === "string" ? raw.methodology_version : null,
  additive: typeof raw.additive === "boolean" ? raw.additive : null,
  availability: (raw.availability as Availability | undefined) ?? "not_available",
  source_label: typeof raw.source_label === "string" ? raw.source_label : null,
  period_label: typeof raw.period_label === "string" ? raw.period_label : null,
});

const canonicalChart = (
  definition: Pick<AnalyticsChart, "id" | "title">,
  chart: Record<string, unknown> | undefined
): AnalyticsChart => {
  const rawPoints = Array.isArray(chart?.points) ? chart?.points : [];
  return {
    ...definition,
    points: rawPoints.map((point) => {
      const value = point as Record<string, unknown>;
      return {
        key: String(value.key ?? value.label ?? "unknown"),
        label: String(value.label ?? value.key ?? "Not configured"),
        value: numberOrNull(value.value),
        availability: value.availability as Availability | undefined,
      };
    }),
    metric: metricFromCanonical((chart?.metric as Record<string, unknown>) ?? {}),
  };
};

const fromCanonical = (envelope: PublicEnvelope<Record<string, unknown>>): DashboardAnalyticsView => {
  const data = envelope.data ?? {};
  const overview = (data.registry_overview ?? {}) as Record<string, unknown>;
  const rawCharts = (data.charts ?? {}) as Record<string, Record<string, unknown>>;
  return {
    overview: {
      programme_count: numberOrNull(overview.programme_count),
      stage_counts: (overview.stage_counts ?? {}) as Record<string, number | null>,
      certificate_metrics: (overview.certificate_metrics ?? {}) as Record<
        string,
        number | null
      >,
    },
    charts: CHART_DEFINITIONS.map((definition) =>
      canonicalChart(definition, rawCharts[definition.id])
    ),
    meta: envelope.meta ?? {},
    isCanonical: true,
  };
};

const fromLegacy = (summary: LegacySummary): DashboardAnalyticsView => {
  const chartValues: Record<AnalyticsChart["id"], Record<string, number> | undefined> = {
    proponents_by_registry_scheme: undefined,
    proponent_category_distribution: summary.proponentsByCategory,
    issued_units_by_registry_scheme: undefined,
    verified_reduction_by_proponent_category:
      summary.verifiedEmissionReductionByProponentCategory,
    issued_units_by_sector: summary.speBySector,
    verified_reduction_by_sector: summary.verifiedEmissionReductionBySector,
  };
  const metricUnits: Record<AnalyticsChart["id"], string | null> = {
    proponents_by_registry_scheme: "organisations",
    proponent_category_distribution: "organisations",
    issued_units_by_registry_scheme: "tCO2e",
    verified_reduction_by_proponent_category: "tCO2e",
    issued_units_by_sector: "tCO2e",
    verified_reduction_by_sector: "tCO2e",
  };

  return {
    overview: {
      programme_count: numberOrNull(summary.totalProjects),
      stage_counts: summary.stageCounts ?? {},
      certificate_metrics: {
        issued: numberOrNull(summary.credits?.issued),
        available: numberOrNull(summary.credits?.available),
        transferred: numberOrNull(summary.credits?.transferred),
        retired: numberOrNull(summary.credits?.retired),
        cancelled: numberOrNull(summary.credits?.cancelled),
        assigned_to_exchange: numberOrNull(summary.credits?.assignedToExchange),
      },
    },
    charts: CHART_DEFINITIONS.map((definition) => {
      const values = chartValues[definition.id];
      return {
        ...definition,
        points: toPoints(values),
        metric: legacyMetric(definition.id, metricUnits[definition.id], Boolean(values)),
      };
    }),
    meta: {
      availability: "not_available",
      disclosure:
        "Data metadata unavailable — provenance and methodology cannot yet be verified.",
    },
    isCanonical: false,
  };
};

/** Accepts either the raw axios body or the ConnectionContext response. */
export const adaptDashboardAnalytics = (response: unknown): DashboardAnalyticsView => {
  const connection = response as {
    data?: unknown;
    response?: { data?: unknown };
  };
  const raw = connection?.response?.data ?? connection?.data ?? response;
  const candidate = raw as { data?: unknown; meta?: AnalyticsMeta };
  if (
    candidate?.meta &&
    candidate.data &&
    typeof candidate.data === "object" &&
    !Array.isArray(candidate.data)
  ) {
    return fromCanonical(candidate as PublicEnvelope<Record<string, unknown>>);
  }
  return fromLegacy((raw ?? {}) as LegacySummary);
};

export const metricTotal = (chart: AnalyticsChart): number | null => {
  if (chart.metric.availability !== "available") return null;
  const values = chart.points.map((point) => point.value);
  return values.every((value) => value !== null)
    ? values.reduce<number>((total, value) => total + (value ?? 0), 0)
    : null;
};

/**
 * Used by component tests and W9 evidence checks. A chart can only expose a
 * numeric total when every displayed series is numeric and the API marks the
 * metric available.
 */
export const isChartReconciled = (chart: AnalyticsChart): boolean =>
  metricTotal(chart) !== null || chart.metric.availability !== "available";

export const humanMetricValue = (value: number | null, availability: Availability) => {
  if (availability === "withheld") return "Withheld";
  if (availability === "not_configured") return "Not configured";
  if (availability !== "available" || value === null) return "Not available";
  return value.toLocaleString("en-US");
};

import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Alert, Button, Select, Spin } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { COLOR_CONFIGS } from "../../Config/colorConfigs";
import {
  adaptDashboardAnalytics,
  AnalyticsChart,
  Availability,
  DashboardAnalyticsView,
  humanMetricValue,
  metricTotal,
} from "./dashboardAnalytics";
import "./Dashboard.scss";
import "./DashboardAnalytics.scss";

export const DONUT_PALETTE = [
  COLOR_CONFIGS.PRIMARY_THEME_COLOR,
  COLOR_CONFIGS.ACCENT_GOLD_COLOR,
  COLOR_CONFIGS.PRIMARY_RED_COLOR,
  "#2E8B67",
  "#6B7280",
  "#7C9CBF",
];

type DonutDatum = { title: string; value: number };

export const DonutBreakdown = ({
  data,
  totalLabel,
  totalOverride,
}: {
  data: DonutDatum[];
  totalLabel: string;
  totalOverride?: number | null;
}) => {
  const total = totalOverride ?? data.reduce((sum, item) => sum + item.value, 0);
  if (data.length === 0 || total === null || total <= 0) {
    return <div className="donut-empty">Not available</div>;
  }

  return (
    <div className="donut-breakdown">
      <Chart
        type="donut"
        width="220"
        options={{
          labels: data.map((item) => item.title),
          colors: DONUT_PALETTE,
          legend: { show: false },
          dataLabels: { enabled: false },
          stroke: { width: 2 },
          tooltip: { y: { formatter: (value: number) => value.toLocaleString() } },
          plotOptions: {
            pie: {
              donut: {
                size: "72%",
                labels: {
                  show: true,
                  value: { fontSize: "20px", fontWeight: 700, offsetY: -4 },
                  total: {
                    show: true,
                    label: totalLabel,
                    fontSize: "13px",
                    formatter: () => total.toLocaleString(),
                  },
                },
              },
            },
          },
        }}
        series={data.map((item) => item.value)}
      />
      <ul className="donut-legend">
        {data.map((item, index) => (
          <li key={item.title}>
            <span
              className="donut-legend-dot"
              style={{ backgroundColor: DONUT_PALETTE[index % DONUT_PALETTE.length] }}
            />
            <span className="donut-legend-label">{item.title}</span>
            <span className="donut-legend-value">{item.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const EMPTY_VIEW: DashboardAnalyticsView = {
  overview: { programme_count: null, stage_counts: {}, certificate_metrics: {} },
  charts: [],
  meta: { availability: "not_available" },
  isCanonical: false,
};

const stageLabels: Array<{ key: string; label: string }> = [
  { key: "New", label: "Submitted" },
  { key: "AwaitingAuthorization", label: "Under review" },
  { key: "Authorised", label: "Authorised" },
  { key: "Approved", label: "Approved / active" },
  { key: "Rejected", label: "Rejected" },
];

const certificateCards = [
  ["issued", "Issued"],
  ["available", "Available"],
  ["transferred", "Transferred event volume"],
  ["retired", "Retired"],
  ["cancelled", "Cancelled"],
  ["assigned_to_exchange", "Assigned to exchange"],
] as const;

const years = ["", "2021", "2022", "2023", "2024", "2025", "2026"];

const filterPath = (year: string, sector: string, scheme: string) => {
  const query = new URLSearchParams();
  if (year) query.set("year", year);
  if (sector) query.set("sector", sector);
  if (scheme) query.set("scheme", scheme);
  const suffix = query.toString();
  return `${API_PATHS.PUBLIC_ANALYTICS_SUMMARY}${suffix ? `?${suffix}` : ""}`;
};

const ChartCard = ({ chart }: { chart: AnalyticsChart }) => {
  const availablePoints = chart.points.filter(
    (point) => point.value !== null && point.availability !== "withheld"
  ) as Array<{ key: string; label: string; value: number }>;
  const total = metricTotal(chart);
  const state = chart.metric.availability;

  return (
    <article className="donut-card analytics-chart-card" data-chart-id={chart.id}>
      <h3 className="section-title">{chart.title}</h3>
      {state === "available" ? (
        <DonutBreakdown
          data={availablePoints.map(({ label, value }) => ({ title: label, value }))}
          totalLabel={chart.metric.unit ?? "records"}
          totalOverride={total}
        />
      ) : (
        <div className="analytics-unavailable">
          {humanMetricValue(null, state)}
        </div>
      )}
      <dl className="analytics-metric-meta">
        <div><dt>Unit</dt><dd>{chart.metric.unit ?? "Not available"}</dd></div>
        <div><dt>Formula</dt><dd>{chart.metric.formula_id ?? "Not available"}</dd></div>
        <div><dt>Source</dt><dd>{chart.metric.source_label ?? "Not available"}</dd></div>
        <div><dt>Methodology</dt><dd>{chart.metric.methodology_version ?? "Not available"}</dd></div>
        <div><dt>Semantics</dt><dd>{chart.metric.additive === null ? "Not available" : chart.metric.additive ? "Additive" : "Non-additive"}</dd></div>
      </dl>
    </article>
  );
};

const dashboardAvailability = (view: DashboardAnalyticsView): Availability =>
  view.meta.availability ?? (view.isCanonical ? "available" : "not_available");

const CarbonDashboard = () => {
  const { get } = useConnection();
  const [year, setYear] = useState("");
  const [sector, setSector] = useState("");
  const [scheme, setScheme] = useState("");
  const [view, setView] = useState<DashboardAnalyticsView>(EMPTY_VIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    get(filterPath(year, sector, scheme))
      .then((response) => {
        if (active) setView(adaptDashboardAnalytics(response));
      })
      .catch(() => {
        if (active) {
          setView(EMPTY_VIEW);
          setError("Dashboard data could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [get, reloadToken, scheme, sector, year]);

  const sectorOptions = useMemo(() => {
    const chart = view.charts.find((item) => item.id === "issued_units_by_sector");
    return chart?.points.map((point) => point.label) ?? [];
  }, [view.charts]);
  const schemeOptions = useMemo(() => {
    const chart = view.charts.find(
      (item) => item.id === "proponents_by_registry_scheme"
    );
    return chart?.points.map((point) => point.label) ?? [];
  }, [view.charts]);
  const availability = dashboardAvailability(view);

  return (
    <section className="carbon-dashboard" aria-busy={loading}>
      <div className="dashboard-container">
        <header className="analytics-dashboard-header">
          <div>
            <p className="analytics-eyebrow">Mitigation Registry</p>
            <h2 className="header-title">Registry analytics</h2>
          </div>
          <a className="analytics-drill-link" href="#registry-table">Browse registry records</a>
        </header>

        <div className="analytics-disclosure" role="status">
          {view.meta.disclosure ?? "Data metadata unavailable — provenance cannot be verified."}
          {view.meta.as_of && <span> As of: {view.meta.as_of}.</span>}
          {view.meta.period?.start && view.meta.period.end && (
            <span> Coverage: {view.meta.period.start}–{view.meta.period.end}.</span>
          )}
        </div>

        <div className="analytics-filter-bar" aria-label="Registry analytics filters">
          <Select value={year} onChange={setYear} options={years.map((value) => ({ value, label: value || "All years" }))} />
          <Select
            value={sector}
            onChange={setSector}
            options={[{ value: "", label: "All sectors" }, ...sectorOptions.map((value) => ({ value, label: value }))]}
          />
          <Select
            value={scheme}
            onChange={setScheme}
            options={[{ value: "", label: "All configured schemes" }, ...schemeOptions.map((value) => ({ value, label: value }))]}
          />
          <Button onClick={() => setReloadToken((current) => current + 1)}>Refresh</Button>
        </div>

        {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => setReloadToken((current) => current + 1)}>Retry</Button>} />}
        {loading ? (
          <div className="analytics-loading"><Spin /> Loading registry analytics…</div>
        ) : (
          <>
            <div className="registry-overview-grid">
              <article className="registry-overview-sidebar">
                <h3 className="registry-overview-sidebar-title">Mitigation Registry</h3>
                <div className="registry-overview-sidebar-total">
                  <div className="registry-overview-sidebar-total-value">
                    {humanMetricValue(view.overview.programme_count, availability)}
                  </div>
                  <div className="registry-overview-sidebar-total-label">Programmes</div>
                </div>
                <div className="registry-overview-sidebar-stages">
                  {stageLabels.map((stage) => (
                    <div key={stage.key} className="registry-overview-sidebar-stage">
                      <span className="registry-overview-sidebar-stage-label">{stage.label}</span>
                      <span className="registry-overview-sidebar-stage-value">
                        {humanMetricValue(view.overview.stage_counts[stage.key] ?? null, availability)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="registry-overview-certificate">
                <h3 className="registry-overview-certificate-title">Champa Certificate Registry</h3>
                <div className="registry-overview-certificate-grid">
                  {certificateCards.map(([key, label], index) => (
                    <div className={`registry-overview-certificate-card ${index === 0 ? "highlight" : ""}`} key={key}>
                      <div className="registry-overview-certificate-value">
                        {humanMetricValue(view.overview.certificate_metrics[key] ?? null, availability)}
                      </div>
                      <div className="registry-overview-certificate-label">{label}</div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
            <div className="donut-grid analytics-chart-grid">
              {view.charts.map((chart) => <ChartCard chart={chart} key={chart.id} />)}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CarbonDashboard;

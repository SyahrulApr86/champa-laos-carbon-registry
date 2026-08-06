import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Input, Select, Table, Tag } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { AnalyticsMeta } from "./dashboardAnalytics";
import { DonutBreakdown } from "./CarbonDashboard";
import { readPublicEnvelope } from "./publicData";
import "./Dashboard.scss";
import "./DashboardAnalytics.scss";

interface RecognizedMitigationSummary {
  totalActions: number | null;
  byStatus: Record<string, number>;
  byProponentType: Record<string, number>;
  estimatedReductionTco2e: number | null;
  meta?: AnalyticsMeta;
  isCanonical: boolean;
}

interface RecognizedMitigationRow {
  referenceId: string;
  title: string;
  proponentName: string;
  proponentType: string;
  sector: string;
  region: string;
  estimatedReductionTco2e: number | null;
  status: string;
  createdAt: number;
}

const emptySummary: RecognizedMitigationSummary = {
  totalActions: null,
  byStatus: {},
  byProponentType: {},
  estimatedReductionTco2e: null,
  isCanonical: false,
};

const statusColor: Record<string, string> = { Submitted: "gold", UnderReview: "blue", Recognized: "green", Rejected: "red" };
const PAGE_SIZE = 10;

const appendFilters = (path: string, filters: Record<string, string>) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  const suffix = query.toString();
  return `${path}${suffix ? `&${suffix}` : ""}`;
};

const rawBody = (response: unknown) => {
  const connection = response as { data?: unknown; response?: { data?: unknown } };
  return connection.response?.data ?? connection.data ?? response;
};

const parseSummary = (response: unknown): RecognizedMitigationSummary => {
  const raw = rawBody(response) as { data?: unknown; meta?: AnalyticsMeta };
  if (raw.meta && raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
    const data = raw.data as Record<string, unknown>;
    return {
      totalActions: Number.isFinite(Number(data.total_actions)) ? Number(data.total_actions) : null,
      byStatus: (data.by_status ?? {}) as Record<string, number>,
      byProponentType: (data.by_proponent_type ?? {}) as Record<string, number>,
      estimatedReductionTco2e: Number.isFinite(Number(data.estimated_reduction_tco2e)) ? Number(data.estimated_reduction_tco2e) : null,
      meta: raw.meta,
      isCanonical: true,
    };
  }
  const data = raw as Partial<{ totalActions: number; byStatus: Record<string, number>; byProponentType: Record<string, number>; estimatedReductionTco2e: number }>;
  return {
    totalActions: Number.isFinite(Number(data.totalActions)) ? Number(data.totalActions) : null,
    byStatus: data.byStatus ?? {},
    byProponentType: data.byProponentType ?? {},
    estimatedReductionTco2e: Number.isFinite(Number(data.estimatedReductionTco2e)) ? Number(data.estimatedReductionTco2e) : null,
    meta: raw.meta,
    isCanonical: Boolean(raw.meta),
  };
};

const parseRows = (response: unknown) => {
  const envelope = readPublicEnvelope<RecognizedMitigationRow[]>(response);
  const raw = rawBody(response) as { data?: unknown; meta?: AnalyticsMeta; total?: number };
  if (envelope.meta && Array.isArray(envelope.data)) {
    return { rows: envelope.data, total: envelope.meta.pagination?.total_items ?? raw.total ?? 0, meta: envelope.meta as AnalyticsMeta };
  }
  if (Array.isArray(raw.data)) {
    return { rows: raw.data as RecognizedMitigationRow[], total: raw.meta?.pagination?.total_items ?? raw.total ?? 0, meta: raw.meta };
  }
  if (Array.isArray(raw)) return { rows: raw as RecognizedMitigationRow[], total: 0, meta: undefined };
  return { rows: [], total: 0, meta: raw.meta };
};

const RecognizedMitigationTab = () => {
  const { get } = useConnection();
  const [summary, setSummary] = useState<RecognizedMitigationSummary>(emptySummary);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [proponentType, setProponentType] = useState("");
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState("");
  const [rows, setRows] = useState<RecognizedMitigationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<AnalyticsMeta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ status, proponent_type: proponentType, sector, region }),
    [proponentType, region, sector, status]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryPath = appendFilters(API_PATHS.RECOGNIZED_MITIGATION_PUBLIC_SUMMARY, filters);
      const rowsPath = appendFilters(API_PATHS.RECOGNIZED_MITIGATION_PUBLIC_SEARCH(query, page, PAGE_SIZE), filters);
      const [summaryResponse, rowResponse] = await Promise.all([get(summaryPath), get(rowsPath)]);
      const nextSummary = parseSummary(summaryResponse);
      const nextRows = parseRows(rowResponse);
      setSummary(nextSummary);
      setRows(nextRows.rows);
      setTotal(nextRows.total);
      setMeta(nextRows.meta ?? nextSummary.meta);
    } catch {
      setSummary(emptySummary);
      setRows([]);
      setTotal(0);
      setError("Recognised mitigation actions could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters, get, page, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = Object.entries(summary.byProponentType)
    .filter(([, value]) => value > 0)
    .map(([title, value]) => ({ title, value }));
  const chartTotal = chartData.reduce((sum, item) => sum + item.value, 0);
  const chartReconciles = summary.isCanonical && summary.totalActions !== null && chartTotal === summary.totalActions;
  const statusEntries = Object.entries(summary.byStatus);
  const columns = [
    { title: "Registration number", dataIndex: "referenceId", key: "referenceId" },
    { title: "Proponent", dataIndex: "proponentName", key: "proponentName" },
    { title: "Activity", dataIndex: "title", key: "title" },
    { title: "Proponent type", dataIndex: "proponentType", key: "proponentType" },
    { title: "Sector", dataIndex: "sector", key: "sector" },
    { title: "Region", dataIndex: "region", key: "region" },
    { title: "Estimated reduction", dataIndex: "estimatedReductionTco2e", key: "estimatedReductionTco2e", render: (value: number | null) => value === null || value === undefined ? "Not available" : `${value.toLocaleString()} tCO2e (estimated)` },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag color={statusColor[value] || "default"}>{value}</Tag> },
  ];

  return (
    <section className="dashboard-container" aria-busy={loading}>
      <header className="analytics-dashboard-header">
        <div><p className="analytics-eyebrow">Mitigation Registry</p><h2 className="header-title">Recognised Mitigation Actions</h2></div>
      </header>
      <p className="analytics-disclosure">{meta?.disclosure ?? "Data metadata unavailable. Provenance cannot be verified."}</p>
      <p className="registry-table-subtitle">Estimated reductions are not verified reductions and are never certificate issuance volumes.</p>
      <div className="analytics-filter-bar">
        <Input.Search placeholder="Search recognised actions" allowClear onSearch={(value) => { setPage(1); setQuery(value.trim()); }} />
        <Select value={status} onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: "", label: "All statuses" }, ...Object.keys(statusColor).map((value) => ({ value, label: value }))]} />
        <Select value={proponentType} onChange={(value) => { setPage(1); setProponentType(value); }} options={[{ value: "", label: "All proponent types" }, ...Object.keys(summary.byProponentType).map((value) => ({ value, label: value }))]} />
        <Input value={sector} onChange={(event) => { setPage(1); setSector(event.target.value); }} placeholder="Sector" aria-label="Sector filter" />
        <Input value={region} onChange={(event) => { setPage(1); setRegion(event.target.value); }} placeholder="Province/region" aria-label="Province or region filter" />
      </div>
      {error && <Alert type="error" showIcon message={error} />}
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-card-label">Recognised actions</div><div className="kpi-card-value">{summary.totalActions?.toLocaleString() ?? "Not available"}</div></div>
        <div className="kpi-card"><div className="kpi-card-label">Estimated reduction</div><div className="kpi-card-value">{summary.estimatedReductionTco2e === null ? "Not available" : `${summary.estimatedReductionTco2e.toLocaleString()} tCO2e`}</div></div>
        {statusEntries.map(([label, value]) => <div className="kpi-card" key={label}><div className="kpi-card-label">{label}</div><div className="kpi-card-value">{value.toLocaleString()}</div></div>)}
      </div>
      <div className="donut-grid">
        <article className="donut-card analytics-chart-card">
          <h3 className="section-title">Proponent Type Distribution</h3>
          {chartReconciles ? <>{/* The chart centre is computed from the exact same filtered population as the KPI. */}<DonutBreakdown data={chartData} totalLabel="Actions" totalOverride={chartTotal} /></> : <div className="analytics-unavailable">Not available until the filtered analytics contract reconciles.</div>}
          <dl className="analytics-metric-meta"><div><dt>Unit</dt><dd>records</dd></div><div><dt>Formula</dt><dd>Count of recognised actions grouped by proponent type</dd></div><div><dt>Source</dt><dd>{summary.meta?.source?.label ?? "Not available"}</dd></div><div><dt>Semantics</dt><dd>Non-additive across overlapping classifications</dd></div></dl>
        </article>
      </div>
      <div className="registry-table-section">
        <h3 className="section-title">Recognised Action Registry</h3>
        <Table rowKey="referenceId" columns={columns} dataSource={rows} loading={loading} scroll={{ x: true }} locale={{ emptyText: error ? "Recognised action data unavailable." : "No recognised actions match the selected filters." }} pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: (nextPage) => setPage(nextPage) }} />
      </div>
    </section>
  );
};

export default RecognizedMitigationTab;

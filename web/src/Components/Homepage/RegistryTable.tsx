import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Input, Select, Table, Tag } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { AnalyticsMeta } from "./dashboardAnalytics";
import "./Dashboard.scss";
import "./DashboardAnalytics.scss";

interface RegistryRow {
  registrationNumber: string;
  title: string;
  sector: string | null;
  status: string;
  proponent: string | null;
}

interface RegistryResult {
  rows: RegistryRow[];
  total: number;
  meta?: AnalyticsMeta;
}

const statusColor: Record<string, string> = {
  Submitted: "gold",
  "Under review": "blue",
  Authorised: "cyan",
  "Approved / active": "green",
  Rejected: "red",
};

const PAGE_SIZE = 10;
const YEARS = ["", "2021", "2022", "2023", "2024", "2025", "2026"];

const STAGE_TABS: { key: string; label: string }[] = [
  { key: "All", label: "All stages" },
  { key: "New", label: "Submitted" },
  { key: "AwaitingAuthorization", label: "Under review" },
  { key: "Authorised", label: "Authorised" },
  { key: "Approved", label: "Approved / active" },
  { key: "Rejected", label: "Rejected" },
];

const withFilters = (path: string, filters: Record<string, string>) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString();
  return `${path}${suffix ? `&${suffix}` : ""}`;
};

const parseRegistryResult = (response: unknown): RegistryResult => {
  const connection = response as {
    data?: unknown;
    response?: { data?: unknown };
  };
  const raw = connection.response?.data ?? connection.data ?? response;
  const envelope = raw as { data?: unknown; meta?: AnalyticsMeta; total?: number };
  if (Array.isArray(envelope.data)) {
    return { rows: envelope.data as RegistryRow[], total: envelope.meta?.pagination?.total_items ?? envelope.total ?? 0, meta: envelope.meta };
  }
  if (Array.isArray(raw)) return { rows: raw as RegistryRow[], total: 0 };
  return { rows: [], total: 0, meta: envelope.meta };
};

const RegistryTable = () => {
  const { t } = useTranslation(["homepage"]);
  const { get } = useConnection();
  const [query, setQuery] = useState("");
  const [activeStage, setActiveStage] = useState("All");
  const [year, setYear] = useState("");
  const [sector, setSector] = useState("");
  const [scheme, setScheme] = useState("");
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<AnalyticsMeta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = withFilters(
        API_PATHS.PUBLIC_PROJECT_SEARCH(
          query,
          page,
          PAGE_SIZE,
          activeStage === "All" ? undefined : activeStage
        ),
        { year, sector, scheme }
      );
      const result = parseRegistryResult(await get(path));
      setRows(result.rows);
      setTotal(result.total);
      setMeta(result.meta);
    } catch {
      setRows([]);
      setTotal(0);
      setError("Registry records could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeStage, get, page, query, scheme, sector, year]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const sectors = useMemo(
    () => Array.from(new Set(rows.map((row) => row.sector).filter(Boolean))) as string[],
    [rows]
  );

  const columns = [
    { title: t("homepage:colRegistrationNumber"), dataIndex: "registrationNumber", key: "registrationNumber" },
    { title: t("homepage:colTitle"), dataIndex: "title", key: "title" },
    { title: t("homepage:colSector"), dataIndex: "sector", key: "sector", render: (value: string | null) => value ?? "Not available" },
    { title: t("homepage:colProponent"), dataIndex: "proponent", key: "proponent", render: (value: string | null) => value ?? "Not available" },
    { title: t("homepage:colStatus"), dataIndex: "status", key: "status", render: (status: string) => <Tag color={statusColor[status] || "default"}>{status}</Tag> },
    { title: "Detail", key: "detail", render: (_: unknown, row: RegistryRow) => <Link to={`/public/project/${encodeURIComponent(row.registrationNumber)}`}>View detail</Link> },
  ];

  return (
    <section className="dashboard-container registry-table-section" id="registry-table" aria-busy={loading}>
      <h3 className="section-title">{t("homepage:registryTableTitle")}</h3>
      <p className="registry-table-subtitle">{t("homepage:registryTableSubtitle")}</p>
      <p className="analytics-disclosure">{meta?.disclosure ?? "Data metadata unavailable — provenance cannot be verified."}</p>
      <div className="analytics-filter-bar">
        <Input.Search allowClear size="large" placeholder={String(t("homepage:registrySearchPlaceholder"))} onSearch={(value) => { setPage(1); setQuery(value.trim()); }} className="registry-table-search" />
        <Select value={year} onChange={(value) => { setPage(1); setYear(value); }} options={YEARS.map((value) => ({ value, label: value || "All years" }))} />
        <Select value={sector} onChange={(value) => { setPage(1); setSector(value); }} options={[{ value: "", label: "All sectors" }, ...sectors.map((value) => ({ value, label: value }))]} />
        <Input value={scheme} onChange={(event) => { setPage(1); setScheme(event.target.value); }} placeholder="Configured scheme" aria-label="Registry scheme filter" />
      </div>
      <div className="ndc-pill-tabs-nav" aria-label="Programme stage filter">
        {STAGE_TABS.map((tab) => (
          <button key={tab.key} className={`ndc-pill-tab-button ${activeStage === tab.key ? "active" : ""}`} onClick={() => { setPage(1); setActiveStage(tab.key); }}>
            {tab.label}
          </button>
        ))}
      </div>
      {error && <Alert type="error" showIcon message={error} />}
      <Table
        className="registry-table"
        rowKey="registrationNumber"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: true }}
        locale={{ emptyText: error ? "Registry data unavailable." : query || sector || scheme ? String(t("homepage:registryTableNoResults")) : String(t("homepage:registryTableEmpty")) }}
        pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: (nextPage) => setPage(nextPage) }}
      />
    </section>
  );
};

export default RegistryTable;

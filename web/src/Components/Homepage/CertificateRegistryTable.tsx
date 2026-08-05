import { useCallback, useEffect, useState } from "react";
import { Alert, Input, Select, Table, Tag } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { AnalyticsMeta, Availability, humanMetricValue } from "./dashboardAnalytics";
import "./Dashboard.scss";
import "./DashboardAnalytics.scss";

interface CertificateRow {
  certificateId?: string;
  accountHolder: string | null;
  activity: string;
  sector: string | null;
  registryNo: string;
  scheme?: string | null;
  startVintage: number | null;
  endVintage: number | null;
  status: string;
  issuedUnits: number | null;
  availableUnits: number | null;
  retiredUnits: number | null;
  cancelledUnits: number | null;
  assignedToExchangeUnits: number | null;
  issuedDate: string | null;
  availability?: Availability;
}

type CanonicalCertificateRow = {
  certificate_id: string;
  account_holder: string | null;
  activity: string | null;
  sector: string | null;
  registry_number: string | null;
  registry_scheme: string | null;
  vintage?: { start?: string | null; end?: string | null };
  balances?: Record<string, number | null>;
  issued_quantity: number | null;
  issued_at: string | null;
  availability?: Availability;
};

interface CertificateResult {
  rows: CertificateRow[];
  total: number;
  meta?: AnalyticsMeta;
}

const statusColor: Record<string, string> = { Active: "green", Retired: "gold", Cancelled: "red", "Assigned to Exchange": "blue" };
const PAGE_SIZE = 10;

const parseResult = (response: unknown): CertificateResult => {
  const connection = response as { data?: unknown; response?: { data?: unknown } };
  const raw = connection.response?.data ?? connection.data ?? response;
  const envelope = raw as { data?: unknown; meta?: AnalyticsMeta; total?: number };
  if (Array.isArray(envelope.data)) {
    const rows = (envelope.data as Array<CertificateRow | CanonicalCertificateRow>).map((row) => {
      if ("certificate_id" in row) {
        const balances = row.balances ?? {};
        const state = Object.entries(balances).find(([, value]) => Number(value) > 0)?.[0] ?? "available";
        return {
          certificateId: row.certificate_id,
          accountHolder: row.account_holder,
          activity: row.activity ?? "Not available",
          sector: row.sector,
          registryNo: row.registry_number ?? "Not available",
          scheme: row.registry_scheme,
          startVintage: row.vintage?.start ? Number(row.vintage.start.slice(0, 4)) : null,
          endVintage: row.vintage?.end ? Number(row.vintage.end.slice(0, 4)) : null,
          status: state.replaceAll("_", " "),
          issuedUnits: row.issued_quantity,
          availableUnits: balances.available ?? null,
          retiredUnits: balances.retired ?? null,
          cancelledUnits: balances.cancelled ?? null,
          assignedToExchangeUnits: balances.exchange_assigned ?? null,
          issuedDate: row.issued_at,
          availability: row.availability,
        };
      }
      return row;
    });
    return { rows, total: envelope.meta?.pagination?.total_items ?? envelope.total ?? 0, meta: envelope.meta };
  }
  return { rows: [], total: 0, meta: envelope.meta };
};

const CertificateRegistryTable = () => {
  const { get } = useConnection();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<AnalyticsMeta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = `${API_PATHS.PUBLIC_CERTIFICATE_REGISTRY(query, page, PAGE_SIZE)}${status ? `&state=${encodeURIComponent(status)}` : ""}`;
      const result = parseResult(await get(path));
      setRows(result.rows);
      setTotal(result.total);
      setMeta(result.meta);
    } catch {
      setRows([]);
      setTotal(0);
      setError("Certificate records could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [get, page, query, status]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const formatUnits = (value: number | null, row: CertificateRow) => humanMetricValue(value, row.availability ?? meta?.availability ?? "not_available");
  const columns = [
    { title: "Account holder", dataIndex: "accountHolder", key: "accountHolder", render: (value: string | null) => value ?? "Not available" },
    { title: "Activity", dataIndex: "activity", key: "activity" },
    { title: "Sector", dataIndex: "sector", key: "sector", render: (value: string | null) => value ?? "Not available" },
    { title: "Registry number", dataIndex: "registryNo", key: "registryNo" },
    { title: "Configured scheme", dataIndex: "scheme", key: "scheme", render: (value: string | null) => value ?? "Not configured" },
    { title: "Vintage", key: "vintage", render: (_: unknown, row: CertificateRow) => row.startVintage && row.endVintage ? `${row.startVintage}–${row.endVintage}` : "Not available" },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag color={statusColor[value] || "default"}>{value}</Tag> },
    { title: "Issued", key: "issuedUnits", render: (_: unknown, row: CertificateRow) => formatUnits(row.issuedUnits, row) },
    { title: "Available", key: "availableUnits", render: (_: unknown, row: CertificateRow) => formatUnits(row.availableUnits, row) },
    { title: "Retired", key: "retiredUnits", render: (_: unknown, row: CertificateRow) => formatUnits(row.retiredUnits, row) },
    { title: "Cancelled", key: "cancelledUnits", render: (_: unknown, row: CertificateRow) => formatUnits(row.cancelledUnits, row) },
    { title: "Assigned to exchange", key: "assignedToExchangeUnits", render: (_: unknown, row: CertificateRow) => formatUnits(row.assignedToExchangeUnits, row) },
    { title: "Issued date", dataIndex: "issuedDate", key: "issuedDate", render: (value: string | null) => value ?? "Not available" },
  ];

  return (
    <section className="dashboard-container registry-table-section" aria-busy={loading}>
      <h3 className="section-title">Champa Certificate Registry</h3>
      <p className="registry-table-subtitle">Public certificate balances and event volumes. A transfer is an event volume, not additional supply.</p>
      <p className="analytics-disclosure">{meta?.disclosure ?? "Data metadata unavailable — provenance cannot be verified."}</p>
      <div className="analytics-filter-bar">
        <Input.Search allowClear size="large" placeholder="Search account holder, registry number, or activity" onSearch={(value) => { setPage(1); setQuery(value.trim()); }} className="registry-table-search" />
        <Select value={status} onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: "", label: "All states" }, { value: "AVAILABLE", label: "Available" }, { value: "RETIRED", label: "Retired" }, { value: "CANCELLED", label: "Cancelled" }, { value: "ASSIGNED_TO_EXCHANGE", label: "Assigned to exchange" }, { value: "WITHHELD", label: "Withheld" }]} />
      </div>
      {error && <Alert type="error" showIcon message={error} />}
      <Table className="registry-table" rowKey={(row) => row.certificateId ?? row.registryNo} columns={columns} dataSource={rows} loading={loading} scroll={{ x: true }} locale={{ emptyText: error ? "Certificate data unavailable." : query || status ? "No certificates match the selected filters." : "No certificate records are available." }} pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: (nextPage) => setPage(nextPage) }} />
    </section>
  );
};

export default CertificateRegistryTable;

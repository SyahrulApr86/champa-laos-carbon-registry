import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Input, Select, Table, Tabs, Tag, Typography } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";

type VenueStatus = "synthetic_demo" | "configured" | "not_configured";

interface MarketMeta {
  availability?: "available" | "not_configured" | "not_available";
  pagination?: { page: number; page_size: number; total_items: number; total_pages: number };
  disclosure?: string;
  ledger_boundary?: { statement?: string };
}

interface SeriesRow {
  record_id: string;
  series_name: string;
  year: number;
  allocated_units: number;
  unit: string;
  participant_count: number;
  exchange_available_units: number | null;
  availability: string;
  venue_status: VenueStatus;
}

interface TransactionRow {
  record_id: string;
  date: number;
  series_name: string | null;
  seller: { name: string };
  buyer: { name: string };
  quantity: number;
  unit: string;
  value: number | null;
  currency: "LAK";
  price_per_unit: number | null;
  venue_status: VenueStatus;
  settlement_status: string;
  certificate_bridge: "absent" | "configured";
}

interface ParticipantRow {
  record_id: string;
  facility_name: string;
  organisation: { name: string };
  capacity_description: string;
  year: number;
  series_name: string | null;
  sector: string | null;
  participant_status: "active" | "unallocated" | "withheld";
}

const PAGE_SIZE = 10;
const number = (value: number) => value.toLocaleString("en-US");
const date = (value: number) => new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const lak = (value: number | null) => value === null ? "Not available" : `LAK ${number(value)}`;
const semantic = (value: number | null, availability?: string) => value === null ? (availability === "not_configured" ? "Not configured" : "Not available") : number(value);

const statusLabel: Record<VenueStatus, string> = {
  synthetic_demo: "Synthetic demonstration market",
  configured: "Configured market",
  not_configured: "Not configured",
};

const appendFilters = (path: string, filters: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  const suffix = query.toString();
  return suffix ? `${path}&${suffix}` : path;
};

function usePublicList<T>(basePath: (page: number, size: number) => string, filters: Record<string, string | number | undefined>) {
  const { get } = useConnection();
  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<MarketMeta>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const filterKey = JSON.stringify(filters);

  useEffect(() => setPage(1), [filterKey]);
  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await get(appendFilters(basePath(page, PAGE_SIZE), filters));
      setRows((response?.data || []) as T[]);
      setMeta((response?.response?.data?.meta || {}) as MarketMeta);
    } catch {
      setRows([]);
      setMeta({});
      setError("Market data is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [basePath, filterKey, get, page]);

  useEffect(() => { fetchPage(); }, [fetchPage]);
  return { rows, meta, page, setPage, loading, error };
}

const MarketDisclosure = ({ meta, status }: { meta?: MarketMeta; status?: VenueStatus }) => (
  <>
    <Alert
      showIcon
      type={status === "not_configured" ? "warning" : "info"}
      message={status ? statusLabel[status] : "Synthetic demonstration market"}
      description={meta?.disclosure || "Synthetic demonstration data — not official Lao PDR market activity or certificate records."}
      style={{ marginBottom: 12 }}
    />
    <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
      {meta?.ledger_boundary?.statement || "Ceiling allocations and market trades are separate from certificate balances."}
    </Typography.Paragraph>
  </>
);

const TableState = ({ error }: { error?: string }) => error ? <Alert type="error" showIcon message={error} /> : null;

const SeriesTable = () => {
  const [year, setYear] = useState<string>();
  const [series, setSeries] = useState("");
  const [venueStatus, setVenueStatus] = useState<VenueStatus>("synthetic_demo");
  const filters = useMemo(() => ({ year, series, venueStatus }), [year, series, venueStatus]);
  const { rows, meta, page, setPage, loading, error } = usePublicList<SeriesRow>(API_PATHS.EMISSION_TRADING_PUBLIC_SERIES, filters);
  return <>
    <MarketDisclosure meta={meta} status={venueStatus} />
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      <Input aria-label="Search ceiling series" placeholder="Search series" value={series} onChange={(event) => setSeries(event.target.value)} style={{ maxWidth: 240 }} allowClear />
      <Input aria-label="Filter emission year" placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} style={{ width: 120 }} />
      <Select aria-label="Market configuration state" value={venueStatus} onChange={setVenueStatus} style={{ minWidth: 210 }} options={Object.entries(statusLabel).map(([value, label]) => ({ value, label }))} />
    </div>
    <TableState error={error} />
    <Table rowKey="record_id" loading={loading} dataSource={rows} locale={{ emptyText: error ? "" : "No ceiling series match these filters." }} columns={[
      { title: "Ceiling Series", dataIndex: "series_name" },
      { title: "Emission Year", dataIndex: "year" },
      { title: "Allocated Amount", render: (_: unknown, row: SeriesRow) => `${number(row.allocated_units)} ${row.unit}` },
      { title: "Participants", dataIndex: "participant_count" },
      { title: "Exchange availability", render: (_: unknown, row: SeriesRow) => semantic(row.exchange_available_units, row.availability) },
      { title: "Venue", render: (_: unknown, row: SeriesRow) => <Tag>{statusLabel[row.venue_status]}</Tag> },
    ]} pagination={{ current: page, pageSize: PAGE_SIZE, total: meta.pagination?.total_items || 0, onChange: setPage, showSizeChanger: false }} />
  </>;
};

const TransactionsTable = () => {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>();
  const [venueStatus, setVenueStatus] = useState<VenueStatus>("synthetic_demo");
  const filters = useMemo(() => ({ search, year, venueStatus }), [search, year, venueStatus]);
  const { rows, meta, page, setPage, loading, error } = usePublicList<TransactionRow>(API_PATHS.EMISSION_TRADING_PUBLIC_TRANSACTIONS, filters);
  return <>
    <MarketDisclosure meta={meta} status={venueStatus} />
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      <Input aria-label="Search market transactions" placeholder="Search seller, buyer or series" value={search} onChange={(event) => setSearch(event.target.value)} style={{ maxWidth: 280 }} allowClear />
      <Input aria-label="Filter transaction year" placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} style={{ width: 120 }} />
      <Select aria-label="Market configuration state" value={venueStatus} onChange={setVenueStatus} style={{ minWidth: 210 }} options={Object.entries(statusLabel).map(([value, label]) => ({ value, label }))} />
    </div>
    <TableState error={error} />
    <Table rowKey="record_id" loading={loading} dataSource={rows} locale={{ emptyText: error ? "" : "No market transactions match these filters." }} columns={[
      { title: "Date", render: (_: unknown, row: TransactionRow) => date(row.date) },
      { title: "Series", render: (_: unknown, row: TransactionRow) => row.series_name || "Not configured" },
      { title: "Seller", render: (_: unknown, row: TransactionRow) => row.seller.name },
      { title: "Buyer", render: (_: unknown, row: TransactionRow) => row.buyer.name },
      { title: "Quantity", render: (_: unknown, row: TransactionRow) => `${number(row.quantity)} ${row.unit}` },
      { title: "Value", render: (_: unknown, row: TransactionRow) => lak(row.value) },
      { title: "Price / unit", render: (_: unknown, row: TransactionRow) => row.price_per_unit === null ? "Not available" : lak(row.price_per_unit) },
      { title: "Settlement", dataIndex: "settlement_status" },
    ]} pagination={{ current: page, pageSize: PAGE_SIZE, total: meta.pagination?.total_items || 0, onChange: setPage, showSizeChanger: false }} />
  </>;
};

const ParticipantsTable = () => {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>();
  const filters = useMemo(() => ({ search, year }), [search, year]);
  const { rows, meta, page, setPage, loading, error } = usePublicList<ParticipantRow>(API_PATHS.EMISSION_TRADING_PUBLIC_PARTICIPANTS, filters);
  return <>
    <MarketDisclosure meta={meta} />
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      <Input aria-label="Search participating facilities" placeholder="Search facility or organisation" value={search} onChange={(event) => setSearch(event.target.value)} style={{ maxWidth: 280 }} allowClear />
      <Input aria-label="Filter participant year" placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} style={{ width: 120 }} />
    </div>
    <TableState error={error} />
    <Table rowKey="record_id" loading={loading} dataSource={rows} locale={{ emptyText: error ? "" : "No participating facilities match these filters." }} columns={[
      { title: "Facility", dataIndex: "facility_name" },
      { title: "Organisation", render: (_: unknown, row: ParticipantRow) => row.organisation.name },
      { title: "Capacity", dataIndex: "capacity_description" },
      { title: "Series", render: (_: unknown, row: ParticipantRow) => row.series_name || "Not configured" },
      { title: "Sector", render: (_: unknown, row: ParticipantRow) => row.sector || "Not configured" },
      { title: "Year", dataIndex: "year" },
      { title: "Status", dataIndex: "participant_status" },
    ]} pagination={{ current: page, pageSize: PAGE_SIZE, total: meta.pagination?.total_items || 0, onChange: setPage, showSizeChanger: false }} />
  </>;
};

const EmissionCeilingTradingTabs = () => <Tabs defaultActiveKey="series" items={[
  { key: "series", label: "Ceiling Series", children: <SeriesTable /> },
  { key: "transactions", label: "Market Transactions", children: <TransactionsTable /> },
  { key: "participants", label: "Participants & Facilities", children: <ParticipantsTable /> },
]} />;

export default EmissionCeilingTradingTabs;

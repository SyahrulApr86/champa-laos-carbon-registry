import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Empty, Input, Select, Space, Table, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { DonutBreakdown } from "./CarbonDashboard";
import { PublicEnvelope, readPublicEnvelope } from "./publicData";
import "./Dashboard.scss";

interface AdaptationSummary {
  totalProjects: number;
  bySector: Record<string, number>;
  byStage: Record<string, number>;
  sectorUnit: "records";
  stageUnit: "records";
}

interface AdaptationRow {
  adaptationId: string;
  title: string;
  sector: string;
  region: string | null;
  status: string;
}

const emptySummary: AdaptationSummary = {
  totalProjects: 0,
  bySector: {},
  byStage: {},
  sectorUnit: "records",
  stageUnit: "records",
};

const statusColor: Record<string, string> = {
  Approved: "green",
  UnderReview: "gold",
  Submitted: "gold",
  Rejected: "red",
};

const PAGE_SIZE = 10;

const AdaptationTab = () => {
  const navigate = useNavigate();
  const { get } = useConnection();
  const [summary, setSummary] = useState<AdaptationSummary>(emptySummary);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>();
  const [region, setRegion] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [rows, setRows] = useState<AdaptationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    get<PublicEnvelope<AdaptationSummary>>(API_PATHS.ADAPTATION_PUBLIC_SUMMARY)
      .then((response) => {
        setSummary(readPublicEnvelope<AdaptationSummary>(response).data ?? emptySummary);
      })
      .catch(() => setSummary(emptySummary));
  }, [get]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (query) params.set("q", query);
      if (sector) params.set("sector", sector);
      if (region) params.set("region", region);
      if (status) params.set("status", status);
      const response = await get<PublicEnvelope<AdaptationRow[]>>(`${API_PATHS.ADAPTATION_PUBLIC_SEARCH("", 1, PAGE_SIZE).split("?")[0]}?${params.toString()}`);
      const envelope = readPublicEnvelope<AdaptationRow[]>(response);
      setRows(envelope.data ?? []);
      setTotal(envelope.meta?.pagination?.total_items ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [get, page, query, region, sector, status]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const sectorData = useMemo(
    () => Object.entries(summary.bySector).map(([title, value]) => ({ title, value })),
    [summary.bySector]
  );
  const stageData = useMemo(
    () => Object.entries(summary.byStage).map(([title, value]) => ({ title, value })),
    [summary.byStage]
  );

  const columns = [
    { title: "Registration No.", dataIndex: "adaptationId", key: "adaptationId" },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: AdaptationRow) => (
        <a onClick={() => navigate(`/public/adaptation/${record.adaptationId}`)}>{title}</a>
      ),
    },
    { title: "Sector", dataIndex: "sector", key: "sector" },
    { title: "Region", dataIndex: "region", key: "region", render: (value: string | null) => value || "Not available" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <Tag color={statusColor[value] || "default"}>{value}</Tag>,
    },
    {
      title: "",
      key: "action",
      render: (_: unknown, record: AdaptationRow) => (
        <a onClick={() => navigate(`/public/adaptation/${record.adaptationId}`)}>See detail</a>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <Alert
        type="info"
        showIcon
        message="Synthetic demonstration data"
        description="Not official Lao PDR statistics or policy records. Scenario: Champa registry demonstration."
        style={{ marginBottom: "1rem" }}
      />
      <div className="donut-grid">
        <div className="donut-card">
          <h3 className="section-title">Adaptation Actions by Category</h3>
          <DonutBreakdown data={sectorData} totalLabel={`${summary.totalProjects.toLocaleString()} actions`} />
          <small>Unit: {summary.sectorUnit}</small>
        </div>
        <div className="donut-card">
          <h3 className="section-title">Adaptation Actions by Status</h3>
          <DonutBreakdown data={stageData} totalLabel={`${summary.totalProjects.toLocaleString()} actions`} />
          <small>Unit: {summary.stageUnit}</small>
        </div>
      </div>

      <div className="registry-table-section">
        <h3 className="section-title">Adaptation Action Registry</h3>
        <Space wrap style={{ marginBottom: "1rem" }}>
          <Input.Search
            placeholder="Search adaptation actions"
            allowClear
            onSearch={(value) => { setPage(1); setQuery(value); }}
            style={{ width: 280 }}
          />
          <Select allowClear placeholder="Category" value={sector} onChange={(value) => { setPage(1); setSector(value); }} options={Object.keys(summary.bySector).map((value) => ({ label: value, value }))} style={{ width: 200 }} />
          <Select allowClear placeholder="Status" value={status} onChange={(value) => { setPage(1); setStatus(value); }} options={Object.keys(summary.byStage).map((value) => ({ label: value, value }))} style={{ width: 160 }} />
          <Input placeholder="Region" value={region} onChange={(event) => setRegion(event.target.value || undefined)} onPressEnter={() => setPage(1)} style={{ width: 180 }} />
        </Space>
        {error && <Alert type="error" showIcon message="Adaptation actions could not be loaded." style={{ marginBottom: "1rem" }} />}
        {!loading && !error && rows.length === 0 ? (
          <Empty description="No adaptation actions match the selected filters." />
        ) : (
          <Table rowKey="adaptationId" columns={columns} dataSource={rows} loading={loading} pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: setPage }} scroll={{ x: 800 }} />
        )}
      </div>
    </div>
  );
};

export default AdaptationTab;

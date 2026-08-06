import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Empty, Input, Select, Space, Table, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { DonutBreakdown } from "./CarbonDashboard";
import { PublicEnvelope, readPublicEnvelope } from "./publicData";
import "./Dashboard.scss";

interface CommunityProgramSummary {
  totalPrograms: number;
  byCategory: Record<string, number>;
  byRegion: Record<string, number>;
  totalParticipants: number | null;
  categoryUnit: "records";
  participantUnit: "participants";
}

interface CommunityProgramRow {
  programId: string;
  name: string;
  region: string;
  category: string;
  participantCount: number | null;
  status: string;
  startYear: number;
}

const emptySummary: CommunityProgramSummary = {
  totalPrograms: 0,
  byCategory: {},
  byRegion: {},
  totalParticipants: null,
  categoryUnit: "records",
  participantUnit: "participants",
};

const statusColor: Record<string, string> = {
  Active: "green",
  Completed: "blue",
  Planned: "gold",
};

const PAGE_SIZE = 10;

const CommunityProgramTab = () => {
  const navigate = useNavigate();
  const { get } = useConnection();
  const [summary, setSummary] = useState<CommunityProgramSummary>(emptySummary);
  const [rows, setRows] = useState<CommunityProgramRow[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>();
  const [region, setRegion] = useState<string>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    get<PublicEnvelope<CommunityProgramSummary>>(API_PATHS.COMMUNITY_PROGRAM_PUBLIC_SUMMARY)
      .then((response) => {
        setSummary(readPublicEnvelope<CommunityProgramSummary>(response).data ?? emptySummary);
      })
      .catch(() => setSummary(emptySummary));
  }, [get]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (region) params.set("region", region);
      const response = await get<PublicEnvelope<CommunityProgramRow[]>>(`${API_PATHS.COMMUNITY_PROGRAM_PUBLIC_LIST}?${params.toString()}`);
      const envelope = readPublicEnvelope<CommunityProgramRow[]>(response);
      setRows(envelope.data ?? []);
      setTotal(envelope.meta?.pagination?.total_items ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, get, page, query, region]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const categoryData = useMemo(
    () => Object.entries(summary.byCategory).map(([title, value]) => ({ title, value })),
    [summary.byCategory]
  );
  const regionData = useMemo(
    () => Object.entries(summary.byRegion).map(([title, value]) => ({ title, value })),
    [summary.byRegion]
  );

  const columns = [
    { title: "Registration No.", dataIndex: "programId", key: "programId" },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: CommunityProgramRow) => (
        <a onClick={() => navigate(`/public/community/${record.programId}`)}>{name}</a>
      ),
    },
    { title: "Region", dataIndex: "region", key: "region" },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Participants",
      dataIndex: "participantCount",
      key: "participantCount",
      render: (value: number | null) => value == null ? "Not available" : value.toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag color={statusColor[status] || "default"}>{status}</Tag>,
    },
    { title: "Start Year", dataIndex: "startYear", key: "startYear" },
    {
      title: "",
      key: "action",
      render: (_: unknown, record: CommunityProgramRow) => (
        <a onClick={() => navigate(`/public/community/${record.programId}`)}>See detail</a>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <Alert
        type="info"
        showIcon
        message="Synthetic demonstration data"
        description="Not official Lao PDR statistics, legal authorisation, market activity, or certificate records. Scenario: Champa registry demonstration."
        style={{ marginBottom: "1rem" }}
      />
      <div className="donut-grid">
        <div className="donut-card">
          <h3 className="section-title">Community Actions by Category</h3>
          <DonutBreakdown data={categoryData} totalLabel={`${summary.totalPrograms.toLocaleString()} actions`} />
          <small>Unit: {summary.categoryUnit}</small>
        </div>
        <div className="donut-card">
          <h3 className="section-title">Community Actions by Region</h3>
          <DonutBreakdown data={regionData} totalLabel={`${summary.totalPrograms.toLocaleString()} actions`} />
          <small>Participants: {summary.totalParticipants == null ? "Not available" : summary.totalParticipants.toLocaleString()}</small>
        </div>
      </div>

      <div className="registry-table-section">
        <h3 className="section-title">Community Climate Actions Registry</h3>
        <Space wrap style={{ marginBottom: "1rem" }}>
          <Input.Search
            placeholder="Search community actions"
            allowClear
            onSearch={(value) => { setPage(1); setQuery(value); }}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="Category"
            value={category}
            onChange={(value) => { setPage(1); setCategory(value); }}
            options={Object.keys(summary.byCategory).map((value) => ({ label: value, value }))}
            style={{ width: 180 }}
          />
          <Select
            allowClear
            placeholder="Region"
            value={region}
            onChange={(value) => { setPage(1); setRegion(value); }}
            options={Object.keys(summary.byRegion).map((value) => ({ label: value, value }))}
            style={{ width: 180 }}
          />
        </Space>
        {error && <Alert type="error" showIcon message="Community actions could not be loaded." style={{ marginBottom: "1rem" }} />}
        {!loading && !error && rows.length === 0 ? (
          <Empty description="No community actions match the selected filters." />
        ) : (
          <Table
            rowKey="programId"
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: setPage }}
            scroll={{ x: 900 }}
          />
        )}
      </div>
    </div>
  );
};

export default CommunityProgramTab;

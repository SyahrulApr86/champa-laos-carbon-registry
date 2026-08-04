import React, { useCallback, useEffect, useState } from "react";
import { Input, Table, Tag } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { DonutBreakdown } from "./CarbonDashboard";
import "./Dashboard.scss";

interface RecognizedMitigationSummary {
  totalActions: number;
  byStatus: Record<string, number>;
  byProponentType: Record<string, number>;
}

const emptySummary: RecognizedMitigationSummary = {
  totalActions: 0,
  byStatus: {},
  byProponentType: {},
};

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

const statusColor: Record<string, string> = {
  Submitted: "gold",
  UnderReview: "blue",
  Recognized: "green",
  Rejected: "red",
};

const PAGE_SIZE = 10;

// Public tab for smaller-scale/community-level mitigation actions that
// are formally recognized by the DNA/Ministry without going through the
// full Programme certification track (registration, MRV, third-party
// validation/verification, credit issuance). Distinct from the main
// Mitigation project registry rendered by CarbonDashboard/RegistryTable
// above it. Mirrors the smaller-scale recognized-action registry
// Indonesia's SRN exposes as a separate child tab under Mitigation.
const RecognizedMitigationTab = () => {
  const { get } = useConnection();

  const [summary, setSummary] =
    useState<RecognizedMitigationSummary>(emptySummary);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<RecognizedMitigationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await get(
          API_PATHS.RECOGNIZED_MITIGATION_PUBLIC_SUMMARY
        );
        const data = response?.data as
          | Partial<RecognizedMitigationSummary>
          | undefined;
        setSummary({
          totalActions: data?.totalActions ?? 0,
          byStatus: data?.byStatus ?? {},
          byProponentType: data?.byProponentType ?? {},
        });
      } catch (error) {
        setSummary(emptySummary);
      }
    };

    fetchSummary();
  }, [get]);

  const fetchRows = useCallback(
    async (q: string, pageNum: number) => {
      setLoading(true);
      try {
        const response = await get(
          API_PATHS.RECOGNIZED_MITIGATION_PUBLIC_SEARCH(q, pageNum, PAGE_SIZE)
        );
        const data = response?.data as RecognizedMitigationRow[] | undefined;
        setRows(data ?? []);
        const rawTotal = response?.response?.data as
          | { total?: number }
          | undefined;
        setTotal(rawTotal?.total ?? 0);
      } catch (error) {
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  useEffect(() => {
    fetchRows(query, page);
  }, [fetchRows, query, page]);

  const proponentTypeData = Object.entries(summary.byProponentType)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({ value, title: type }));

  const statusEntries = Object.entries(summary.byStatus);

  const columns = [
    {
      title: "Registration No.",
      dataIndex: "referenceId",
      key: "referenceId",
    },
    {
      title: "Proponent",
      dataIndex: "proponentName",
      key: "proponentName",
    },
    {
      title: "Activity",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
    },
    {
      title: "Est. Reduction (tCO2e)",
      dataIndex: "estimatedReductionTco2e",
      key: "estimatedReductionTco2e",
      render: (value: number | null) =>
        value === null || value === undefined ? "—" : value.toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColor[status] || "default"}>{status}</Tag>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-label">Total Recognized Actions</div>
          <div className="kpi-card-value">{summary.totalActions}</div>
        </div>
        {statusEntries.map(([status, value]) => (
          <div className="kpi-card" key={status}>
            <div className="kpi-card-label">{status}</div>
            <div className="kpi-card-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="donut-grid">
        <div className="donut-card">
          <h3 className="section-title">Proponent Type Percentage</h3>
          <DonutBreakdown
            data={proponentTypeData}
            totalLabel="Recognized Actions"
          />
        </div>
      </div>

      <div className="registry-table-section">
        <h3 className="section-title">Recognized Mitigation Action Registry</h3>

        <Input.Search
          placeholder="Search recognized mitigation actions"
          allowClear
          onSearch={(value) => {
            setPage(1);
            setQuery(value);
          }}
          style={{ marginBottom: "1rem", maxWidth: 400 }}
        />

        <Table
          rowKey="referenceId"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            onChange: (nextPage) => setPage(nextPage),
          }}
        />
      </div>
    </div>
  );
};

export default RecognizedMitigationTab;

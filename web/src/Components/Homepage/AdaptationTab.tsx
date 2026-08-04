import React, { useCallback, useEffect, useState } from "react";
import { Input, Table, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { DonutBreakdown } from "./CarbonDashboard";
import "./Dashboard.scss";

interface AdaptationSummary {
  totalProjects: number;
  bySector: Record<string, number>;
  byStage: Record<string, number>;
}

const emptySummary: AdaptationSummary = {
  totalProjects: 0,
  bySector: {},
  byStage: {},
};

interface AdaptationRow {
  adaptationId: string;
  title: string;
  sector: string;
  region: string;
  status: string;
}

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
  const [rows, setRows] = useState<AdaptationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await get(API_PATHS.ADAPTATION_PUBLIC_SUMMARY);
        const data = response?.data as Partial<AdaptationSummary> | undefined;
        setSummary({
          totalProjects: data?.totalProjects ?? 0,
          bySector: data?.bySector ?? {},
          byStage: data?.byStage ?? {},
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
          API_PATHS.ADAPTATION_PUBLIC_SEARCH(q, pageNum, PAGE_SIZE)
        );
        const data = response?.data as AdaptationRow[] | undefined;
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

  const sectorData = Object.entries(summary.bySector)
    .filter(([, value]) => value > 0)
    .map(([sector, value]) => ({ value, title: sector }));

  const stageData = Object.entries(summary.byStage).map(([stage, value]) => ({
    value,
    title: stage,
  }));

  const columns = [
    {
      title: "Registration No.",
      dataIndex: "adaptationId",
      key: "adaptationId",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: AdaptationRow) => (
        <a onClick={() => navigate(`/public/adaptation/${record.adaptationId}`)}>
          {title}
        </a>
      ),
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColor[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "",
      key: "action",
      render: (_: unknown, record: AdaptationRow) => (
        <a onClick={() => navigate(`/public/adaptation/${record.adaptationId}`)}>
          See detail
        </a>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="donut-grid">
        <div className="donut-card">
          <h3 className="section-title">Adaptation Projects by Sector</h3>
          <DonutBreakdown data={sectorData} totalLabel="Total Projects" />
        </div>

        <div className="donut-card">
          <h3 className="section-title">Adaptation Projects by Stage</h3>
          <DonutBreakdown data={stageData} totalLabel="Total Projects" />
        </div>
      </div>

      <div className="registry-table-section">
        <h3 className="section-title">Adaptation Project Registry</h3>

        <Input.Search
          placeholder="Search adaptation projects"
          allowClear
          onSearch={(value) => {
            setPage(1);
            setQuery(value);
          }}
          style={{ marginBottom: "1rem", maxWidth: 400 }}
        />

        <Table
          rowKey="adaptationId"
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

export default AdaptationTab;

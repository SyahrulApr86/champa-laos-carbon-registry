import React, { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { DonutBreakdown } from "./CarbonDashboard";
import "./Dashboard.scss";

interface CommunityProgramSummary {
  totalPrograms: number;
  byCategory: Record<string, number>;
  byRegion: Record<string, number>;
  totalParticipants: number;
}

const emptySummary: CommunityProgramSummary = {
  totalPrograms: 0,
  byCategory: {},
  byRegion: {},
  totalParticipants: 0,
};

interface CommunityProgramRow {
  programId: string;
  name: string;
  region: string;
  category: string;
  participantCount?: number;
  status: string;
  startYear: number;
}

const statusColor: Record<string, string> = {
  Active: "green",
  Completed: "blue",
  Planned: "gold",
};

// Public tab for community-level climate resilience/action initiatives
// (village/community adaptation & mitigation programs), distinct from the
// project-level Adaptation registry which tracks individual carbon-credit
// projects. Discovery of the authenticated submission form is via the
// sidebar "Climate Programs" submenu only - no CTA here.
const CommunityProgramTab = () => {
  const { get } = useConnection();

  const [summary, setSummary] = useState<CommunityProgramSummary>(emptySummary);
  const [rows, setRows] = useState<CommunityProgramRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await get(API_PATHS.COMMUNITY_PROGRAM_PUBLIC_SUMMARY);
        const data = response?.data as
          | Partial<CommunityProgramSummary>
          | undefined;
        setSummary({
          totalPrograms: data?.totalPrograms ?? 0,
          byCategory: data?.byCategory ?? {},
          byRegion: data?.byRegion ?? {},
          totalParticipants: data?.totalParticipants ?? 0,
        });
      } catch (error) {
        setSummary(emptySummary);
      }
    };

    fetchSummary();
  }, [get]);

  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true);
      try {
        const response = await get(API_PATHS.COMMUNITY_PROGRAM_PUBLIC_LIST);
        const data = response?.data as CommunityProgramRow[] | undefined;
        setRows(data ?? []);
      } catch (error) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, [get]);

  const categoryData = Object.entries(summary.byCategory)
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({ value, title: category }));

  const regionData = Object.entries(summary.byRegion)
    .filter(([, value]) => value > 0)
    .map(([region, value]) => ({ value, title: region }));

  const columns = [
    {
      title: "Registration No.",
      dataIndex: "programId",
      key: "programId",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Participants",
      dataIndex: "participantCount",
      key: "participantCount",
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
      title: "Start Year",
      dataIndex: "startYear",
      key: "startYear",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="donut-grid">
        <div className="donut-card">
          <h3 className="section-title">Community Programs by Category</h3>
          <DonutBreakdown data={categoryData} totalLabel="Total Programs" />
        </div>

        <div className="donut-card">
          <h3 className="section-title">Community Programs by Region</h3>
          <DonutBreakdown data={regionData} totalLabel="Total Programs" />
        </div>
      </div>

      <div className="registry-table-section">
        <h3 className="section-title">Community Climate Program Registry</h3>

        <Table
          rowKey="programId"
          columns={columns}
          dataSource={rows}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CommunityProgramTab;

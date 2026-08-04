import React, { useCallback, useEffect, useState } from "react";
import { Button, Descriptions, Input, Modal, Table, Tag } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { DonutBreakdown } from "./CarbonDashboard";
import "./Dashboard.scss";

interface ClimateFinanceSummary {
  totalAmountLAK: number;
  totalAmountUSD: number;
  bySector: Record<string, number>;
  byChannel: Record<string, { amount: number; percentage: number }>;
}


interface ClimateFinanceRow {
  title: string;
  description: string;
  channel: string;
  recipientEntity: string;
  implementingEntity: string;
  dateSigned: number;
  dateClosing: number | null;
  amountLAK: number | null;
  amountUSD: number | null;
  sector: string;
  financialInstrument: string;
  status: string;
  type: string;
}

interface TechnologyTransferRow {
  id: number;
  title: string;
  description: string;
  technologyType: string;
  timeframe: string | null;
  recipientEntity: string;
  implementingEntity: string;
  type: string;
  sector: string;
  subsector: string | null;
  status: string;
  impactEstimatedResult: string | null;
  additionalInformation: string | null;
}

interface CapacityBuildingRow {
  id: number;
  title: string;
  description: string;
  timeframe: string | null;
  recipientEntity: string;
  implementingEntity: string;
  type: string;
  sector: string;
  subsector: string | null;
  status: string;
  impactEstimatedResult: string | null;
  additionalInformation: string | null;
}

const emptyFinanceSummary: ClimateFinanceSummary = {
  totalAmountLAK: 0,
  totalAmountUSD: 0,
  bySector: {},
  byChannel: {},
};


const statusColor: Record<string, string> = {
  "Fully Disbursed": "green",
  Ongoing: "blue",
  Closed: "default",
};

const supportStatusColor: Record<string, string> = {
  Completed: "green",
  "On-Going": "blue",
  Terminated: "red",
};

const PAGE_SIZE = 10;

const ResourcesTab = () => {
  const { get } = useConnection();
  const [financeSummary, setFinanceSummary] = useState<ClimateFinanceSummary>(
    emptyFinanceSummary
  );

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ClimateFinanceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [technologyTransferRows, setTechnologyTransferRows] = useState<
    TechnologyTransferRow[]
  >([]);
  const [technologyTransferLoading, setTechnologyTransferLoading] =
    useState(false);
  const [selectedTechnologyTransfer, setSelectedTechnologyTransfer] =
    useState<TechnologyTransferRow | null>(null);

  const [capacityBuildingRows, setCapacityBuildingRows] = useState<
    CapacityBuildingRow[]
  >([]);
  const [capacityBuildingLoading, setCapacityBuildingLoading] =
    useState(false);
  const [selectedCapacityBuilding, setSelectedCapacityBuilding] =
    useState<CapacityBuildingRow | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const financeResponse = await get<ClimateFinanceSummary>(
          API_PATHS.CLIMATE_FINANCE_PUBLIC_SUMMARY
        );
        setFinanceSummary({
          totalAmountLAK: financeResponse?.data?.totalAmountLAK ?? 0,
          totalAmountUSD: financeResponse?.data?.totalAmountUSD ?? 0,
          bySector: financeResponse?.data?.bySector ?? {},
          byChannel: financeResponse?.data?.byChannel ?? {},
        });
      } catch (error) {
        console.log("Error fetching climate finance public summary", error);
      }

    };

    fetchSummaries();
  }, [get]);

  const fetchRows = useCallback(
    async (q: string, pageNum: number) => {
      setLoading(true);
      try {
        const response = await get<ClimateFinanceRow[]>(
          API_PATHS.CLIMATE_FINANCE_PUBLIC_SEARCH(q, pageNum, PAGE_SIZE)
        );
        setRows(response?.data ?? []);
        setTotal(response?.response?.data?.total ?? 0);
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

  useEffect(() => {
    const fetchTechnologyTransfer = async () => {
      setTechnologyTransferLoading(true);
      try {
        const response = await get<TechnologyTransferRow[]>(
          API_PATHS.TECHNOLOGY_TRANSFER_PUBLIC_LIST
        );
        setTechnologyTransferRows(response?.data ?? []);
      } catch (error) {
        setTechnologyTransferRows([]);
      } finally {
        setTechnologyTransferLoading(false);
      }
    };

    fetchTechnologyTransfer();
  }, [get]);

  useEffect(() => {
    const fetchCapacityBuilding = async () => {
      setCapacityBuildingLoading(true);
      try {
        const response = await get<CapacityBuildingRow[]>(
          API_PATHS.CAPACITY_BUILDING_PUBLIC_LIST
        );
        setCapacityBuildingRows(response?.data ?? []);
      } catch (error) {
        setCapacityBuildingRows([]);
      } finally {
        setCapacityBuildingLoading(false);
      }
    };

    fetchCapacityBuilding();
  }, [get]);

  const sectorData = Object.entries(financeSummary.bySector)
    .filter(([, value]) => value > 0)
    .map(([sector, value]) => ({ title: sector, value }));

  const channelData = Object.entries(financeSummary.byChannel)
    .filter(([, value]) => value.amount > 0)
    .map(([channel, value]) => ({ title: channel, value: value.amount }));

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Recipient",
      dataIndex: "recipientEntity",
      key: "recipientEntity",
    },
    {
      title: "Implementing Entity",
      dataIndex: "implementingEntity",
      key: "implementingEntity",
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
    },
    {
      title: "Channel",
      dataIndex: "channel",
      key: "channel",
    },
    {
      title: "Amount (LAK)",
      dataIndex: "amountLAK",
      key: "amountLAK",
      render: (amountLAK: number | null) =>
        amountLAK != null ? amountLAK.toLocaleString() : "-",
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

  const technologyTransferColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Technology Type",
      dataIndex: "technologyType",
      key: "technologyType",
    },
    {
      title: "Recipient",
      dataIndex: "recipientEntity",
      key: "recipientEntity",
    },
    {
      title: "Implementing Entity",
      dataIndex: "implementingEntity",
      key: "implementingEntity",
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={supportStatusColor[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "",
      key: "detail",
      render: (_: unknown, record: TechnologyTransferRow) => (
        <Button size="small" onClick={() => setSelectedTechnologyTransfer(record)}>
          Detail
        </Button>
      ),
    },
  ];

  const capacityBuildingColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Recipient",
      dataIndex: "recipientEntity",
      key: "recipientEntity",
    },
    {
      title: "Implementing Entity",
      dataIndex: "implementingEntity",
      key: "implementingEntity",
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={supportStatusColor[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "",
      key: "detail",
      render: (_: unknown, record: CapacityBuildingRow) => (
        <Button size="small" onClick={() => setSelectedCapacityBuilding(record)}>
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <section className="section">
        <h3 className="section-title">Climate Finance</h3>
        <div className="donut-grid">
          <div className="donut-card">
            <div className="main-statistic">
              <div className="statistic-value">
                {financeSummary.totalAmountLAK.toLocaleString()}
              </div>
              <div className="statistic-title">Total Finance (LAK)</div>
            </div>
          </div>
          <div className="donut-card">
            <div className="main-statistic">
              <div className="statistic-value">
                {financeSummary.totalAmountUSD.toLocaleString()}
              </div>
              <div className="statistic-title">Total Finance (USD)</div>
            </div>
          </div>
        </div>
        <div className="donut-grid">
          <div className="donut-card">
            <h4 className="section-title">By Sector</h4>
            <DonutBreakdown data={sectorData} totalLabel="Total LAK" />
          </div>
          <div className="donut-card">
            <h4 className="section-title">By Channel</h4>
            <DonutBreakdown data={channelData} totalLabel="Total LAK" />
          </div>
        </div>
      </section>

      <div className="registry-table-section">
        <h3 className="section-title">Browse Climate Finance Entries</h3>
        <Input.Search
          allowClear
          size="large"
          placeholder="Search climate finance entries"
          onSearch={(value) => {
            setPage(1);
            setQuery(value.trim());
          }}
          className="registry-table-search"
        />
        <Table
          className="registry-table"
          rowKey="title"
          columns={columns}
          dataSource={rows}
          loading={loading}
          locale={{
            emptyText: query
              ? "No matching climate finance entries found."
              : "No climate finance entries recorded yet.",
          }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            onChange: (nextPage) => setPage(nextPage),
          }}
        />
      </div>

      <div className="registry-table-section">
        <h3 className="section-title">
          Technology Development &amp; Transfer Support Received
        </h3>
        <Table
          className="registry-table"
          rowKey="id"
          columns={technologyTransferColumns}
          dataSource={technologyTransferRows}
          loading={technologyTransferLoading}
          locale={{
            emptyText: "No technology transfer entries recorded yet.",
          }}
        />
      </div>
      <Modal
        title={selectedTechnologyTransfer?.title}
        open={!!selectedTechnologyTransfer}
        onCancel={() => setSelectedTechnologyTransfer(null)}
        footer={null}
      >
        {selectedTechnologyTransfer && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Description">
              {selectedTechnologyTransfer.description}
            </Descriptions.Item>
            <Descriptions.Item label="Technology Type">
              {selectedTechnologyTransfer.technologyType}
            </Descriptions.Item>
            <Descriptions.Item label="Timeframe">
              {selectedTechnologyTransfer.timeframe || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Recipient Entity">
              {selectedTechnologyTransfer.recipientEntity}
            </Descriptions.Item>
            <Descriptions.Item label="Implementing Entity">
              {selectedTechnologyTransfer.implementingEntity}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {selectedTechnologyTransfer.type}
            </Descriptions.Item>
            <Descriptions.Item label="Sector">
              {selectedTechnologyTransfer.sector}
            </Descriptions.Item>
            <Descriptions.Item label="Subsector">
              {selectedTechnologyTransfer.subsector || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={
                  supportStatusColor[selectedTechnologyTransfer.status] ||
                  "default"
                }
              >
                {selectedTechnologyTransfer.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Impact / Estimated Result">
              {selectedTechnologyTransfer.impactEstimatedResult || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Additional Information">
              {selectedTechnologyTransfer.additionalInformation || "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <div className="registry-table-section">
        <h3 className="section-title">Capacity Building Support Received</h3>
        <Table
          className="registry-table"
          rowKey="id"
          columns={capacityBuildingColumns}
          dataSource={capacityBuildingRows}
          loading={capacityBuildingLoading}
          locale={{
            emptyText: "No capacity building entries recorded yet.",
          }}
        />
      </div>
      <Modal
        title={selectedCapacityBuilding?.title}
        open={!!selectedCapacityBuilding}
        onCancel={() => setSelectedCapacityBuilding(null)}
        footer={null}
      >
        {selectedCapacityBuilding && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Description">
              {selectedCapacityBuilding.description}
            </Descriptions.Item>
            <Descriptions.Item label="Timeframe">
              {selectedCapacityBuilding.timeframe || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Recipient Entity">
              {selectedCapacityBuilding.recipientEntity}
            </Descriptions.Item>
            <Descriptions.Item label="Implementing Entity">
              {selectedCapacityBuilding.implementingEntity}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {selectedCapacityBuilding.type}
            </Descriptions.Item>
            <Descriptions.Item label="Sector">
              {selectedCapacityBuilding.sector}
            </Descriptions.Item>
            <Descriptions.Item label="Subsector">
              {selectedCapacityBuilding.subsector || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={
                  supportStatusColor[selectedCapacityBuilding.status] ||
                  "default"
                }
              >
                {selectedCapacityBuilding.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Impact / Estimated Result">
              {selectedCapacityBuilding.impactEstimatedResult || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Additional Information">
              {selectedCapacityBuilding.additionalInformation || "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ResourcesTab;

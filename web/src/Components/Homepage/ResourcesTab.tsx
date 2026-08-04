import React, { useCallback, useEffect, useState } from "react";
import { Button, Input, Table, Tag } from "antd";
import { Link } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { ROUTES } from "../../Config/uiRoutingConfig";
import { DonutBreakdown } from "./CarbonDashboard";
import "./Dashboard.scss";

interface ClimateFinanceSummary {
  totalAmountLAK: number;
  totalAmountUSD: number;
  bySector: Record<string, number>;
  byChannel: Record<string, { amount: number; percentage: number }>;
}

interface EmissionTradingSummary {
  year: number | null;
  ceiling: { totalUnits: number; companies: number };
  trading: { totalUnits: number; totalValueLAK: number; companies: number };
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

const emptyFinanceSummary: ClimateFinanceSummary = {
  totalAmountLAK: 0,
  totalAmountUSD: 0,
  bySector: {},
  byChannel: {},
};

const emptyTradingSummary: EmissionTradingSummary = {
  year: null,
  ceiling: { totalUnits: 0, companies: 0 },
  trading: { totalUnits: 0, totalValueLAK: 0, companies: 0 },
};

const statusColor: Record<string, string> = {
  "Fully Disbursed": "green",
  Ongoing: "blue",
  Closed: "default",
};

const PAGE_SIZE = 10;

const ResourcesTab = () => {
  const { get } = useConnection();
  const [financeSummary, setFinanceSummary] = useState<ClimateFinanceSummary>(
    emptyFinanceSummary
  );
  const [tradingSummary, setTradingSummary] = useState<EmissionTradingSummary>(
    emptyTradingSummary
  );

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ClimateFinanceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

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

      try {
        const tradingResponse = await get<EmissionTradingSummary>(
          API_PATHS.EMISSION_TRADING_PUBLIC_SUMMARY()
        );
        setTradingSummary({
          year: tradingResponse?.data?.year ?? null,
          ceiling: {
            totalUnits: tradingResponse?.data?.ceiling?.totalUnits ?? 0,
            companies: tradingResponse?.data?.ceiling?.companies ?? 0,
          },
          trading: {
            totalUnits: tradingResponse?.data?.trading?.totalUnits ?? 0,
            totalValueLAK: tradingResponse?.data?.trading?.totalValueLAK ?? 0,
            companies: tradingResponse?.data?.trading?.companies ?? 0,
          },
        });
      } catch (error) {
        console.log("Error fetching emission trading public summary", error);
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

  return (
    <div className="dashboard-container">
      <section className="section">
        <h3 className="section-title">Emission Ceiling &amp; Trading</h3>
        <p className="registry-table-subtitle">
          Prototype module — emission ceiling and trading data, not tied to a
          specific real-world regulation.
        </p>
        <div className="donut-grid">
          <div className="donut-card">
            <div className="main-statistic">
              <div className="statistic-value">
                {tradingSummary.ceiling.totalUnits.toLocaleString()}
              </div>
              <div className="statistic-title">Total Ceiling Units</div>
            </div>
          </div>
          <div className="donut-card">
            <div className="main-statistic">
              <div className="statistic-value">
                {tradingSummary.ceiling.companies}
              </div>
              <div className="statistic-title">
                Companies with Allocated Ceiling
              </div>
            </div>
          </div>
          <div className="donut-card">
            <div className="main-statistic">
              <div className="statistic-value">
                {tradingSummary.trading.totalUnits.toLocaleString()}
              </div>
              <div className="statistic-title">Total Units Traded</div>
            </div>
          </div>
        </div>
        <Link to={ROUTES.EMISSION_TRADING_SUBMIT}>
          <Button type="primary">Record Ceiling/Trading Entry</Button>
        </Link>
      </section>

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
        <Link to={ROUTES.CLIMATE_FINANCE_SUBMIT}>
          <Button type="primary">Record a Climate Finance Entry</Button>
        </Link>
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
    </div>
  );
};

export default ResourcesTab;

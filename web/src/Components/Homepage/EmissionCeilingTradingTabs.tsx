import React, { useCallback, useEffect, useState } from "react";
import { Table, Tabs } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";

// Emission ceiling/trading sub-tabs: Series / Carbon Exchange Transactions /
// Participants. Each tab is backed by a real, paginated public endpoint -
// see EmissionTradingService.publicSeries / publicTransactions /
// publicParticipants.

interface SeriesRow {
  seriesName: string;
  year: number;
  units: number;
  companies: number;
  availableForExchange: null;
}

interface TransactionRow {
  id: number;
  date: number;
  sellerCompanyName: string;
  buyerCompanyName: string;
  units: number;
  valueLAK: number;
}

interface ParticipantRow {
  id: number;
  facilityName: string;
  companyName: string;
  capacityDescription: string;
  year: number;
}

const PAGE_SIZE = 10;

const formatNumber = (n: number) => n.toLocaleString("en-US");

const formatDate = (ms: number) =>
  ms ? new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-";

const formatLAK = (n: number) =>
  n ? `LAK ${n.toLocaleString("en-US")}` : "-";

// Generic paginated fetch: our endpoints all return { data, total }, and
// useConnection's get() resolves `.data` to the rows array while
// `.response.data.total` carries the total row count.
function usePaginatedList<T>(pathBuilder: (page: number, pageSize: number) => string) {
  const { get } = useConnection();
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const response = await get(pathBuilder(pageNum, PAGE_SIZE));
        const data = response?.data as T[] | undefined;
        setRows(data ?? []);
        const rawTotal = response?.response?.data as { total?: number } | undefined;
        setTotal(rawTotal?.total ?? 0);
      } catch (error) {
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [get, pathBuilder]
  );

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  return { rows, total, page, setPage, loading };
}

const SeriesTable = () => {
  const { rows, total, page, setPage, loading } = usePaginatedList<SeriesRow>(
    API_PATHS.EMISSION_TRADING_PUBLIC_SERIES
  );

  const columns = [
    { title: "Ceiling Series", dataIndex: "seriesName", key: "seriesName" },
    { title: "Emission Year", dataIndex: "year", key: "year" },
    {
      title: "Amount",
      dataIndex: "units",
      key: "units",
      render: (units: number) => formatNumber(units),
    },
    {
      title: "Available Carbon Exchange",
      dataIndex: "availableForExchange",
      key: "availableForExchange",
      // Champa's ceiling model has no sub-allocation reserved for exchange -
      // honestly rendered as "-", matching SRN's own live data for this
      // column.
      render: () => "-",
    },
  ];

  return (
    <Table
      rowKey={(row: SeriesRow) => `${row.seriesName}-${row.year}`}
      columns={columns}
      dataSource={rows}
      loading={loading}
      locale={{ emptyText: "No emission ceiling series recorded yet." }}
      pagination={{
        current: page,
        pageSize: PAGE_SIZE,
        total,
        onChange: (nextPage) => setPage(nextPage),
      }}
    />
  );
};

const TransactionsTable = () => {
  const { rows, total, page, setPage, loading } = usePaginatedList<TransactionRow>(
    API_PATHS.EMISSION_TRADING_PUBLIC_TRANSACTIONS
  );

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: number) => formatDate(date),
    },
    { title: "Seller Company", dataIndex: "sellerCompanyName", key: "sellerCompanyName" },
    { title: "Buyer Company", dataIndex: "buyerCompanyName", key: "buyerCompanyName" },
    {
      title: "Transaction Amount",
      dataIndex: "units",
      key: "units",
      render: (units: number) => formatNumber(units),
    },
    {
      title: "Transaction Value",
      dataIndex: "valueLAK",
      key: "valueLAK",
      render: (valueLAK: number) => formatLAK(valueLAK),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={loading}
      locale={{ emptyText: "No carbon exchange transactions recorded yet." }}
      pagination={{
        current: page,
        pageSize: PAGE_SIZE,
        total,
        onChange: (nextPage) => setPage(nextPage),
      }}
    />
  );
};

const ParticipantsTable = () => {
  const { rows, total, page, setPage, loading } = usePaginatedList<ParticipantRow>(
    API_PATHS.EMISSION_TRADING_PUBLIC_PARTICIPANTS
  );

  const columns = [
    { title: "Power Unit / Facility Name", dataIndex: "facilityName", key: "facilityName" },
    { title: "Company Name", dataIndex: "companyName", key: "companyName" },
    { title: "Power Capacity", dataIndex: "capacityDescription", key: "capacityDescription" },
    { title: "Year", dataIndex: "year", key: "year" },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={loading}
      locale={{ emptyText: "No participating facilities recorded yet." }}
      pagination={{
        current: page,
        pageSize: PAGE_SIZE,
        total,
        onChange: (nextPage) => setPage(nextPage),
      }}
    />
  );
};

const EmissionCeilingTradingTabs = () => {
  return (
    <Tabs
      defaultActiveKey="series"
      items={[
        { key: "series", label: "Ceiling Series", children: <SeriesTable /> },
        {
          key: "transactions",
          label: "Carbon Exchange Transactions",
          children: <TransactionsTable />,
        },
        { key: "participants", label: "Participants", children: <ParticipantsTable /> },
      ]}
    />
  );
};

export default EmissionCeilingTradingTabs;

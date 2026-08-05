import React, { useCallback, useEffect, useState } from "react";
import { Input, Table, Tag } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./Dashboard.scss";

interface CertificateRow {
  accountHolder: string | null;
  activity: string;
  sector: string;
  registryNo: string;
  startVintage: number | null;
  endVintage: number | null;
  status: string;
  issuedUnits: number;
  availableUnits: number;
  retiredUnits: number;
  cancelledUnits: number;
  assignedToExchangeUnits: number;
  issuedDate: string | null;
}

const statusColor: Record<string, string> = {
  Active: "green",
  Retired: "gold",
  Cancelled: "red",
  "Assigned to Exchange": "blue",
};

const PAGE_SIZE = 10;

// GHG Emission Reduction Certificate (SPE) registry equivalent - lists
// individual programme credit-issuance records rather than the aggregate
// KPI cards above. Sourced from real Programme credit-issuance fields, not
// a fabricated table.
const CertificateRegistryTable = () => {
  const { get } = useConnection();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(
    async (q: string, pageNum: number) => {
      setLoading(true);
      try {
        const response = await get<CertificateRow[]>(
          API_PATHS.PUBLIC_CERTIFICATES(q, pageNum, PAGE_SIZE)
        );
        setRows(response?.data ?? []);
        setTotal(response?.response?.data?.total ?? 0);
      } catch {
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

  const formatUnits = (value: number) =>
    (value ?? 0).toLocaleString("en-US");

  const columns = [
    {
      title: "Account Holder",
      dataIndex: "accountHolder",
      key: "accountHolder",
      render: (value: string | null) => value ?? "-",
    },
    {
      title: "Activity",
      dataIndex: "activity",
      key: "activity",
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
    },
    {
      title: "Registry No",
      dataIndex: "registryNo",
      key: "registryNo",
    },
    {
      title: "Start Vintage",
      dataIndex: "startVintage",
      key: "startVintage",
      render: (value: number | null) => value ?? "-",
    },
    {
      title: "End Vintage",
      dataIndex: "endVintage",
      key: "endVintage",
      render: (value: number | null) => value ?? "-",
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
      title: "Issued Units",
      dataIndex: "issuedUnits",
      key: "issuedUnits",
      render: formatUnits,
    },
    {
      title: "Available Units",
      dataIndex: "availableUnits",
      key: "availableUnits",
      render: formatUnits,
    },
    {
      title: "Retired Units",
      dataIndex: "retiredUnits",
      key: "retiredUnits",
      render: formatUnits,
    },
    {
      title: "Cancelled Units",
      dataIndex: "cancelledUnits",
      key: "cancelledUnits",
      render: formatUnits,
    },
    {
      title: "Assigned to Exchange",
      dataIndex: "assignedToExchangeUnits",
      key: "assignedToExchangeUnits",
      render: formatUnits,
    },
    {
      title: "Issued Date",
      dataIndex: "issuedDate",
      key: "issuedDate",
      render: (value: string | null) => value ?? "-",
    },
  ];

  return (
    <div className="dashboard-container registry-table-section">
      <h3 className="section-title">Emission Reduction Certificates</h3>
      <p className="registry-table-subtitle">
        GHG Emission Reduction Certificates (SPE) issued against authorised
        programmes in the National Registry System.
      </p>
      <Input.Search
        allowClear
        size="large"
        placeholder="Search by account holder, registry number, etc."
        onSearch={(value) => {
          setPage(1);
          setQuery(value.trim());
        }}
        className="registry-table-search"
      />
      <Table
        className="registry-table"
        rowKey="registryNo"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: true }}
        locale={{
          emptyText: query
            ? "No certificates match your search."
            : "No emission reduction certificates have been issued yet.",
        }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: (nextPage) => setPage(nextPage),
        }}
      />
    </div>
  );
};

export default CertificateRegistryTable;

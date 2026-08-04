import React, { useCallback, useEffect, useState } from "react";
import { Input, Table } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";

interface ExpertRow {
  id: number;
  name: string;
  affiliation: string;
  expertise: string;
  certification: string | null;
  yearsOfExperience: number | null;
  province: string;
}

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Affiliation",
    dataIndex: "affiliation",
    key: "affiliation",
  },
  {
    title: "Expertise",
    dataIndex: "expertise",
    key: "expertise",
  },
  {
    title: "Certification",
    dataIndex: "certification",
    key: "certification",
    render: (certification: string | null) => certification || "-",
  },
  {
    title: "Years of Experience",
    dataIndex: "yearsOfExperience",
    key: "yearsOfExperience",
    render: (years: number | null) => (years ?? "-").toString(),
  },
  {
    title: "Province",
    dataIndex: "province",
    key: "province",
  },
];

const PAGE_SIZE = 10;

// Public, searchable directory of accredited technical experts, backed by
// real Expert records registered by DNA/Ministry. Mirrors SRN Indonesia's
// Instruments > Roster of Expert search-and-paginate table.
const RosterOfExpertList = () => {
  const { get } = useConnection();

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ExpertRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(
    async (q: string, pageNum: number) => {
      setLoading(true);
      try {
        const response = await get(
          API_PATHS.EXPERT_PUBLIC_LIST(q, pageNum, PAGE_SIZE)
        );
        const data = response?.data as ExpertRow[] | undefined;
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

  if (!loading && rows.length === 0 && !query) {
    return <p>No accredited experts registered yet.</p>;
  }

  return (
    <div>
      <Input.Search
        placeholder="Search by name or institution"
        allowClear
        onSearch={(value) => {
          setPage(1);
          setQuery(value);
        }}
        style={{ marginBottom: "1rem", maxWidth: 400 }}
      />
      <Table
        rowKey="id"
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
  );
};

export default RosterOfExpertList;

import React, { useCallback, useEffect, useState } from "react";
import { Input, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./Dashboard.scss";

interface RegistryRow {
  registrationNumber: string;
  title: string;
  sector: string;
  status: string;
  proponent: string;
}

const statusColor: Record<string, string> = {
  Registered: "green",
  "Under Review": "gold",
};

const PAGE_SIZE = 10;

const RegistryTable = () => {
  const { t } = useTranslation(["homepage"]);
  const { get } = useConnection();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(
    async (q: string, pageNum: number) => {
      setLoading(true);
      try {
        const response: any = await get(
          API_PATHS.PUBLIC_PROJECT_SEARCH(q, pageNum, PAGE_SIZE)
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

  const columns = [
    {
      title: t("homepage:colRegistrationNumber"),
      dataIndex: "registrationNumber",
      key: "registrationNumber",
    },
    {
      title: t("homepage:colTitle"),
      dataIndex: "title",
      key: "title",
    },
    {
      title: t("homepage:colSector"),
      dataIndex: "sector",
      key: "sector",
    },
    {
      title: t("homepage:colProponent"),
      dataIndex: "proponent",
      key: "proponent",
    },
    {
      title: t("homepage:colStatus"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColor[status] || "default"}>{status}</Tag>
      ),
    },
  ];

  return (
    <div className="dashboard-container registry-table-section">
      <h3 className="section-title">{t("homepage:registryTableTitle")}</h3>
      <p className="registry-table-subtitle">
        {t("homepage:registryTableSubtitle")}
      </p>
      <Input.Search
        allowClear
        size="large"
        placeholder={t("homepage:registrySearchPlaceholder")}
        onSearch={(value) => {
          setPage(1);
          setQuery(value.trim());
        }}
        className="registry-table-search"
      />
      <Table
        className="registry-table"
        rowKey="registrationNumber"
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{
          emptyText: query
            ? t("homepage:registryTableNoResults")
            : t("homepage:registryTableEmpty"),
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

export default RegistryTable;

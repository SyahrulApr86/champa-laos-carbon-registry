import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Empty, Input, Select, Table, Tag } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import PublicDisclosure from "../../Components/PublicDisclosure/PublicDisclosure";

interface ExpertRow {
  id: number;
  name: string;
  affiliation: string;
  expertise: string;
  certification: string | null;
  yearsOfExperience: number | null;
  province: string;
  publicationStatus?: string | null;
}

interface ExpertResponse {
  data?: ExpertRow[];
  total?: number;
}

const unwrap = (response: any): ExpertResponse => {
  const payload = response?.data ?? response;
  return Array.isArray(payload) ? { data: payload, total: payload.length } : payload ?? {};
};

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const downloadCsv = (rows: ExpertRow[]) => {
  const header = ["Name", "Affiliation", "Expertise", "Certification", "Years of Experience", "Province"];
  const body = rows.map((row) => [
    row.name,
    row.affiliation,
    row.expertise,
    row.certification,
    row.yearsOfExperience,
    row.province,
  ]);
  const blob = new Blob([[header, ...body].map((line) => line.map(csvCell).join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "champa-expert-roster-demo.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};

const RosterOfExpertList = () => {
  const { get } = useConnection();
  const { t } = useTranslation(["instruments"]);
  const [query, setQuery] = useState("");
  const [certification, setCertification] = useState<string>();
  const [province, setProvince] = useState<string>();
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [rows, setRows] = useState<ExpertRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        search: query,
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (certification) params.set("certification", certification);
      if (province) params.set("province", province);
      const response = await get(`national/expert/public/list?${params.toString()}`);
      const payload = unwrap(response);
      setRows(payload.data ?? []);
      setTotal(payload.total ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [certification, get, page, pageSize, province, query, sortBy, sortOrder]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const columns = [
    { title: t("name", { defaultValue: "Name" }), dataIndex: "name", key: "name" },
    { title: t("affiliation", { defaultValue: "Affiliation" }), dataIndex: "affiliation", key: "affiliation" },
    { title: t("expertise", { defaultValue: "Expertise" }), dataIndex: "expertise", key: "expertise" },
    {
      title: t("certification", { defaultValue: "Certification" }),
      dataIndex: "certification",
      key: "certification",
      render: (value: string | null) => value || <Tag>{t("notAvailable", { defaultValue: "Not available" })}</Tag>,
    },
    {
      title: t("experience", { defaultValue: "Experience (years)" }),
      dataIndex: "yearsOfExperience",
      key: "yearsOfExperience",
      render: (value: number | null) => value ?? <Tag>{t("notAvailable", { defaultValue: "Not available" })}</Tag>,
    },
    { title: t("province", { defaultValue: "Province" }), dataIndex: "province", key: "province" },
  ];

  return (
    <div className="expert-directory">
      <PublicDisclosure />
      {error && (
        <Alert
          type="error"
          showIcon
          message={t("directoryError", { defaultValue: "Directory unavailable" })}
          action={<Button onClick={fetchRows}>{t("retry", { defaultValue: "Retry" })}</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      <div className="directory-toolbar">
        <Input.Search
          placeholder={t("expertSearch", { defaultValue: "Search by name or institution" })}
          allowClear
          onSearch={(value) => {
            setPage(1);
            setQuery(value.trim());
          }}
        />
        <Select
          allowClear
          placeholder={t("certificationFilter", { defaultValue: "Qualification / certification" })}
          onChange={(value) => {
            setPage(1);
            setCertification(value);
          }}
          options={[
            { value: "Methodology", label: "Methodology" },
            { value: "MRV", label: "MRV" },
            { value: "Adaptation", label: "Adaptation" },
          ]}
        />
        <Select
          allowClear
          placeholder={t("province", { defaultValue: "Province" })}
          onChange={(value) => {
            setPage(1);
            setProvince(value);
          }}
          options={[]}
          notFoundContent={t("notAvailable", { defaultValue: "Not available" })}
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "name", label: t("sortName", { defaultValue: "Name" }) },
            { value: "yearsOfExperience", label: t("sortExperience", { defaultValue: "Experience" }) },
          ]}
        />
        <Select
          value={sortOrder}
          onChange={setSortOrder}
          options={[
            { value: "asc", label: t("ascending", { defaultValue: "Ascending" }) },
            { value: "desc", label: t("descending", { defaultValue: "Descending" }) },
          ]}
        />
        <Button icon={<DownloadOutlined />} onClick={() => downloadCsv(rows)} disabled={!rows.length}>
          {t("download", { defaultValue: "Download" })}
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{ emptyText: <Empty description={t("noExperts", { defaultValue: "No public experts found" })} /> }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextSize !== pageSize ? 1 : nextPage);
            setPageSize(nextSize);
          },
        }}
      />
    </div>
  );
};

export default RosterOfExpertList;

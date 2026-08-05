import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Empty, Input, Select, Table, Tag } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";

interface CertifierRow {
  companyId: number;
  name: string;
  country: string | null;
  website: string | null;
  address: string | null;
  logo: string | null;
  scopeSectors?: string[] | null;
  eligibleForSpei?: boolean | null;
  eligibleForPtbaePu?: boolean | null;
  publicationStatus?: string | null;
}

interface AgencyResponse {
  data?: CertifierRow[];
  total?: number;
}

const unwrap = (response: any): AgencyResponse => {
  const payload = response?.data ?? response;
  return Array.isArray(payload) ? { data: payload, total: payload.length } : payload ?? {};
};

const downloadCsv = (rows: CertifierRow[]) => {
  const lines = [
    ["Name", "Country", "Website", "Address", "Scope"],
    ...rows.map((row) => [
      row.name,
      row.country,
      row.website,
      row.address,
      row.scopeSectors?.join("; "),
    ]),
  ];
  const csv = lines
    .map((line) => line.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "champa-verification-agencies-demo.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};

const VerificationAgencyList = () => {
  const { get } = useConnection();
  const { t } = useTranslation(["instruments"]);
  const [rows, setRows] = useState<CertifierRow[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [scheme, setScheme] = useState<string>();
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (query) params.set("search", query);
      if (scheme) params.set("scheme", scheme);
      const response = await get(`${API_PATHS.CERTIFIERS_PUBLIC_LIST}?${params}`);
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
  }, [get, page, pageSize, query, scheme, sortBy, sortOrder]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const columns = [
    {
      title: t("name", { defaultValue: "Name" }),
      dataIndex: "name",
      key: "name",
      render: (name: string, row: CertifierRow) => (
        <Link to={`/instruments/agency/${row.companyId}`}>{name}</Link>
      ),
    },
    { title: t("country", { defaultValue: "Country" }), dataIndex: "country", key: "country" },
    {
      title: t("website", { defaultValue: "Website" }),
      dataIndex: "website",
      key: "website",
      render: (website: string | null) =>
        website ? <a href={website} target="_blank" rel="noopener noreferrer">{website}</a> : <Tag>{t("notAvailable", { defaultValue: "Not available" })}</Tag>,
    },
    {
      title: t("address", { defaultValue: "Address" }),
      dataIndex: "address",
      key: "address",
      render: (address: string | null) => address || <Tag>{t("notAvailable", { defaultValue: "Not available" })}</Tag>,
    },
    {
      title: t("detail", { defaultValue: "Detail" }),
      key: "detail",
      render: (_: unknown, row: CertifierRow) => <Link to={`/instruments/agency/${row.companyId}`}>{t("seeDetail", { defaultValue: "See detail →" })}</Link>,
    },
  ];

  return (
    <div className="agency-directory">
      {error && (
        <Alert
          type="error"
          showIcon
          message={t("directoryError", { defaultValue: "Directory unavailable" })}
          action={<Button onClick={fetchAgencies}>{t("retry", { defaultValue: "Retry" })}</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      <div className="directory-toolbar">
        <Input.Search
          placeholder={t("agencySearch", { defaultValue: "Search agency" })}
          allowClear
          onSearch={(value) => {
            setPage(1);
            setQuery(value.trim());
          }}
        />
        <Select
          allowClear
          placeholder={t("schemeFilter", { defaultValue: "Configured scheme" })}
          onChange={(value) => {
            setPage(1);
            setScheme(value);
          }}
          options={[
            { value: "certificate", label: t("certificateScheme", { defaultValue: "Certificate registry" }) },
            { value: "ceiling", label: t("ceilingScheme", { defaultValue: "Emission ceiling & trading" }) },
          ]}
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          options={[{ value: "name", label: t("sortName", { defaultValue: "Name" }) }, { value: "country", label: t("country", { defaultValue: "Country" }) }]}
        />
        <Select
          value={sortOrder}
          onChange={setSortOrder}
          options={[{ value: "asc", label: t("ascending", { defaultValue: "Ascending" }) }, { value: "desc", label: t("descending", { defaultValue: "Descending" }) }]}
        />
        <Button icon={<DownloadOutlined />} onClick={() => downloadCsv(rows)} disabled={!rows.length}>
          {t("download", { defaultValue: "Download" })}
        </Button>
      </div>
      <Table
        rowKey="companyId"
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{ emptyText: <Empty description={t("noAgencies", { defaultValue: "No public agencies found" })} /> }}
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

export default VerificationAgencyList;

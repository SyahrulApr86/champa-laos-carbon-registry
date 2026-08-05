import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Col, Empty, Input, Row, Select, Table, Tag } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { Sector } from "../../Definitions/Enums/sector.enum";
import { MethodologyStatus } from "../../Definitions/Enums/methodologyStatus.enum";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import PublicDisclosure from "../../Components/PublicDisclosure/PublicDisclosure";
import "./methodology.scss";

const { Search } = Input;

interface MethodologyRecord {
  id: number;
  methodologyNumber: string;
  name: string;
  source: string;
  category: Sector;
  status: MethodologyStatus;
  description?: string | null;
  documentUrl?: string | null;
  methodologyVersion?: string | null;
  publicationStatus?: string | null;
}

interface MethodologyResponse {
  data?: MethodologyRecord[];
  total?: number;
  totalItems?: number;
}

const statusTagColor = (status: MethodologyStatus) =>
  status === MethodologyStatus.ACTIVE ? "success" : "default";

const unwrap = (response: any): MethodologyResponse => {
  const payload = response?.data ?? response;
  return Array.isArray(payload) ? { data: payload, total: payload.length } : payload ?? {};
};

const MethodologyDirectory = () => {
  const { get } = useConnection();
  const { t } = useTranslation(["instruments"]);
  const [data, setData] = useState<MethodologyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<Sector>();
  const [status, setStatus] = useState<MethodologyStatus>();
  const [sortBy, setSortBy] = useState("methodologyNumber");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchMethodologies = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (keyword) params.set("keyword", keyword);
      if (category) params.set("category", category);
      if (status) params.set("status", status);

      const response = await get(`${API_PATHS.METHODOLOGY_PUBLIC_LIST}?${params}`);
      const payload = unwrap(response);
      setData(payload.data ?? []);
      setTotal(payload.totalItems ?? payload.total ?? 0);
    } catch {
      setData([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, get, keyword, page, pageSize, sortBy, sortOrder, status]);

  useEffect(() => {
    fetchMethodologies();
  }, [fetchMethodologies]);

  const columns = [
    {
      title: t("methodologyNumber", { defaultValue: "Methodology No." }),
      dataIndex: "methodologyNumber",
      key: "methodologyNumber",
      width: 160,
    },
    { title: t("name", { defaultValue: "Name" }), dataIndex: "name", key: "name" },
    {
      title: t("category", { defaultValue: "Category" }),
      dataIndex: "category",
      key: "category",
    },
    { title: t("source", { defaultValue: "Source" }), dataIndex: "source", key: "source" },
    {
      title: t("status", { defaultValue: "Status" }),
      dataIndex: "status",
      key: "status",
      render: (value: MethodologyStatus) => (
        <Tag color={statusTagColor(value)}>{value}</Tag>
      ),
    },
    {
      title: t("document", { defaultValue: "Document" }),
      key: "document",
      render: (_: unknown, record: MethodologyRecord) =>
        record.documentUrl ? (
          <a href={record.documentUrl} target="_blank" rel="noopener noreferrer">
            {t("download", { defaultValue: "Download" })}
          </a>
        ) : (
          <Tag>{t("notConfigured", { defaultValue: "Not configured" })}</Tag>
        ),
    },
  ];

  return (
    <div className="methodology-directory-container">
      <AppHeader />
      <div className="methodology-body-container">
        <div className="methodology-title">
          {t("methodologyTitle", { defaultValue: "Methodology Directory" })}
        </div>
        <div className="methodology-sub">
          {t("methodologySubtitle", {
            defaultValue: "Browse configured methodology records and publication status.",
          })}
        </div>
        <PublicDisclosure />

        {error && (
          <Alert
            type="error"
            showIcon
            message={t("directoryError", { defaultValue: "Directory unavailable" })}
            description={t("directoryErrorBody", {
              defaultValue: "The public endpoint could not be reached. Please retry.",
            })}
            action={<Button onClick={fetchMethodologies}>{t("retry", { defaultValue: "Retry" })}</Button>}
            style={{ marginBottom: 20 }}
          />
        )}

        <Row gutter={[16, 16]} className="methodology-filters">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder={t("methodologySearch", { defaultValue: "Search number, name or source" })}
              allowClear
              onSearch={(value) => {
                setPage(1);
                setKeyword(value.trim());
              }}
            />
          </Col>
          <Col xs={24} sm={6} md={5}>
            <Select
              allowClear
              placeholder={t("category", { defaultValue: "Category" })}
              style={{ width: "100%" }}
              value={category}
              onChange={(value) => {
                setPage(1);
                setCategory(value);
              }}
              options={Object.values(Sector).map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} sm={6} md={5}>
            <Select
              allowClear
              placeholder={t("status", { defaultValue: "Status" })}
              style={{ width: "100%" }}
              value={status}
              onChange={(value) => {
                setPage(1);
                setStatus(value);
              }}
              options={Object.values(MethodologyStatus).map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Select
              style={{ width: "100%" }}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "methodologyNumber", label: t("sortNumber", { defaultValue: "Number" }) },
                { value: "name", label: t("sortName", { defaultValue: "Name" }) },
                { value: "source", label: t("sortSource", { defaultValue: "Source" }) },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Select
              style={{ width: "100%" }}
              value={sortOrder}
              onChange={setSortOrder}
              options={[
                { value: "asc", label: t("ascending", { defaultValue: "Ascending" }) },
                { value: "desc", label: t("descending", { defaultValue: "Descending" }) },
              ]}
            />
          </Col>
        </Row>

        <Table
          className="methodology-table"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          locale={{
            emptyText: <Empty description={t("noMethodologies", { defaultValue: "No methodologies found" })} />,
          }}
          expandable={{
            expandedRowRender: (record: MethodologyRecord) => (
              <div className="methodology-description">
                <p>{record.description || t("notAvailable", { defaultValue: "Not available" })}</p>
                <small>
                  {t("publicationStatus", { defaultValue: "Publication status" })}: {record.publicationStatus || t("notConfigured", { defaultValue: "Not configured" })}
                  {record.methodologyVersion ? ` · ${record.methodologyVersion}` : ""}
                </small>
              </div>
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (newPage, newSize) => {
              setPage(newSize !== pageSize ? 1 : newPage);
              setPageSize(newSize);
            },
          }}
        />
        <p className="methodology-policy-note">
          {t("methodologyPolicyNote", {
            defaultValue: "Methodology approval and source claims remain configurable until published by an approved owner.",
          })}
        </p>
        <Link to="/instruments#methodology">
          {t("backToInstruments", { defaultValue: "Back to Instruments" })}
        </Link>
      </div>
      <LayoutFooter />
    </div>
  );
};

export default MethodologyDirectory;

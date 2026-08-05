import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Col, Empty, Input, Pagination, Row, Select, Spin, Tag } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";

interface GuidanceDocumentRow {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  documentUrl: string | null;
  createdAt: number;
  documentType?: string | null;
  sizeBytes?: number | null;
  contentHash?: string | null;
  version?: string | null;
  publicationStatus?: string | null;
}

interface GuidanceResponse {
  data?: GuidanceDocumentRow[];
  total?: number;
  meta?: { categories?: string[] };
}

const unwrap = (response: any): GuidanceResponse => {
  const payload = response?.data ?? response;
  return Array.isArray(payload) ? { data: payload, total: payload.length } : payload ?? {};
};

const GuidanceDocumentList = () => {
  const { get } = useConnection();
  const { t } = useTranslation(["instruments"]);
  const [rows, setRows] = useState<GuidanceDocumentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>();
  const [categories, setCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortOrder,
      });
      if (keyword) params.set("search", keyword);
      if (category) params.set("category", category);
      const response = await get(`${API_PATHS.GUIDANCE_DOCUMENT_PUBLIC_LIST}?${params}`);
      const payload = unwrap(response);
      setRows(payload.data ?? []);
      setTotal(payload.total ?? 0);
      setCategories(payload.meta?.categories ?? []);
    } catch {
      setRows([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, get, keyword, page, pageSize, sortOrder]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="guidance-directory">
      {error && (
        <Alert
          type="error"
          showIcon
          message={t("directoryError", { defaultValue: "Directory unavailable" })}
          action={<Button onClick={fetchDocuments}>{t("retry", { defaultValue: "Retry" })}</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      <div className="directory-toolbar">
        <Input.Search
          placeholder={t("guidanceSearch", { defaultValue: "Search title or description" })}
          allowClear
          onSearch={(value) => {
            setPage(1);
            setKeyword(value.trim());
          }}
        />
        <Select
          allowClear
          placeholder={t("category", { defaultValue: "Category" })}
          onChange={(value) => {
            setPage(1);
            setCategory(value);
          }}
          options={categories.map((value) => ({ value, label: value }))}
          notFoundContent={t("notAvailable", { defaultValue: "Not available" })}
        />
        <Select
          value={sortOrder}
          onChange={setSortOrder}
          options={[{ value: "desc", label: t("newest", { defaultValue: "Newest" }) }, { value: "asc", label: t("oldest", { defaultValue: "Oldest" }) }]}
        />
      </div>

      {loading && rows.length === 0 ? (
        <div className="directory-loading"><Spin /></div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {rows.map((doc) => (
              <Col xs={24} md={12} key={doc.id}>
                <Card title={doc.title} extra={doc.documentType || "PDF"}>
                  {doc.description && <p>{doc.description}</p>}
                  <div className="directory-card-meta">
                    {doc.category && <Tag>{doc.category}</Tag>}
                    <Tag>{doc.publicationStatus || t("synthetic", { defaultValue: "Synthetic demo" })}</Tag>
                    {doc.version && <Tag>{doc.version}</Tag>}
                    {doc.sizeBytes != null && <span>{Math.ceil(doc.sizeBytes / 1024)} KB</span>}
                  </div>
                  <div className="directory-card-actions">
                    {doc.documentUrl ? (
                      <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" download>
                        <DownloadOutlined /> {t("download", { defaultValue: "Download" })}
                      </a>
                    ) : (
                      <Tag>{t("downloadNotConfigured", { defaultValue: "Download not configured" })}</Tag>
                    )}
                  </div>
                  {doc.contentHash && (
                    <small title={doc.contentHash}>
                      {t("contentHash", { defaultValue: "Content hash" })}: {doc.contentHash.slice(0, 12)}…
                    </small>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
          {!loading && rows.length === 0 && (
            <Empty description={t("noGuidance", { defaultValue: "No guidance documents found" })} />
          )}
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            onChange={(nextPage, nextSize) => {
              setPage(nextSize !== pageSize ? 1 : nextPage);
              setPageSize(nextSize);
            }}
            style={{ marginTop: 20 }}
          />
        </>
      )}
    </div>
  );
};

export default GuidanceDocumentList;

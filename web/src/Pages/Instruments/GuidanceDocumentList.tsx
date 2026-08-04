import React, { useEffect, useState } from "react";
import { Card, Col, Row, Spin, Tag } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";

interface GuidanceDocumentRow {
  id: number;
  title: string;
  description: string;
  category: string;
  documentUrl: string;
  createdAt: number;
}

// Public directory of downloadable guidance documents for the Instruments
// > Module section, backed by real GuidanceDocumentEntity records. Mirrors
// SRN Indonesia's Instruments > Module page (title / subtitle / category /
// PDF download link).
const GuidanceDocumentList = () => {
  const { get } = useConnection();

  const [rows, setRows] = useState<GuidanceDocumentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await get(API_PATHS.GUIDANCE_DOCUMENT_PUBLIC_LIST);
        const data = response?.data as GuidanceDocumentRow[] | undefined;
        setRows(data ?? []);
      } catch (error) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [get]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
        <Spin />
      </div>
    );
  }

  if (rows.length === 0) {
    return <p>No guidance documents have been published yet.</p>;
  }

  return (
    <Row gutter={[16, 16]}>
      {rows.map((doc) => (
        <Col xs={24} md={12} key={doc.id}>
          <Card title={doc.title}>
            {doc.description && <p>{doc.description}</p>}
            {doc.category && <Tag>{doc.category}</Tag>}
            <div style={{ marginTop: "0.75rem" }}>
              <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                Download →
              </a>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default GuidanceDocumentList;

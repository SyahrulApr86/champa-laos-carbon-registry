import React, { useEffect, useState } from "react";
import { Alert, Col, Descriptions, Empty, Row, Spin, Steps, Tag } from "antd";
import { useParams } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import { readPublicEnvelope } from "../../Components/Homepage/publicData";
import "./publicAdaptationDetail.scss";

interface AdaptationDetail {
  found: boolean;
  adaptationId: string;
  title: string;
  description: string;
  sector: string;
  region: string | null;
  status: string;
  period: { start: string | null; end: string | null; availability: string };
  duration: { label?: string; days?: number } | null;
  goal: { value: string | null; availability: string };
  vulnerability: { value: string | null; availability: string };
  documents: { items: unknown[]; availability: string };
  responsibleOrganisation: { name: string | null; address: string | null; type: string | null; availability: string };
  createdAt: number;
}

const statusColor: Record<string, string> = { Approved: "green", UnderReview: "gold", Submitted: "gold", Rejected: "red" };
const stageLabel: Record<string, string> = { UnderReview: "Under Review" };
const stageSteps = ["Submitted", "Under Review", "Approved"];

const displayAvailability = (value: string | null | undefined) => {
  if (value === "not_configured") return "Not configured";
  if (value === "not_available") return "Not available";
  if (value === "withheld") return "Withheld";
  return value || "Not available";
};

const exactDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return null;
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000);
  return `${days} day${days === 1 ? "" : "s"}`;
};

const PublicAdaptationDetail = () => {
  const { adaptationId } = useParams<{ adaptationId: string }>();
  const { get } = useConnection();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdaptationDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!adaptationId) { setDetail(null); setLoading(false); return; }
    setLoading(true);
    setError(false);
    get(API_PATHS.ADAPTATION_PUBLIC_DETAIL(adaptationId))
      .then((response) => setDetail(readPublicEnvelope<AdaptationDetail>(response).data ?? null))
      .catch(() => { setDetail(null); setError(true); })
      .finally(() => setLoading(false));
  }, [adaptationId, get]);

  const status = detail?.status || "";
  const currentStep = status === "Rejected" ? 1 : Math.max(0, stageSteps.indexOf(status === "Approved" ? "Approved" : status === "UnderReview" ? "Under Review" : "Submitted"));

  return (
    <div id="publicAdaptationDetail" className="public-adaptation-detail-container">
      <AppHeader />
      <div className="public-adaptation-detail-body-container">
        <Row justify="center"><Col xs={22} md={16}>
          {loading && <div className="public-adaptation-detail-loading"><Spin size="large" /></div>}
          {error && !loading && <Alert type="error" showIcon message="Adaptation details could not be loaded." />}
          {!loading && !error && !detail && <div className="public-adaptation-detail-not-found"><Empty description={`No adaptation action matches ${adaptationId || "this identifier"}.`} /></div>}
          {!loading && detail && <>
            <Alert type="info" showIcon message="Synthetic demonstration data" description="This public detail is a generated Champa registry demonstration record, not an official Lao PDR record." style={{ marginBottom: "1rem" }} />
            <div className="public-adaptation-detail-title">{detail.title}</div>
            <div className="public-adaptation-detail-subtitle">Registration No. {detail.adaptationId} <Tag color={statusColor[status] || "default"}>{stageLabel[status] || status}</Tag></div>
            <div className="public-adaptation-detail-steps"><Steps current={currentStep} status={status === "Rejected" ? "error" : "process"} items={stageSteps.map((label, index) => status === "Rejected" && index === 1 ? { title: "Rejected" } : { title: label })} /></div>
            <Descriptions className="public-adaptation-detail-summary" title="Adaptation Action Summary" bordered column={1} size="middle">
              <Descriptions.Item label="Registration Number">{detail.adaptationId}</Descriptions.Item>
              <Descriptions.Item label="Period">{detail.period?.start || displayAvailability(detail.period?.availability)} to {detail.period?.end || displayAvailability(detail.period?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Duration">{detail.duration?.label || exactDuration(detail.period?.start, detail.period?.end) || displayAvailability(detail.period?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Implementation Status">{stageLabel[status] || status}</Descriptions.Item>
              <Descriptions.Item label="Category">{detail.sector || "Not available"}</Descriptions.Item>
              <Descriptions.Item label="Location">{detail.region || "Not available"}</Descriptions.Item>
              <Descriptions.Item label="Responsible Organisation">{detail.responsibleOrganisation?.name || displayAvailability(detail.responsibleOrganisation?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Address">{detail.responsibleOrganisation?.address || displayAvailability(detail.responsibleOrganisation?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Vulnerability">{detail.vulnerability?.value || displayAvailability(detail.vulnerability?.availability)}</Descriptions.Item>
            </Descriptions>
            <Descriptions className="public-adaptation-detail-action" title="Goals and Description" bordered column={1} size="middle">
              <Descriptions.Item label="Adaptation Goal">{detail.goal?.value || displayAvailability(detail.goal?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Description">{detail.description || "Not available"}</Descriptions.Item>
              <Descriptions.Item label="Submitted">{detail.createdAt ? new Date(Number(detail.createdAt)).toLocaleDateString() : "Not available"}</Descriptions.Item>
            </Descriptions>
            <div className="public-adaptation-detail-documents"><h2>Documents</h2><p>{detail.documents?.items?.length ? `${detail.documents.items.length} public documents` : displayAvailability(detail.documents?.availability)}</p></div>
          </>}
        </Col></Row>
      </div>
      <LayoutFooter />
    </div>
  );
};

export default PublicAdaptationDetail;

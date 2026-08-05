import React, { useEffect, useState } from "react";
import { Alert, Col, Descriptions, Empty, Row, Spin, Tag } from "antd";
import { useParams } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import "./publicCommunityDetail.scss";

interface CommunityDetail {
  found: boolean;
  programId: string;
  name: string;
  region: string;
  category: string;
  description: string;
  participantCount: number | null;
  status: string;
  startYear: number;
  period: { start: string | null; end: string | null; availability: string };
  duration: { label?: string; days?: number } | null;
  goals: { value: string | null; availability: string };
  responsibleOrganisation: { value: string | null; availability: string };
  vulnerability: { value: string | null; availability: string };
  documents: { items: unknown[]; availability: string };
  location: { region: string; availability: string };
  createdAt: number;
}

interface PublicEnvelope<T> {
  data: T | null;
  meta?: { disclosure?: string; availability?: string };
}

const statusColor: Record<string, string> = { Active: "green", Completed: "blue", Planned: "gold" };

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

const PublicCommunityDetail = () => {
  const { programId } = useParams<{ programId: string }>();
  const { get } = useConnection();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CommunityDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!programId) { setDetail(null); setLoading(false); return; }
    setLoading(true);
    setError(false);
    get(API_PATHS.COMMUNITY_PROGRAM_PUBLIC_DETAIL(programId))
      .then((response: any) => setDetail((response?.data as PublicEnvelope<CommunityDetail>)?.data ?? null))
      .catch(() => { setDetail(null); setError(true); })
      .finally(() => setLoading(false));
  }, [get, programId]);

  return (
    <div id="publicCommunityDetail" className="public-community-detail-container">
      <AppHeader />
      <div className="public-community-detail-body-container">
        <Row justify="center"><Col xs={22} md={16}>
          {loading && <div className="public-community-detail-loading"><Spin size="large" /></div>}
          {error && !loading && <Alert type="error" showIcon message="Community action details could not be loaded." />}
          {!loading && !error && !detail && <div className="public-community-detail-not-found"><Empty description={`No community action matches ${programId || "this identifier"}.`} /></div>}
          {!loading && detail && <>
            <Alert type="info" showIcon message="Synthetic demonstration data" description="This public detail is a generated Champa registry demonstration record, not an official Lao PDR record." style={{ marginBottom: "1rem" }} />
            <div className="public-community-detail-title">{detail.name}</div>
            <div className="public-community-detail-subtitle">Registration No. {detail.programId} <Tag color={statusColor[detail.status] || "default"}>{detail.status}</Tag></div>
            <Descriptions className="public-community-detail-summary" title="Community Action Summary" bordered column={1} size="middle">
              <Descriptions.Item label="Registration Number">{detail.programId}</Descriptions.Item>
              <Descriptions.Item label="Period">{detail.period?.start || "Not available"} — {detail.period?.end || displayAvailability(detail.period?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Duration">{detail.duration?.label || exactDuration(detail.period?.start, detail.period?.end) || displayAvailability(detail.period?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Implementation Status">{detail.status}</Descriptions.Item>
              <Descriptions.Item label="Category">{detail.category || "Not available"}</Descriptions.Item>
              <Descriptions.Item label="Location">{detail.location?.region || displayAvailability(detail.location?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Participants">{detail.participantCount == null ? "Not available" : detail.participantCount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Responsible Organisation">{detail.responsibleOrganisation?.value || displayAvailability(detail.responsibleOrganisation?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Vulnerability">{detail.vulnerability?.value || displayAvailability(detail.vulnerability?.availability)}</Descriptions.Item>
            </Descriptions>
            <Descriptions className="public-community-detail-action" title="Goals and Description" bordered column={1} size="middle">
              <Descriptions.Item label="Goals">{detail.goals?.value || displayAvailability(detail.goals?.availability)}</Descriptions.Item>
              <Descriptions.Item label="Description">{detail.description || "Not available"}</Descriptions.Item>
              <Descriptions.Item label="Submitted">{detail.createdAt ? new Date(Number(detail.createdAt)).toLocaleDateString() : "Not available"}</Descriptions.Item>
            </Descriptions>
            <div className="public-community-detail-documents"><h2>Documents</h2><p>{detail.documents?.items?.length ? `${detail.documents.items.length} public documents` : displayAvailability(detail.documents?.availability)}</p></div>
          </>}
        </Col></Row>
      </div>
      <LayoutFooter />
    </div>
  );
};

export default PublicCommunityDetail;

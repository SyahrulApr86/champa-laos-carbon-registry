import React, { useEffect, useState } from "react";
import { Row, Col, Tag, Spin, Descriptions } from "antd";
import { useParams } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import "./publicCommunityDetail.scss";

interface PublicCommunityDetailResult {
  found: boolean;
  programId?: string;
  name?: string;
  region?: string;
  category?: string;
  description?: string;
  participantCount?: number;
  startYear?: number;
  status?: "Active" | "Completed" | "Planned";
  createdAt?: number;
}

const statusColor: Record<string, string> = {
  Active: "green",
  Completed: "blue",
  Planned: "gold",
};

// createdAt comes from CommunityProgramEntity.setCreatedAt (Date.getTime()),
// already in milliseconds - see publicProjectDetail.tsx's dateOfMillis for
// the same distinction this registry must respect.
const dateOfMillis = (epochMillis?: number) =>
  epochMillis ? new Date(Number(epochMillis)).toLocaleDateString() : "-";

const PublicCommunityDetail = () => {
  const { programId } = useParams<{ programId: string }>();
  const { get } = useConnection();
  const [loading, setLoading] = useState<boolean>(true);
  const [detail, setDetail] = useState<PublicCommunityDetailResult | null>(
    null
  );

  useEffect(() => {
    if (!programId) {
      setDetail({ found: false });
      setLoading(false);
      return;
    }
    setLoading(true);
    get(API_PATHS.COMMUNITY_PROGRAM_PUBLIC_DETAIL(programId))
      .then((response: any) => setDetail(response?.data ?? { found: false }))
      .catch(() => setDetail({ found: false }))
      .finally(() => setLoading(false));
  }, [programId, get]);

  return (
    <div
      id="publicCommunityDetail"
      className="public-community-detail-container"
    >
      <AppHeader />
      <div className="public-community-detail-body-container">
        <Row justify="center">
          <Col xs={22} md={16}>
            {loading && (
              <div className="public-community-detail-loading">
                <Spin size="large" />
              </div>
            )}

            {!loading && (!detail || !detail.found) && (
              <div className="public-community-detail-not-found">
                <h2>Community program not found</h2>
                <p>
                  No registered community program matches registration
                  number <strong>{programId}</strong>.
                </p>
              </div>
            )}

            {!loading && detail?.found && (
              <>
                <div className="public-community-detail-title">
                  {detail.name}
                </div>
                <div className="public-community-detail-subtitle">
                  Registration No. {detail.programId}{" "}
                  <Tag color={statusColor[detail.status || ""] || "default"}>
                    {detail.status}
                  </Tag>
                </div>

                <Descriptions
                  className="public-community-detail-summary"
                  title="Program Summary"
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label="Registration Number">
                    {detail.programId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Start Year">
                    {detail.startYear ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Implementation Status">
                    {detail.status}
                  </Descriptions.Item>
                  <Descriptions.Item label="Category">
                    {detail.category || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Region">
                    {detail.region || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Participants">
                    {detail.participantCount ?? "-"}
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions
                  className="public-community-detail-action"
                  title="Program Description"
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label="Description">
                    {detail.description || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Submitted">
                    {dateOfMillis(detail.createdAt)}
                  </Descriptions.Item>
                </Descriptions>

                <div className="public-community-detail-documents">
                  <h2>Documents</h2>
                  <p>
                    No public documents have been published for this program
                    yet.
                  </p>
                </div>
              </>
            )}
          </Col>
        </Row>
      </div>
      <LayoutFooter />
    </div>
  );
};

export default PublicCommunityDetail;

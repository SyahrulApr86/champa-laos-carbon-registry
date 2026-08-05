import React, { useEffect, useState } from "react";
import { Row, Col, Steps, Tag, Spin, Descriptions } from "antd";
import { useParams } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import "./publicAdaptationDetail.scss";

interface PublicAdaptationDetailResult {
  found: boolean;
  adaptationId?: string;
  title?: string;
  description?: string;
  sector?: string;
  region?: string;
  currentStage?: "Submitted" | "UnderReview" | "Approved" | "Rejected";
  responsibleOrgName?: string;
  responsibleOrgAddress?: string;
  responsibleOrgType?: string;
  createdAt?: number;
}

const statusColor: Record<string, string> = {
  Approved: "green",
  UnderReview: "gold",
  Submitted: "gold",
  Rejected: "red",
};

const stageLabel: Record<string, string> = {
  Submitted: "Submitted",
  UnderReview: "Under Review",
  Approved: "Approved",
  Rejected: "Rejected",
};

// Honest 3-step progress derived from the real AdaptationStage values
// Champa tracks (Submitted -> UnderReview -> Approved), with Rejected
// shown as an alternate terminal step - same "no fabricated granularity"
// philosophy as publicProjectDetail.tsx's stageSteps.
const stageSteps = ["Submitted", "Under Review", "Approved"];

// createdAt comes from AdaptationProjectEntity.setCreatedAt (Date.getTime()),
// already in milliseconds - see publicProjectDetail.tsx's dateOfMillis for
// the same distinction this registry must respect.
const dateOfMillis = (epochMillis?: number) =>
  epochMillis ? new Date(Number(epochMillis)).toLocaleDateString() : "-";

const PublicAdaptationDetail = () => {
  const { adaptationId } = useParams<{ adaptationId: string }>();
  const { get } = useConnection();
  const [loading, setLoading] = useState<boolean>(true);
  const [detail, setDetail] = useState<PublicAdaptationDetailResult | null>(
    null
  );

  useEffect(() => {
    if (!adaptationId) {
      setDetail({ found: false });
      setLoading(false);
      return;
    }
    setLoading(true);
    get(API_PATHS.ADAPTATION_PUBLIC_DETAIL(adaptationId))
      .then((response: any) => setDetail(response?.data ?? { found: false }))
      .catch(() => setDetail({ found: false }))
      .finally(() => setLoading(false));
  }, [adaptationId, get]);

  const currentStep =
    detail?.currentStage === "Rejected"
      ? 1
      : stageSteps.indexOf(
          detail?.currentStage === "Approved" ? "Approved" : "Under Review"
        );

  return (
    <div
      id="publicAdaptationDetail"
      className="public-adaptation-detail-container"
    >
      <AppHeader />
      <div className="public-adaptation-detail-body-container">
        <Row justify="center">
          <Col xs={22} md={16}>
            {loading && (
              <div className="public-adaptation-detail-loading">
                <Spin size="large" />
              </div>
            )}

            {!loading && (!detail || !detail.found) && (
              <div className="public-adaptation-detail-not-found">
                <h2>Adaptation project not found</h2>
                <p>
                  No registered adaptation project matches registration
                  number <strong>{adaptationId}</strong>.
                </p>
              </div>
            )}

            {!loading && detail?.found && (
              <>
                <div className="public-adaptation-detail-title">
                  {detail.title}
                </div>
                <div className="public-adaptation-detail-subtitle">
                  Registration No. {detail.adaptationId}{" "}
                  <Tag color={statusColor[detail.currentStage || ""] || "default"}>
                    {stageLabel[detail.currentStage || ""] || detail.currentStage}
                  </Tag>
                </div>

                <div className="public-adaptation-detail-steps">
                  <Steps
                    current={currentStep}
                    status={
                      detail.currentStage === "Rejected" ? "error" : "process"
                    }
                    items={stageSteps.map((label, index) =>
                      detail.currentStage === "Rejected" && index === 1
                        ? { title: "Rejected" }
                        : { title: label }
                    )}
                  />
                </div>

                <Descriptions
                  className="public-adaptation-detail-summary"
                  title="Project Summary"
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label="Registration Number">
                    {detail.adaptationId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Implementation Status">
                    {stageLabel[detail.currentStage || ""] ||
                      detail.currentStage}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sector">
                    {detail.sector || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Location">
                    {detail.region || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Responsible Organization">
                    {detail.responsibleOrgName
                      ? `${detail.responsibleOrgName}${
                          detail.responsibleOrgType
                            ? ` (${detail.responsibleOrgType})`
                            : ""
                        }`
                      : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    {detail.responsibleOrgAddress || "-"}
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions
                  className="public-adaptation-detail-action"
                  title="Project Description"
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

                <div className="public-adaptation-detail-documents">
                  <h2>Documents</h2>
                  <p>
                    No public documents have been published for this project
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

export default PublicAdaptationDetail;

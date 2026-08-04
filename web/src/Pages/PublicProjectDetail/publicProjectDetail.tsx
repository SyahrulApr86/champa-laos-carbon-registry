import React, { useEffect, useState } from "react";
import { Row, Col, Steps, Tag, Spin, Descriptions } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import LayoutFooter from "../../Components/Footer/layout.footer";
import "./publicProjectDetail.scss";

interface PublicProjectDetailResult {
  found: boolean;
  programmeId?: string;
  title?: string;
  sector?: string;
  sectoralScope?: string;
  currentStage?: "Registered" | "Under Review" | "Rejected";
  startTime?: number;
  endTime?: number;
  geographicalLocation?: string[];
  creditEst?: number;
  proponent?: string[];
  createdTime?: number;
}

const statusColor: Record<string, string> = {
  Registered: "green",
  "Under Review": "gold",
  Rejected: "red",
};

// Honest 3-step progress derived from the real ProgrammeStage values Champa
// tracks (New / AwaitingAuthorization collapse into "Under Review" on the
// public detail response, Authorised -> "Registered"), with Rejected shown
// as an alternate terminal step rather than fabricating SRN Indonesia's
// fictitious 5-stage General/Technical/Validation/Verification/Finalization
// breakdown, which Champa's data model does not track.
const stageSteps = ["Submitted", "Under Review", "Registered"];

const yearOf = (epochSeconds?: number) =>
  epochSeconds ? new Date(epochSeconds * 1000).getFullYear() : "-";

const dateOf = (epochSeconds?: number) =>
  epochSeconds ? new Date(epochSeconds * 1000).toLocaleDateString() : "-";

// createdTime comes from Programme.txTime (Date.getTime()), already in
// milliseconds - unlike startTime/endTime, which are stored in seconds.
const dateOfMillis = (epochMillis?: number) =>
  epochMillis ? new Date(Number(epochMillis)).toLocaleDateString() : "-";

const PublicProjectDetail = () => {
  const navigate = useNavigate();
  const { programmeId } = useParams<{ programmeId: string }>();
  const { get } = useConnection();
  const [loading, setLoading] = useState<boolean>(true);
  const [detail, setDetail] = useState<PublicProjectDetailResult | null>(
    null
  );

  useEffect(() => {
    if (!programmeId) {
      setDetail({ found: false });
      setLoading(false);
      return;
    }
    setLoading(true);
    get(API_PATHS.PUBLIC_PROJECT_DETAIL(programmeId))
      .then((response: any) => setDetail(response?.data ?? { found: false }))
      .catch(() => setDetail({ found: false }))
      .finally(() => setLoading(false));
  }, [programmeId, get]);

  const currentStep =
    detail?.currentStage === "Rejected"
      ? 1
      : stageSteps.indexOf(
          detail?.currentStage === "Registered" ? "Registered" : "Under Review"
        );

  return (
    <div
      id="publicProjectDetail"
      className="public-project-detail-container"
    >
      <Row>
        <Col span={24}>
          <div
            onClick={() => navigate("/")}
            className="public-project-detail-header-container"
          >
            <div className="logo">
              <img src={sliderLogo} alt="slider-logo" />
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <div className="title">{"CHAMPA"}</div>
                <div className="title-sub">{"LAO PDR CARBON REGISTRY"}</div>
              </div>
              <div className="country-name">
                {import.meta.env.VITE_APP_COUNTRY_NAME || "Lao PDR"}
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <div className="public-project-detail-body-container">
        <Row justify="center">
          <Col xs={22} md={16}>
            {loading && (
              <div className="public-project-detail-loading">
                <Spin size="large" />
              </div>
            )}

            {!loading && (!detail || !detail.found) && (
              <div className="public-project-detail-not-found">
                <h2>Project not found</h2>
                <p>
                  No registered project matches registration number{" "}
                  <strong>{programmeId}</strong>.
                </p>
              </div>
            )}

            {!loading && detail?.found && (
              <>
                <div className="public-project-detail-title">
                  {detail.title}
                </div>
                <div className="public-project-detail-subtitle">
                  Registration No. {detail.programmeId}{" "}
                  <Tag color={statusColor[detail.currentStage || ""] || "default"}>
                    {detail.currentStage}
                  </Tag>
                </div>

                <div className="public-project-detail-steps">
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
                  className="public-project-detail-summary"
                  title="Project Summary"
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label="Registration Number">
                    {detail.programmeId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Activity Period">
                    {yearOf(detail.startTime)} - {yearOf(detail.endTime)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Implementation Status">
                    {detail.currentStage}
                  </Descriptions.Item>
                  <Descriptions.Item label="Responsible Party">
                    {detail.proponent && detail.proponent.length > 0
                      ? detail.proponent.join(", ")
                      : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Location">
                    {detail.geographicalLocation &&
                    detail.geographicalLocation.length > 0
                      ? detail.geographicalLocation.join(", ")
                      : "-"}
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions
                  className="public-project-detail-action"
                  title="Action Details"
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label="Action Type / Sector">
                    {detail.sector || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sectoral Scope">
                    {detail.sectoralScope || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Implementation Year">
                    {yearOf(detail.startTime)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Estimated Credits">
                    {detail.creditEst ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Submitted">
                    {dateOfMillis(detail.createdTime)}
                  </Descriptions.Item>
                </Descriptions>

                <div className="public-project-detail-documents">
                  <h2>Documents</h2>
                  <p>No public documents have been published for this project yet.</p>
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

export default PublicProjectDetail;

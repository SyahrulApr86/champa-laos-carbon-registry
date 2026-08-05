import React, { useEffect, useState } from "react";
import { Row, Col, Spin, Descriptions, Tag } from "antd";
import { useParams, Link } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import "./verificationAgencyDetail.scss";

interface CertifierDetail {
  companyId: number;
  name: string;
  country: string;
  website: string;
  address: string;
  logo: string;
  certificateNumber: string | null;
  certificateIssuedDate: number | null;
  certificateValidUntil: number | null;
  scopeSectors: string[] | null;
  appliesToDram: boolean | null;
  appliesToLcam: boolean | null;
  eligibleForSpei: boolean | null;
  eligibleForPtbaePu: boolean | null;
}

// createdAt/certificate dates are stored as millisecond epoch timestamps
// (Date.getTime()) - do not multiply by 1000 again.
const dateOfMillis = (epochMillis?: number | null) =>
  epochMillis ? new Date(Number(epochMillis)).toLocaleDateString() : "-";

const yesNoUnset = (value: boolean | null | undefined) => {
  if (value === true) return <Tag color="green">Yes</Tag>;
  if (value === false) return <Tag color="default">No</Tag>;
  return "-";
};

// Per-agency detail page for a Validation/Verification Agency, mirroring
// SRN Indonesia's LVV detail page: certificate number, validity period,
// address/website, scope-by-sector coverage, mitigation-document
// applicability, and scheme eligibility. Certificate/scope fields are
// recorded separately from the core Company record (CertifierProfileEntity)
// and are honestly empty until a profile has been entered for this agency -
// most agencies will not have one yet, which is correct, not a bug.
const VerificationAgencyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { get } = useConnection();
  const [loading, setLoading] = useState<boolean>(true);
  const [detail, setDetail] = useState<CertifierDetail | null>(null);

  useEffect(() => {
    if (!companyId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    get(API_PATHS.CERTIFIER_PUBLIC_DETAIL(companyId))
      .then((response: any) => setDetail(response?.data ?? null))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [companyId, get]);

  return (
    <div
      id="verificationAgencyDetail"
      className="verification-agency-detail-container"
    >
      <AppHeader />
      <div className="verification-agency-detail-body-container">
        <Row justify="center">
          <Col xs={22} md={16}>
            <Link to="/instruments#vva" className="verification-agency-detail-back">
              ← Back to Validation/Verification Agencies
            </Link>

            {loading && (
              <div className="verification-agency-detail-loading">
                <Spin size="large" />
              </div>
            )}

            {!loading && !detail && (
              <div className="verification-agency-detail-not-found">
                <h2>Agency not found</h2>
                <p>
                  No active Validation/Verification Agency matches this
                  identifier.
                </p>
              </div>
            )}

            {!loading && detail && (
              <>
                <div className="verification-agency-detail-title">
                  {detail.name}
                </div>

                <Descriptions
                  className="verification-agency-detail-section"
                  title="Certificate"
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label="Certificate Number">
                    {detail.certificateNumber || "Not yet recorded"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Validity Period">
                    {detail.certificateIssuedDate || detail.certificateValidUntil
                      ? `${dateOfMillis(detail.certificateIssuedDate)} – ${dateOfMillis(
                          detail.certificateValidUntil
                        )}`
                      : "Not yet recorded"}
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions
                  className="verification-agency-detail-section"
                  title="Scope"
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label="Sector Coverage">
                    {detail.scopeSectors && detail.scopeSectors.length > 0
                      ? detail.scopeSectors.join(", ")
                      : "Not yet recorded"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Applies to Mitigation Action Design Document">
                    {yesNoUnset(detail.appliesToDram)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Applies to Mitigation Achievement Report">
                    {yesNoUnset(detail.appliesToLcam)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Eligible for Emission Reduction Certificate Scheme">
                    {yesNoUnset(detail.eligibleForSpei)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Eligible for Emission Ceiling &amp; Trading Scheme">
                    {yesNoUnset(detail.eligibleForPtbaePu)}
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions
                  className="verification-agency-detail-section"
                  title="Contact"
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label="Country">
                    {detail.country || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    {detail.address || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Website">
                    {detail.website ? (
                      <a href={detail.website} target="_blank" rel="noopener noreferrer">
                        {detail.website}
                      </a>
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Col>
        </Row>
      </div>
      <LayoutFooter />
    </div>
  );
};

export default VerificationAgencyDetail;

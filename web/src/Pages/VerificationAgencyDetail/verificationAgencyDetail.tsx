import React, { useEffect, useState } from "react";
import { Row, Col, Spin, Descriptions, Tag } from "antd";
import { useParams, Link } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import PublicDisclosure from "../../Components/PublicDisclosure/PublicDisclosure";
import { useTranslation } from "react-i18next";
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
  publicationStatus?: string | null;
  certificateDocumentUrl?: string | null;
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
  const { t } = useTranslation(["instruments"]);
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
              ← {t("backToAgencies", { defaultValue: "Back to Validation/Verification Agencies" })}
            </Link>

            {loading && (
              <div className="verification-agency-detail-loading">
                <Spin size="large" />
              </div>
            )}

            {!loading && !detail && (
              <div className="verification-agency-detail-not-found">
                <h2>{t("agencyNotFound", { defaultValue: "Agency not found" })}</h2>
                <p>
                  {t("agencyNotFoundBody", { defaultValue: "No public agency matches this identifier." })}
                </p>
              </div>
            )}

            {!loading && detail && (
              <>
                <PublicDisclosure />
                <div className="verification-agency-detail-title">
                  {detail.name}
                </div>
                <p className="verification-agency-detail-status">
                  {t("publicationStatus", { defaultValue: "Publication status" })}: {detail.publicationStatus || t("synthetic", { defaultValue: "Synthetic demo" })}
                </p>

                <Descriptions
                  className="verification-agency-detail-section"
                  title={t("certificate", { defaultValue: "Certificate" })}
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label={t("certificateNumber", { defaultValue: "Certificate number" })}>
                    {detail.certificateNumber || t("notAvailable", { defaultValue: "Not available" })}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("validityPeriod", { defaultValue: "Validity period" })}>
                    {detail.certificateIssuedDate || detail.certificateValidUntil
                      ? `${dateOfMillis(detail.certificateIssuedDate)} – ${dateOfMillis(
                          detail.certificateValidUntil
                        )}`
                      : t("notAvailable", { defaultValue: "Not available" })}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("certificateDocument", { defaultValue: "Certificate document" })}>
                    {detail.certificateDocumentUrl ? (
                      <a href={detail.certificateDocumentUrl} target="_blank" rel="noopener noreferrer">
                        {t("download", { defaultValue: "Download" })}
                      </a>
                    ) : (
                      t("notConfigured", { defaultValue: "Not configured" })
                    )}
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions
                  className="verification-agency-detail-section"
                  title={t("scope", { defaultValue: "Scope" })}
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label={t("sectorCoverage", { defaultValue: "Sector coverage" })}>
                    {detail.scopeSectors && detail.scopeSectors.length > 0
                      ? detail.scopeSectors.join(", ")
                      : t("notAvailable", { defaultValue: "Not available" })}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("appliesToMitigation", { defaultValue: "Applies to mitigation documentation" })}>
                    {yesNoUnset(detail.appliesToDram)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("appliesToAchievement", { defaultValue: "Applies to achievement reporting" })}>
                    {yesNoUnset(detail.appliesToLcam)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("eligibleCertificate", { defaultValue: "Eligible for certificate scheme" })}>
                    {yesNoUnset(detail.eligibleForSpei)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("eligibleCeiling", { defaultValue: "Eligible for emission ceiling capability" })}>
                    {yesNoUnset(detail.eligibleForPtbaePu)}
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions
                  className="verification-agency-detail-section"
                  title={t("contact", { defaultValue: "Public contact" })}
                  bordered
                  column={1}
                  size="middle"
                >
                  <Descriptions.Item label={t("country", { defaultValue: "Country" })}>
                    {detail.country || t("notAvailable", { defaultValue: "Not available" })}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("address", { defaultValue: "Address" })}>
                    {detail.address || t("notAvailable", { defaultValue: "Not available" })}
                  </Descriptions.Item>
                  <Descriptions.Item label={t("website", { defaultValue: "Website" })}>
                    {detail.website ? (
                      <a href={detail.website} target="_blank" rel="noopener noreferrer">
                        {detail.website}
                      </a>
                    ) : (
                      t("notAvailable", { defaultValue: "Not available" })
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

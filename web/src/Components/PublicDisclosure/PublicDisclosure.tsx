import React from "react";
import { useTranslation } from "react-i18next";
import "./PublicDisclosure.scss";

interface PublicDisclosureProps {
  asOf?: string;
  periodStart?: string;
  periodEnd?: string;
}

const PublicDisclosure: React.FC<PublicDisclosureProps> = ({
  asOf = "2026-08-05",
  periodStart = "2021",
  periodEnd = "2026",
}) => {
  const { t } = useTranslation(["instruments"]);

  return (
    <aside className="public-disclosure" role="note">
      <strong>{t("syntheticDisclosureTitle")}</strong>
      <span>{t("syntheticDisclosureBody")}</span>
      <small>
        {t("syntheticDisclosurePeriod", {
          asOf,
          periodStart,
          periodEnd,
        })}
      </small>
      <small>
        {t("contentMetadata", {
          defaultValue: "Content version: champa-content-demo-v1 · Publication: synthetic_demo · Owner: pending approved publication policy",
        })}
      </small>
    </aside>
  );
};

export default PublicDisclosure;

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import VerificationAgencyList from "./VerificationAgencyList";
import RosterOfExpertList from "./RosterOfExpertList";
import GuidanceDocumentList from "./GuidanceDocumentList";
import PublicDisclosure from "../../Components/PublicDisclosure/PublicDisclosure";
import { useTranslation } from "react-i18next";
import "./instruments.scss";

const Instruments = () => {
  const { t } = useTranslation(["instruments"]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  return (
    <div className="instruments-page-container">
      <AppHeader />

      <div className="instruments-body-container">
        <h1 className="instruments-title">{t("instrumentsTitle")}</h1>
        <p className="instruments-subtitle">{t("instrumentsSubtitle")}</p>
        <PublicDisclosure />

        <section className="instruments-section" id="methodology">
          <h2>{t("methodologySectionTitle")}</h2>
          <p>{t("methodologySectionBody")}</p>
          <Link to="/methodology" className="instruments-link">
            {t("methodologyOpen")}
          </Link>
        </section>

        <section className="instruments-section" id="vva">
          <h2>{t("agencySectionTitle")}</h2>
          <p>{t("agencySectionBody")}</p>
          <VerificationAgencyList />
        </section>

        <section className="instruments-section" id="roster-of-expert">
          <h2>{t("expertSectionTitle")}</h2>
          <p>{t("expertSectionBody")}</p>
          <RosterOfExpertList />
        </section>

        <section className="instruments-section">
          <h2>{t("policySectionTitle")}</h2>
          <p>{t("policySectionBody")}</p>
        </section>

        <section className="instruments-section" id="module">
          <h2>{t("moduleSectionTitle")}</h2>
          <p>{t("moduleSectionBody")}</p>
          <GuidanceDocumentList />
        </section>

        <section className="instruments-section">
          <h2>{t("sourceCodeTitle")}</h2>
          <p>{t("sourceCodeBody")}</p>
          <a
            href="https://github.com/undp/carbon-registry"
            target="_blank"
            rel="noopener noreferrer"
            className="instruments-link"
          >
            {t("sourceCodeLink")}
          </a>
        </section>
      </div>

      <LayoutFooter />
    </div>
  );
};

export default Instruments;

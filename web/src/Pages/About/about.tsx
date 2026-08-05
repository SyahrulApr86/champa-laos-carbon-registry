import React from "react";
import { Link } from "react-router-dom";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import PublicDisclosure from "../../Components/PublicDisclosure/PublicDisclosure";
import { useTranslation } from "react-i18next";
import "./about.scss";

const About = () => {
  const { t } = useTranslation(["instruments"]);

  return (
    <div className="about-page-container">
      <AppHeader />

      <div className="about-body-container">
        <h1 className="about-title">{t("aboutTitle")}</h1>
        <PublicDisclosure />

        <section className="about-section">
          <h2>{t("aboutIntroTitle")}</h2>
          <p>{t("aboutIntroBody")}</p>
        </section>

        <section className="about-section">
          <h2>{t("aboutGovernanceTitle")}</h2>
          <p>{t("aboutGovernanceBody")}</p>
        </section>

        <section className="about-section">
          <h2>{t("aboutRegistryTitle")}</h2>
          <ul>
            <li>{t("aboutRegistryMitigation")}</li>
            <li>{t("aboutRegistryAdaptation")}</li>
            <li>{t("aboutRegistryResources")}</li>
            <li>{t("aboutRegistryReporting")}</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>{t("aboutLegalTitle")}</h2>
          <p>{t("aboutLegalBody")}</p>
        </section>

        <section className="about-section">
          <h2>{t("aboutOpenSourceTitle")}</h2>
          <p>
            {t("aboutOpenSourceBody")} <Link to="/">{t("sourceCodeLink")}</Link>
          </p>
        </section>
      </div>

      <LayoutFooter />
    </div>
  );
};

export default About;

import React, { useEffect } from "react";
import { Row, Col } from "antd";
import { useNavigate, Link } from "react-router-dom";
import LayoutFooter from "../../Components/Footer/layout.footer";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import VerificationAgencyList from "./VerificationAgencyList";
import GuidanceDocumentList from "./GuidanceDocumentList";
import "./instruments.scss";

// Static, informational "Instruments" page mirroring SRN Indonesia's
// Instruments nav dropdown (Methodology / Roster of Expert / Validation-
// Verification Agency / Module / Registration links). Genuinely
// data-backed items link to their real pages; the rest are described
// honestly as not yet populated rather than filled with placeholder data.
const Instruments = () => {
  const navigate = useNavigate();

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
      <Row>
        <Col span={24}>
          <div
            onClick={() => navigate("/")}
            className="instruments-header-container"
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

      <div className="instruments-body-container">
        <h1 className="instruments-title">Instruments</h1>
        <p className="instruments-subtitle">
          Reference documents and directories supporting Lao PDR&apos;s
          carbon market.
        </p>

        <section className="instruments-section">
          <h2>Methodology Directory</h2>
          <p>
            Browse the list of GHG accounting methodologies approved for
            use in Lao PDR&apos;s carbon market.
          </p>
          <Link to="/methodology" className="instruments-link">
            Open Methodology Directory →
          </Link>
        </section>

        <section className="instruments-section" id="vva">
          <h2>Validation and Verification Bodies</h2>
          <p>
            Independent certifiers registered on Champa validate and verify
            project claims before MAE authorisation. The registry below
            lists active, independently-certified verification agencies.
          </p>
          <VerificationAgencyList />
        </section>

        <section className="instruments-section">
          <h2>Roster of Experts</h2>
          <p>
            A public roster of accredited technical experts has not yet
            been established for Lao PDR&apos;s carbon market.
          </p>
        </section>

        <section className="instruments-section">
          <h2>Legal &amp; Regulatory Framework</h2>
          <p>
            Champa supports implementation of Lao PDR&apos;s Decree on Carbon
            Credits (28 May 2025), the legal instrument establishing the
            framework for authorising, registering, and overseeing carbon
            market activities in Lao PDR.
          </p>
        </section>

        <section className="instruments-section" id="module">
          <h2>Module</h2>
          <p>
            Downloadable guidance documents supporting proponents,
            verification agencies, and DNA/Ministry staff working with
            Champa.
          </p>
          <GuidanceDocumentList />
        </section>

        <section className="instruments-section">
          <h2>Source Code &amp; Technical Documentation</h2>
          <p>
            Champa is built on UNDP&apos;s open-source National Carbon
            Registry. The source code and technical documentation are
            publicly available.
          </p>
          <a
            href="https://github.com/undp/carbon-registry"
            target="_blank"
            rel="noopener noreferrer"
            className="instruments-link"
          >
            View on GitHub →
          </a>
        </section>
      </div>

      <LayoutFooter />
    </div>
  );
};

export default Instruments;

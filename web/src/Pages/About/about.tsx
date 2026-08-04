import React from "react";
import { Row, Col } from "antd";
import { useNavigate, Link } from "react-router-dom";
import LayoutFooter from "../../Components/Footer/layout.footer";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import "./about.scss";

// Static, informational "About" page mirroring SRN Indonesia's "About SRN"
// nav item. No data-driven content here by design - this is background
// context (what Champa is, who runs it, the legal basis), not a dashboard.
const About = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page-container">
      <Row>
        <Col span={24}>
          <div onClick={() => navigate("/")} className="about-header-container">
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

      <div className="about-body-container">
        <h1 className="about-title">About Champa</h1>

        <section className="about-section">
          <h2>What is Champa?</h2>
          <p>
            Champa is Lao PDR&apos;s official National Carbon Registry. It is
            used by the Ministry of Agriculture and Environment (MAE) and
            line ministries to register, authorise, monitor, and track
            carbon credit projects, adaptation initiatives, and related
            climate finance under the Decree on Carbon Credits.
          </p>
        </section>

        <section className="about-section">
          <h2>Who runs it?</h2>
          <p>
            The Ministry of Agriculture and Environment (MAE) is Lao PDR&apos;s
            Designated National Authority (DNA), responsible for the final
            authorisation and registration of carbon market activities. Line
            ministries review projects within their own sectors before MAE&apos;s
            final decision.
          </p>
        </section>

        <section className="about-section">
          <h2>What does the registry track?</h2>
          <ul>
            <li>
              <strong>Mitigation:</strong> carbon credit projects that reduce
              or remove greenhouse gas emissions, from submission through
              authorisation, credit issuance, transfer, and retirement.
            </li>
            <li>
              <strong>Adaptation:</strong> climate adaptation projects
              submitted by project developers and reviewed by MAE/line
              ministries.
            </li>
            <li>
              <strong>Resources:</strong> climate finance received
              (grants/loans), technology transfer support, and capacity
              building support recorded by MAE/line ministries.
            </li>
            <li>
              <strong>Community Climate Programs:</strong> community-level
              climate resilience and action initiatives.
            </li>
            <li>
              <strong>NDC Achievement:</strong> Lao PDR&apos;s national emission
              reduction baseline, target, and yearly achievement figures.
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Legal basis</h2>
          <p>
            Champa supports implementation of Lao PDR&apos;s Decree on Carbon
            Credits (28 May 2025), which establishes the legal framework for
            authorising, registering, and overseeing carbon market
            activities in Lao PDR.
          </p>
        </section>

        <section className="about-section">
          <h2>Open source</h2>
          <p>
            Champa is built on UNDP&apos;s open-source National Carbon
            Registry, a Digital Public Good licensed under AGPL-3.0. Read
            more on the <Link to="/">homepage</Link>.
          </p>
        </section>
      </div>

      <LayoutFooter />
    </div>
  );
};

export default About;

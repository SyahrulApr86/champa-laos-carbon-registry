import React from "react";
import { Button, Col, Dropdown, MenuProps, Row } from "antd";
import { useNavigate } from "react-router-dom";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import { ROUTES } from "../../Config/uiRoutingConfig";
import "./appHeader.scss";

// Single source of truth for the public-site navbar (logo, Home/Map/About/
// Instruments/NDC Achievement links, Sign In button). Every public page
// must render this instead of hand-copying the markup - previously
// homepage.tsx and mapPage.tsx each maintained their own near-duplicate
// header, and pages like About/Instruments/detail pages had no nav at all,
// so navigation drifted and stayed missing across the site.

const scrollToId = (navigate: (path: string) => void, id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  navigate("/");
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, 150);
};

const scrollToNdc = (navigate: (path: string) => void) => {
  const container = document.querySelector(".registry-tabs-container");
  window.location.hash = "ndc";
  if (container) {
    container.scrollIntoView({ block: "start" });
    return;
  }
  navigate("/");
  setTimeout(() => {
    document
      .querySelector(".registry-tabs-container")
      ?.scrollIntoView({ block: "start" });
  }, 150);
};

const AppHeader: React.FC = () => {
  const navigate = useNavigate();

  const aboutMenuItems: MenuProps["items"] = [
    {
      key: "about-champa",
      label: "About Champa",
      onClick: () => navigate("/about"),
    },
    {
      key: "faq",
      label: "FAQ",
      onClick: () => scrollToId(navigate, "faq"),
    },
  ];

  const instrumentsMenuItems: MenuProps["items"] = [
    {
      key: "methodology-directory",
      label: "Methodology Directory",
      onClick: () => navigate("/methodology"),
    },
    {
      key: "instruments-overview",
      label: "Instruments Overview",
      onClick: () => navigate("/instruments"),
    },
    {
      key: "vva",
      label: "Validation/Verification Agencies",
      onClick: () => navigate("/instruments#vva"),
    },
    {
      key: "module",
      label: "Module",
      onClick: () => navigate("/instruments#module"),
    },
  ];

  return (
    <Row className="app-header-row">
      <Col md={18} lg={21} xs={17} flex="auto">
        <div className="app-header-container">
          <div className="logo" onClick={() => navigate("/")}>
            <img src={sliderLogo} alt="slider-logo" />
          </div>
          <div onClick={() => navigate("/")} className="app-header-titleblock">
            <div style={{ display: "flex" }}>
              <div className="title">{"CHAMPA - LAO PDR CARBON REGISTRY"}</div>
            </div>
            <div className="country-name">
              {import.meta.env.VITE_APP_COUNTRY_NAME || "Lao PDR"}
            </div>
          </div>
          <nav className="app-header-nav-links">
            <a onClick={() => navigate("/")}>Home</a>
            <a onClick={() => navigate("/map")}>Map</a>
            <Dropdown
              menu={{ items: aboutMenuItems }}
              trigger={["click"]}
              overlayClassName="app-header-nav-dropdown"
            >
              <a onClick={(e) => e.preventDefault()}>About</a>
            </Dropdown>
            <Dropdown
              menu={{ items: instrumentsMenuItems }}
              trigger={["click"]}
              overlayClassName="app-header-nav-dropdown"
            >
              <a onClick={(e) => e.preventDefault()}>Instruments</a>
            </Dropdown>
            <a onClick={() => scrollToNdc(navigate)}>NDC Achievement</a>
          </nav>
        </div>
      </Col>
      <Col md={6} lg={3} xs={7} flex="auto">
        <div className="app-header-button-container">
          <div className="button">
            <Button type="primary" onClick={() => navigate(ROUTES.LOGIN)}>
              SIGN IN
            </Button>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default AppHeader;

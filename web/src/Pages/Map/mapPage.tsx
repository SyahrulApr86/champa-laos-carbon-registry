import React from "react";
import { Row, Col, Button } from "antd";
import { useNavigate } from "react-router-dom";
import LayoutFooter from "../../Components/Footer/layout.footer";
import MapTab from "../../Components/Homepage/MapTab";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import { ROUTES } from "../../Config/uiRoutingConfig";
import "./mapPage.scss";

// Standalone public map page, mirroring SRN Indonesia's dedicated
// /srn-home/peta route (Activity Type filter, Province search, Leaflet map,
// legend) - previously Champa's map only existed as one tab among several
// inside the homepage dashboard, with no direct link or dedicated URL.
// Header matches the homepage's own nav exactly (Home/Map/About/Instruments
// + Sign In), not a stripped-down variant, so navigation stays consistent
// across every public page.
const MapPage = () => {
  const navigate = useNavigate();

  return (
    <div className="map-page-container">
      <Row>
        <Col md={18} lg={21} xs={17} flex="auto">
          <div className="map-page-header-container">
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
            <nav className="map-page-nav-links">
              <a onClick={() => navigate("/")}>Home</a>
              <a onClick={() => navigate("/map")}>Map</a>
              <a onClick={() => navigate("/about")}>About</a>
              <a onClick={() => navigate("/instruments")}>Instruments</a>
              <a
                onClick={() => {
                  navigate("/#ndc");
                }}
              >
                NDC Achievement
              </a>
            </nav>
          </div>
        </Col>
        <Col md={6} lg={3} xs={7} flex="auto">
          <div className="map-page-button-container">
            <div className="button">
              <Button type="primary" onClick={() => navigate(ROUTES.LOGIN)}>
                SIGN IN
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <div className="map-page-body-container">
        <h1 className="map-page-title">Activity Map</h1>
        <p className="map-page-subtitle">
          Registered mitigation, adaptation, community, and REDD+ activities
          by province across Lao PDR.
        </p>

        <MapTab showLegend />
      </div>

      <LayoutFooter />
    </div>
  );
};

export default MapPage;

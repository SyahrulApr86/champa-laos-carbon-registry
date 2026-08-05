import React from "react";
import LayoutFooter from "../../Components/Footer/layout.footer";
import MapTab from "../../Components/Homepage/MapTab";
import AppHeader from "../../Components/AppHeader/appHeader";
import "./mapPage.scss";

// Standalone public map page, mirroring SRN Indonesia's dedicated
// /srn-home/peta route (Activity Type filter, Province search, Leaflet map,
// legend) - previously Champa's map only existed as one tab among several
// inside the homepage dashboard, with no direct link or dedicated URL.
// Header is the shared <AppHeader />, not a hand-copied variant, so
// navigation stays byte-for-byte consistent across every public page.
const MapPage = () => {
  return (
    <div className="map-page-container">
      <AppHeader />

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

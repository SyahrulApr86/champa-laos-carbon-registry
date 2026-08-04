import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { MapboxComponent } from "../Maps/mapboxComponent";
import { MapTypes } from "../../Definitions/Definitions/mapComponent.definitions";
import "./Dashboard.scss";

interface ProvinceMapSummary {
  province: string;
  projectCount: number;
  lat: number;
  lng: number;
}

// Diameter (px) of a province marker badge, proportional to project count
// and clamped so it stays legible at both ends of the range.
const markerDiameter = (projectCount: number) =>
  Math.max(24, Math.min(56, 20 + projectCount * 6));

// mapComponent.definitions.tsx types MarkerData.element as a raw HTMLElement
// (mapboxComponent.tsx passes it straight into `new mapboxgl.Marker({ element })`),
// so the count badge is built imperatively instead of as a React node.
const buildMarkerElement = (projectCount: number): HTMLElement => {
  const diameter = markerDiameter(projectCount);
  const el = document.createElement("div");
  el.className = "map-tab-marker";
  el.textContent = String(projectCount);
  el.style.width = `${diameter}px`;
  el.style.height = `${diameter}px`;
  el.style.borderRadius = "50%";
  el.style.background = "#0D2E63";
  el.style.color = "#ffffff";
  el.style.fontWeight = "bold";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.border = "2px solid #ffffff";
  el.style.boxShadow = "0 1px 4px rgba(0, 0, 0, 0.4)";
  el.style.cursor = "pointer";
  return el;
};

const LAO_PDR_CENTER: [number, number] = [102.6, 18.2];
const accessToken = import.meta.env.VITE_APP_MAPBOXGL_ACCESS_TOKEN || "";

const MapTab = () => {
  const { get } = useConnection();
  const [mapSummary, setMapSummary] = useState<ProvinceMapSummary[]>([]);

  useEffect(() => {
    const fetchMapSummary = async () => {
      try {
        const response = await get(API_PATHS.PROJECT_MAP_SUMMARY);
        const data = response?.data as ProvinceMapSummary[] | undefined;
        setMapSummary(data ?? []);
      } catch (error) {
        setMapSummary([]);
      }
    };

    fetchMapSummary();
  }, [get]);

  const sortedByCount = [...mapSummary].sort(
    (a, b) => b.projectCount - a.projectCount
  );

  const columns = [
    {
      title: "Province",
      dataIndex: "province",
      key: "province",
    },
    {
      title: "Projects",
      dataIndex: "projectCount",
      key: "projectCount",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="registry-table-section">
        <h3 className="section-title">Projects by Province</h3>

        {mapSummary.length === 0 ? (
          <p>No geolocated projects registered yet.</p>
        ) : (
          <>
            <MapboxComponent
              mapType={MapTypes.Mapbox}
              accessToken={accessToken}
              center={LAO_PDR_CENTER}
              zoom={6}
              height={500}
              style="mapbox://styles/mapbox/light-v11"
              markers={mapSummary.map((entry) => ({
                location: [entry.lng, entry.lat],
                color: "#0D2E63",
                element: buildMarkerElement(entry.projectCount),
              }))}
            />

            <Table
              rowKey="province"
              columns={columns}
              dataSource={sortedByCount}
              pagination={false}
              style={{ marginTop: "1.5rem" }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MapTab;

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input, Select, Table } from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./Dashboard.scss";

interface ProvinceMapSummary {
  province: string;
  projectCount: number;
  lat: number;
  lng: number;
}

// Mirrors SRN Indonesia's own map "Activity Type" dropdown (Mitigasi /
// Adaptasi / Proklim), plus REDD+ - the fourth domain Champa tracks with
// its own province-scoped registry. Values match the backend's
// ProgrammeService.getPublicMapSummary activityType switch.
const ACTIVITY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "mitigation", label: "Mitigation" },
  { value: "adaptation", label: "Adaptation" },
  { value: "community", label: "Community Programs" },
  { value: "redd", label: "REDD+" },
];

// Diameter (px) of a province marker badge, proportional to project count
// and clamped so it stays legible at both ends of the range.
const markerDiameter = (projectCount: number) =>
  Math.max(24, Math.min(56, 20 + projectCount * 6));

const LAO_PDR_CENTER: [number, number] = [18.2, 102.6]; // Leaflet uses [lat, lng]

// Public, unauthenticated province-level activity map. Uses Leaflet +
// OpenStreetMap - the same free, no-API-key stack Indonesia's SRN registry
// itself uses for its map page - instead of Mapbox, which requires a paid
// access token this deployment never had configured.
const MapTab = () => {
  const { get } = useConnection();
  const [activityType, setActivityType] = useState("mitigation");
  const [mapSummary, setMapSummary] = useState<ProvinceMapSummary[]>([]);
  const [provinceSearch, setProvinceSearch] = useState("");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const fetchMapSummary = async () => {
      try {
        const response = await get(API_PATHS.PROJECT_MAP_SUMMARY(activityType));
        const data = response?.data as ProvinceMapSummary[] | undefined;
        setMapSummary(data ?? []);
      } catch (error) {
        setMapSummary([]);
      }
    };

    fetchMapSummary();
  }, [get, activityType]);

  // Champa's map plots province-level aggregates, not individual activity
  // points (unlike SRN Indonesia's per-activity marker + search), so
  // "Search Activities" is an honest client-side filter over the visible
  // province list/markers rather than a fabricated per-activity search.
  const filteredSummary = useMemo(() => {
    const query = provinceSearch.trim().toLowerCase();
    if (!query) {
      return mapSummary;
    }
    return mapSummary.filter((entry) =>
      entry.province.toLowerCase().includes(query)
    );
  }, [mapSummary, provinceSearch]);

  useEffect(() => {
    if (!mapContainerRef.current || filteredSummary.length === 0) {
      return;
    }

    const map = L.map(mapContainerRef.current).setView(LAO_PDR_CENTER, 6);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    filteredSummary.forEach((entry) => {
      const diameter = markerDiameter(entry.projectCount);
      const icon = L.divIcon({
        className: "map-tab-marker-wrapper",
        html: `<div class="map-tab-marker" style="width:${diameter}px;height:${diameter}px;">${entry.projectCount}</div>`,
        iconSize: [diameter, diameter],
        iconAnchor: [diameter / 2, diameter / 2],
      });

      L.marker([entry.lat, entry.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${entry.province}</strong><br/>${entry.projectCount} project(s)`);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [filteredSummary]);

  const sortedByCount = [...filteredSummary].sort(
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

        <div
          className="map-tab-filters"
          style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}
        >
          <Select
            value={activityType}
            onChange={(value) => setActivityType(value)}
            style={{ minWidth: 220 }}
            options={ACTIVITY_TYPE_OPTIONS}
            aria-label="Activity Type"
          />
          <Input.Search
            allowClear
            placeholder="Search Activities"
            value={provinceSearch}
            onChange={(event) => setProvinceSearch(event.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>

        {mapSummary.length === 0 ? (
          <p>No geolocated projects registered yet.</p>
        ) : filteredSummary.length === 0 ? (
          <p>No provinces match &quot;{provinceSearch}&quot;.</p>
        ) : (
          <>
            <div
              ref={mapContainerRef}
              className="map-tab-leaflet-container"
              style={{ height: 500, borderRadius: 12, overflow: "hidden" }}
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

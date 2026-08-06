import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Empty, Input, Select, Spin, Table } from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./MapTab.scss";

type ActivityType = "mitigation" | "adaptation" | "community" | "redd";

interface MapFeature {
  recordId: string;
  activityType: ActivityType;
  title: string;
  province: string | null;
  sector: string | null;
  coordinateStatus: "plotted";
  coordinates: [number, number];
  aggregation: "individual_activity_feature";
}

interface MapMeta {
  received_count: number;
  plotted_count: number;
  excluded_count: number;
  exclusions: {
    missing_coordinates: number;
    withheld: number;
    invalid: number;
  };
  availability: "available" | "not_available";
  disclosure: string;
  filters: Record<string, string | null>;
}

interface MapPayload {
  features: MapFeature[];
  legend: Array<{
    activityType: ActivityType;
    receivedCount: number;
    plottedCount: number;
    excludedCount: number;
  }>;
}

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "mitigation", label: "Mitigation" },
  { value: "adaptation", label: "Adaptation" },
  { value: "community", label: "Community Climate Actions" },
  { value: "redd", label: "REDD+ Forest Carbon" },
];

const LAO_PROVINCES = [
  "Attapeu",
  "Bokeo",
  "Bolikhamxay",
  "Champasak",
  "Houaphanh",
  "Khammouane",
  "Luang Namtha",
  "Luang Prabang",
  "Oudomxay",
  "Phongsaly",
  "Salavan",
  "Savannakhet",
  "Sekong",
  "Vientiane Capital",
  "Vientiane Province",
  "Xaisomboun",
  "Xayabouly",
  "Xieng Khouang",
];

const LAO_PDR_CENTER: [number, number] = [18.2, 102.6];

const markerDiameter = (featureCount: number) =>
  Math.max(24, Math.min(56, 20 + featureCount * 6));

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });

const MapTab = ({ showLegend = false }: { showLegend?: boolean }) => {
  const { get } = useConnection();
  const [activityType, setActivityType] = useState<ActivityType>("mitigation");
  const [province, setProvince] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [payload, setPayload] = useState<MapPayload>({ features: [], legend: [] });
  const [meta, setMeta] = useState<MapMeta | null>(null);
  const [legend, setLegend] = useState<MapMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchMap = async () => {
      setLoading(true);
      setError(false);
      try {
        const basePath = API_PATHS.PROJECT_MAP_SUMMARY(activityType);
        const params = new URLSearchParams();
        if (province) params.set("province", province);
        if (search.trim()) params.set("search", search.trim());
        const response = await get(`${basePath}${params.toString() ? `&${params}` : ""}`);
        if (cancelled) return;
        const nextPayload = (response?.data as MapPayload) ?? {
          features: [],
          legend: [],
        };
        setPayload(nextPayload);
        setMeta((response?.response?.data?.meta as MapMeta) ?? null);
      } catch {
        if (!cancelled) {
          setPayload({ features: [], legend: [] });
          setMeta(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMap();
    return () => {
      cancelled = true;
    };
  }, [get, activityType, province, search]);

  useEffect(() => {
    if (!showLegend) return;
    let cancelled = false;
    const fetchLegend = async () => {
      const results = await Promise.all(
        ACTIVITY_TYPE_OPTIONS.map(async (option) => {
          try {
            const response = await get(API_PATHS.PROJECT_MAP_SUMMARY(option.value));
            return (response?.response?.data?.meta as MapMeta) ?? null;
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) setLegend(results.filter((entry): entry is MapMeta => !!entry));
    };
    fetchLegend();
    return () => {
      cancelled = true;
    };
  }, [get, showLegend]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || payload.features.length === 0) return undefined;

    const map = L.map(container).setView(LAO_PDR_CENTER, 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const byProvince = payload.features.reduce<Record<string, MapFeature[]>>(
      (groups, feature) => {
        const key = feature.province ?? "Not available";
        groups[key] = [...(groups[key] ?? []), feature];
        return groups;
      },
      {}
    );
    Object.entries(byProvince).forEach(([provinceName, features]) => {
      const [lng, lat] = features[0].coordinates;
      const diameter = markerDiameter(features.length);
      const icon = L.divIcon({
        className: "map-tab-marker-wrapper",
        html: `<div class="map-tab-marker" style="width:${diameter}px;height:${diameter}px;">${features.length}</div>`,
        iconSize: [diameter, diameter],
        iconAnchor: [diameter / 2, diameter / 2],
      });
      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(
          `<strong>${escapeHtml(provinceName)}</strong><br/>${features.length} plotted activity feature(s)`
        );
    });
    return () => {
      map.remove();
    };
  }, [payload.features]);

  const tableData = useMemo(
    () => payload.features.map((feature) => ({ ...feature, key: feature.recordId })),
    [payload.features]
  );
  const columns = [
    { title: "Activity", dataIndex: "title", key: "title" },
    { title: "Province", dataIndex: "province", key: "province", render: (value: string | null) => value ?? "Not available" },
    { title: "Sector", dataIndex: "sector", key: "sector", render: (value: string | null) => value ?? "Not applicable" },
    { title: "Coordinates", key: "coordinates", render: (_: unknown, feature: MapFeature) => feature.coordinates.join(", ") },
  ];

  return (
    <div className="map-tab-container">
      <div className="registry-table-section">
        <h3 className="section-title">Activity Map</h3>
        <p className="registry-table-subtitle">
          Individual activity features plotted against Lao PDR province geography. Province aggregates are not individual points.
        </p>
        <p className="map-tab-disclosure">
          {meta?.disclosure ?? "Synthetic demonstration data, not official Lao PDR statistics or activity records."}
        </p>

        <div className="map-tab-filters">
          <Select
            value={activityType}
            onChange={setActivityType}
            options={ACTIVITY_TYPE_OPTIONS}
            aria-label="Activity Type"
          />
          <Select
            allowClear
            value={province}
            onChange={setProvince}
            options={LAO_PROVINCES.map((item) => ({ value: item, label: item }))}
            placeholder="All Lao PDR provinces"
            aria-label="Province"
          />
          <Input.Search
            allowClear
            placeholder="Search Activities"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search Activities"
          />
        </div>

        {meta && (
          <div className="map-tab-count-grid" aria-label="Map feature counts">
            <div><span>Received</span><strong>{meta.received_count.toLocaleString()}</strong></div>
            <div><span>Plotted</span><strong>{meta.plotted_count.toLocaleString()}</strong></div>
            <div><span>Excluded</span><strong>{meta.excluded_count.toLocaleString()}</strong></div>
            <div><span>Missing coordinates</span><strong>{meta.exclusions.missing_coordinates.toLocaleString()}</strong></div>
            <div><span>Invalid geography</span><strong>{meta.exclusions.invalid.toLocaleString()}</strong></div>
            <div><span>Withheld</span><strong>{meta.exclusions.withheld.toLocaleString()}</strong></div>
          </div>
        )}

        {showLegend && (
          <div className="map-tab-legend">
            <h4 className="map-tab-legend-title">Activity legend</h4>
            {legend.map((entry) => (
              <div key={entry.filters.activityType} className="map-tab-legend-item">
                <span>{entry.filters.activityType}</span>
                <span>{entry.received_count.toLocaleString()} received / {entry.plotted_count.toLocaleString()} plotted</span>
              </div>
            ))}
          </div>
        )}

        {error && <Alert type="error" message="Map data could not be loaded." showIcon />}
        {loading && <div className="map-tab-state"><Spin /> <span>Loading map features…</span></div>}
        {!loading && !error && meta?.availability === "not_available" && (
          <Empty description="No activity features match the selected filters." />
        )}
        {!loading && !error && payload.features.length > 0 && (
          <>
            <div ref={mapContainerRef} className="map-tab-leaflet-container" />
            <Table rowKey="key" columns={columns} dataSource={tableData} pagination={{ pageSize: 10 }} />
          </>
        )}
        {!loading && !error && payload.features.length === 0 && meta?.excluded_count > 0 && (
          <Empty description="Records were received, but none can be plotted with the available public coordinates." />
        )}
      </div>
    </div>
  );
};

export default MapTab;

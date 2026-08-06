import React, { useEffect, useMemo, useState } from "react";
import { Alert, Card, Empty, Modal, Select, Spin } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./Dashboard.scss";
import "./ReddPlusTab.scss";

interface ReddMetric {
  value: number | null;
  unit: "ha" | "tCO2e";
  availability: "available" | "not_available";
  qualityStatus: "observed" | "estimated_demo" | "not_available";
}

interface ReddPlusProvinceSummary {
  province: string;
  lat: number | null;
  lng: number | null;
  projectCount: number;
  forestArea: ReddMetric;
  estimatedReduction: ReddMetric;
  overlapStatus: "unknown" | "non_overlapping";
}

interface ReddResponse {
  scope: "national" | "province";
  selectedProvince: string | null;
  national: {
    projectCount: number;
    forestArea: ReddMetric;
    estimatedReduction: ReddMetric;
    overlapStatus: "unknown" | "non_overlapping";
  };
  provinces: ReddPlusProvinceSummary[];
}

interface ReddMeta {
  disclosure: string;
  as_of: string;
  source: { label: string };
  methodology_version: string;
  geography: { country: string; provinceCount: number };
}

const formatMetric = (metric: ReddMetric) =>
  metric.value === null ? "Not available" : `${metric.value.toLocaleString()} ${metric.unit}`;

const metricState = (metric: ReddMetric) =>
  metric.availability === "not_available" ? "not-available" : "available";

const ReddPlusTab = () => {
  const { get } = useConnection();
  const [data, setData] = useState<ReddResponse | null>(null);
  const [meta, setMeta] = useState<ReddMeta | null>(null);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>();
  const [selectedProvince, setSelectedProvince] = useState<ReddPlusProvinceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await get(API_PATHS.REDD_PLUS_PUBLIC_BY_PROVINCE);
        if (cancelled) return;
        setData((response?.data as ReddResponse) ?? null);
        setMeta((response?.response?.data?.meta as ReddMeta) ?? null);
      } catch {
        if (!cancelled) {
          setData(null);
          setMeta(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [get]);

  const provinces = data?.provinces ?? [];
  const selected = useMemo(
    () => provinces.find((province) => province.province === selectedProvinceName) ?? null,
    [provinces, selectedProvinceName]
  );

  return (
    <div className="dashboard-container">
      <div className="registry-table-section">
        <h3 className="section-title">REDD+ Forest Carbon: National and Province View</h3>
        <p className="registry-table-subtitle">
          Capability view only. It does not assert an official Lao PDR REDD+ programme or forest inventory.
        </p>
        <p className="redd-plus-disclosure">
          {meta?.disclosure ?? "Synthetic demonstration data, not official Lao PDR REDD+ statistics."}
        </p>

        {loading && <div className="redd-plus-state"><Spin /> <span>Loading REDD+ geography…</span></div>}
        {error && <Alert type="error" showIcon message="REDD+ data could not be loaded." />}
        {!loading && !error && !data && <Empty description="REDD+ data is not available." />}

        {!loading && !error && data && (
          <>
            <div className="redd-plus-national-card">
              <div>
                <span className="redd-plus-card-label">National scope</span>
                <strong>{data.national.projectCount.toLocaleString()}</strong>
                <span>actions recorded across {meta?.geography.provinceCount ?? provinces.length} Lao PDR provinces</span>
              </div>
              <div className="redd-plus-national-metric">
                <span>Forest area</span>
                <strong className={metricState(data.national.forestArea)}>{formatMetric(data.national.forestArea)}</strong>
              </div>
              <div className="redd-plus-national-metric">
                <span>Estimated reduction</span>
                <strong className={metricState(data.national.estimatedReduction)}>{formatMetric(data.national.estimatedReduction)}</strong>
              </div>
              <div className="redd-plus-national-metric">
                <span>Overlap status</span>
                <strong>{data.national.overlapStatus === "unknown" ? "Unknown" : "Non-overlapping"}</strong>
              </div>
            </div>

            <div className="redd-plus-filter-row">
              <label htmlFor="redd-province-filter">Province scope</label>
              <Select
                id="redd-province-filter"
                allowClear
                value={selectedProvinceName}
                onChange={setSelectedProvinceName}
                placeholder="National / all provinces"
                options={provinces.map((province) => ({ value: province.province, label: province.province }))}
              />
              {selected && <span>Selected: {selected.province}</span>}
            </div>

            <div className="redd-plus-metadata-strip">
              <span>Source: {meta?.source.label ?? "Not available"}</span>
              <span>Methodology: {meta?.methodology_version ?? "Not available"}</span>
              <span>As of: {meta?.as_of ?? "Not available"}</span>
            </div>

            {provinces.length === 0 ? (
              <Empty description="No province geography is configured." />
            ) : (
              <div className="cards-grid cards-grid-4">
                {provinces
                  .filter((province) => !selectedProvinceName || province.province === selectedProvinceName)
                  .map((province) => (
                    <Card
                      key={province.province}
                      hoverable
                      className={province.projectCount > 0 ? "redd-plus-province-card has-projects" : "redd-plus-province-card"}
                      onClick={() => setSelectedProvince(province)}
                    >
                      <h4 className="redd-plus-province-name">{province.province}</h4>
                      <div className="redd-plus-province-stat"><span>Actions</span><strong>{province.projectCount.toLocaleString()}</strong></div>
                      <div className="redd-plus-province-stat"><span>Forest area</span><strong className={metricState(province.forestArea)}>{formatMetric(province.forestArea)}</strong></div>
                      <div className="redd-plus-province-stat"><span>Estimated reduction</span><strong className={metricState(province.estimatedReduction)}>{formatMetric(province.estimatedReduction)}</strong></div>
                      <div className="redd-plus-province-status">Overlap: {province.overlapStatus === "unknown" ? "Unknown" : "Non-overlapping"}</div>
                    </Card>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal title={selectedProvince?.province} open={!!selectedProvince} onCancel={() => setSelectedProvince(null)} footer={null}>
        {selectedProvince && (
          <div className="redd-plus-province-detail">
            <p><strong>Actions:</strong> {selectedProvince.projectCount.toLocaleString()}</p>
            <p><strong>Forest area:</strong> {formatMetric(selectedProvince.forestArea)}</p>
            <p><strong>Estimated reduction:</strong> {formatMetric(selectedProvince.estimatedReduction)}</p>
            <p><strong>Overlap status:</strong> {selectedProvince.overlapStatus === "unknown" ? "Unknown. Public geometry is not available for a non-overlap claim." : "Non-overlapping"}</p>
            <p><strong>Coordinates:</strong> {selectedProvince.lat === null || selectedProvince.lng === null ? "Not available" : `${selectedProvince.lat.toFixed(4)}, ${selectedProvince.lng.toFixed(4)}`}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReddPlusTab;

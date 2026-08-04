import React, { useEffect, useState } from "react";
import { Card, Empty, Modal } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./Dashboard.scss";

interface ReddPlusProvinceSummary {
  province: string;
  lat: number | null;
  lng: number | null;
  projectCount: number;
  totalForestAreaHectares: number;
  totalEstimatedEmissionReductionTco2e: number;
}

const numberOrDash = (value: number | null | undefined) =>
  value === null || value === undefined || value === 0
    ? "—"
    : value.toLocaleString();

// Public, unauthenticated REDD+ (forest carbon) province grid - mirrors
// Indonesia's SRN REDD++ sub-tab under Mitigation, which shows a grid of
// province cards clickable to province-specific REDD+ data. Scoped
// honestly to Lao PDR's real 18 provinces (backend/services/regions.csv);
// provinces with no recorded REDD+ entries show an honest empty state
// rather than a fabricated number.
const ReddPlusTab = () => {
  const { get } = useConnection();
  const [summary, setSummary] = useState<ReddPlusProvinceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] =
    useState<ReddPlusProvinceSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await get(API_PATHS.REDD_PLUS_PUBLIC_BY_PROVINCE);
        const data = (response?.data as ReddPlusProvinceSummary[]) ?? [];
        setSummary(data);
      } catch (error) {
        setSummary([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [get]);

  const totalProjects = summary.reduce(
    (sum, province) => sum + province.projectCount,
    0
  );

  return (
    <div className="dashboard-container">
      <div className="registry-table-section">
        <h3 className="section-title">REDD+ Forest Carbon by Province</h3>
        <p className="registry-table-subtitle">
          {totalProjects > 0
            ? `${totalProjects} REDD+ project${
                totalProjects === 1 ? "" : "s"
              } recorded across Lao PDR's 18 provinces.`
            : "No REDD+ projects recorded yet. Provinces are shown below with an honest empty state until DNA/Ministry record real entries."}
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : summary.length === 0 ? (
          <Empty description="No province data available." />
        ) : (
          <div className="cards-grid cards-grid-4">
            {summary.map((province) => (
              <Card
                key={province.province}
                hoverable
                className={
                  province.projectCount > 0
                    ? "redd-plus-province-card has-projects"
                    : "redd-plus-province-card"
                }
                onClick={() => setSelectedProvince(province)}
              >
                <h4 className="redd-plus-province-name">
                  {province.province}
                </h4>
                <div className="redd-plus-province-stat">
                  <span className="redd-plus-province-stat-label">
                    Projects
                  </span>
                  <span className="redd-plus-province-stat-value">
                    {province.projectCount}
                  </span>
                </div>
                <div className="redd-plus-province-stat">
                  <span className="redd-plus-province-stat-label">
                    Forest Area (ha)
                  </span>
                  <span className="redd-plus-province-stat-value">
                    {numberOrDash(province.totalForestAreaHectares)}
                  </span>
                </div>
                <div className="redd-plus-province-stat">
                  <span className="redd-plus-province-stat-label">
                    Est. Reduction (tCO2e)
                  </span>
                  <span className="redd-plus-province-stat-value">
                    {numberOrDash(
                      province.totalEstimatedEmissionReductionTco2e
                    )}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        title={selectedProvince?.province}
        open={!!selectedProvince}
        onCancel={() => setSelectedProvince(null)}
        footer={null}
      >
        {selectedProvince &&
          (selectedProvince.projectCount === 0 ? (
            <Empty description="No REDD+ projects recorded in this province yet." />
          ) : (
            <div className="redd-plus-province-detail">
              <p>
                <strong>REDD+ projects:</strong>{" "}
                {selectedProvince.projectCount}
              </p>
              <p>
                <strong>Total forest area:</strong>{" "}
                {numberOrDash(selectedProvince.totalForestAreaHectares)}{" "}
                hectares
              </p>
              <p>
                <strong>Total estimated emission reduction:</strong>{" "}
                {numberOrDash(
                  selectedProvince.totalEstimatedEmissionReductionTco2e
                )}{" "}
                tCO2e
              </p>
              {selectedProvince.lat !== null &&
                selectedProvince.lng !== null && (
                  <p>
                    <strong>Coordinates:</strong>{" "}
                    {selectedProvince.lat.toFixed(4)},{" "}
                    {selectedProvince.lng.toFixed(4)}
                  </p>
                )}
            </div>
          ))}
      </Modal>
    </div>
  );
};

export default ReddPlusTab;

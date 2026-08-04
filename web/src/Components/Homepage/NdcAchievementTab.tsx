import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { COLOR_CONFIGS } from "../../Config/colorConfigs";
import { NdcSector } from "../../Definitions/Enums/ndcSector.enum";
import "./Dashboard.scss";

interface NdcTargetSummary {
  latestYear: number | null;
  baselineEmissions: number;
  targetEmissions2030: number;
  achievedEmissions: number;
  contributionPercent: number;
}

interface NdcTargetSeriesPoint {
  year: number;
  baselineEmissions: number;
  achievedEmissions: number;
  claimedEmissions: number | null;
}

const emptySummary: NdcTargetSummary = {
  latestYear: null,
  baselineEmissions: 0,
  targetEmissions2030: 0,
  achievedEmissions: 0,
  contributionPercent: 0,
};

type SectorTabKey = "All" | NdcSector;

const SECTOR_TABS: { key: SectorTabKey; label: string }[] = [
  { key: "All", label: "All" },
  { key: NdcSector.ENERGY, label: "Energy" },
  { key: NdcSector.IPPU, label: "IPPU" },
  { key: NdcSector.AGRICULTURE, label: "Agriculture" },
  { key: NdcSector.FORESTRY, label: "Forestry" },
  { key: NdcSector.WASTE, label: "Waste" },
];

// NDC (Nationally Determined Contribution) Achievement tab - mirrors
// Indonesia's SRN "NDC Achievement" page: an "All" aggregate plus 5 real
// sector tabs (Energy/IPPU/Agriculture/Forestry/Waste), each showing
// baseline emissions, the current emission level, the emission reduction
// achieved, the % contribution toward the 2030 target, and the 2030 target
// itself, plus 2 yearly trend charts. Pre-release: all figures are dummy
// placeholder data entered by DNA/Ministry through the record form, never
// hardcoded here.
const NdcAchievementTab = () => {
  const { get } = useConnection();
  const [activeSector, setActiveSector] = useState<SectorTabKey>("All");
  const [summary, setSummary] = useState<NdcTargetSummary>(emptySummary);
  const [series, setSeries] = useState<NdcTargetSeriesPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const sectorParam = activeSector === "All" ? undefined : activeSector;

    const fetchData = async () => {
      try {
        const summaryResponse = await get<NdcTargetSummary>(
          API_PATHS.NDC_TARGET_PUBLIC_SUMMARY(sectorParam)
        );
        if (cancelled) return;
        setSummary({
          latestYear: summaryResponse?.data?.latestYear ?? null,
          baselineEmissions: summaryResponse?.data?.baselineEmissions ?? 0,
          targetEmissions2030:
            summaryResponse?.data?.targetEmissions2030 ?? 0,
          achievedEmissions: summaryResponse?.data?.achievedEmissions ?? 0,
          contributionPercent:
            summaryResponse?.data?.contributionPercent ?? 0,
        });
      } catch (error) {
        console.log("Error fetching NDC target public summary", error);
        if (!cancelled) setSummary(emptySummary);
      }

      try {
        const seriesResponse = await get<NdcTargetSeriesPoint[]>(
          API_PATHS.NDC_TARGET_PUBLIC_SERIES(sectorParam)
        );
        if (cancelled) return;
        setSeries(seriesResponse?.data ?? []);
      } catch (error) {
        console.log("Error fetching NDC target public series", error);
        if (!cancelled) setSeries([]);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [get, activeSector]);

  const emissionLevel = summary.achievedEmissions;
  const emissionReduction =
    summary.baselineEmissions - summary.achievedEmissions;

  const years = series.map((point) => point.year);
  const baselineSeries = series.map((point) => point.baselineEmissions);
  const emissionLevelSeries = series.map((point) => point.achievedEmissions);
  const verifiedReductionSeries = series.map(
    (point) => point.baselineEmissions - point.achievedEmissions
  );
  const hasAnyClaimed = series.some(
    (point) => point.claimedEmissions !== null
  );
  const claimedReductionSeries = series.map((point) =>
    point.claimedEmissions === null
      ? null
      : point.baselineEmissions - point.claimedEmissions
  );

  return (
    <div className="dashboard-container">
      <section className="section">
        <h3 className="section-title">NDC Achievement</h3>

        <div className="ndc-sector-tabs-nav">
          {SECTOR_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ndc-sector-tab-button ${
                activeSector === tab.key ? "active" : ""
              }`}
              onClick={() => setActiveSector(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {summary.latestYear === null ? (
          <p className="registry-table-subtitle">
            No NDC target data has been recorded yet.
          </p>
        ) : (
          <>
            <div className="donut-grid">
              <div className="donut-card">
                <div className="main-statistic">
                  <div className="statistic-value">
                    {summary.baselineEmissions.toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    Baseline Emissions (MtCO2e)
                  </div>
                </div>
              </div>
              <div className="donut-card">
                <div className="main-statistic">
                  <div className="statistic-value">
                    {emissionLevel.toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    Emission Level — {summary.latestYear} (MtCO2e)
                  </div>
                </div>
              </div>
              <div className="donut-card">
                <div className="main-statistic">
                  <div className="statistic-value">
                    {emissionReduction.toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    Emission Reduction (MtCO2e)
                  </div>
                </div>
              </div>
              <div className="donut-card">
                <div className="main-statistic">
                  <div className="statistic-value">
                    {summary.contributionPercent.toFixed(1)}%
                  </div>
                  <div className="statistic-title">
                    NDC Target Achievement Contribution
                  </div>
                </div>
              </div>
              <div className="donut-card">
                <div className="main-statistic">
                  <div className="statistic-value">
                    {summary.targetEmissions2030.toLocaleString()}
                  </div>
                  <div className="statistic-title">2030 Target (MtCO2e)</div>
                </div>
              </div>
            </div>

            {series.length >= 2 && (
              <div className="donut-grid">
                <div className="donut-card">
                  <h4 className="section-title">
                    Inventory - Emission Trend from Baseline: Total{" "}
                    {activeSector === "All" ? "All Sectors" : activeSector}
                  </h4>
                  <Chart
                    type="area"
                    height={320}
                    options={{
                      chart: { toolbar: { show: false } },
                      xaxis: { categories: years },
                      yaxis: { title: { text: "MtCO2e" } },
                      dataLabels: { enabled: false },
                      colors: [
                        COLOR_CONFIGS.PRIMARY_RED_COLOR,
                        COLOR_CONFIGS.PRIMARY_THEME_COLOR,
                      ],
                      stroke: { curve: "smooth", width: 2 },
                    }}
                    series={[
                      {
                        name: "Baseline Emissions",
                        data: baselineSeries,
                      },
                      {
                        name: "Achieved/Actual Emission Level",
                        data: emissionLevelSeries,
                      },
                    ]}
                  />
                </div>

                <div className="donut-card">
                  <h4 className="section-title">
                    Mitigation Actions - Emission Reduction Achievement
                  </h4>
                  <Chart
                    type="bar"
                    height={320}
                    options={{
                      chart: { toolbar: { show: false } },
                      xaxis: { categories: years },
                      yaxis: { title: { text: "MtCO2e" } },
                      dataLabels: { enabled: false },
                      legend: { show: hasAnyClaimed },
                      colors: hasAnyClaimed
                        ? [
                            COLOR_CONFIGS.ACCENT_GOLD_COLOR,
                            COLOR_CONFIGS.PRIMARY_THEME_COLOR,
                          ]
                        : [COLOR_CONFIGS.PRIMARY_THEME_COLOR],
                    }}
                    series={
                      hasAnyClaimed
                        ? [
                            {
                              name: "Claimed Emission Reduction",
                              data: claimedReductionSeries,
                            },
                            {
                              name: "Verified Emission Reduction",
                              data: verifiedReductionSeries,
                            },
                          ]
                        : [
                            {
                              name: "Verified Emission Reduction",
                              data: verifiedReductionSeries,
                            },
                          ]
                    }
                  />
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default NdcAchievementTab;

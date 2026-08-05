import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Alert, Empty, Spin } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { COLOR_CONFIGS } from "../../Config/colorConfigs";
import { NdcSector } from "../../Definitions/Enums/ndcSector.enum";
import "./Dashboard.scss";
import "./NdcAchievementTab.scss";

interface NdcTargetSummary {
  latestYear: number | null;
  baselineEmissions: number | null;
  targetEmissions2030: number | null;
  achievedEmissions: number | null;
  verifiedReduction: number | null;
  contributionPercent: number | null;
}

interface NdcTargetSeriesPoint {
  year: number;
  baselineEmissions: number | null;
  achievedEmissions: number | null;
  claimedEmissions: number | null;
  verifiedReduction: number | null;
  unit: "tCO2e";
  scale: "canonical";
  verificationStatus: "claimed_and_verified" | "verified_only" | "not_available";
}

interface NdcMeta {
  as_of: string;
  period: { start: string; end: string };
  source: { label: string };
  methodology_version: string;
  unit: string;
  scale: string;
  availability: "available" | "not_available";
  disclosure: string;
  aggregation?: string;
}

const emptySummary: NdcTargetSummary = {
  latestYear: null,
  baselineEmissions: null,
  targetEmissions2030: null,
  achievedEmissions: null,
  verifiedReduction: null,
  contributionPercent: null,
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

const formatMetric = (value: number | null, digits = 2) =>
  value === null || value === undefined
    ? "Not available"
    : new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
      }).format(value);

const NdcAchievementTab = () => {
  const { get } = useConnection();
  const [activeSector, setActiveSector] = useState<SectorTabKey>("All");
  const [summary, setSummary] = useState<NdcTargetSummary>(emptySummary);
  const [series, setSeries] = useState<NdcTargetSeriesPoint[]>([]);
  const [meta, setMeta] = useState<NdcMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sectorParam = activeSector === "All" ? undefined : activeSector;
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const [summaryResponse, seriesResponse] = await Promise.all([
          get<NdcTargetSummary>(API_PATHS.NDC_TARGET_PUBLIC_SUMMARY(sectorParam)),
          get<NdcTargetSeriesPoint[]>(API_PATHS.NDC_TARGET_PUBLIC_SERIES(sectorParam)),
        ]);
        if (cancelled) return;
        setSummary(summaryResponse?.data ?? emptySummary);
        setSeries(seriesResponse?.data ?? []);
        setMeta(
          (summaryResponse?.response?.data?.meta as NdcMeta) ??
            (seriesResponse?.response?.data?.meta as NdcMeta) ??
            null
        );
      } catch {
        if (!cancelled) {
          setSummary(emptySummary);
          setSeries([]);
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
  }, [get, activeSector]);

  const sectorLabel = SECTOR_TABS.find((tab) => tab.key === activeSector)?.label ?? activeSector;
  const hasData = !loading && !error && (meta?.availability === "available" || series.length > 0);
  const years = useMemo(() => series.map((point) => point.year), [series]);
  const hasAnyClaimed = series.some((point) => point.claimedEmissions !== null);
  const claimedReductionSeries = series.map((point) =>
    point.claimedEmissions === null || point.baselineEmissions === null
      ? null
      : point.baselineEmissions - point.claimedEmissions
  );
  const verifiedReductionSeries = series.map((point) => point.verifiedReduction);

  return (
    <div className="dashboard-container">
      <section className="section">
        <h3 className="section-title">NDC Achievement — {sectorLabel}</h3>
        <p className="ndc-disclosure">
          {meta?.disclosure ?? "Synthetic demonstration data — not official Lao PDR NDC statistics."}
        </p>
        <div className="ndc-pill-tabs-nav" role="tablist" aria-label="NDC sector">
          {SECTOR_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ndc-pill-tab-button ${activeSector === tab.key ? "active" : ""}`}
              onClick={() => setActiveSector(tab.key)}
              role="tab"
              aria-selected={activeSector === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <div className="ndc-state"><Spin /> <span>Loading NDC observations…</span></div>}
        {error && <Alert type="error" showIcon message="NDC data could not be loaded." />}
        {!loading && !error && !hasData && (
          <Empty description={`No NDC observations are available for ${sectorLabel}.`} />
        )}

        {hasData && (
          <>
            <div className="ndc-kpi-row">
              <div className="ndc-kpi-card">
                <h4 className="ndc-kpi-card-title">Verified Emission Reduction</h4>
                <p className="ndc-kpi-card-subtitle">Latest available observation ({summary.latestYear ?? "Not available"})</p>
                <div className="ndc-kpi-card-value">{formatMetric(summary.verifiedReduction)} <span className="ndc-kpi-card-unit">tCO2e</span></div>
              </div>
              <div className="ndc-kpi-card">
                <h4 className="ndc-kpi-card-title">Inventory — {sectorLabel}</h4>
                {["baselineEmissions", "achievedEmissions", "verifiedReduction"].map((key) => (
                  <div className="ndc-kpi-card-stat-row" key={key}>
                    <span className="ndc-kpi-card-stat-label">
                      {key === "baselineEmissions" ? "Baseline" : key === "achievedEmissions" ? "Achieved / actual" : "Reduction"}
                    </span>
                    <span className="ndc-kpi-card-stat-value">{formatMetric(summary[key as keyof NdcTargetSummary] as number | null)} <span className="ndc-kpi-card-unit">tCO2e</span></span>
                  </div>
                ))}
              </div>
              <div className="ndc-kpi-card contribution">
                <h4 className="ndc-kpi-card-title">2030 Target Contribution</h4>
                <p className="ndc-kpi-card-subtitle">Formula: verified reduction ÷ baseline-to-target gap</p>
                <div className="ndc-kpi-card-value">{summary.contributionPercent === null ? "Not available" : `${formatMetric(summary.contributionPercent)}%`}</div>
                <div className="ndc-kpi-card-contribution-bottom">
                  <span className="ndc-kpi-card-stat-label">Target 2030</span>
                  <div className="ndc-kpi-card-value">{formatMetric(summary.targetEmissions2030)} <span className="ndc-kpi-card-unit">tCO2e</span></div>
                </div>
              </div>
            </div>

            <div className="ndc-metadata-strip">
              <span>Unit: {meta?.unit ?? "tCO2e"}</span>
              <span>Scale: {meta?.scale ?? "canonical"}</span>
              <span>Source: {meta?.source.label ?? "Not available"}</span>
              <span>As of: {meta?.as_of ?? "Not available"}</span>
              {meta?.aggregation && <span>Aggregation: {meta.aggregation}</span>}
            </div>

            {series.length >= 2 ? (
              <div className="donut-grid">
                <div className="donut-card">
                  <h4 className="section-title">Inventory — Emission Trend from Baseline: {sectorLabel}</h4>
                  <Chart
                    type="area"
                    height={320}
                    options={{
                      chart: { toolbar: { show: false } },
                      xaxis: { categories: years, title: { text: "Year" } },
                      yaxis: { title: { text: "tCO2e (canonical)" } },
                      dataLabels: { enabled: false },
                      colors: [COLOR_CONFIGS.PRIMARY_RED_COLOR, COLOR_CONFIGS.PRIMARY_THEME_COLOR],
                      stroke: { curve: "smooth", width: 2 },
                      noData: { text: "No inventory observations" },
                    }}
                    series={[
                      { name: `Baseline — ${sectorLabel}`, data: series.map((point) => point.baselineEmissions) },
                      { name: `Achieved / actual — ${sectorLabel}`, data: series.map((point) => point.achievedEmissions) },
                    ]}
                  />
                </div>
                <div className="donut-card">
                  <h4 className="section-title">Mitigation Actions — Claimed vs verified: {sectorLabel}</h4>
                  <Chart
                    type="bar"
                    height={320}
                    options={{
                      chart: { toolbar: { show: false } },
                      xaxis: { categories: years, title: { text: "Year" } },
                      yaxis: { title: { text: "tCO2e (canonical)" } },
                      dataLabels: { enabled: false },
                      legend: { show: hasAnyClaimed },
                      colors: hasAnyClaimed ? [COLOR_CONFIGS.ACCENT_GOLD_COLOR, COLOR_CONFIGS.PRIMARY_THEME_COLOR] : [COLOR_CONFIGS.PRIMARY_THEME_COLOR],
                      noData: { text: "No mitigation observations" },
                    }}
                    series={hasAnyClaimed ? [
                      { name: `Claimed reduction — ${sectorLabel}`, data: claimedReductionSeries },
                      { name: `Verified reduction — ${sectorLabel}`, data: verifiedReductionSeries },
                    ] : [{ name: `Verified reduction — ${sectorLabel}`, data: verifiedReductionSeries }]}
                  />
                </div>
              </div>
            ) : (
              <Empty description="The selected NDC series has fewer than two observations for a trend chart." />
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default NdcAchievementTab;

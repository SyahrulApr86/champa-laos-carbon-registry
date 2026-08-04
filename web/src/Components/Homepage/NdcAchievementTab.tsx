import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./Dashboard.scss";

interface NdcTargetSummary {
  latestYear: number | null;
  baselineEmissions: number;
  targetEmissions2030: number;
  achievedEmissions: number;
  contributionPercent: number;
}

interface NdcTargetRow {
  id: number;
  year: number;
  baselineEmissions: number;
  targetEmissions2030: number;
  achievedEmissions: number;
  notes: string | null;
}

const emptySummary: NdcTargetSummary = {
  latestYear: null,
  baselineEmissions: 0,
  targetEmissions2030: 0,
  achievedEmissions: 0,
  contributionPercent: 0,
};

// NDC (Nationally Determined Contribution) Achievement tab - mirrors
// Indonesia's SRN "NDC Achievement" page showing baseline emissions, the
// 2030 target, yearly verified achievement, and % contribution toward the
// target. Pre-release: all figures are dummy placeholder data entered by
// DNA/Ministry through the record form, never hardcoded here.
const NdcAchievementTab = () => {
  const { get } = useConnection();
  const [summary, setSummary] = useState<NdcTargetSummary>(emptySummary);
  const [rows, setRows] = useState<NdcTargetRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summaryResponse = await get<NdcTargetSummary>(
          API_PATHS.NDC_TARGET_PUBLIC_SUMMARY
        );
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
      }

      try {
        const listResponse = await get<NdcTargetRow[]>(
          API_PATHS.NDC_TARGET_PUBLIC_LIST
        );
        setRows(listResponse?.data ?? []);
      } catch (error) {
        console.log("Error fetching NDC target public list", error);
      }
    };

    fetchData();
  }, [get]);


  if (summary.latestYear === null) {
    return (
      <div className="dashboard-container">
        <section className="section">
          <h3 className="section-title">NDC Achievement</h3>
          <p className="registry-table-subtitle">
            No NDC target data has been recorded yet.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="section">
        <h3 className="section-title">NDC Achievement</h3>
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
                {summary.targetEmissions2030.toLocaleString()}
              </div>
              <div className="statistic-title">2030 Target (MtCO2e)</div>
            </div>
          </div>
          <div className="donut-card">
            <div className="main-statistic">
              <div className="statistic-value">
                {summary.achievedEmissions.toLocaleString()}
              </div>
              <div className="statistic-title">
                Achieved Emissions — {summary.latestYear} (MtCO2e)
              </div>
            </div>
          </div>
        </div>

        <div className="donut-grid">
          <div className="donut-card">
            <div className="main-statistic">
              <div className="statistic-value">
                {summary.contributionPercent.toFixed(1)}%
              </div>
              <div className="statistic-title">NDC Target Contribution</div>
            </div>
          </div>
        </div>

        {rows.length >= 2 && (
          <div className="donut-card">
            <h4 className="section-title">Achievement Trend by Year</h4>
            <Chart
              type="bar"
              height={320}
              options={{
                chart: { toolbar: { show: false } },
                xaxis: { categories: rows.map((row) => row.year) },
                yaxis: { title: { text: "MtCO2e" } },
                dataLabels: { enabled: false },
              }}
              series={[
                {
                  name: "Achieved Emissions",
                  data: rows.map((row) => row.achievedEmissions),
                },
              ]}
            />
          </div>
        )}

      </section>
    </div>
  );
};

export default NdcAchievementTab;

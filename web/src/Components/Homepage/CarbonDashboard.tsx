import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import { Trans, useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { COLOR_CONFIGS } from "../../Config/colorConfigs";
import "./Dashboard.scss";
import EmissionCeilingTradingTabs from "./EmissionCeilingTradingTabs";

export const DONUT_PALETTE = [
  COLOR_CONFIGS.PRIMARY_THEME_COLOR,
  COLOR_CONFIGS.ACCENT_GOLD_COLOR,
  COLOR_CONFIGS.PRIMARY_RED_COLOR,
  "#2E8B67",
  "#6B7280",
  "#7C9CBF",
];

export const DonutBreakdown = ({
  data,
  totalLabel,
}: {
  data: { title: string; value: number }[];
  totalLabel: string;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const formatCompact = (n: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);

  return (
    <div className="donut-breakdown">
      <Chart
        key={`${totalLabel}-${total}`}
        type="donut"
        width="220"
        options={{
          labels: data.map((item) => item.title),
          colors: DONUT_PALETTE,
          legend: { show: false },
          dataLabels: { enabled: false },
          stroke: { width: 2 },
          tooltip: {
            y: {
              formatter: (value: number) => value.toLocaleString(),
            },
          },
          plotOptions: {
            pie: {
              donut: {
                size: "72%",
                labels: {
                  show: true,
                  value: {
                    fontSize: "20px",
                    fontWeight: 700,
                    offsetY: -4,
                    formatter: (val: string) => formatCompact(Number(val)),
                  },
                  total: {
                    show: true,
                    label: totalLabel,
                    fontSize: "13px",
                    formatter: () => formatCompact(total),
                  },
                },
              },
            },
          },
        }}
        series={data.map((item) => item.value)}
      />
      <ul className="donut-legend">
        {data.map((item, index) => (
          <li key={item.title}>
            <span
              className="donut-legend-dot"
              style={{
                backgroundColor: DONUT_PALETTE[index % DONUT_PALETTE.length],
              }}
            />
            <span className="donut-legend-label">{item.title}</span>
            <span className="donut-legend-value">
              {item.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface PublicAnalyticsSummary {
  totalProjects: number;
  projectsByStatus: {
    authorised: number;
    pending: number;
    rejected: number;
  };
  credits: {
    authorised: number;
    issued: number;
    transferred: number;
    retired: number;
    available: number;
  };
  projectsBySector: Record<string, number>;
  proponentsByRole: Record<string, number>;
}

const emptySummary: PublicAnalyticsSummary = {
  totalProjects: 0,
  projectsByStatus: { authorised: 0, pending: 0, rejected: 0 },
  credits: { authorised: 0, issued: 0, transferred: 0, retired: 0, available: 0 },
  projectsBySector: {},
  proponentsByRole: {},
};

interface EmissionTradingSummary {
  year: number | null;
  ceiling: { totalUnits: number; companies: number };
  trading: { totalUnits: number; totalValueLAK: number; companies: number };
}

const emptyTradingSummary: EmissionTradingSummary = {
  year: null,
  ceiling: { totalUnits: 0, companies: 0 },
  trading: { totalUnits: 0, totalValueLAK: 0, companies: 0 },
};

const CarbonDashboard = () => {
  const { i18n, t } = useTranslation(["common", "homepage", "companyRoles"]);
  const { get } = useConnection();
  const [summary, setSummary] = useState<PublicAnalyticsSummary>(emptySummary);
  const [tradingSummary, setTradingSummary] = useState<EmissionTradingSummary>(
    emptyTradingSummary
  );
  const [projectCount, setProjectCount] = useState(0);
  const [creditCount, setCreditCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const fetchPublicSummary = async () => {
      try {
        const response: any = await get(API_PATHS.PUBLIC_ANALYTICS_SUMMARY);
        if (response?.data) {
          const data = response.data;
          setSummary({
            totalProjects: data.totalProjects ?? 0,
            projectsByStatus: {
              authorised: data.projectsByStatus?.authorised ?? 0,
              pending: data.projectsByStatus?.pending ?? 0,
              rejected: data.projectsByStatus?.rejected ?? 0,
            },
            credits: {
              authorised: data.credits?.authorised ?? 0,
              issued: data.credits?.issued ?? 0,
              transferred: data.credits?.transferred ?? 0,
              retired: data.credits?.retired ?? 0,
              available: data.credits?.available ?? 0,
            },
            projectsBySector: data.projectsBySector ?? {},
            proponentsByRole: data.proponentsByRole ?? {},
          });
        }
      } catch (error) {
        console.log("Error fetching public analytics summary", error);
      }
    };

    fetchPublicSummary();
  }, [get]);

  useEffect(() => {
    const fetchTradingSummary = async () => {
      try {
        const tradingResponse = await get<EmissionTradingSummary>(
          API_PATHS.EMISSION_TRADING_PUBLIC_SUMMARY()
        );
        if (tradingResponse?.data) {
          setTradingSummary(tradingResponse.data);
        }
      } catch (error) {
        console.log("Error fetching emission trading summary", error);
      }
    };

    fetchTradingSummary();
  }, [get]);

  const animateCounters = useCallback(() => {
    const targetProjectCount = summary.totalProjects;
    const targetCreditCount = summary.credits.authorised;
    const startingCreditCount = 0;
    const duration = 1500;
    const startTime = Date.now();

    const updateCounters = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      // Update project count
      const currentProjectCount = Math.floor(easeOutQuart * targetProjectCount);
      setProjectCount(currentProjectCount);

      // Update credit count
      const creditDifference = targetCreditCount - startingCreditCount;
      const currentCreditCount = Math.floor(
        startingCreditCount + easeOutQuart * creditDifference
      );
      setCreditCount(currentCreditCount);

      setIsAnimating(progress < 1);

      if (progress < 1) {
        requestAnimationFrame(updateCounters);
      } else {
        setProjectCount(targetProjectCount);
        setCreditCount(targetCreditCount);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(updateCounters);
  }, [summary]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounters();
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [animateCounters, hasAnimated]);

  const projectData = [
    { value: summary.projectsByStatus.authorised, title: t("homepage:authorised") },
    { value: summary.projectsByStatus.pending, title: t("homepage:pending") },
    { value: summary.projectsByStatus.rejected, title: t("homepage:rejected") },
  ];

  const creditData = [
    { value: summary.credits.authorised, title: t("homepage:authorised") },
    { value: summary.credits.issued, title: t("homepage:issued") },
    { value: summary.credits.transferred, title: t("homepage:transferred") },
    { value: summary.credits.retired, title: t("homepage:retired") },
  ];

  const sectorData = Object.entries(summary.projectsBySector)
    .filter(([, value]) => value > 0)
    .map(([sector, value]) => ({ value, title: sector }));

  const proponentData = Object.entries(summary.proponentsByRole).map(
    ([role, value]) => ({
      value,
      title: t(`companyRoles:${role}`, { defaultValue: role }),
    })
  );

  return (
    <div className="carbon-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h2 className="header-title">{t("homepage:dashboardtitle")}</h2>
        </div>

        {/* Main Card with Title and Statistics */}
        <div className="main-card">
          <div className="main-card-content">
            <div className="main-title-container">
              <h1 className="main-title">{t("homepage:allinoneplatform")}</h1>
            </div>
            <div className="stats-container" ref={statsRef}>
              <div className="stats-wrapper">
                <div className="main-statistic procount">
                  <div
                    className={`statistic-value ${
                      isAnimating ? "counting" : ""
                    }`}
                  >
                    {projectCount.toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    {t("homepage:totprojects")}
                  </div>
                </div>
                <div className="main-statistic">
                  <div
                    className={`statistic-value ${
                      isAnimating ? "counting" : ""
                    }`}
                  >
                    {creditCount.toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    {t("homepage:totcredits")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Grid: Project Status / Credit Status / Sector / Proponent */}
        <motion.div
          className="donut-grid"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="donut-card">
            <h3 className="section-title">
              {t("homepage:projectdistribution")}
            </h3>
            <DonutBreakdown
              data={projectData}
              totalLabel={t("homepage:totprojects")}
            />
          </div>

          <div className="donut-card">
            <h3 className="section-title">
              {t("homepage:distributionbystatus")}
            </h3>
            <DonutBreakdown
              data={creditData}
              totalLabel={t("homepage:totcredits")}
            />
          </div>

          {sectorData.length > 0 && (
            <div className="donut-card">
              <h3 className="section-title">
                {t("homepage:sectordistribution")}
              </h3>
              <DonutBreakdown
                data={sectorData}
                totalLabel={t("homepage:totprojects")}
              />
            </div>
          )}

          <div className="donut-card">
            <h3 className="section-title">
              {t("homepage:proponentdistribution")}
            </h3>
            <DonutBreakdown
              data={proponentData}
              totalLabel={t("homepage:totalOrganisations")}
            />
          </div>
        </motion.div>

        {/* Emission Ceiling & Trading (SRN's PTBAE-PU equivalent) */}
        <section className="section">
          <h3 className="section-title">Emission Ceiling &amp; Trading</h3>
          <p className="registry-table-subtitle">
            Prototype module — emission ceiling and trading data, not tied to
            a specific real-world regulation.
          </p>
          <div className="donut-grid">
            <div className="donut-card">
              <div className="main-statistic">
                <div className="statistic-value">
                  {tradingSummary.ceiling.totalUnits.toLocaleString()}
                </div>
                <div className="statistic-title">Total Ceiling Units</div>
              </div>
            </div>
            <div className="donut-card">
              <div className="main-statistic">
                <div className="statistic-value">
                  {tradingSummary.ceiling.companies}
                </div>
                <div className="statistic-title">
                  Companies with Allocated Ceiling
                </div>
              </div>
            </div>
            <div className="donut-card">
              <div className="main-statistic">
                <div className="statistic-value">
                  {tradingSummary.trading.totalUnits.toLocaleString()}
                </div>
                <div className="statistic-title">Total Units Traded</div>
              </div>
            </div>
          </div>

          <div className="registry-table-section">
            <EmissionCeilingTradingTabs />
          </div>
        </section>

        {/* Footer Text */}
        <div className="footer-section">
          <p className="footer-text">
            {/* {t("homepage:policyContextBody")} */}
            <Trans
              i18nKey={"homepage:policyContextBody"}
              components={{
                br: <br />,
                ul: <ul />,
                li: <li />,
                b: <strong />,
              }}
            />
          </p>
        </div>
      </div>
    </div>
  );
};

export default CarbonDashboard;

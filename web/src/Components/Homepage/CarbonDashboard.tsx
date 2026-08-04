import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Trans, useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./Dashboard.scss";

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

const CarbonDashboard = () => {
  const { i18n, t } = useTranslation(["common", "homepage", "companyRoles"]);
  const { get } = useConnection();
  const [summary, setSummary] = useState<PublicAnalyticsSummary>(emptySummary);
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
          <div className="main-card-example-section">
            <div className="example">{t("homepage:example")}</div>
          </div>
        </div>

        {/* Project Distribution Section */}
        <div className="section">
          <h3 className="section-title">{t("homepage:projectdistribution")}</h3>
          <motion.div
            className="cards-grid cards-grid-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {projectData.map((item, index) => (
              <div key={index} className="project-card">
                <div className="project-statistic">
                  <div className="project-value">{item.value}</div>
                  <div className="project-title">{item.title}</div>
                </div>
                <div className="project-card-example example">
                  {t("homepage:example")}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Carbon Credit Distribution Section */}
        <div className="section">
          <h3 className="section-title">
            {t("homepage:distributionbystatus")}
          </h3>
          <motion.div
            className="cards-grid cards-grid-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {creditData.map((item, index) => (
              <div key={index} className="credit-card">
                <div className="credit-statistic">
                  <div className="credit-value">
                    {item.value.toLocaleString()}
                  </div>
                  <div className="credit-title">{item.title}</div>
                </div>
                <div className="credit-card-example example">
                  {t("homepage:example")}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Sector Distribution Section */}
        {sectorData.length > 0 && (
          <div className="section">
            <h3 className="section-title">
              {t("homepage:sectordistribution")}
            </h3>
            <motion.div
              className="cards-grid cards-grid-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.8, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              {sectorData.map((item, index) => (
                <div key={index} className="project-card">
                  <div className="project-statistic">
                    <div className="project-value">{item.value}</div>
                    <div className="project-title">{item.title}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Proponent Distribution Section */}
        <div className="section">
          <h3 className="section-title">
            {t("homepage:proponentdistribution")}
          </h3>
          <motion.div
            className="cards-grid cards-grid-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {proponentData.map((item, index) => (
              <div key={index} className="credit-card">
                <div className="credit-statistic">
                  <div className="credit-value">{item.value}</div>
                  <div className="credit-title">{item.title}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

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

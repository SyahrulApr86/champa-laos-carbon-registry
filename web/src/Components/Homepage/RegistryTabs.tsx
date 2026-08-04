import React, { useState } from "react";
import CarbonDashboard from "./CarbonDashboard";
import RegistryTable from "./RegistryTable";
import AdaptationTab from "./AdaptationTab";
import ResourcesTab from "./ResourcesTab";
import NdcAchievementTab from "./NdcAchievementTab";
import MapTab from "./MapTab";
import CommunityProgramTab from "./CommunityProgramTab";
import ReddPlusTab from "./ReddPlusTab";
import RecognizedMitigationTab from "./RecognizedMitigationTab";
import "./Dashboard.scss";

type TabKey =
  | "mitigation"
  | "adaptation"
  | "resources"
  | "map"
  | "ndc"
  | "community"
  | "redd"
  | "recognizedMitigation";

const TABS: { key: TabKey; label: string }[] = [
  { key: "mitigation", label: "Mitigation" },
  { key: "adaptation", label: "Adaptation" },
  { key: "resources", label: "Resources" },
  { key: "map", label: "Map" },
  { key: "ndc", label: "NDC Achievement" },
  { key: "community", label: "Community Programs" },
  { key: "redd", label: "REDD+" },
  { key: "recognizedMitigation", label: "Recognized Mitigation Actions" },
];

// Category tab switcher mirroring the structure of national registry portals
// like Indonesia's SRN (Mitigation / Adaptation / Resources / community
// programs). Each tab's content is a self-contained component with its own
// live data fetch.

const RegistryTabs = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("mitigation");

  return (
    <div className="registry-tabs-container">
      <div className="registry-tabs-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`registry-tab-button ${
              activeTab === tab.key ? "active" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "mitigation" && (
        <>
          <CarbonDashboard />
          <RegistryTable />
        </>
      )}
      {activeTab === "adaptation" && <AdaptationTab />}
      {activeTab === "resources" && <ResourcesTab />}
      {activeTab === "map" && <MapTab />}
      {activeTab === "ndc" && <NdcAchievementTab />}
      {activeTab === "community" && <CommunityProgramTab />}
      {activeTab === "redd" && <ReddPlusTab />}
      {activeTab === "recognizedMitigation" && <RecognizedMitigationTab />}
    </div>
  );
};

export default RegistryTabs;

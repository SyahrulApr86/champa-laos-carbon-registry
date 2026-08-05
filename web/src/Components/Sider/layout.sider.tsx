import { useEffect, useState } from "react";
import { Menu, Layout, MenuProps } from "antd";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./layout.sider.scss";
import * as Icon from "react-bootstrap-icons";
import {
  AppstoreOutlined,
  DashboardOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { LayoutSiderProps } from "../../Definitions/Definitions/layout.sider.definitions";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import { ROUTES } from "../../Config/uiRoutingConfig";

const { Sider } = Layout;

type MenuItem = {
  key: React.Key;
  icon?: React.ReactNode;
  label: React.ReactNode;
  children?: MenuItem[];
} | null;

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const LayoutSider = (props: LayoutSiderProps) => {
  const { selectedKey } = props;
  const navigate = useNavigate();
  const { userInfoState } = useUserContext();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectKey, setSelectKey] = useState<string | undefined>(selectedKey);
  const { t } = useTranslation(["nav"]);

  const currentPage = location.pathname.replace(/^\/|\/$/g, "");

  const items: MenuItem[] = [
    getItem(t("nav:dashboard"), "dashboard", <DashboardOutlined />),
    getItem(
      t("nav:projectList"),
      "programmeManagement/viewAll",
      <UnorderedListOutlined />
    ),
    getItem(t("nav:companies"), "companyManagement/viewAll", <ShopOutlined />),
    getItem(t("nav:users"), "userManagement/viewAll", <UserOutlined />),
  ];

  if (
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER
  ) {
    items.splice(
      2,
      0,
      getItem(t("nav:credits"), "credits", <AppstoreOutlined />, [
        getItem(t("nav:creditBalance"), "credits/balance", <Icon.Wallet2 />),
        getItem(t("nav:transfers"), "credits/transfers", <SwapOutlined />),
        getItem(
          t("nav:retirements"),
          "credits/retirements",
          <Icon.ClockHistory />
        ),
      ])
    );
  }

  if (userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER) {
    items.push(
      getItem(
        t("nav:submitAdaptation"),
        "adaptation/submit",
        <Icon.CloudSun />
      )
    );
  }

  if (
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY
  ) {
    items.push(
      getItem(t("nav:climatePrograms"), "climatePrograms", <Icon.CloudSun />, [
        getItem(
          t("nav:reviewAdaptation"),
          "adaptation/manage",
          <Icon.ClipboardCheck />
        ),
        getItem(
          t("nav:recordFinance"),
          "climateFinance/submit",
          <Icon.CashCoin />
        ),
        getItem(
          t("nav:recordTrading"),
          "emissionTrading/submit",
          <Icon.ArrowLeftRight />
        ),
        getItem(
          t("nav:recordNdcTarget"),
          "ndcTarget/submit",
          <Icon.BarChartLine />
        ),
        getItem(
          t("nav:recordTechTransfer"),
          "technologyTransfer/submit",
          <Icon.Cpu />
        ),
        getItem(
          t("nav:recordCapacityBuilding"),
          "capacityBuilding/submit",
          <Icon.MortarboardFill />
        ),
        getItem(
          t("nav:recordCommunityProgram"),
          "communityProgram/submit",
          <Icon.People />
        ),
        getItem(
          t("nav:recordReddPlus"),
          "reddPlus/submit",
          <Icon.TreeFill />
        ),
        getItem(
          t("nav:recordExpert"),
          "expert/submit",
          <Icon.PersonBadgeFill />
        ),
        getItem(
          t("nav:recordGuidanceDocument"),
          "guidanceDocument/submit",
          <Icon.FileEarmarkPdf />
        ),
        getItem(
          t("nav:recordRecognizedMitigation"),
          "recognizedMitigation/submit",
          <Icon.Award />
        ),
      ])
    );
  }

  const isManagementAdmin =
    userInfoState?.userRole === Role.Root ||
    (userInfoState?.userRole === Role.Admin &&
      (userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
        userInfoState?.companyRole === CompanyRole.MINISTRY));

  if (isManagementAdmin) {
    items.push(
      getItem(t("nav:management", { defaultValue: "Management" }), "management", <AppstoreOutlined />, [
        getItem(
          t("nav:manageCertificateRegistry", { defaultValue: "Certificate registry" }),
          ROUTES.MANAGEMENT_CERTIFICATE_REGISTRY.slice(1),
          <Icon.JournalText />
        ),
        getItem(
          t("nav:manageEmissionTrading", { defaultValue: "Emission ceiling and trading" }),
          ROUTES.MANAGEMENT_EMISSION_TRADING.slice(1),
          <Icon.ArrowLeftRight />
        ),
        getItem(
          t("nav:manageAdaptation", { defaultValue: "Adaptation projects" }),
          ROUTES.MANAGEMENT_ADAPTATION.slice(1),
          <Icon.CloudSun />
        ),
        getItem(
          t("nav:manageClimateFinance", { defaultValue: "Climate finance" }),
          ROUTES.MANAGEMENT_CLIMATE_FINANCE.slice(1),
          <Icon.CashCoin />
        ),
        getItem(
          t("nav:manageTechnologyTransfer", { defaultValue: "Technology transfer" }),
          ROUTES.MANAGEMENT_TECHNOLOGY_TRANSFER.slice(1),
          <Icon.Cpu />
        ),
        getItem(
          t("nav:manageCapacityBuilding", { defaultValue: "Capacity building" }),
          ROUTES.MANAGEMENT_CAPACITY_BUILDING.slice(1),
          <Icon.MortarboardFill />
        ),
        getItem(
          t("nav:manageCommunityProgram", { defaultValue: "Community programs" }),
          ROUTES.MANAGEMENT_COMMUNITY_PROGRAM.slice(1),
          <Icon.People />
        ),
        getItem(
          t("nav:manageNdcTarget", { defaultValue: "NDC targets" }),
          ROUTES.MANAGEMENT_NDC_TARGET.slice(1),
          <Icon.BarChartLine />
        ),
        getItem(
          t("nav:manageReddPlus", { defaultValue: "REDD+" }),
          ROUTES.MANAGEMENT_REDD_PLUS.slice(1),
          <Icon.TreeFill />
        ),
        getItem(
          t("nav:manageRecognizedMitigation", { defaultValue: "Recognized mitigation" }),
          ROUTES.MANAGEMENT_RECOGNIZED_MITIGATION.slice(1),
          <Icon.Award />
        ),
        getItem(
          t("nav:manageExpert", { defaultValue: "Expert roster" }),
          ROUTES.MANAGEMENT_EXPERT.slice(1),
          <Icon.PersonBadgeFill />
        ),
        getItem(
          t("nav:manageGuidanceDocument", { defaultValue: "Guidance documents" }),
          ROUTES.MANAGEMENT_GUIDANCE_DOCUMENT.slice(1),
          <Icon.FileEarmarkPdf />
        ),
        getItem(
          t("nav:manageMethodology", { defaultValue: "Methodologies" }),
          ROUTES.MANAGEMENT_METHODOLOGY.slice(1),
          <Icon.Book />
        ),
      ])
    );
  }


  if (
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole === Role.Admin ||
      userInfoState?.userRole === Role.Root)
  ) {
    items.splice(
      3,
      0,
      getItem(t("nav:reports"), "reports", <Icon.ClipboardData />)
    );
  }
  
  

  useEffect(() => {
    setSelectKey(currentPage);
  }, [currentPage]);

  // if (
  //   userInfoState?.userRole === Role.Root ||
  //   (userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
  //     userInfoState?.userRole === Role.Admin)
  // ) {
  //   items.splice(
  //     1,
  //     0,
  //     getItem(t('nav:nationalAccounting'), 'nationalAccounting', <Icon.GraphUpArrow />)
  //   );
  // }

  // if (userInfoState?.companyRole !== CompanyRole.PROGRAMME_DEVELOPER) {
  //   items.splice(
  //     4,
  //     0,
  //     getItem(t('nav:programmes'), 'programmeManagement/viewAll', <AppstoreOutlined />),
  //     getItem(t('nav:cdmTransitionProjects'), 'cdmManagement/viewAll', <UnorderedListOutlined />),
  //     getItem(t('nav:verra'), 'verraManagement/viewAll', <AppstoreOutlined />),
  //     getItem(t('nav:goldStandards'), 'goldStandardManagement/viewAll', <AppstoreOutlined />)
  //   );
  // }

  // if (userInfoState?.userRole === Role.Root) {
  //   items.push(getItem(t('nav:settings'), 'settings', <SettingOutlined />));
  // }

  const onClick: MenuProps["onClick"] = (e: { key: string }) => {
    navigate("/" + e.key);
  };
  return (
    <Sider
      width={240}
      className="layout-sider-container"
      breakpoint={collapsed ? undefined : "lg"}
      collapsed={collapsed}
    >
      <div className="layout-sider-div-container">
        <div
          className="layout-sider-heading-container"
          onClick={() => navigate(ROUTES.DASHBOARD, { replace: true })}
        >
          <div className="logo">
            <img src={sliderLogo} alt="slider-logo" />
          </div>
          {!collapsed && (
            <div>
              <div>
                <div className="title">{collapsed ? "" : "CHAMPA"}</div>
                <div className="title-sub">
                  {collapsed ? "" : "LAO PDR CARBON REGISTRY"}
                </div>
              </div>
              <div className="country-name">
                {import.meta.env.VITE_APP_COUNTRY_NAME || "CountryX"}
              </div>
            </div>
          )}
          {collapsed && (
            <div className="country-flag">
              <img
                alt="country flag"
                src={
                  import.meta.env.VITE_APP_COUNTRY_FLAG_URL ||
                  "https://carbon-common-dev.s3.amazonaws.com/flag.png"
                }
              />
            </div>
          )}
        </div>
        <div className="layout-sider-menu-container">
          <Menu
            theme="light"
            selectedKeys={[
              selectedKey
                ? selectedKey
                : !selectedKey && selectKey
                ? selectKey
                : "dashboard",
            ]}
            mode="inline"
            onClick={onClick}
          >
            {items.map((item) =>
              item?.children ? (
                <Menu.SubMenu
                  key={item.key}
                  icon={item.icon}
                  title={item.label}
                >
                  {item.children.map((child) => (
                    <Menu.Item key={child?.key} icon={child?.icon}>
                      <Link to={`/${child?.key}`}>{child?.label}</Link>
                    </Menu.Item>
                  ))}
                </Menu.SubMenu>
              ) : (
                <Menu.Item
                  key={item?.key}
                  icon={item?.icon}
                  className={
                    item?.key === "ndcManagement/viewAll" ||
                    item?.key === "investmentManagement/viewAll" ||
                    item?.key === "retirementManagement/viewAll" ||
                    item?.key === "creditTransfers/viewAll"
                      ? "custom-padding-left"
                      : item?.key === "cdmManagement/viewAll"
                      ? "custom-padding-left wrap-content-overflow"
                      : ""
                  }
                  disabled={
                    // item?.key === 'programmeManagement/viewAll' ||
                    item?.key === "cdmManagement/viewAll" ||
                    item?.key === "goldStandardManagement/viewAll" ||
                    item?.key === "verraManagement/viewAll"
                  }
                >
                  <Link to={`/${item?.key}`}>{item?.label}</Link>
                </Menu.Item>
              )
            )}
          </Menu>
        </div>
      </div>
      <div
        className="toggle-nav-btn"
        onClick={() => {
          setCollapsed(!collapsed);
        }}
      >
        {collapsed ? <Icon.ArrowRight /> : <Icon.ArrowLeft />}
      </div>
    </Sider>
  );
};

export default LayoutSider;

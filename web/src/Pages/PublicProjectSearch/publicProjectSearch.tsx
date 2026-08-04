import React, { useState } from "react";
import { Row, Col, Input, Table, Tag, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import LayoutFooter from "../../Components/Footer/layout.footer";
import "./publicProjectSearch.scss";

interface PublicProjectSearchResult {
  registrationNumber: string;
  title: string;
  sector: string;
  status: string;
  proponent: string;
}

const statusColor: Record<string, string> = {
  Registered: "green",
  "Under Review": "gold",
};

const PublicProjectSearch = () => {
  const { t } = useTranslation(["common"]);
  const navigate = useNavigate();
  const { get } = useConnection();
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PublicProjectSearchResult[]>([]);
  const [searched, setSearched] = useState<boolean>(false);

  const onSearch = async (value: string) => {
    const keyword = value.trim();
    setQuery(value);
    if (!keyword) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const response: any = await get(
        API_PATHS.PUBLIC_PROJECT_SEARCH(keyword)
      );
      setResults(response?.data ?? []);
    } catch (error: any) {
      message.error(
        error?.message || "Unable to search projects at this time"
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Registration No.",
      dataIndex: "registrationNumber",
      key: "registrationNumber",
    },
    {
      title: "Project Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
    },
    {
      title: "Proponent",
      dataIndex: "proponent",
      key: "proponent",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColor[status] || "default"}>{status}</Tag>
      ),
    },
  ];

  return (
    <div id="publicProjectSearch" className="public-project-search-container">
      <Row>
        <Col span={24}>
          <div
            onClick={() => navigate("/")}
            className="public-project-search-header-container"
          >
            <div className="logo">
              <img src={sliderLogo} alt="slider-logo" />
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <div className="title">{"CHAMPA"}</div>
                <div className="title-sub">{"LAO PDR CARBON REGISTRY"}</div>
              </div>
              <div className="country-name">
                {import.meta.env.VITE_APP_COUNTRY_NAME || "CountryX"}
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <div className="public-project-search-body-container">
        <Row justify="center">
          <Col xs={22} md={16}>
            <div className="public-project-search-title">
              Public Project Search
            </div>
            <div className="public-project-search-subtitle">
              Search registered projects by registration number or project
              title. Only publicly available, high-level information is
              shown.
            </div>
            <Input.Search
              allowClear
              placeholder="Search by registration number or project title"
              enterButton="Search"
              size="large"
              onSearch={onSearch}
              loading={loading}
              className="public-project-search-input"
            />
            <Table
              className="public-project-search-table"
              rowKey="registrationNumber"
              columns={columns}
              dataSource={results}
              loading={loading}
              locale={{
                emptyText: searched
                  ? "No projects found matching your search"
                  : "Enter a registration number or project title to search",
              }}
              pagination={{ pageSize: 10 }}
            />
          </Col>
        </Row>
      </div>
      <LayoutFooter />
    </div>
  );
};

export default PublicProjectSearch;

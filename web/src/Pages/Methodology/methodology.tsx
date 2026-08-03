import { useEffect, useState, useCallback } from "react";
import { Row, Col, Input, Select, Table, Tag, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { Sector } from "../../Definitions/Enums/sector.enum";
import { MethodologyStatus } from "../../Definitions/Enums/methodologyStatus.enum";
import LayoutFooter from "../../Components/Footer/layout.footer";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import "./methodology.scss";

const { Search } = Input;
const { Option } = Select;

interface MethodologyRecord {
  id: number;
  methodologyNumber: string;
  name: string;
  source: string;
  category: Sector;
  status: MethodologyStatus;
  description?: string;
}

const statusTagColor = (status: MethodologyStatus) =>
  status === MethodologyStatus.ACTIVE ? "success" : "default";

// Public methodology directory - lets proponents/VVBs browse the list of
// approved GHG accounting methodologies without needing to log in, mirroring
// GET /national/methodology/public on the backend.
const MethodologyDirectory = () => {
  const navigate = useNavigate();
  const { get } = useConnection();

  const [data, setData] = useState<MethodologyRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>("");
  const [category, setCategory] = useState<Sector | undefined>(undefined);
  const [status, setStatus] = useState<MethodologyStatus | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchMethodologies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (category) params.append("category", category);
      if (status) params.append("status", status);
      params.append("page", String(page));
      params.append("size", String(pageSize));

      const response: any = await get(
        `${API_PATHS.METHODOLOGY_PUBLIC_LIST}?${params.toString()}`
      );
      setData(response?.data?.data ?? []);
      setTotal(response?.data?.total ?? 0);
    } catch (error) {
      console.log("Error fetching methodology directory", error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [get, keyword, category, status, page, pageSize]);

  useEffect(() => {
    fetchMethodologies();
  }, [fetchMethodologies]);

  const columns = [
    {
      title: "Methodology No.",
      dataIndex: "methodologyNumber",
      key: "methodologyNumber",
      width: 160,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: MethodologyStatus) => (
        <Tag color={statusTagColor(value)}>{value}</Tag>
      ),
    },
  ];

  return (
    <div className="methodology-directory-container">
      <Row>
        <Col span={24}>
          <div
            onClick={() => navigate("/")}
            className="methodology-header-container"
          >
            <div className="logo">
              <img src={sliderLogo} alt="slider-logo" />
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <div className="title">{"CARBON"}</div>
                <div className="title-sub">{"REGISTRY"}</div>
              </div>
              <div className="country-name">
                {import.meta.env.VITE_APP_COUNTRY_NAME || "CountryX"}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <div className="methodology-body-container">
        <div className="methodology-title">Methodology Directory</div>
        <div className="methodology-sub">
          Browse the list of approved GHG accounting methodologies
        </div>

        <Row gutter={[16, 16]} className="methodology-filters">
          <Col xs={24} sm={12} md={10}>
            <Search
              placeholder="Search by number, name or source"
              allowClear
              onSearch={(value) => {
                setPage(1);
                setKeyword(value);
              }}
            />
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Select
              allowClear
              placeholder="Category"
              style={{ width: "100%" }}
              value={category}
              onChange={(value) => {
                setPage(1);
                setCategory(value);
              }}
            >
              {Object.values(Sector).map((sector) => (
                <Option key={sector} value={sector}>
                  {sector}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Select
              allowClear
              placeholder="Status"
              style={{ width: "100%" }}
              value={status}
              onChange={(value) => {
                setPage(1);
                setStatus(value);
              }}
            >
              {Object.values(MethodologyStatus).map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          className="methodology-table"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          locale={{ emptyText: <Empty description="No methodologies found" /> }}
          expandable={{
            expandedRowRender: (record: MethodologyRecord) => (
              <div className="methodology-description">
                {record.description || "No description provided"}
              </div>
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (newPage, newSize) => {
              setPage(newPage);
              setPageSize(newSize);
            },
          }}
        />
      </div>

      <LayoutFooter />
    </div>
  );
};

export default MethodologyDirectory;

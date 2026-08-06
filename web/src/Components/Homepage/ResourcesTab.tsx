import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Descriptions, Empty, Input, Modal, Radio, Select, Space, Table, Tag } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import Chart from "react-apexcharts";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { COLOR_CONFIGS } from "../../Config/colorConfigs";
import { DONUT_PALETTE } from "./CarbonDashboard";
import "./Dashboard.scss";

interface PublicMeta {
  availability?: string;
  pagination?: { total_items: number };
}

interface PublicEnvelope<T> {
  data: T;
  meta: PublicMeta;
}

interface ChannelBreakdown {
  amount: number;
  percentage: number | null;
}

interface ClimateFinanceSummary {
  totalAmountLAK: number | null;
  totalAmountUSD: number | null;
  bySectorLAK: Record<string, number>;
  bySectorUSD: Record<string, number>;
  byChannelLAK: Record<string, ChannelBreakdown>;
  byChannelUSD: Record<string, ChannelBreakdown>;
  currencyAvailability: { LAK: string; USD: string };
}

interface ClimateFinanceRow {
  recordId: string;
  title: string;
  description: string;
  channel: string;
  recipientEntity: string;
  implementingEntity: string;
  dateSigned: number;
  dateClosing: number | null;
  amountLAK: number | null;
  amountUSD: number | null;
  sector: string;
  financialInstrument: string;
  status: string;
  type: string;
}

interface SupportRow {
  id: number;
  title: string;
  description: string;
  technologyType?: string;
  timeframe: string | null;
  recipientEntity: string;
  implementingEntity: string;
  type: string;
  sector: string;
  subsector: string | null;
  status: string;
  impactEstimatedResult: string | null;
  additionalInformation: string | null;
}

const emptyFinanceSummary: ClimateFinanceSummary = {
  totalAmountLAK: null,
  totalAmountUSD: null,
  bySectorLAK: {},
  bySectorUSD: {},
  byChannelLAK: {},
  byChannelUSD: {},
  currencyAvailability: { LAK: "not_available", USD: "not_available" },
};

const statusColor: Record<string, string> = {
  "Fully Disbursed": "green",
  Ongoing: "blue",
  Closed: "default",
};

const supportStatusColor: Record<string, string> = {
  Completed: "green",
  "On-Going": "blue",
  Terminated: "red",
};

const PAGE_SIZE = 10;

const pageQuery = (page: number) => `page=${page}&pageSize=${PAGE_SIZE}`;

const readPublicEnvelope = <T,>(response: unknown): PublicEnvelope<T> => {
  const candidate = response as {
    data?: unknown;
    meta?: PublicMeta;
    response?: { data?: unknown };
  };
  const isEnvelope = (value: unknown): value is PublicEnvelope<T> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return "data" in value && "meta" in value;
  };

  if (isEnvelope(response)) return response;
  if (isEnvelope(candidate.response?.data)) return candidate.response.data;

  return {
    data: (candidate.data ?? response) as T,
    meta: candidate.meta ?? {},
  };
};

const ResourcesTab = () => {
  const { get } = useConnection();
  const [financeSummary, setFinanceSummary] = useState<ClimateFinanceSummary>(emptyFinanceSummary);
  const [sectorCurrency, setSectorCurrency] = useState<"LAK" | "USD">("LAK");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>();
  const [channel, setChannel] = useState<string>();
  const [financeRows, setFinanceRows] = useState<ClimateFinanceRow[]>([]);
  const [financeTotal, setFinanceTotal] = useState(0);
  const [financePage, setFinancePage] = useState(1);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState(false);
  const [technologyRows, setTechnologyRows] = useState<SupportRow[]>([]);
  const [technologyTotal, setTechnologyTotal] = useState(0);
  const [technologyPage, setTechnologyPage] = useState(1);
  const [technologyLoading, setTechnologyLoading] = useState(false);
  const [capacityRows, setCapacityRows] = useState<SupportRow[]>([]);
  const [capacityTotal, setCapacityTotal] = useState(0);
  const [capacityPage, setCapacityPage] = useState(1);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [supportQuery, setSupportQuery] = useState("");
  const [supportSector, setSupportSector] = useState<string>();
  const [supportStatus, setSupportStatus] = useState<string>();
  const [selectedSupport, setSelectedSupport] = useState<SupportRow | null>(null);

  useEffect(() => {
    get<PublicEnvelope<ClimateFinanceSummary>>(API_PATHS.CLIMATE_FINANCE_PUBLIC_SUMMARY)
      .then((response) => setFinanceSummary(readPublicEnvelope<ClimateFinanceSummary>(response).data ?? emptyFinanceSummary))
      .catch(() => setFinanceSummary(emptyFinanceSummary));
  }, [get]);

  const fetchFinance = useCallback(async () => {
    setFinanceLoading(true);
    setFinanceError(false);
    try {
      const params = new URLSearchParams({ page: String(financePage), pageSize: String(PAGE_SIZE) });
      if (query) params.set("q", query);
      if (sector) params.set("sector", sector);
      if (channel) params.set("channel", channel);
      const response = await get<PublicEnvelope<ClimateFinanceRow[]>>(`${API_PATHS.CLIMATE_FINANCE_PUBLIC_SEARCH("", 1, PAGE_SIZE).split("?")[0]}?${params.toString()}`);
      const envelope = readPublicEnvelope<ClimateFinanceRow[]>(response);
      setFinanceRows(envelope.data ?? []);
      setFinanceTotal(envelope.meta?.pagination?.total_items ?? 0);
    } catch {
      setFinanceRows([]);
      setFinanceTotal(0);
      setFinanceError(true);
    } finally {
      setFinanceLoading(false);
    }
  }, [channel, financePage, get, query, sector]);

  useEffect(() => { fetchFinance(); }, [fetchFinance]);

  const fetchSupport = useCallback(async (kind: "technology" | "capacity", page: number) => {
    const setLoading = kind === "technology" ? setTechnologyLoading : setCapacityLoading;
    setLoading(true);
    try {
      const path = kind === "technology" ? API_PATHS.TECHNOLOGY_TRANSFER_PUBLIC_LIST : API_PATHS.CAPACITY_BUILDING_PUBLIC_LIST;
      const params = new URLSearchParams(pageQuery(page));
      if (supportQuery) params.set("q", supportQuery);
      if (supportSector) params.set("sector", supportSector);
      if (supportStatus) params.set("status", supportStatus);
      const response = await get<PublicEnvelope<SupportRow[]>>(`${path}?${params.toString()}`);
      const envelope = readPublicEnvelope<SupportRow[]>(response);
      if (kind === "technology") {
        setTechnologyRows(envelope.data ?? []);
        setTechnologyTotal(envelope.meta?.pagination?.total_items ?? 0);
      } else {
        setCapacityRows(envelope.data ?? []);
        setCapacityTotal(envelope.meta?.pagination?.total_items ?? 0);
      }
    } catch {
      if (kind === "technology") { setTechnologyRows([]); setTechnologyTotal(0); }
      else { setCapacityRows([]); setCapacityTotal(0); }
    } finally {
      setLoading(false);
    }
  }, [get, supportQuery, supportSector, supportStatus]);

  useEffect(() => { fetchSupport("technology", technologyPage); }, [fetchSupport, technologyPage]);
  useEffect(() => { fetchSupport("capacity", capacityPage); }, [capacityPage, fetchSupport]);

  const activeSectorData = useMemo(() => Object.entries(sectorCurrency === "LAK" ? financeSummary.bySectorLAK : financeSummary.bySectorUSD).map(([title, value]) => ({ title, value })), [financeSummary, sectorCurrency]);
  const channelData = useMemo(() => Object.entries(sectorCurrency === "LAK" ? financeSummary.byChannelLAK : financeSummary.byChannelUSD).map(([title, value]) => ({ title, ...value })), [financeSummary, sectorCurrency]);

  const financeColumns = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Recipient", dataIndex: "recipientEntity", key: "recipientEntity" },
    { title: "Implementing Entity", dataIndex: "implementingEntity", key: "implementingEntity" },
    { title: "Sector", dataIndex: "sector", key: "sector" },
    { title: "Channel", dataIndex: "channel", key: "channel" },
    { title: "Amount (LAK)", dataIndex: "amountLAK", key: "amountLAK", render: (value: number | null) => value == null ? "Not available" : value.toLocaleString() },
    { title: "Amount (USD)", dataIndex: "amountUSD", key: "amountUSD", render: (value: number | null) => value == null ? "Not available" : value.toLocaleString() },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag color={statusColor[value] || "default"}>{value}</Tag> },
  ];

  const supportColumns = (technology: boolean) => [
    { title: "Title", dataIndex: "title", key: "title" },
    ...(technology ? [{ title: "Technology Type", dataIndex: "technologyType", key: "technologyType" }] : []),
    { title: "Recipient", dataIndex: "recipientEntity", key: "recipientEntity" },
    { title: "Implementing Entity", dataIndex: "implementingEntity", key: "implementingEntity" },
    { title: "Sector", dataIndex: "sector", key: "sector" },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag color={supportStatusColor[value] || "default"}>{value}</Tag> },
    { title: "", key: "detail", render: (_: unknown, record: SupportRow) => <Button size="small" onClick={() => setSelectedSupport(record)}>Detail</Button> },
  ];

  const currencyTotal = sectorCurrency === "LAK" ? financeSummary.totalAmountLAK : financeSummary.totalAmountUSD;

  return (
    <div className="dashboard-container">
      <Alert type="info" showIcon message="Synthetic demonstration data" description="Not official Lao PDR financial, technology, or capacity statistics. Scenario: Champa registry demonstration. Currency amounts remain in their entered currency; no implicit FX conversion is applied." style={{ marginBottom: "1rem" }} />
      <section className="section">
        <h3 className="section-title">Climate Finance</h3>
        <div className="donut-grid">
          <div className="donut-card"><div className="main-statistic"><div className="statistic-value">{financeSummary.totalAmountLAK == null ? "Not available" : financeSummary.totalAmountLAK.toLocaleString()}</div><div className="statistic-title">Total Finance (LAK)</div></div></div>
          <div className="donut-card"><div className="main-statistic"><div className="statistic-value">{financeSummary.totalAmountUSD == null ? "Not available" : financeSummary.totalAmountUSD.toLocaleString()}</div><div className="statistic-title">Total Finance (USD)</div></div></div>
        </div>
        <div className="resources-section-badge"><InfoCircleOutlined /> Climate Finance Breakdown — unit: {sectorCurrency}, total: {currencyTotal == null ? "Not available" : currencyTotal.toLocaleString()}</div>
        <div className="resources-chart-grid">
          <div className="resources-chart-card">
            <div className="resources-chart-card-header"><h4 className="section-title">Amount received by sector</h4><Radio.Group size="small" value={sectorCurrency} onChange={(event) => setSectorCurrency(event.target.value)}><Radio.Button value="LAK">LAK</Radio.Button><Radio.Button value="USD">USD</Radio.Button></Radio.Group></div>
            {activeSectorData.length === 0 ? <Empty description={`No ${sectorCurrency} climate finance is available.`} /> : <Chart type="bar" height={320} options={{ chart: { toolbar: { show: false } }, xaxis: { categories: activeSectorData.map((item) => item.title) }, yaxis: { title: { text: sectorCurrency } }, dataLabels: { enabled: false }, legend: { show: false }, colors: [COLOR_CONFIGS.PRIMARY_THEME_COLOR], plotOptions: { bar: { columnWidth: "45%", borderRadius: 4 } }, tooltip: { y: { formatter: (value: number) => value.toLocaleString() } } }} series={[{ name: `Amount (${sectorCurrency})`, data: activeSectorData.map((item) => item.value) }]} />}
          </div>
          <div className="resources-chart-card">
            <div className="resources-chart-card-header"><h4 className="section-title">Amount received by channel</h4><span className="resources-chart-dimension-label">{sectorCurrency}</span></div>
            {channelData.length === 0 ? <Empty description={`No ${sectorCurrency} channel data is available.`} /> : <Chart type="pie" height={320} options={{ labels: channelData.map((item) => item.title), colors: DONUT_PALETTE, dataLabels: { enabled: true, formatter: (value: number) => `${value.toFixed(1)}%` }, legend: { show: true, position: "bottom", formatter: (name: string, opts: { seriesIndex: number }) => { const item = channelData[opts.seriesIndex]; return `${name}: ${item.amount.toLocaleString()} ${sectorCurrency}${item.percentage == null ? "" : ` (${item.percentage.toFixed(1)}%)`}`; } }, tooltip: { y: { formatter: (value: number) => value.toLocaleString() } } }} series={channelData.map((item) => item.amount)} />}
          </div>
        </div>
      </section>

      <div className="registry-table-section"><h3 className="section-title">Browse Climate Finance Entries</h3><Space wrap style={{ marginBottom: "1rem" }}><Input.Search allowClear placeholder="Search climate finance entries" onSearch={(value) => { setFinancePage(1); setQuery(value.trim()); }} style={{ width: 280 }} /><Select allowClear placeholder="Sector" value={sector} onChange={(value) => { setFinancePage(1); setSector(value); }} options={Object.keys(financeSummary.bySectorLAK).map((value) => ({ label: value, value }))} style={{ width: 180 }} /><Input placeholder="Channel" value={channel} onChange={(event) => setChannel(event.target.value || undefined)} onPressEnter={() => setFinancePage(1)} style={{ width: 180 }} /></Space>{financeError && <Alert type="error" showIcon message="Climate finance could not be loaded." style={{ marginBottom: "1rem" }} />}{!financeLoading && !financeError && financeRows.length === 0 ? <Empty description="No climate finance entries match the selected filters." /> : <Table className="registry-table" rowKey="recordId" columns={financeColumns} dataSource={financeRows} loading={financeLoading} pagination={{ current: financePage, pageSize: PAGE_SIZE, total: financeTotal, onChange: setFinancePage }} scroll={{ x: 1100 }} />}</div>

      <div className="registry-table-section"><h3 className="section-title">Technology Development &amp; Transfer Support</h3><Space wrap style={{ marginBottom: "1rem" }}><Input.Search allowClear placeholder="Search support entries" onSearch={(value) => { setTechnologyPage(1); setCapacityPage(1); setSupportQuery(value.trim()); }} style={{ width: 280 }} /><Input placeholder="Sector" value={supportSector} onChange={(event) => setSupportSector(event.target.value || undefined)} onPressEnter={() => { setTechnologyPage(1); setCapacityPage(1); }} style={{ width: 160 }} /><Select allowClear placeholder="Status" value={supportStatus} onChange={(value) => { setTechnologyPage(1); setCapacityPage(1); setSupportStatus(value); }} options={["Completed", "On-Going", "Terminated"].map((value) => ({ label: value, value }))} style={{ width: 160 }} /></Space><Table className="registry-table" rowKey="id" columns={supportColumns(true)} dataSource={technologyRows} loading={technologyLoading} locale={{ emptyText: "No technology transfer entries are available." }} pagination={{ current: technologyPage, pageSize: PAGE_SIZE, total: technologyTotal, onChange: setTechnologyPage }} scroll={{ x: 900 }} /></div>
      <div className="registry-table-section"><h3 className="section-title">Capacity Building Support</h3><Table className="registry-table" rowKey="id" columns={supportColumns(false)} dataSource={capacityRows} loading={capacityLoading} locale={{ emptyText: "No capacity building entries are available." }} pagination={{ current: capacityPage, pageSize: PAGE_SIZE, total: capacityTotal, onChange: setCapacityPage }} scroll={{ x: 900 }} /></div>

      <Modal title={selectedSupport?.title} open={!!selectedSupport} onCancel={() => setSelectedSupport(null)} footer={null}><Alert type="info" showIcon message="Synthetic demonstration record" style={{ marginBottom: "1rem" }} />{selectedSupport && <Descriptions column={1} bordered size="small"><Descriptions.Item label="Description">{selectedSupport.description || "Not available"}</Descriptions.Item><Descriptions.Item label="Technology Type">{selectedSupport.technologyType || "Not applicable"}</Descriptions.Item><Descriptions.Item label="Timeframe">{selectedSupport.timeframe || "Not available"}</Descriptions.Item><Descriptions.Item label="Recipient Entity">{selectedSupport.recipientEntity || "Not available"}</Descriptions.Item><Descriptions.Item label="Implementing Entity">{selectedSupport.implementingEntity || "Not available"}</Descriptions.Item><Descriptions.Item label="Type">{selectedSupport.type || "Not available"}</Descriptions.Item><Descriptions.Item label="Sector">{selectedSupport.sector || "Not available"}</Descriptions.Item><Descriptions.Item label="Subsector">{selectedSupport.subsector || "Not available"}</Descriptions.Item><Descriptions.Item label="Status"><Tag color={supportStatusColor[selectedSupport.status] || "default"}>{selectedSupport.status}</Tag></Descriptions.Item><Descriptions.Item label="Impact / Estimated Result">{selectedSupport.impactEstimatedResult || "Not available"}</Descriptions.Item><Descriptions.Item label="Additional Information">{selectedSupport.additionalInformation || "Not available"}</Descriptions.Item></Descriptions>}</Modal>
    </div>
  );
};

export default ResourcesTab;

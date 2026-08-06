import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tabs,
  message,
} from "antd";
import { Link } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import { formatPublicEnum } from "../../Components/Homepage/publicData";
import {
  EMISSION_MARKET_CURRENCIES,
  EMISSION_MARKET_UNITS,
  EMISSION_MARKET_VENUES,
  EMISSION_TRADING_MANAGEMENT_API,
  EmissionManagementKind,
} from "./emissionTradingManagement.api";

type ManagementRecord = Record<string, any> & { id: number };
type LifecycleEvent = {
  action: string;
  at: number;
  actorId: number | null;
  reason: string | null;
};

const unwrap = <T,>(response: any): T => {
  const payload = response?.data ?? response;
  return (payload?.data ?? payload) as T;
};

const statusColor = (status?: string) => {
  if (status === "active") return "green";
  if (status === "archived" || status === "voided") return "default";
  if (status === "reversed") return "orange";
  return "blue";
};

const EmissionTradingManagement = () => {
  const { get, put, post } = useConnection();
  const { userInfoState } = useUserContext();
  const [activeKind, setActiveKind] = useState<EmissionManagementKind>("ceilings");
  const [records, setRecords] = useState<Record<EmissionManagementKind, ManagementRecord[]>>({
    ceilings: [],
    participants: [],
    trades: [],
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [selected, setSelected] = useState<ManagementRecord | null>(null);
  const [history, setHistory] = useState<LifecycleEvent[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm<Record<string, any>>();

  const isAuthorized =
    userInfoState?.userRole === Role.Root ||
    (userInfoState?.userRole === Role.Admin &&
      (userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
        userInfoState?.companyRole === CompanyRole.MINISTRY));

  const apiFor = EMISSION_TRADING_MANAGEMENT_API[activeKind];

  const fetchRecords = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const response = await get(apiFor.list(1, 50, search, status));
      const data = unwrap<ManagementRecord[]>(response);
      setRecords((previous) => ({ ...previous, [activeKind]: data ?? [] }));
    } catch (error) {
      setRecords((previous) => ({ ...previous, [activeKind]: [] }));
      message.error("Unable to load emission market records.");
    } finally {
      setLoading(false);
    }
  }, [activeKind, apiFor, get, isAuthorized, search, status]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const showDetail = async (record: ManagementRecord) => {
    setSelected(record);
    setEditing(false);
    setDetailLoading(true);
    try {
      const [detailResponse, historyResponse] = await Promise.all([
        get(apiFor.detail(record.id)),
        get(apiFor.history(record.id)),
      ]);
      const detail = unwrap<ManagementRecord>(detailResponse);
      setSelected(detail ?? record);
      setHistory(unwrap<LifecycleEvent[]>(historyResponse) ?? []);
    } catch {
      setHistory(record.lifecycleHistory ?? []);
    } finally {
      setDetailLoading(false);
    }
  };

  const beginEdit = () => {
    if (!selected) return;
    form.setFieldsValue({ ...selected, reason: "" });
    setEditing(true);
  };

  const saveUpdate = async (values: Record<string, any>) => {
    if (!selected) return;
    try {
      await put(apiFor.update(selected.id), values);
      message.success("Emission market record updated.");
      setEditing(false);
      await fetchRecords();
      await showDetail({ ...selected, ...values });
    } catch (error) {
      message.error("The record could not be updated.");
    }
  };

  const lifecycleAction = async (record: ManagementRecord, action: "archive" | "void" | "reverse") => {
    const reason = window.prompt(`Reason for ${action}:`);
    if (!reason?.trim()) return;
    try {
      if (action === "archive" && activeKind === "ceilings") {
        await post(EMISSION_TRADING_MANAGEMENT_API.ceilings.archive(record.id), { action, reason });
      } else if (action === "archive" && activeKind === "participants") {
        await post(EMISSION_TRADING_MANAGEMENT_API.participants.archive(record.id), { action, reason });
      } else if (action === "void") {
        await post(EMISSION_TRADING_MANAGEMENT_API.trades.void(record.id), { action, reason });
      } else if (action === "reverse") {
        await post(EMISSION_TRADING_MANAGEMENT_API.trades.reverse(record.id), { action, reason });
      }
      message.success(`Record ${action}d successfully.`);
      await fetchRecords();
      if (selected?.id === record.id) await showDetail(record);
    } catch {
      message.error(`The record could not be ${action}d.`);
    }
  };

  const actionColumn = {
    title: "Actions",
    key: "actions",
    render: (_: unknown, record: ManagementRecord) => {
      const lifecycleStatus = record.lifecycleStatus || "active";
      const settled = ["settled", "completed", "finalized"].includes(record.settlementStatus);
      return (
        <Space>
          <Button size="small" onClick={() => showDetail(record)}>Detail</Button>
          {lifecycleStatus === "active" && activeKind !== "trades" && (
            <Button size="small" onClick={() => lifecycleAction(record, "archive")}>Archive</Button>
          )}
          {activeKind === "trades" && lifecycleStatus === "active" && !settled && (
            <Button size="small" onClick={() => lifecycleAction(record, "void")}>Void</Button>
          )}
          {activeKind === "trades" && lifecycleStatus === "active" && (
            <Button size="small" onClick={() => lifecycleAction(record, "reverse")}>Reverse</Button>
          )}
        </Space>
      );
    },
  };

  const columns = useMemo(() => {
    const common = [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
      },
    ];
    if (activeKind === "ceilings") {
      return [
        ...common,
        { title: "Company", dataIndex: "companyId", key: "companyId" },
        { title: "Year", dataIndex: "year", key: "year" },
        { title: "Units", dataIndex: "units", key: "units" },
        { title: "Unit", dataIndex: "unit", key: "unit" },
        { title: "Venue", dataIndex: "venueStatus", key: "venueStatus" },
        {
          title: "Status",
          dataIndex: "lifecycleStatus",
          key: "lifecycleStatus",
          render: (value: string) => <Tag color={statusColor(value || "active")}>{formatPublicEnum(value || "active")}</Tag>,
        },
        actionColumn,
      ];
    }
    if (activeKind === "participants") {
      return [
        ...common,
        { title: "Facility", dataIndex: "facilityName", key: "facilityName" },
        { title: "Company", dataIndex: "companyId", key: "companyId" },
        { title: "Year", dataIndex: "year", key: "year" },
        { title: "Capacity", dataIndex: "capacityDescription", key: "capacityDescription" },
        {
          title: "Status",
          dataIndex: "lifecycleStatus",
          key: "lifecycleStatus",
          render: (value: string) => <Tag color={statusColor(value || "active")}>{formatPublicEnum(value || "active")}</Tag>,
        },
        actionColumn,
      ];
    }
    return [
      ...common,
      { title: "Seller", dataIndex: "sellerCompanyId", key: "sellerCompanyId" },
      { title: "Buyer", dataIndex: "buyerCompanyId", key: "buyerCompanyId" },
      { title: "Units", dataIndex: "units", key: "units" },
      { title: "Value (LAK)", dataIndex: "valueLAK", key: "valueLAK" },
      { title: "Settlement", dataIndex: "settlementStatus", key: "settlementStatus", render: (value: string) => formatPublicEnum(value) },
      {
        title: "Status",
        dataIndex: "lifecycleStatus",
        key: "lifecycleStatus",
        render: (value: string) => <Tag color={statusColor(value || "active")}>{formatPublicEnum(value || "active")}</Tag>,
      },
      actionColumn,
    ];
  }, [activeKind]);

  const detailFields = selected
    ? Object.entries(selected).filter(([key]) => key !== "lifecycleHistory")
    : [];

  const editForm = () => {
    if (activeKind === "ceilings") {
      return (
        <>
          <Form.Item name="companyId" label="Company ID" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}><InputNumber min={2000} max={2100} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="units" label="Units (tCO2e)" rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="unit" label="Unit"><Select options={EMISSION_MARKET_UNITS.map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="venueStatus" label="Venue"><Select options={EMISSION_MARKET_VENUES.map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="availability" label="Availability"><Select options={["available", "not_available", "not_configured"].map((value) => ({ value, label: value }))} /></Form.Item>
        </>
      );
    }
    if (activeKind === "participants") {
      return (
        <>
          <Form.Item name="companyId" label="Company ID" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="facilityName" label="Facility" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="capacityDescription" label="Capacity" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}><InputNumber min={2000} max={2100} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="seriesName" label="Series"><Input /></Form.Item>
          <Form.Item name="sector" label="Sector"><Input /></Form.Item>
          <Form.Item name="participantStatus" label="Participant status"><Select options={["active", "unallocated", "withheld"].map((value) => ({ value, label: value }))} /></Form.Item>
        </>
      );
    }
    return (
      <>
        <Form.Item name="sellerCompanyId" label="Seller company ID" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="buyerCompanyId" label="Buyer company ID" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="units" label="Units (tCO2e)" rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="valueLAK" label="Value (LAK)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="currency" label="Currency"><Select options={EMISSION_MARKET_CURRENCIES.map((value) => ({ value, label: value }))} /></Form.Item>
        <Form.Item name="tradeDate" label="Trade date (epoch milliseconds)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="seriesName" label="Series"><Input /></Form.Item>
        <Form.Item name="venueStatus" label="Venue"><Select options={EMISSION_MARKET_VENUES.map((value) => ({ value, label: value }))} /></Form.Item>
        <Form.Item name="settlementStatus" label="Settlement"><Select options={["not_applicable", "not_configured", "configured", "pending", "settled", "completed", "finalized"].map((value) => ({ value, label: value }))} /></Form.Item>
      </>
    );
  };

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 560, margin: "4rem auto", textAlign: "center" }}>
        <Alert message="Admin access required" description="Only an authenticated DNA/Ministry administrator can manage emission market records." type="warning" />
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 1rem" }}>
      <Card title="Emission ceiling and market management">
        <Alert
          type="info"
          showIcon
          message="Lifecycle-safe administration"
          description="Ceilings and facilities can be archived. Trades are updated only while editable; settled trades must be reversed and are never deleted. Public summaries refresh from the active source records."
          style={{ marginBottom: 16 }}
        />
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search placeholder="Search records" allowClear onSearch={setSearch} style={{ width: 280 }} />
          <Select value={status} onChange={setStatus} style={{ width: 180 }} options={["active", "archived", "voided", "reversed", "all"].map((value) => ({ value, label: value }))} />
        </Space>
        <Tabs
          activeKey={activeKind}
          onChange={(key) => setActiveKind(key as EmissionManagementKind)}
          items={[
            { key: "ceilings", label: "Ceiling allocations" },
            { key: "participants", label: "Participants / facilities" },
            { key: "trades", label: "Market trades" },
          ]}
        />
        <Table
          rowKey="id"
          loading={loading}
          columns={columns as any}
          dataSource={records[activeKind]}
          locale={{ emptyText: <Empty description="No records found" /> }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        open={Boolean(selected)}
        title={`${activeKind.slice(0, -1)} detail`}
        footer={editing ? null : <Button onClick={() => setSelected(null)}>Close</Button>}
        onCancel={() => { setSelected(null); setEditing(false); }}
        width={760}
        confirmLoading={detailLoading}
      >
        {selected && !editing && (
          <>
            <Descriptions bordered size="small" column={2}>
              {detailFields.map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {typeof value === "object" ? JSON.stringify(value) : String(value ?? "Not available")}
                </Descriptions.Item>
              ))}
            </Descriptions>
            <Divider />
            <h4>Lifecycle history</h4>
            <Table rowKey={(record) => `${record.action}-${record.at}`} size="small" pagination={false} dataSource={history} columns={[
              { title: "Action", dataIndex: "action", key: "action" },
              { title: "When", dataIndex: "at", key: "at", render: (value: number) => new Date(value).toLocaleString() },
              { title: "Actor", dataIndex: "actorId", key: "actorId" },
              { title: "Reason", dataIndex: "reason", key: "reason" },
            ]} />
            {(selected.lifecycleStatus || "active") === "active" &&
              !(activeKind === "trades" && ["settled", "completed", "finalized"].includes(selected.settlementStatus)) && (
              <Button type="primary" style={{ marginTop: 16 }} onClick={beginEdit}>Edit record</Button>
            )}
          </>
        )}
        {selected && editing && (
          <Form form={form} layout="vertical" onFinish={saveUpdate}>
            {editForm()}
            <Form.Item name="reason" label="Change reason"><Input.TextArea rows={3} maxLength={500} /></Form.Item>
            <Space>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Save update</Button>
            </Space>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default EmissionTradingManagement;

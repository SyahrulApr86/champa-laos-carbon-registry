import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Divider, Empty, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, message } from "antd";
import { Link } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import { EMISSION_TRADING_MANAGEMENT_API, EmissionManagementKind } from "./emissionTradingManagement.api";

type RecordRow = Record<string, any> & { id: number };
type HistoryRow = { action: string; at: number; actorId: number | null; reason: string | null };
const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;
const color = (value: string) => value === "active" ? "green" : value === "reversed" ? "orange" : "default";

const EmissionTradingManagement = () => {
  const { get, put, post } = useConnection();
  const { userInfoState } = useUserContext();
  const authorized = userInfoState?.userRole === Role.Root || (userInfoState?.userRole === Role.Admin && [CompanyRole.DESIGNATED_NATIONAL_AUTHORITY, CompanyRole.MINISTRY].includes(userInfoState.companyRole as CompanyRole));
  const [kind, setKind] = useState<EmissionManagementKind>("ceilings");
  const [rows, setRows] = useState<Record<EmissionManagementKind, RecordRow[]>>({ ceilings: [], participants: [], trades: [] });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const api = EMISSION_TRADING_MANAGEMENT_API[kind];

  const load = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    try { const response = await get(api.list(1, 50, search, status)); setRows((old) => ({ ...old, [kind]: unwrap(response) || [] })); }
    catch { message.error("Unable to load emission market records."); }
    finally { setLoading(false); }
  }, [api, authorized, get, kind, search, status]);
  useEffect(() => { load(); }, [load]);

  const show = async (row: RecordRow) => {
    setSelected(row); setEditing(false);
    try { const [detail, audit] = await Promise.all([get(api.detail(row.id)), get(api.history(row.id))]); setSelected(unwrap(detail) || row); setHistory(unwrap(audit) || []); }
    catch { setHistory(row.lifecycleHistory || []); }
  };
  const save = async (values: Record<string, any>) => {
    if (!selected) return;
    try { await put(api.update(selected.id), values); message.success("Record updated."); setEditing(false); await load(); await show({ ...selected, ...values }); }
    catch { message.error("Record update failed."); }
  };
  const lifecycle = async (row: RecordRow, action: "archive" | "void" | "reverse") => {
    const reason = window.prompt(`Reason for ${action}:`); if (!reason?.trim()) return;
    try {
      if (action === "archive") await post((api as any).archive(row.id), { reason });
      if (action === "void") await post((api as any).void(row.id), { reason });
      if (action === "reverse") await post((api as any).reverse(row.id), { reason });
      message.success(`Record ${action}d.`); await load();
    } catch { message.error(`Unable to ${action} record.`); }
  };
  const actionColumn = { title: "Actions", key: "actions", render: (_: unknown, row: RecordRow) => { const settled = ["settled", "completed", "finalized"].includes(row.settlementStatus); return <Space><Button size="small" onClick={() => show(row)}>Detail</Button>{(row.lifecycleStatus || "active") === "active" && kind !== "trades" && <Button size="small" onClick={() => lifecycle(row, "archive")}>Archive</Button>}{kind === "trades" && (row.lifecycleStatus || "active") === "active" && !settled && <Button size="small" onClick={() => lifecycle(row, "void")}>Void</Button>}{kind === "trades" && (row.lifecycleStatus || "active") === "active" && <Button size="small" onClick={() => lifecycle(row, "reverse")}>Reverse</Button>}</Space>; } };
  const columns = kind === "ceilings" ? [{ title: "ID", dataIndex: "id" }, { title: "Company", dataIndex: "companyId" }, { title: "Year", dataIndex: "year" }, { title: "Units", dataIndex: "units" }, { title: "Unit", dataIndex: "unit" }, { title: "Venue", dataIndex: "venueStatus" }, { title: "Status", dataIndex: "lifecycleStatus", render: (v: string) => <Tag color={color(v || "active")}>{v || "active"}</Tag> }, actionColumn] : kind === "participants" ? [{ title: "ID", dataIndex: "id" }, { title: "Facility", dataIndex: "facilityName" }, { title: "Company", dataIndex: "companyId" }, { title: "Year", dataIndex: "year" }, { title: "Capacity", dataIndex: "capacityDescription" }, { title: "Status", dataIndex: "lifecycleStatus", render: (v: string) => <Tag color={color(v || "active")}>{v || "active"}</Tag> }, actionColumn] : [{ title: "ID", dataIndex: "id" }, { title: "Seller", dataIndex: "sellerCompanyId" }, { title: "Buyer", dataIndex: "buyerCompanyId" }, { title: "Units", dataIndex: "units" }, { title: "Value LAK", dataIndex: "valueLAK" }, { title: "Settlement", dataIndex: "settlementStatus" }, { title: "Status", dataIndex: "lifecycleStatus", render: (v: string) => <Tag color={color(v || "active")}>{v || "active"}</Tag> }, actionColumn];

  const editFields = kind === "ceilings" ? <><Form.Item name="companyId" label="Company ID" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item><Form.Item name="year" label="Year" rules={[{ required: true }]}><InputNumber min={2000} max={2100} /></Form.Item><Form.Item name="units" label="Units (tCO2e)" rules={[{ required: true }]}><InputNumber min={0.01} /></Form.Item><Form.Item name="unit" label="Unit"><Select options={["tCO2e"].map((v) => ({ value: v, label: v }))} /></Form.Item><Form.Item name="venueStatus" label="Venue"><Select options={["synthetic_demo", "configured", "not_configured"].map((v) => ({ value: v, label: v }))} /></Form.Item></> : kind === "participants" ? <><Form.Item name="companyId" label="Company ID" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item><Form.Item name="facilityName" label="Facility" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="capacityDescription" label="Capacity" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="year" label="Year" rules={[{ required: true }]}><InputNumber min={2000} max={2100} /></Form.Item><Form.Item name="seriesName" label="Series"><Input /></Form.Item></> : <><Form.Item name="sellerCompanyId" label="Seller ID" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item><Form.Item name="buyerCompanyId" label="Buyer ID" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item><Form.Item name="units" label="Units (tCO2e)" rules={[{ required: true }]}><InputNumber min={0.01} /></Form.Item><Form.Item name="valueLAK" label="Value (LAK)"><InputNumber min={0} /></Form.Item><Form.Item name="currency" label="Currency"><Select options={["LAK"].map((v) => ({ value: v, label: v }))} /></Form.Item><Form.Item name="tradeDate" label="Trade date (epoch ms)" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item><Form.Item name="venueStatus" label="Venue"><Select options={["synthetic_demo", "configured", "not_configured"].map((v) => ({ value: v, label: v }))} /></Form.Item><Form.Item name="settlementStatus" label="Settlement"><Select options={["not_applicable", "not_configured", "configured", "pending", "settled", "completed", "finalized"].map((v) => ({ value: v, label: v }))} /></Form.Item></>;

  if (!authorized) return <div style={{ maxWidth: 560, margin: "4rem auto", textAlign: "center" }}><Alert type="warning" message="Admin access required" description="Only an authenticated DNA/Ministry administrator can manage emission market records." /><Link to="/">Return to homepage</Link></div>;
  const selectedTradeSettled = kind === "trades" && ["settled", "completed", "finalized"].includes(selected?.settlementStatus);
  return <div style={{ maxWidth: 1280, margin: "2rem auto", padding: "0 1rem" }}><Card title="Emission ceiling and market management"><Alert type="info" showIcon message="Lifecycle-safe administration" description="Archive source records; void or reverse trades. Settled trades remain in the audit history and are never deleted." style={{ marginBottom: 16 }} /><Space wrap style={{ marginBottom: 16 }}><Input.Search allowClear placeholder="Search" onSearch={setSearch} style={{ width: 280 }} /><Select value={status} onChange={setStatus} style={{ width: 160 }} options={["active", "archived", "voided", "reversed", "all"].map((v) => ({ value: v, label: v }))} /></Space><Tabs activeKey={kind} onChange={(v) => setKind(v as EmissionManagementKind)} items={[{ key: "ceilings", label: "Ceilings" }, { key: "participants", label: "Participants" }, { key: "trades", label: "Trades" }]} /><Table rowKey="id" loading={loading} columns={columns as any} dataSource={rows[kind]} locale={{ emptyText: <Empty description="No records found" /> }} scroll={{ x: 900 }} /></Card><Modal open={Boolean(selected)} title={`${kind} detail`} footer={editing ? null : <Button onClick={() => setSelected(null)}>Close</Button>} onCancel={() => { setSelected(null); setEditing(false); }} width={760}><>{selected && !editing && <><Descriptions bordered size="small" column={2}>{Object.entries(selected).filter(([key]) => key !== "lifecycleHistory").map(([key, value]) => <Descriptions.Item key={key} label={key}>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</Descriptions.Item>)}</Descriptions><Divider /><h4>Lifecycle history</h4><Table rowKey={(r) => `${r.action}-${r.at}`} size="small" pagination={false} dataSource={history} columns={[{ title: "Action", dataIndex: "action" }, { title: "When", dataIndex: "at", render: (v: number) => new Date(v).toLocaleString() }, { title: "Actor", dataIndex: "actorId" }, { title: "Reason", dataIndex: "reason" }]} /><Button type="primary" style={{ marginTop: 16 }} disabled={selected.lifecycleStatus !== "active" || selectedTradeSettled} onClick={() => { form.setFieldsValue(selected); setEditing(true); }}>Edit record</Button></>}{selected && editing && <Form form={form} layout="vertical" onFinish={save}>{editFields}<Form.Item name="reason" label="Change reason"><Input.TextArea maxLength={500} /></Form.Item><Space><Button onClick={() => setEditing(false)}>Cancel</Button><Button type="primary" htmlType="submit">Save update</Button></Space></Form>}</></Modal></div>;
};

export default EmissionTradingManagement;

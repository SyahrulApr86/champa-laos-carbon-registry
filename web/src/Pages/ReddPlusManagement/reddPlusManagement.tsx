import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from "antd";
import type { TableColumnsType } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import { reddPlusManagementApi as api } from "./reddPlusManagementApi";

type ReddRow = {
  id: number;
  province: string;
  title: string;
  description?: string | null;
  forestAreaHectares?: number | null;
  estimatedEmissionReductionTco2e?: number | null;
  implementingEntity: string;
  status: string;
  startYear?: number | null;
  version?: number;
  archivedAt?: number | null;
};

const statuses = ["Proposed", "Ongoing", "Completed"];
const provinces = ["Vientiane Capital", "Phongsaly", "Luang Namtha", "Oudomxay", "Bokeo", "Luang Prabang", "Houaphanh", "Xayaboury", "Xiangkhouang", "Vientiane Province", "Bolikhamxay", "Khammouane", "Savannakhet", "Salavan", "Sekong", "Champasak", "Attapeu", "Xaisomboun"];
const canManage = (role?: string, companyRole?: string) => role === Role.Root || (role === Role.Admin && (companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY || companyRole === CompanyRole.MINISTRY));
const responseData = (response: any) => response?.data ?? response;

const ReddPlusManagement = () => {
  const { get, post, put, patch } = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<ReddRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReddRow>();
  const [detail, setDetail] = useState<any>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const authorized = canManage(userInfoState?.userRole, userInfoState?.companyRole);

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response: any = await get(api.list(includeArchived));
      const data = responseData(response);
      setRows(Array.isArray(data) ? data : data?.data ?? []);
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load REDD+ records.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (authorized) void load(); }, [authorized, includeArchived]);

  const openCreate = () => { setEditing(undefined); setDetail(undefined); form.resetFields(); setEditorOpen(true); };
  const openEdit = async (row: ReddRow) => {
    setEditing(row);
    form.setFieldsValue(row);
    setEditorOpen(true);
    try { const response: any = await get(api.detail(row.id)); setDetail(responseData(response)); } catch { /* detail history is supplementary */ }
  };

  const save = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (editing) await put(api.update(editing.id), values);
      else await post(api.create, values);
      message.success(editing ? "REDD+ record version saved." : "REDD+ record recorded.");
      setEditorOpen(false);
      await load();
    } catch (requestError: any) { message.error(requestError?.message || "Unable to save REDD+ record."); }
    finally { setSaving(false); }
  };

  const archive = async (id: number) => {
    try { await patch(api.archive(id)); message.success("REDD+ record archived without deleting its history."); await load(); }
    catch (requestError: any) { message.error(requestError?.message || "Unable to archive REDD+ record."); }
  };

  if (!authorized) return <Alert type="warning" message="Only DNA/Ministry administrators or root users can manage REDD+ records." />;

  const columns: TableColumnsType<ReddRow> = [
    { title: "Province", dataIndex: "province" },
    { title: "Project", dataIndex: "title" },
    { title: "Implementing entity", dataIndex: "implementingEntity" },
    { title: "Forest area (ha)", dataIndex: "forestAreaHectares" },
    { title: "Reduction (tCO2e)", dataIndex: "estimatedEmissionReductionTco2e" },
    { title: "Status", dataIndex: "status", render: (value) => <Tag>{value}</Tag> },
    { title: "Version", dataIndex: "version", render: (value) => value ?? 1 },
    { title: "Actions", render: (_, row) => <Space><Button size="small" onClick={() => void openEdit(row)}>Detail / edit</Button>{!row.archivedAt && <Button size="small" danger onClick={() => void archive(row.id)}>Archive</Button>}</Space> },
  ];

  return <Card title="REDD+ management" extra={<Space><Button onClick={() => setIncludeArchived((value) => !value)}>{includeArchived ? "Hide archived" : "Show archived"}</Button><Button type="primary" onClick={openCreate}>Record project</Button></Space>}>
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
    <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 20 }} />
    <Modal title={editing ? "Edit REDD+ record (creates a new version)" : "Record REDD+ project"} open={editorOpen} onCancel={() => setEditorOpen(false)} footer={null} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={(values) => void save(values)}>
        <Form.Item name="province" label="Province" rules={[{ required: true }]}><Select showSearch options={provinces.map((value) => ({ label: value, value }))} /></Form.Item>
        <Form.Item name="title" label="Project title" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="implementingEntity" label="Implementing entity" rules={[{ required: true }]}><Input /></Form.Item>
        <Space style={{ display: "flex" }}>
          <Form.Item name="forestAreaHectares" label="Forest area (ha)"><InputNumber min={0} /></Form.Item>
          <Form.Item name="estimatedEmissionReductionTco2e" label="Reduction (tCO2e)"><InputNumber min={0} /></Form.Item>
        </Space>
        <Space style={{ display: "flex" }}>
          <Form.Item name="status" label="Status"><Select allowClear options={statuses.map((value) => ({ label: value, value }))} /></Form.Item>
          <Form.Item name="startYear" label="Start year"><InputNumber min={1900} max={2100} /></Form.Item>
        </Space>
        {detail?.versions && <Alert type="info" message={`${detail.versions.length} version(s) in this project history`} style={{ marginBottom: 16 }} />}
        <Button type="primary" htmlType="submit" loading={saving} block>Save</Button>
      </Form>
    </Modal>
  </Card>;
};

export default ReddPlusManagement;

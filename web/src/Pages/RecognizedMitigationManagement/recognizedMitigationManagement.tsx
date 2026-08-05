import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from "antd";
import type { TableColumnsType } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import { Sector } from "../../Definitions/Enums/sector.enum";
import { recognizedMitigationManagementApi as api } from "./recognizedMitigationManagementApi";

type MitigationRow = {
  id: number;
  referenceId?: string;
  title: string;
  description: string;
  proponentName: string;
  proponentType: string;
  sector: string;
  region: string;
  estimatedReductionTco2e?: number | null;
  status: string;
  version?: number;
  archivedAt?: number | null;
};

const statuses = ["Submitted", "UnderReview", "Recognized", "Rejected"];
const canManage = (role?: string, companyRole?: string) => role === Role.Root || (role === Role.Admin && (companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY || companyRole === CompanyRole.MINISTRY));
const responseData = (response: any) => response?.data ?? response;

const RecognizedMitigationManagement = () => {
  const { get, post, put, patch } = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<MitigationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MitigationRow>();
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
      setError(requestError?.message || "Unable to load recognized mitigation actions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (authorized) void load(); }, [authorized, includeArchived]);

  const openCreate = () => { setEditing(undefined); setDetail(undefined); form.resetFields(); setEditorOpen(true); };
  const openEdit = async (row: MitigationRow) => {
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
      message.success(editing ? "Mitigation action version saved." : "Mitigation action recorded.");
      setEditorOpen(false);
      await load();
    } catch (requestError: any) { message.error(requestError?.message || "Unable to save mitigation action."); }
    finally { setSaving(false); }
  };

  const archive = async (id: number) => {
    try { await patch(api.archive(id)); message.success("Action archived without deleting its history."); await load(); }
    catch (requestError: any) { message.error(requestError?.message || "Unable to archive action."); }
  };

  if (!authorized) return <Alert type="warning" message="Only DNA/Ministry administrators or root users can manage recognized mitigation actions." />;

  const columns: TableColumnsType<MitigationRow> = [
    { title: "Reference", dataIndex: "referenceId" },
    { title: "Action", dataIndex: "title" },
    { title: "Proponent", dataIndex: "proponentName" },
    { title: "Region", dataIndex: "region" },
    { title: "Reduction (tCO2e)", dataIndex: "estimatedReductionTco2e" },
    { title: "Status", dataIndex: "status", render: (value) => <Tag>{value}</Tag> },
    { title: "Version", dataIndex: "version", render: (value) => value ?? 1 },
    { title: "Actions", render: (_, row) => <Space><Button size="small" onClick={() => void openEdit(row)}>Detail / edit</Button>{!row.archivedAt && <Button size="small" danger onClick={() => void archive(row.id)}>Archive</Button>}</Space> },
  ];

  return <Card title="Recognized mitigation management" extra={<Space><Button onClick={() => setIncludeArchived((value) => !value)}>{includeArchived ? "Hide archived" : "Show archived"}</Button><Button type="primary" onClick={openCreate}>Record action</Button></Space>}>
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
    <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 20 }} />
    <Modal title={editing ? "Edit action (creates a new version)" : "Record recognized mitigation action"} open={editorOpen} onCancel={() => setEditorOpen(false)} footer={null} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={(values) => void save(values)}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="proponentName" label="Proponent" rules={[{ required: true }]}><Input /></Form.Item>
        <Space style={{ display: "flex" }}>
          <Form.Item name="proponentType" label="Proponent type" rules={[{ required: true }]}><Select style={{ width: 200 }} options={Object.values(CompanyRole).map((value) => ({ label: value, value }))} /></Form.Item>
          <Form.Item name="sector" label="Sector" rules={[{ required: true }]}><Select style={{ width: 180 }} options={Object.values(Sector).map((value) => ({ label: value, value }))} /></Form.Item>
        </Space>
        <Form.Item name="region" label="Region / province" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="estimatedReductionTco2e" label="Estimated reduction (tCO2e)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="status" label="Review status"><Select allowClear options={statuses.map((value) => ({ label: value, value }))} /></Form.Item>
        {detail?.versions && <Alert type="info" message={`${detail.versions.length} version(s) in this action history`} style={{ marginBottom: 16 }} />}
        <Button type="primary" htmlType="submit" loading={saving} block>Save</Button>
      </Form>
    </Modal>
  </Card>;
};

export default RecognizedMitigationManagement;

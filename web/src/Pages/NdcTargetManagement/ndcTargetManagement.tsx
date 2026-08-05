import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from "antd";
import type { TableColumnsType } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import { NdcSector } from "../../Definitions/Enums/ndcSector.enum";
import { ndcTargetManagementApi as api } from "./ndcTargetManagementApi";

type NdcRow = {
  id: number;
  year: number;
  sector: NdcSector;
  baselineEmissions: number;
  targetEmissions2030: number;
  achievedEmissions: number;
  claimedEmissions?: number | null;
  notes?: string | null;
  version?: number;
  published?: boolean;
  archivedAt?: number | null;
};

const isManager = (role?: string, companyRole?: string) =>
  role === Role.Root ||
  (role === Role.Admin &&
    (companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      companyRole === CompanyRole.MINISTRY));

const responseData = (response: any) => response?.data ?? response;

const NdcTargetManagement = () => {
  const { get, post, put, patch } = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<NdcRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [detail, setDetail] = useState<any>();
  const [editing, setEditing] = useState<NdcRow>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const canManage = isManager(userInfoState?.userRole, userInfoState?.companyRole);

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response: any = await get(api.list(includeArchived));
      const data = responseData(response);
      setRows(Array.isArray(data) ? data : data?.data ?? []);
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load NDC target records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, includeArchived]);

  const openCreate = () => {
    setEditing(undefined);
    form.resetFields();
    setEditorOpen(true);
  };

  const openEdit = async (row: NdcRow) => {
    setEditing(row);
    form.setFieldsValue(row);
    setEditorOpen(true);
    try {
      const response: any = await get(api.detail(row.id));
      setDetail(responseData(response));
    } catch {
      // The editor remains usable when an optional history lookup fails.
    }
  };

  const save = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (editing) await put(api.update(editing.id), values);
      else await post(api.create, values);
      message.success(editing ? "NDC target version saved." : "NDC target recorded.");
      setEditorOpen(false);
      await load();
    } catch (requestError: any) {
      message.error(requestError?.message || "Unable to save NDC target.");
    } finally {
      setSaving(false);
    }
  };

  const archive = async (id: number) => {
    try {
      await patch(api.archive(id));
      message.success("NDC target archived without deleting its history.");
      await load();
    } catch (requestError: any) {
      message.error(requestError?.message || "Unable to archive NDC target.");
    }
  };

  if (!canManage) {
    return <Alert type="warning" message="Only DNA/Ministry administrators or root users can manage NDC targets." />;
  }

  const columns: TableColumnsType<NdcRow> = [
    { title: "Year", dataIndex: "year", width: 90 },
    { title: "Sector", dataIndex: "sector" },
    { title: "Baseline", dataIndex: "baselineEmissions" },
    { title: "2030 target", dataIndex: "targetEmissions2030" },
    { title: "Achieved", dataIndex: "achievedEmissions" },
    { title: "Version", dataIndex: "version", render: (value) => value ?? 1 },
    { title: "Lifecycle", render: (_, row) => row.archivedAt ? <Tag>Archived</Tag> : <Tag color="green">Published</Tag> },
    {
      title: "Actions",
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => void openEdit(row)}>Detail / edit</Button>
          {!row.archivedAt && <Button size="small" danger onClick={() => void archive(row.id)}>Archive</Button>}
        </Space>
      ),
    },
  ];

  return (
    <Card title="NDC target management" extra={<Space><Button onClick={() => setIncludeArchived((value) => !value)}>{includeArchived ? "Hide archived" : "Show archived"}</Button><Button type="primary" onClick={openCreate}>Record target</Button></Space>}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 20 }} />
      <Modal title={editing ? "Edit NDC target (creates a new version)" : "Record NDC target"} open={editorOpen} onCancel={() => setEditorOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={(values) => void save(values)}>
          <Space style={{ display: "flex" }} size="middle">
            <Form.Item name="year" label="Year" rules={[{ required: true }]}><InputNumber min={1900} max={2100} /></Form.Item>
            <Form.Item name="sector" label="Sector" rules={[{ required: true }]}><Select style={{ width: 180 }} options={Object.values(NdcSector).map((value) => ({ label: value, value }))} /></Form.Item>
          </Space>
          <Form.Item name="baselineEmissions" label="Baseline emissions" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="targetEmissions2030" label="2030 target emissions" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="achievedEmissions" label="Achieved emissions" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="claimedEmissions" label="Claimed emissions"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
          {detail?.versions && <Alert type="info" message={`${detail.versions.length} version(s) in this observation history`} style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" loading={saving} block>Save</Button>
        </Form>
      </Modal>
    </Card>
  );
};

export default NdcTargetManagement;

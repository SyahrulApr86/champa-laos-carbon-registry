import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { Link } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { technologyTransferManagementApi as api } from "./api";

interface TechnologyRecord {
  id: number;
  title: string;
  description: string;
  technologyType: string;
  timeframe?: string;
  recipientEntity: string;
  implementingEntity: string;
  type: string;
  sector: string;
  subsector?: string;
  status?: string;
  impactEstimatedResult?: string;
  additionalInformation?: string;
  archivedAt?: number | null;
}

const TYPES = ["Mitigation", "Adaptation", "Cross Cutting"];
const STATUSES = ["Completed", "On-Going", "Terminated"];

const unwrap = (response: any): any => {
  const value = response?.data ?? response;
  return Array.isArray(value) ? value : value?.data ?? value;
};

const errorText = (error: unknown) =>
  error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "The management request failed.";

const TechnologyTransferManagement = () => {
  const { get, put, patch, delete: deleteRequest } = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<TechnologyRecord[]>([]);
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<TechnologyRecord>();
  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await get(api.list({ q: query.trim(), includeArchived }));
      setRows((unwrap(response) as TechnologyRecord[]) ?? []);
    } catch (error) {
      setRows([]);
      message.error(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [get, includeArchived, query]);

  useEffect(() => {
    if (isAuthorized) void fetchRows();
  }, [fetchRows, isAuthorized]);

  const edit = async (id: number) => {
    try {
      form.setFieldsValue(unwrap(await get(api.detail(id))) as TechnologyRecord);
      setEditingId(id);
      setEditorVisible(true);
    } catch (error) {
      message.error(errorText(error));
    }
  };

  const save = async (values: TechnologyRecord) => {
    if (editingId === null) return;
    setSaving(true);
    try {
      const { id, archivedAt, ...payload } = values;
      await put(api.update(editingId), payload);
      message.success("Technology transfer entry updated.");
      setEditorVisible(false);
      await fetchRows();
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  const archive = (id: number) => {
    Modal.confirm({
      title: "Archive this technology transfer entry?",
      content: "The entry will leave the public list but remain available to management users.",
      okText: "Archive",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await patch(api.archive(id), { reason: "Archived from resource management" });
          message.success("Technology transfer entry archived.");
          await fetchRows();
        } catch (error) {
          message.error(errorText(error));
        }
      },
    });
  };

  const remove = (id: number) => {
    Modal.confirm({
      title: "Delete this source record permanently?",
      content: "Use archive when an audit trail is required. This delete cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRequest(api.remove(id));
          message.success("Technology transfer entry deleted.");
          await fetchRows();
        } catch (error) {
          message.error(errorText(error));
        }
      },
    });
  };

  if (!isAuthorized) {
    return <Alert type="error" showIcon message="Only DNA/Ministry users can manage technology transfer." action={<Link to="/">Back to home</Link>} />;
  }

  const columns = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Technology", dataIndex: "technologyType", key: "technologyType" },
    { title: "Recipient", dataIndex: "recipientEntity", key: "recipientEntity" },
    { title: "Sector", dataIndex: "sector", key: "sector" },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag>{value}</Tag> },
    { title: "Lifecycle", key: "lifecycle", render: (_: unknown, record: TechnologyRecord) => record.archivedAt ? <Tag>Archived</Tag> : <Tag color="green">Public</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: TechnologyRecord) => (
        <Space>
          <Button size="small" onClick={() => void edit(record.id)}>Detail / edit</Button>
          {!record.archivedAt && <Button size="small" danger onClick={() => archive(record.id)}>Archive</Button>}
          <Button size="small" danger onClick={() => remove(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Technology Transfer Management" extra={<Link to="/">Back to home</Link>}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Search title or entity" allowClear onSearch={setQuery} style={{ width: 280 }} />
        <span>Include archived <Switch checked={includeArchived} onChange={setIncludeArchived} /></span>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} scroll={{ x: 1100 }} />
      <Modal title="Technology transfer detail" visible={editorVisible} onCancel={() => setEditorVisible(false)} onOk={() => form.submit()} confirmLoading={saving} destroyOnClose width={760}>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="technologyType" label="Technology type" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="timeframe" label="Timeframe"><Input /></Form.Item>
          </Space>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="recipientEntity" label="Recipient" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="implementingEntity" label="Implementer" rules={[{ required: true }]}><Input /></Form.Item>
          </Space>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="type" label="Type" rules={[{ required: true }]}><Select options={TYPES.map((value) => ({ value, label: value }))} /></Form.Item>
            <Form.Item name="sector" label="Sector" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="subsector" label="Subsector"><Input /></Form.Item>
          </Space>
          <Form.Item name="status" label="Status"><Select allowClear options={STATUSES.map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="impactEstimatedResult" label="Impact / estimated result"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="additionalInformation" label="Additional information"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TechnologyTransferManagement;

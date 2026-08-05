import { useCallback, useEffect, useState } from "react";
import moment, { Moment } from "moment";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
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
import { climateFinanceManagementApi as api } from "./api";

interface FinanceRecord {
  id: number;
  title: string;
  description: string;
  channel?: string;
  recipientEntity: string;
  implementingEntity: string;
  dateSigned: number;
  dateClosing?: number | null;
  amountLAK?: number | null;
  amountUSD?: number | null;
  sector: string;
  financialInstrument?: string;
  status?: string;
  type: string;
  archivedAt?: number | null;
}

interface FinanceFormValues extends Omit<FinanceRecord, "dateSigned" | "dateClosing" | "id" | "archivedAt"> {
  dateSigned?: Moment;
  dateClosing?: Moment;
}

const OPTIONS = {
  channel: ["Multilateral", "Bilateral", "Commercial Bank or Other Financial Institution", "Other"],
  instrument: ["Grant", "Concessional Loan", "Loan", "Other"],
  status: ["Ongoing", "Fully Disbursed", "Closed"],
  type: ["Mitigation", "Adaptation", "Cross Cutting"],
  sector: ["Energy", "Health", "Education", "Transport", "Manufacturing", "Industrial Processes and Product Use", "Hospitality", "Forestry", "Waste", "Agriculture", "Other"],
};

const unwrap = (response: any): any => {
  const value = response?.data ?? response;
  return Array.isArray(value) ? value : value?.data ?? value;
};

const errorText = (error: unknown) =>
  error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "The management request failed.";

const ClimateFinanceManagement = () => {
  const { get, put, patch, delete: deleteRequest } = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<FinanceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FinanceFormValues>();

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await get(api.list({ q: query.trim(), includeArchived }));
      setRows((unwrap(response) as FinanceRecord[]) ?? []);
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
      const record = unwrap(await get(api.detail(id))) as FinanceRecord;
      form.setFieldsValue({
        ...record,
        dateSigned: record.dateSigned ? moment(Number(record.dateSigned)) : undefined,
        dateClosing: record.dateClosing ? moment(Number(record.dateClosing)) : undefined,
      });
      setEditingId(id);
      setEditorVisible(true);
    } catch (error) {
      message.error(errorText(error));
    }
  };

  const save = async (values: FinanceFormValues) => {
    if (editingId === null) return;
    setSaving(true);
    try {
      const { dateSigned, dateClosing, ...rest } = values;
      await put(api.update(editingId), {
        ...rest,
        dateSigned: dateSigned?.valueOf(),
        dateClosing: dateClosing?.valueOf(),
      });
      message.success("Climate finance entry updated.");
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
      title: "Archive this climate finance entry?",
      content: "Archived entries leave the public search and summary but remain available to management users.",
      okText: "Archive",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await patch(api.archive(id), { reason: "Archived from resource management" });
          message.success("Climate finance entry archived.");
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
          message.success("Climate finance entry deleted.");
          await fetchRows();
        } catch (error) {
          message.error(errorText(error));
        }
      },
    });
  };

  if (!isAuthorized) {
    return <Alert type="error" showIcon message="Only DNA/Ministry users can manage climate finance." action={<Link to="/">Back to home</Link>} />;
  }

  const columns = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Recipient", dataIndex: "recipientEntity", key: "recipientEntity" },
    { title: "Sector", dataIndex: "sector", key: "sector" },
    { title: "LAK", dataIndex: "amountLAK", key: "amountLAK" },
    { title: "USD", dataIndex: "amountUSD", key: "amountUSD" },
    { title: "Status", dataIndex: "status", key: "status", render: (value: string) => <Tag>{value}</Tag> },
    { title: "Lifecycle", key: "lifecycle", render: (_: unknown, record: FinanceRecord) => record.archivedAt ? <Tag color="default">Archived</Tag> : <Tag color="green">Public</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: FinanceRecord) => (
        <Space>
          <Button size="small" onClick={() => void edit(record.id)}>Detail / edit</Button>
          {!record.archivedAt && <Button size="small" danger onClick={() => archive(record.id)}>Archive</Button>}
          <Button size="small" danger onClick={() => remove(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Climate Finance Management" extra={<Link to="/">Back to home</Link>}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Search title or entity" allowClear onSearch={setQuery} style={{ width: 280 }} />
        <span>Include archived <Switch checked={includeArchived} onChange={setIncludeArchived} /></span>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} scroll={{ x: 1100 }} />
      <Modal title="Climate finance detail" visible={editorVisible} onCancel={() => setEditorVisible(false)} onOk={() => form.submit()} confirmLoading={saving} destroyOnClose width={760}>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="recipientEntity" label="Recipient" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="implementingEntity" label="Implementer" rules={[{ required: true }]}><Input /></Form.Item>
          </Space>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="dateSigned" label="Date signed" rules={[{ required: true }]}><DatePicker /></Form.Item>
            <Form.Item name="dateClosing" label="Date closing"><DatePicker /></Form.Item>
          </Space>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="amountLAK" label="Amount (LAK)"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item>
            <Form.Item name="amountUSD" label="Amount (USD)"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item>
          </Space>
          <Form.Item name="channel" label="Channel"><Select allowClear options={OPTIONS.channel.map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="financialInstrument" label="Financial instrument"><Select allowClear options={OPTIONS.instrument.map((value) => ({ value, label: value }))} /></Form.Item>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item name="sector" label="Sector" rules={[{ required: true }]}><Select options={OPTIONS.sector.map((value) => ({ value, label: value }))} /></Form.Item>
            <Form.Item name="status" label="Status"><Select allowClear options={OPTIONS.status.map((value) => ({ value, label: value }))} /></Form.Item>
            <Form.Item name="type" label="Type" rules={[{ required: true }]}><Select options={OPTIONS.type.map((value) => ({ value, label: value }))} /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
};

export default ClimateFinanceManagement;

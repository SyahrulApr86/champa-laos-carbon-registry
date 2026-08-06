import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
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
import { COMMUNITY_PROGRAM_MANAGEMENT_API } from "./communityProgramManagement.api";

type CommunityProgramStatus = "Active" | "Completed" | "Planned" | "Archived";

interface CommunityProgram {
  id: number;
  programId: string;
  name: string;
  region: string;
  category: string;
  description: string;
  participantCount?: number | null;
  startYear: number;
  status: CommunityProgramStatus;
  createdAt: number;
  updatedAt?: number | null;
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
  archivedAt?: number | null;
  archivedByUserId?: number | null;
  archiveReason?: string | null;
}

interface CommunityProgramEditValues {
  name: string;
  region: string;
  category: string;
  description: string;
  participantCount?: number;
  startYear: number;
  status: CommunityProgramStatus;
}

const CATEGORIES = ["Adaptation", "Mitigation", "Adaptation and Mitigation"];
const STATUSES: CommunityProgramStatus[] = ["Active", "Completed", "Planned"];
const statusColors: Record<string, string> = {
  Active: "green",
  Completed: "blue",
  Planned: "gold",
  Archived: "default",
};

const errorMessage = (error: unknown, fallback: string) =>
  error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : fallback;

const CommunityProgramManagement = () => {
  const { get, put, post } = useConnection();
  const { userInfoState } = useUserContext();
  const [form] = Form.useForm<CommunityProgramEditValues>();
  const [rows, setRows] = useState<CommunityProgram[]>([]);
  const [selected, setSelected] = useState<CommunityProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await get(COMMUNITY_PROGRAM_MANAGEMENT_API.list(includeArchived));
      setRows((response?.data as CommunityProgram[] | undefined) ?? []);
    } catch (error) {
      setRows([]);
      message.error(errorMessage(error, "Community programs could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [get, includeArchived]);

  useEffect(() => {
    if (isAuthorized) fetchRows();
  }, [fetchRows, isAuthorized]);

  const openDetail = async (record: CommunityProgram) => {
    try {
      const response = await get(COMMUNITY_PROGRAM_MANAGEMENT_API.detail(record.id));
      setSelected((response?.data as CommunityProgram | undefined) ?? record);
    } catch (error) {
      setSelected(record);
      message.error(errorMessage(error, "Community program detail could not be loaded."));
    }
    setDetailOpen(true);
  };

  const openEdit = (record: CommunityProgram) => {
    setSelected(record);
    form.setFieldsValue({
      name: record.name,
      region: record.region,
      category: record.category,
      description: record.description,
      participantCount: record.participantCount ?? undefined,
      startYear: record.startYear,
      status: record.status,
    });
    setEditOpen(true);
  };

  const saveEdit = async (values: CommunityProgramEditValues) => {
    if (!selected) return;
    setSaving(true);
    try {
      await put(COMMUNITY_PROGRAM_MANAGEMENT_API.update(selected.id), values);
      message.success("Community program updated.");
      setEditOpen(false);
      await fetchRows();
    } catch (error) {
      message.error(errorMessage(error, "Community program could not be updated."));
    } finally {
      setSaving(false);
    }
  };

  const archive = (record: CommunityProgram) => {
    Modal.confirm({
      title: "Archive community program?",
      content: "The record will leave public totals but remain available in the management list.",
      okText: "Archive",
      okButtonProps: { danger: true },
      onOk: async () => {
        setActioningId(record.id);
        try {
          await post(COMMUNITY_PROGRAM_MANAGEMENT_API.archive(record.id), {});
          message.success("Community program archived.");
          await fetchRows();
        } catch (error) {
          message.error(errorMessage(error, "Community program could not be archived."));
        } finally {
          setActioningId(null);
        }
      },
    });
  };

  const columns = [
      {
        title: "Program ID",
        dataIndex: "programId",
        key: "programId",
        render: (value: string, record: CommunityProgram) => (
          <Button type="link" onClick={() => openDetail(record)}>{value}</Button>
        ),
      },
      { title: "Program", dataIndex: "name", key: "name" },
      { title: "Region", dataIndex: "region", key: "region" },
      { title: "Category", dataIndex: "category", key: "category" },
      { title: "Participants", dataIndex: "participantCount", key: "participantCount" },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: CommunityProgramStatus) => <Tag color={statusColors[status]}>{status}</Tag>,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: unknown, record: CommunityProgram) => (
          <Space>
            <Button size="small" onClick={() => openDetail(record)}>Detail</Button>
            {record.status !== "Archived" && <Button size="small" onClick={() => openEdit(record)}>Edit</Button>}
            {record.status !== "Archived" && (
              <Button size="small" danger loading={actioningId === record.id} onClick={() => archive(record)}>
                Archive
              </Button>
            )}
          </Space>
        ),
      },
  ];

  if (!isAuthorized) {
    return <Alert type="warning" showIcon message="Only DNA/Ministry users can access community program management." action={<Link to="/">Back to home</Link>} />;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space align="center" wrap>
          <h2 style={{ margin: 0 }}>Community Climate Program Management</h2>
          <span>Include archived</span>
          <Switch checked={includeArchived} onChange={setIncludeArchived} />
        </Space>
        {!rows.length && !loading ? <Empty description="No community programs found." /> : <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} />}
      </Space>

      <Drawer title={selected?.programId ?? "Community program detail"} width={560} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selected && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Program">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="Description">{selected.description}</Descriptions.Item>
            <Descriptions.Item label="Region">{selected.region}</Descriptions.Item>
            <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
            <Descriptions.Item label="Participants">{selected.participantCount ?? "Not configured"}</Descriptions.Item>
            <Descriptions.Item label="Start year">{selected.startYear}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={statusColors[selected.status]}>{selected.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Created by">{selected.createdByUserId ?? "Legacy/imported record"}</Descriptions.Item>
            <Descriptions.Item label="Updated by">{selected.updatedByUserId ?? "Not available"}</Descriptions.Item>
            <Descriptions.Item label="Archived by">{selected.archivedByUserId ?? "Not available"}</Descriptions.Item>
            <Descriptions.Item label="Archive reason">{selected.archiveReason ?? "Not available"}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal title="Edit community program" open={editOpen} confirmLoading={saving} onCancel={() => setEditOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={saveEdit}>
          <Form.Item name="name" label="Program name" rules={[{ required: true, message: "Program name is required" }]}><Input maxLength={200} /></Form.Item>
          <Form.Item name="region" label="Region" rules={[{ required: true, message: "Region is required" }]}><Input maxLength={200} /></Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: "Category is required" }]}><Select options={CATEGORIES.map((category) => ({ label: category, value: category }))} /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}><Input.TextArea rows={4} maxLength={5000} /></Form.Item>
          <Form.Item name="participantCount" label="Participant count"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="startYear" label="Start year" rules={[{ required: true, message: "Start year is required" }]}><InputNumber min={1900} max={2200} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Status is required" }]}><Select options={STATUSES.map((status) => ({ label: status, value: status }))} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Save changes</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default CommunityProgramManagement;

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
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
import { useConnection } from "../../Components/Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { ADAPTATION_MANAGEMENT_API } from "./adaptationManagement.api";

type AdaptationStage = "Submitted" | "UnderReview" | "Approved" | "Rejected" | "Archived";

interface AdaptationProject {
  id: number;
  adaptationId: string;
  title: string;
  description: string;
  sector: string;
  region?: string | null;
  companyId: number;
  currentStage: AdaptationStage;
  createdAt: number;
  updatedAt?: number | null;
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
  archivedAt?: number | null;
  archivedByUserId?: number | null;
  archiveReason?: string | null;
}

interface AdaptationEditValues {
  title: string;
  description: string;
  sector: string;
  region?: string;
}

const STAGES: AdaptationStage[] = ["Submitted", "UnderReview", "Approved", "Rejected"];
const SECTORS = [
  "Health",
  "Ecosystem Resilience",
  "Multi-sector",
  "Infrastructure",
  "Coastal and Small Islands",
  "Energy Self-reliance",
  "Food Security",
  "Urban and Rural Settlements",
  "Water Security",
];
const stageColors: Record<string, string> = {
  Submitted: "gold",
  UnderReview: "blue",
  Approved: "green",
  Rejected: "red",
  Archived: "default",
};

const errorMessage = (error: unknown, fallback: string) =>
  error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : fallback;

const AdaptationManagement = () => {
  const { get, put, post } = useConnection();
  const { userInfoState } = useUserContext();
  const [form] = Form.useForm<AdaptationEditValues>();
  const [rows, setRows] = useState<AdaptationProject[]>([]);
  const [selected, setSelected] = useState<AdaptationProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const isReviewer =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;
  const isDeveloper = userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER;
  const isAuthorized = isReviewer || isDeveloper;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await get(ADAPTATION_MANAGEMENT_API.list(includeArchived));
      setRows((response?.data as AdaptationProject[] | undefined) ?? []);
    } catch (error) {
      setRows([]);
      message.error(errorMessage(error, "Adaptation projects could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [get, includeArchived]);

  useEffect(() => {
    if (isAuthorized) fetchRows();
  }, [fetchRows, isAuthorized]);

  const canEdit = useCallback(
    (record: AdaptationProject) =>
      record.currentStage !== "Approved" &&
      record.currentStage !== "Rejected" &&
      record.currentStage !== "Archived" &&
      (Boolean(isReviewer) ||
        (Boolean(isDeveloper) && record.companyId === userInfoState?.companyId)),
    [isDeveloper, isReviewer, userInfoState?.companyId]
  );

  const openDetail = async (record: AdaptationProject) => {
    try {
      const response = await get(ADAPTATION_MANAGEMENT_API.detail(record.id));
      setSelected((response?.data as AdaptationProject | undefined) ?? record);
    } catch (error) {
      setSelected(record);
      message.error(errorMessage(error, "Adaptation project detail could not be loaded."));
    }
    setDetailOpen(true);
  };

  const openEdit = (record: AdaptationProject) => {
    setSelected(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      sector: record.sector,
      region: record.region ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = async (values: AdaptationEditValues) => {
    if (!selected) return;
    setSaving(true);
    try {
      await put(ADAPTATION_MANAGEMENT_API.update(selected.id), values);
      message.success("Adaptation project updated.");
      setEditOpen(false);
      await fetchRows();
    } catch (error) {
      message.error(errorMessage(error, "Adaptation project could not be updated."));
    } finally {
      setSaving(false);
    }
  };

  const updateStage = async (record: AdaptationProject, stage: AdaptationStage) => {
    setActioningId(record.id);
    try {
      await put(ADAPTATION_MANAGEMENT_API.stage(record.id), { stage });
      message.success(`Project status changed to ${stage}.`);
      await fetchRows();
    } catch (error) {
      message.error(errorMessage(error, "Project status could not be changed."));
    } finally {
      setActioningId(null);
    }
  };

  const archive = (record: AdaptationProject) => {
    Modal.confirm({
      title: "Archive adaptation project?",
      content: "The record will leave public totals but remain available in the management list.",
      okText: "Archive",
      okButtonProps: { danger: true },
      onOk: async () => {
        setActioningId(record.id);
        try {
          await post(ADAPTATION_MANAGEMENT_API.archive(record.id), {});
          message.success("Adaptation project archived.");
          await fetchRows();
        } catch (error) {
          message.error(errorMessage(error, "Adaptation project could not be archived."));
        } finally {
          setActioningId(null);
        }
      },
    });
  };

  const columns = [
      {
        title: "Registration No.",
        dataIndex: "adaptationId",
        key: "adaptationId",
        render: (value: string, record: AdaptationProject) => (
          <Button type="link" onClick={() => openDetail(record)}>{value}</Button>
        ),
      },
      { title: "Title", dataIndex: "title", key: "title" },
      { title: "Sector", dataIndex: "sector", key: "sector" },
      { title: "Region", dataIndex: "region", key: "region" },
      {
        title: "Status",
        dataIndex: "currentStage",
        key: "currentStage",
        render: (stage: AdaptationStage) => <Tag color={stageColors[stage]}>{stage}</Tag>,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: unknown, record: AdaptationProject) => (
          <Space wrap>
            <Button size="small" onClick={() => openDetail(record)}>Detail</Button>
            {canEdit(record) && <Button size="small" onClick={() => openEdit(record)}>Edit</Button>}
            {isReviewer && (record.currentStage === "Submitted" || record.currentStage === "UnderReview") && (
              <Select
                size="small"
                value={record.currentStage}
                loading={actioningId === record.id}
                onChange={(stage: AdaptationStage) => updateStage(record, stage)}
                options={STAGES.map((stage) => ({ label: stage, value: stage }))}
              />
            )}
            {canEdit(record) && (
              <Button size="small" danger loading={actioningId === record.id} onClick={() => archive(record)}>
                Archive
              </Button>
            )}
          </Space>
        ),
      },
  ];

  if (!isAuthorized) {
    return <Alert type="warning" showIcon message="Only the submitting project developer or DNA/Ministry reviewers can access adaptation management." action={<Link to="/">Back to home</Link>} />;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space align="center" wrap>
          <h2 style={{ margin: 0 }}>Adaptation Project Management</h2>
          <span>Include archived</span>
          <Switch checked={includeArchived} onChange={setIncludeArchived} />
        </Space>
        {!rows.length && !loading ? <Empty description="No adaptation projects found." /> : <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} />}
      </Space>

      <Drawer title={selected?.adaptationId ?? "Adaptation project detail"} width={560} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selected && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Title">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="Description">{selected.description}</Descriptions.Item>
            <Descriptions.Item label="Sector">{selected.sector}</Descriptions.Item>
            <Descriptions.Item label="Region">{selected.region || "Not configured"}</Descriptions.Item>
            <Descriptions.Item label="Company ID">{selected.companyId}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={stageColors[selected.currentStage]}>{selected.currentStage}</Tag></Descriptions.Item>
            <Descriptions.Item label="Created by">{selected.createdByUserId ?? "Legacy/imported record"}</Descriptions.Item>
            <Descriptions.Item label="Updated by">{selected.updatedByUserId ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Archived by">{selected.archivedByUserId ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Archive reason">{selected.archiveReason ?? "—"}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal title="Edit adaptation project" open={editOpen} confirmLoading={saving} onCancel={() => setEditOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={saveEdit}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}><Input maxLength={200} /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}><Input.TextArea rows={4} maxLength={5000} /></Form.Item>
          <Form.Item name="sector" label="Sector" rules={[{ required: true, message: "Sector is required" }]}><Select options={SECTORS.map((sector) => ({ label: sector, value: sector }))} /></Form.Item>
          <Form.Item name="region" label="Region"><Input maxLength={200} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Save changes</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default AdaptationManagement;

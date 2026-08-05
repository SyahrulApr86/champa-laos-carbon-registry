import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { Link } from "react-router-dom";
import { useConnection } from "../../Components/Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Components/Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../Config/apiConfig";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { MethodologyStatus } from "../../Definitions/Enums/methodologyStatus.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import { Sector } from "../../Definitions/Enums/sector.enum";

interface MethodologyRecord {
  id: number;
  methodologyNumber: string;
  name: string;
  source: string;
  category: Sector;
  status: MethodologyStatus;
  description?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  archivedAt?: number | null;
  archivedBy?: number | null;
}

interface MethodologyListPayload {
  data?: MethodologyRecord[];
  total?: number;
  totalItems?: number;
}

interface MethodologyFormValues {
  methodologyNumber: string;
  name: string;
  source: string;
  category: Sector;
  description?: string;
}

const isManagementAdmin = (role?: string, companyRole?: string) =>
  role === Role.Root ||
  (role === Role.Admin &&
    (companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      companyRole === CompanyRole.MINISTRY));

const errorMessage = (error: unknown, fallback: string) =>
  error &&
  typeof error === "object" &&
  "message" in error &&
  typeof error.message === "string"
    ? error.message
    : fallback;

const MethodologyManagement = () => {
  const { get, post, put, patch } = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<MethodologyRecord[]>([]);
  const [selected, setSelected] = useState<MethodologyRecord | null>(null);
  const [editing, setEditing] = useState<MethodologyRecord | null>(null);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<Sector>();
  const [status, setStatus] = useState<MethodologyStatus>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form] = Form.useForm<MethodologyFormValues>();

  const authorized = isManagementAdmin(
    userInfoState?.userRole,
    userInfoState?.companyRole
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        sortBy: "methodologyNumber",
        sortOrder: "asc",
      });
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (category) params.set("category", category);
      if (status) params.set("status", status);

      const response = await get<MethodologyListPayload | MethodologyRecord[]>(
        `${API_PATHS.METHODOLOGY_ADMIN_LIST}?${params.toString()}`
      );
      const payload = response.data;
      if (Array.isArray(payload)) {
        setRows(payload);
        setTotal(payload.length);
      } else {
        setRows(payload?.data ?? []);
        setTotal(payload?.totalItems ?? payload?.total ?? 0);
      }
    } catch (error) {
      setRows([]);
      setTotal(0);
      message.error(errorMessage(error, "Methodologies could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [category, get, keyword, page, pageSize, status]);

  useEffect(() => {
    if (authorized) void loadRows();
  }, [authorized, loadRows]);

  const loadDetail = async (record: MethodologyRecord) => {
    setDetailLoading(true);
    try {
      const response = await get<MethodologyRecord>(
        API_PATHS.METHODOLOGY_ADMIN_DETAIL(record.id)
      );
      return response.data;
    } catch (error) {
      message.error(errorMessage(error, "Methodology detail could not be loaded."));
      return record;
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (record: MethodologyRecord) => {
    setSelected(await loadDetail(record));
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setEditorOpen(true);
  };

  const openEdit = async (record: MethodologyRecord) => {
    const detail = await loadDetail(record);
    if (detail.status === MethodologyStatus.INACTIVE) {
      message.info("Publish the archived methodology before editing it.");
      setSelected(detail);
      return;
    }
    setSelected(null);
    setEditing(detail);
    form.setFieldsValue({
      methodologyNumber: detail.methodologyNumber,
      name: detail.name,
      source: detail.source,
      category: detail.category,
      description: detail.description ?? undefined,
    });
    setEditorOpen(true);
  };

  const save = async (values: MethodologyFormValues) => {
    setActioningId(editing?.id ?? -1);
    try {
      if (editing) {
        await put(API_PATHS.METHODOLOGY_UPDATE(editing.id), values);
        message.success("Methodology updated.");
      } else {
        await post(API_PATHS.METHODOLOGY_CREATE, {
          ...values,
          status: MethodologyStatus.ACTIVE,
        });
        message.success("Methodology created.");
      }
      setEditorOpen(false);
      await loadRows();
    } catch (error) {
      message.error(errorMessage(error, "Methodology could not be saved."));
    } finally {
      setActioningId(null);
    }
  };

  const transition = (record: MethodologyRecord, action: "archive" | "publish") => {
    const isArchive = action === "archive";
    Modal.confirm({
      title: isArchive ? "Archive this methodology?" : "Publish this methodology?",
      content: isArchive
        ? "The record will be retained for audit and removed from the public directory."
        : "The record will become available in the public methodology directory.",
      okText: isArchive ? "Archive" : "Publish",
      okButtonProps: isArchive ? { danger: true } : undefined,
      onOk: async () => {
        setActioningId(record.id);
        try {
          await patch(API_PATHS.METHODOLOGY_LIFECYCLE(record.id), { action });
          message.success(`Methodology ${isArchive ? "archived" : "published"}.`);
          setSelected(null);
          await loadRows();
        } catch (error) {
          message.error(
            errorMessage(
              error,
              `Methodology could not be ${isArchive ? "archived" : "published"}.`
            )
          );
        } finally {
          setActioningId(null);
        }
      },
    });
  };

  if (!authorized) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Admin access required"
        description="Only DNA/Ministry administrators can manage methodologies."
        action={<Link to="/">Back to home</Link>}
      />
    );
  }

  return (
    <Card
      title="Methodology management"
      extra={<Button type="primary" onClick={openCreate}>Add methodology</Button>}
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Search number, name or source"
          onSearch={(value) => {
            setPage(1);
            setKeyword(value);
          }}
          style={{ width: 300 }}
        />
        <Select
          allowClear
          placeholder="All sectors"
          value={category}
          onChange={(value) => {
            setPage(1);
            setCategory(value);
          }}
          options={Object.values(Sector).map((value) => ({ value, label: value }))}
          style={{ width: 180 }}
        />
        <Select
          allowClear
          placeholder="All statuses"
          value={status}
          onChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
          options={Object.values(MethodologyStatus).map((value) => ({ value, label: value }))}
          style={{ width: 150 }}
        />
        <Button onClick={() => void loadRows()}>Refresh</Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        locale={{ emptyText: <Empty description="No methodologies found." /> }}
        onRow={(record) => ({ onClick: () => void openDetail(record) })}
        columns={[
          { title: "Methodology no.", dataIndex: "methodologyNumber", key: "methodologyNumber" },
          { title: "Name", dataIndex: "name", key: "name" },
          { title: "Source", dataIndex: "source", key: "source" },
          { title: "Category", dataIndex: "category", key: "category" },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (value: MethodologyStatus) => (
              <Tag color={value === MethodologyStatus.ACTIVE ? "green" : "default"}>
                {value}
              </Tag>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: unknown, record: MethodologyRecord) => (
              <Space onClick={(event) => event.stopPropagation()}>
                <Button size="small" onClick={() => void openDetail(record)}>
                  Detail
                </Button>
                {record.status === MethodologyStatus.ACTIVE && (
                  <Button size="small" onClick={() => void openEdit(record)}>
                    Edit
                  </Button>
                )}
                {record.status === MethodologyStatus.ACTIVE ? (
                  <Button
                    size="small"
                    danger
                    loading={actioningId === record.id}
                    onClick={() => transition(record, "archive")}
                  >
                    Archive
                  </Button>
                ) : (
                  <Button
                    size="small"
                    loading={actioningId === record.id}
                    onClick={() => transition(record, "publish")}
                  >
                    Publish
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            if (nextPageSize && nextPageSize !== pageSize) {
              setPage(1);
              setPageSize(nextPageSize);
            }
          },
        }}
      />

      <Drawer
        title={selected?.methodologyNumber ?? "Methodology detail"}
        open={Boolean(selected)}
        width={560}
        onClose={() => setSelected(null)}
        extra={
          selected && (
            <Space>
              {selected.status === MethodologyStatus.ACTIVE ? (
                <Button onClick={() => void openEdit(selected)}>Edit</Button>
              ) : (
                <Button onClick={() => transition(selected, "publish")}>Publish</Button>
              )}
            </Space>
          )
        }
      >
        {detailLoading ? (
          <p>Loading methodology detail…</p>
        ) : (
          selected && (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Methodology number">{selected.methodologyNumber}</Descriptions.Item>
              <Descriptions.Item label="Name">{selected.name}</Descriptions.Item>
              <Descriptions.Item label="Source">{selected.source}</Descriptions.Item>
              <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag>{selected.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Description">{selected.description || "—"}</Descriptions.Item>
              <Descriptions.Item label="Created by">{selected.createdBy ?? "Legacy/imported record"}</Descriptions.Item>
              <Descriptions.Item label="Updated by">{selected.updatedBy ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Archived by">{selected.archivedBy ?? "—"}</Descriptions.Item>
            </Descriptions>
          )
        )}
      </Drawer>

      <Modal
        title={editing ? "Edit methodology" : "Add methodology"}
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item
            name="methodologyNumber"
            label="Methodology number"
            rules={[{ required: true, message: "Methodology number is required." }]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required." }]}
          >
            <Input maxLength={240} />
          </Form.Item>
          <Form.Item
            name="source"
            label="Source"
            rules={[{ required: true, message: "Source is required." }]}
          >
            <Input maxLength={240} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Category is required." }]}
          >
            <Select options={Object.values(Sector).map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={5} maxLength={4000} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={actioningId === (editing?.id ?? -1)}
          >
            Save methodology
          </Button>
        </Form>
      </Modal>
    </Card>
  );
};

export default MethodologyManagement;

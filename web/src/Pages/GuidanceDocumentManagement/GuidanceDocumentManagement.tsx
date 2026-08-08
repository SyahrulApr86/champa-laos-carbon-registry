import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { RcFile } from "antd/lib/upload";
import { Link } from "react-router-dom";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import {
  guidanceDocumentManagementApi,
  GuidanceDocumentDraft,
  GuidanceDocumentRecord,
  GuidanceDocumentStatus,
} from "./guidanceDocumentManagementApi";

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string"
    ? error.message
    : fallback;

const fileToDataUri = (file: RcFile) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read document file."));
    reader.readAsDataURL(file);
  });

const GuidanceDocumentManagement = () => {
  const connection = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<GuidanceDocumentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GuidanceDocumentStatus | undefined>();
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [editing, setEditing] = useState<GuidanceDocumentRecord | null>(null);
  const [detail, setDetail] = useState<{
    document: GuidanceDocumentRecord;
    versions: GuidanceDocumentRecord[];
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<GuidanceDocumentDraft>();

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await guidanceDocumentManagementApi.list(connection, search, status);
      setRows(response.data ?? []);
    } catch (error) {
      setRows([]);
      message.error(getErrorMessage(error, "Failed to load guidance documents."));
    } finally {
      setLoading(false);
    }
  }, [connection, search, status]);

  useEffect(() => {
    if (isAuthorized) {
      void loadRows();
    }
  }, [isAuthorized, loadRows]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = async (record: GuidanceDocumentRecord) => {
    try {
      const response = await guidanceDocumentManagementApi.detail(connection, record.id);
      const selected = response.data.document;
      setDetail(response.data);
      setEditing(selected);
      form.setFieldsValue({
        title: selected.title,
        description: selected.description ?? undefined,
        category: selected.category ?? undefined,
        documentUrl: selected.documentUrl,
      });
      setModalOpen(true);
    } catch (error) {
      message.error(getErrorMessage(error, "Failed to load document details."));
    }
  };

  const save = async (values: GuidanceDocumentDraft) => {
    setActioningId(editing?.id ?? -1);
    try {
      if (editing) {
        await guidanceDocumentManagementApi.update(connection, editing.id, values);
        message.success(
          editing.status === "Published"
            ? "Draft version created; publish it when ready."
            : "Draft updated."
        );
      } else {
        await guidanceDocumentManagementApi.create(connection, values);
        message.success("Guidance document published.");
      }
      setModalOpen(false);
      await loadRows();
    } catch (error) {
      message.error(getErrorMessage(error, "Failed to save guidance document."));
    } finally {
      setActioningId(null);
    }
  };

  const publish = async (record: GuidanceDocumentRecord) => {
    setActioningId(record.id);
    try {
      await guidanceDocumentManagementApi.publish(connection, record.id);
      message.success(`Version ${record.version} published.`);
      await loadRows();
    } catch (error) {
      message.error(getErrorMessage(error, "Failed to publish version."));
    } finally {
      setActioningId(null);
    }
  };

  const archive = (record: GuidanceDocumentRecord) => {
    Modal.confirm({
      title: "Archive this document version?",
      content: "The file remains retained, but no longer appears in the public module list.",
      okText: "Archive",
      okButtonProps: { danger: true },
      onOk: async () => {
        setActioningId(record.id);
        try {
          await guidanceDocumentManagementApi.archive(connection, record.id);
          message.success("Document version archived.");
          await loadRows();
        } catch (error) {
          message.error(getErrorMessage(error, "Failed to archive document."));
        } finally {
          setActioningId(null);
        }
      },
    });
  };

  if (!isAuthorized) {
    return (
      <div style={{ textAlign: "center", margin: "4rem auto", maxWidth: 480 }}>
        <p>Only DNA/Ministry administrators can manage guidance documents.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <Card
        title="Guidance and Module Document Management"
        extra={<Button type="primary" onClick={openCreate}>Publish document</Button>}
      >
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <Input.Search
            allowClear
            placeholder="Search title, description or category"
            onSearch={setSearch}
            style={{ maxWidth: 420 }}
          />
          <Select
            allowClear
            placeholder="All statuses"
            value={status}
            onChange={setStatus}
            options={["Draft", "Published", "Archived"].map((value) => ({ value }))}
            style={{ width: 150 }}
          />
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          onRow={(record) => ({ onClick: () => void openEdit(record) })}
          columns={[
            { title: "Title", dataIndex: "title", key: "title" },
            { title: "Category", dataIndex: "category", key: "category" },
            { title: "Version", dataIndex: "version", key: "version" },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (value: GuidanceDocumentStatus) => (
                <Tag color={value === "Published" ? "green" : value === "Draft" ? "gold" : "default"}>{value}</Tag>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_: unknown, record: GuidanceDocumentRecord) => (
                <div style={{ display: "flex", gap: "0.5rem" }} onClick={(event) => event.stopPropagation()}>
                  {record.status === "Draft" && (
                    <Button size="small" loading={actioningId === record.id} onClick={() => void publish(record)}>Publish</Button>
                  )}
                  {record.status !== "Archived" && (
                    <Button size="small" danger loading={actioningId === record.id} onClick={() => archive(record)}>Archive</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editing ? `Edit document (v${editing.version})` : "Publish guidance document"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="category" label="Category"><Input /></Form.Item>
          <Form.Item name="documentUrl" label="Document URL or uploaded file" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="https://... or select a file below" />
          </Form.Item>
          <Upload
            accept=".pdf,.doc,.docx"
            maxCount={1}
            beforeUpload={() => false}
            onChange={({ file }) => {
              const rawFile = file.originFileObj as RcFile | undefined;
              if (rawFile) {
                void fileToDataUri(rawFile)
                  .then((value) => form.setFieldsValue({ documentUrl: value }))
                  .catch((error: unknown) => message.error(getErrorMessage(error, "Unable to read file.")));
              }
            }}
          >
            <Button icon={<UploadOutlined />}>Replace with file</Button>
          </Upload>
          <Button type="primary" htmlType="submit" loading={actioningId === (editing?.id ?? -1)} style={{ marginTop: "1rem" }}>
            Save
          </Button>
        </Form>
      </Modal>

      <Modal title="Document version history" open={Boolean(detail) && !modalOpen} onCancel={() => setDetail(null)} footer={null}>
        {detail && (
          <Table
            rowKey="id"
            pagination={false}
            dataSource={detail.versions}
            columns={[
              { title: "Version", dataIndex: "version", key: "version" },
              { title: "Status", dataIndex: "status", key: "status" },
              { title: "Updated", dataIndex: "updatedAt", key: "updatedAt" },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default GuidanceDocumentManagement;

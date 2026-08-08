import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import { Link } from "react-router-dom";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import {
  expertManagementApi,
  ExpertDraft,
  ExpertRecord,
  ExpertStatus,
} from "./expertManagementApi";

const PROVINCES = [
  "Vientiane Capital",
  "Phongsaly",
  "Luang Namtha",
  "Oudomxay",
  "Bokeo",
  "Luang Prabang",
  "Houaphanh",
  "Xayaboury",
  "Xiangkhouang",
  "Vientiane Province",
  "Bolikhamxay",
  "Khammouane",
  "Savannakhet",
  "Salavan",
  "Sekong",
  "Champasak",
  "Attapeu",
  "Xaisomboun",
];

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string"
    ? error.message
    : fallback;

const ExpertManagement = () => {
  const connection = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<ExpertRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ExpertStatus | undefined>();
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [editing, setEditing] = useState<ExpertRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<ExpertRecord | null>(null);
  const [form] = Form.useForm<ExpertDraft>();

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await expertManagementApi.list(connection, search, status);
      setRows(response.data ?? []);
    } catch (error) {
      setRows([]);
      message.error(getErrorMessage(error, "Failed to load expert roster."));
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

  const openEdit = async (record: ExpertRecord) => {
    try {
      const response = await expertManagementApi.detail(connection, record.id);
      const selected = response.data;
      setDetail(selected);
      setEditing(selected);
      form.setFieldsValue(selected);
      setModalOpen(true);
    } catch (error) {
      message.error(getErrorMessage(error, "Failed to load expert details."));
    }
  };

  const save = async (values: ExpertDraft) => {
    setActioningId(editing?.id ?? -1);
    try {
      if (editing) {
        await expertManagementApi.update(connection, editing.id, values);
        message.success("Expert updated.");
      } else {
        await expertManagementApi.create(connection, values);
        message.success("Expert registered.");
      }
      setModalOpen(false);
      await loadRows();
    } catch (error) {
      message.error(getErrorMessage(error, "Failed to save expert."));
    } finally {
      setActioningId(null);
    }
  };

  const toggleStatus = async (record: ExpertRecord) => {
    setActioningId(record.id);
    try {
      const nextStatus: ExpertStatus =
        record.status === "Active" ? "Inactive" : "Active";
      await expertManagementApi.setStatus(connection, record.id, nextStatus);
      message.success(`Expert marked ${nextStatus.toLowerCase()}.`);
      await loadRows();
    } catch (error) {
      message.error(getErrorMessage(error, "Failed to update expert status."));
    } finally {
      setActioningId(null);
    }
  };

  const archive = (record: ExpertRecord) => {
    Modal.confirm({
      title: "Archive this expert?",
      content: "The roster entry will be retained for audit and hidden publicly.",
      okText: "Archive",
      okButtonProps: { danger: true },
      onOk: async () => {
        setActioningId(record.id);
        try {
          await expertManagementApi.archive(connection, record.id);
          message.success("Expert archived.");
          await loadRows();
        } catch (error) {
          message.error(getErrorMessage(error, "Failed to archive expert."));
        } finally {
          setActioningId(null);
        }
      },
    });
  };

  if (!isAuthorized) {
    return (
      <div style={{ textAlign: "center", margin: "4rem auto", maxWidth: 480 }}>
        <p>Only DNA/Ministry administrators can manage the expert roster.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <Card
        title="Roster of Expert Management"
        extra={<Button type="primary" onClick={openCreate}>Register expert</Button>}
      >
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <Input.Search
            allowClear
            placeholder="Search name, institution, expertise or province"
            onSearch={setSearch}
            style={{ maxWidth: 460 }}
          />
          <Select
            allowClear
            placeholder="All statuses"
            value={status}
            onChange={setStatus}
            options={[{ value: "Active" }, { value: "Inactive" }]}
            style={{ width: 150 }}
          />
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          onRow={(record) => ({ onClick: () => setDetail(record) })}
          columns={[
            { title: "Name", dataIndex: "name", key: "name" },
            { title: "Affiliation", dataIndex: "affiliation", key: "affiliation" },
            { title: "Expertise", dataIndex: "expertise", key: "expertise" },
            { title: "Province", dataIndex: "province", key: "province" },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (value: ExpertStatus, record: ExpertRecord) => (
                <Tag color={record.archivedAt ? "default" : value === "Active" ? "green" : "orange"}>
                  {record.archivedAt ? "Archived" : value}
                </Tag>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_: unknown, record: ExpertRecord) => (
                <div style={{ display: "flex", gap: "0.5rem" }} onClick={(event) => event.stopPropagation()}>
                  {!record.archivedAt && (
                    <>
                      <Button size="small" onClick={() => void openEdit(record)}>Edit</Button>
                      <Button size="small" loading={actioningId === record.id} onClick={() => void toggleStatus(record)}>
                        {record.status === "Active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="small" danger loading={actioningId === record.id} onClick={() => archive(record)}>
                        Archive
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editing ? "Edit expert" : "Register expert"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="affiliation" label="Affiliation" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="expertise" label="Expertise" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="certification" label="Certification"><Input /></Form.Item>
          <Form.Item name="yearsOfExperience" label="Years of experience"><InputNumber min={0} max={80} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="province" label="Province" rules={[{ required: true }]}>
            <Select options={PROVINCES.map((province) => ({ value: province, label: province }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={actioningId === (editing?.id ?? -1)}>Save</Button>
        </Form>
      </Modal>

      <Modal title="Expert details" open={Boolean(detail) && !modalOpen} onCancel={() => setDetail(null)} footer={null}>
        {detail && <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(detail, null, 2)}</pre>}
      </Modal>
    </div>
  );
};

export default ExpertManagement;

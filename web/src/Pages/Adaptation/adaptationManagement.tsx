import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Table, Tag, message } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { API_PATHS } from "../../Config/apiConfig";

interface AdaptationProjectRow {
  id: number;
  adaptationId: string;
  title: string;
  description: string;
  sector: string;
  region: string;
  companyId: number;
  currentStage: string;
}

const statusColor: Record<string, string> = {
  Approved: "green",
  UnderReview: "gold",
  Submitted: "gold",
  Rejected: "red",
};

const AdaptationManagement = () => {
  const { get, patch } = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<AdaptationProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await get(API_PATHS.ADAPTATION_QUERY);
      const data = response?.data as AdaptationProjectRow[] | undefined;
      setRows(data ?? []);
    } catch (error) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    if (isAuthorized) {
      fetchRows();
    }
  }, [isAuthorized, fetchRows]);

  const updateStage = async (id: number, stage: "Approved" | "Rejected") => {
    setActioningId(id);
    try {
      await patch(API_PATHS.ADAPTATION_UPDATE_STAGE(id), { stage });
      message.success(`Project ${stage.toLowerCase()} successfully`);
      await fetchRows();
    } catch (error) {
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Failed to update project stage";
      message.error(errorMessage);
    } finally {
      setActioningId(null);
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ textAlign: "center", margin: "4rem auto", maxWidth: 480 }}>
        <p>Only DNA/Ministry reviewers can access this page.</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  const columns = [
    {
      title: "Registration No.",
      dataIndex: "adaptationId",
      key: "adaptationId",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Sector",
      dataIndex: "sector",
      key: "sector",
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
    },
    {
      title: "Company ID",
      dataIndex: "companyId",
      key: "companyId",
    },
    {
      title: "Status",
      dataIndex: "currentStage",
      key: "currentStage",
      render: (stage: string) => (
        <Tag color={statusColor[stage] || "default"}>{stage}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: AdaptationProjectRow) => {
        if (
          record.currentStage !== "Submitted" &&
          record.currentStage !== "UnderReview"
        ) {
          return null;
        }
        return (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              size="small"
              style={{ color: "green", borderColor: "green" }}
              loading={actioningId === record.id}
              onClick={() => updateStage(record.id, "Approved")}
            >
              Approve
            </Button>
            <Button
              size="small"
              style={{ color: "red", borderColor: "red" }}
              loading={actioningId === record.id}
              onClick={() => updateStage(record.id, "Rejected")}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Adaptation Project Review</h2>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
      />
    </div>
  );
};

export default AdaptationManagement;

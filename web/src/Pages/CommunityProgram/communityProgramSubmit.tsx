import React, { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../Config/apiConfig";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";

const { TextArea } = Input;

const CATEGORY_OPTIONS = ["Adaptation", "Mitigation", "Adaptation and Mitigation"];

const STATUS_OPTIONS = ["Active", "Completed", "Planned"];

interface CommunityProgramFormValues {
  name: string;
  region: string;
  category: string;
  description: string;
  participantCount?: number;
  startYear: number;
  status?: string;
}

const CommunityProgramSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [form] = Form.useForm<CommunityProgramFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can record community climate program entries.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleSubmit = async (values: CommunityProgramFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        region: values.region,
        category: values.category,
        description: values.description,
        participantCount: values.participantCount,
        startYear: values.startYear,
        status: values.status,
      };
      await post(API_PATHS.COMMUNITY_PROGRAM_CREATE, payload);
      message.success("Community climate program entry recorded.");
      navigate("/");
    } catch (error) {
      let errorText = "Failed to record community climate program entry.";
      if (error && typeof error === "object" && "message" in error) {
        const { message: errMessage } = error;
        if (typeof errMessage === "string" && errMessage.length > 0) {
          errorText = errMessage;
        }
      }
      message.error(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto" }}>
      <Card title="Record Community Climate Program">
        <Form<CommunityProgramFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Program Name"
            rules={[{ required: true, message: "Program name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="region"
            label="Region"
            rules={[{ required: true, message: "Region is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Category is required" }]}
          >
            <Select placeholder="Select category">
              {CATEGORY_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="participantCount" label="Participant Count">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="startYear"
            label="Start Year"
            rules={[{ required: true, message: "Start year is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1990} max={2100} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select allowClear placeholder="Select status">
              {STATUS_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CommunityProgramSubmit;

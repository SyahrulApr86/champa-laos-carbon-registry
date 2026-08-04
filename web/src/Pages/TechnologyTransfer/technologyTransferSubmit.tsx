import React, { useState } from "react";
import { Button, Card, Form, Input, Select, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../Config/apiConfig";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";

const { TextArea } = Input;

const TYPE_OPTIONS = ["Mitigation", "Adaptation", "Cross Cutting"];

const STATUS_OPTIONS = ["Completed", "On-Going", "Terminated"];

interface TechnologyTransferFormValues {
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
}

const TechnologyTransferSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [form] = Form.useForm<TechnologyTransferFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can record technology transfer entries.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleSubmit = async (values: TechnologyTransferFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        technologyType: values.technologyType,
        timeframe: values.timeframe,
        recipientEntity: values.recipientEntity,
        implementingEntity: values.implementingEntity,
        type: values.type,
        sector: values.sector,
        subsector: values.subsector,
        status: values.status,
        impactEstimatedResult: values.impactEstimatedResult,
        additionalInformation: values.additionalInformation,
      };
      await post(API_PATHS.TECHNOLOGY_TRANSFER_CREATE, payload);
      message.success("Technology transfer entry recorded.");
      navigate("/");
    } catch (error) {
      let errorText = "Failed to record technology transfer entry.";
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
      <Card title="Record Technology Transfer Entry">
        <Form<TechnologyTransferFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="technologyType"
            label="Technology Type"
            rules={[
              { required: true, message: "Technology type is required" },
            ]}
          >
            <Input placeholder="e.g. Solar Ice Maker" />
          </Form.Item>
          <Form.Item name="timeframe" label="Timeframe">
            <Input placeholder="e.g. 2022-now" />
          </Form.Item>
          <Form.Item
            name="recipientEntity"
            label="Recipient Entity"
            rules={[
              { required: true, message: "Recipient entity is required" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="implementingEntity"
            label="Implementing Entity"
            rules={[
              { required: true, message: "Implementing entity is required" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Type is required" }]}
          >
            <Select placeholder="Select type">
              {TYPE_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="sector"
            label="Sector"
            rules={[{ required: true, message: "Sector is required" }]}
          >
            <Input placeholder="e.g. Multiple Areas" />
          </Form.Item>
          <Form.Item name="subsector" label="Subsector">
            <Input />
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
          <Form.Item name="impactEstimatedResult" label="Impact / Estimated Result">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="additionalInformation" label="Additional Information">
            <TextArea rows={3} />
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

export default TechnologyTransferSubmit;

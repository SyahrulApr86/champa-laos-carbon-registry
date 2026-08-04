import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Select, message } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { API_PATHS } from "../../Config/apiConfig";

interface AdaptationSubmitFormValues {
  title: string;
  description: string;
  sector: string;
  region?: string;
}

const ADAPTATION_SECTORS: { value: string; label: string }[] = [
  { value: "Health", label: "Health" },
  { value: "Ecosystem Resilience", label: "Ecosystem Resilience" },
  { value: "Multi-sector", label: "Multi-sector" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Coastal and Small Islands", label: "Coastal and Small Islands" },
  { value: "Energy Self-reliance", label: "Energy Self-reliance" },
  { value: "Food Security", label: "Food Security" },
  { value: "Urban and Rural Settlements", label: "Urban and Rural Settlements" },
  { value: "Water Security", label: "Water Security" },
];

const AdaptationSubmit = () => {
  const { post } = useConnection();
  const { userInfoState } = useUserContext();
  const navigate = useNavigate();
  const [form] = Form.useForm<AdaptationSubmitFormValues>();
  const [submitting, setSubmitting] = useState(false);

  if (userInfoState?.companyRole !== CompanyRole.PROJECT_DEVELOPER) {
    return (
      <div style={{ textAlign: "center", margin: "4rem auto", maxWidth: 480 }}>
        <p>
          Only registered Project Developer organisations can submit
          adaptation projects.
        </p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  const onFinish = async (values: AdaptationSubmitFormValues) => {
    setSubmitting(true);
    try {
      await post(API_PATHS.ADAPTATION_CREATE, {
        title: values.title,
        description: values.description,
        sector: values.sector,
        region: values.region,
      });
      message.success("Adaptation project submitted successfully");
      form.resetFields();
      navigate("/");
    } catch (error) {
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Failed to submit adaptation project";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Submit Adaptation Project"
      style={{ maxWidth: 600, margin: "2rem auto" }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label="Sector"
          name="sector"
          rules={[{ required: true, message: "Please select a sector" }]}
        >
          <Select options={ADAPTATION_SECTORS} placeholder="Select sector" />
        </Form.Item>

        <Form.Item label="Region" name="region">
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AdaptationSubmit;

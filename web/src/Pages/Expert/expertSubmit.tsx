import React, { useState } from "react";
import { Button, Card, Form, Input, InputNumber, Select, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../Config/apiConfig";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";

// Real Lao PDR provinces, matching backend/services/regions.csv (the
// seeded Region table the backend validates this field against).
const PROVINCE_OPTIONS = [
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

const STATUS_OPTIONS = ["Active", "Inactive"];

interface ExpertFormValues {
  name: string;
  affiliation: string;
  expertise: string;
  certification?: string;
  yearsOfExperience?: number;
  province: string;
  status?: string;
}

const ExpertSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [form] = Form.useForm<ExpertFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can register Roster of Expert entries.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleSubmit = async (values: ExpertFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        affiliation: values.affiliation,
        expertise: values.expertise,
        certification: values.certification,
        yearsOfExperience: values.yearsOfExperience,
        province: values.province,
        status: values.status,
      };
      await post(API_PATHS.EXPERT_CREATE, payload);
      message.success("Expert registered on the Roster of Expert.");
      navigate("/");
    } catch (error) {
      let errorText = "Failed to register expert.";
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
      <Card title="Register Roster of Expert Entry">
        <Form<ExpertFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="affiliation"
            label="Institution / Affiliation"
            rules={[
              { required: true, message: "Institution/affiliation is required" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="expertise"
            label="Area of Expertise"
            rules={[{ required: true, message: "Area of expertise is required" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="certification" label="Certification">
            <Input placeholder="e.g. Carbon Market Specialist - 2023" />
          </Form.Item>
          <Form.Item name="yearsOfExperience" label="Years of Experience">
            <InputNumber style={{ width: "100%" }} min={0} max={80} />
          </Form.Item>
          <Form.Item
            name="province"
            label="Province"
            rules={[{ required: true, message: "Province is required" }]}
          >
            <Select placeholder="Select province">
              {PROVINCE_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
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

export default ExpertSubmit;

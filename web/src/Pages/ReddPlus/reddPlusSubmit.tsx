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

const STATUS_OPTIONS = ["Proposed", "Ongoing", "Completed"];

interface ReddPlusFormValues {
  province: string;
  title: string;
  description?: string;
  forestAreaHectares?: number;
  estimatedEmissionReductionTco2e?: number;
  implementingEntity: string;
  status?: string;
  startYear?: number;
}

const ReddPlusSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [form] = Form.useForm<ReddPlusFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can record REDD+ project entries.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleSubmit = async (values: ReddPlusFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        province: values.province,
        title: values.title,
        description: values.description,
        forestAreaHectares: values.forestAreaHectares,
        estimatedEmissionReductionTco2e: values.estimatedEmissionReductionTco2e,
        implementingEntity: values.implementingEntity,
        status: values.status,
        startYear: values.startYear,
      };
      await post(API_PATHS.REDD_PLUS_CREATE, payload);
      message.success("REDD+ project entry recorded.");
      navigate("/");
    } catch (error) {
      let errorText = "Failed to record REDD+ project entry.";
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
      <Card title="Record REDD+ Project">
        <Form<ReddPlusFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
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
          <Form.Item
            name="title"
            label="Project Title"
            rules={[{ required: true, message: "Project title is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="forestAreaHectares" label="Forest Area (hectares)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="estimatedEmissionReductionTco2e"
            label="Estimated Emission Reduction (tCO2e)"
          >
            <InputNumber style={{ width: "100%" }} min={0} />
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
          <Form.Item name="status" label="Status">
            <Select allowClear placeholder="Select status">
              {STATUS_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="startYear" label="Start Year">
            <InputNumber style={{ width: "100%" }} min={1990} max={2100} />
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

export default ReddPlusSubmit;

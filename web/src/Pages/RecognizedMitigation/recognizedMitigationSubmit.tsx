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
import { Sector } from "../../Definitions/Enums/sector.enum";

const { TextArea } = Input;

// Real Lao PDR provinces, matching backend/services/regions.csv (the
// seeded Region table the backend validates this field against).
const REGION_OPTIONS = [
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

// Reuses the platform's existing CompanyRole categories - the honest
// proponent-type taxonomy this system's data model actually tracks.
const PROPONENT_TYPE_OPTIONS: { value: CompanyRole; label: string }[] = [
  { value: CompanyRole.PROJECT_DEVELOPER, label: "Project Developer" },
  {
    value: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
    label: "Designated National Authority",
  },
  { value: CompanyRole.MINISTRY, label: "Ministry" },
  { value: CompanyRole.INDEPENDENT_CERTIFIER, label: "Independent Certifier" },
  { value: CompanyRole.CLIMATE_FUND, label: "Climate Fund" },
  { value: CompanyRole.EXECUTIVE_COMMITTEE, label: "Executive Committee" },
  { value: CompanyRole.API, label: "API Partner" },
];

const STATUS_OPTIONS = ["Submitted", "UnderReview", "Recognized", "Rejected"];

interface RecognizedMitigationFormValues {
  title: string;
  description: string;
  proponentName: string;
  proponentType: CompanyRole;
  sector: Sector;
  region: string;
  estimatedReductionTco2e?: number;
  status?: string;
}

// Submission form for smaller-scale/community-level mitigation actions
// recognized by the DNA/Ministry outside the full Programme
// certification track. Discovery is via the sidebar "Climate Programs"
// submenu only, matching the other DNA/Ministry-recorded registries.
const RecognizedMitigationSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [form] = Form.useForm<RecognizedMitigationFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can record recognized mitigation actions.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleSubmit = async (values: RecognizedMitigationFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        proponentName: values.proponentName,
        proponentType: values.proponentType,
        sector: values.sector,
        region: values.region,
        estimatedReductionTco2e: values.estimatedReductionTco2e,
        status: values.status,
      };
      await post(API_PATHS.RECOGNIZED_MITIGATION_CREATE, payload);
      message.success("Recognized mitigation action recorded.");
      navigate("/");
    } catch (error) {
      let errorText = "Failed to record recognized mitigation action.";
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
      <Card title="Record Recognized Mitigation Action">
        <Form<RecognizedMitigationFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Activity Title"
            rules={[{ required: true, message: "Activity title is required" }]}
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
            name="proponentName"
            label="Proponent Name"
            rules={[{ required: true, message: "Proponent name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="proponentType"
            label="Proponent Type"
            rules={[{ required: true, message: "Proponent type is required" }]}
          >
            <Select placeholder="Select proponent type">
              {PROPONENT_TYPE_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="sector"
            label="Sector"
            rules={[{ required: true, message: "Sector is required" }]}
          >
            <Select placeholder="Select sector">
              {Object.values(Sector).map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="region"
            label="Region"
            rules={[{ required: true, message: "Region is required" }]}
          >
            <Select placeholder="Select region">
              {REGION_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="estimatedReductionTco2e"
            label="Estimated Emission Reduction (tCO2e)"
          >
            <InputNumber style={{ width: "100%" }} min={0} />
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

export default RecognizedMitigationSubmit;

import React, { useState } from "react";
import { Button, Card, Form, Input, InputNumber, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../Config/apiConfig";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";

const { TextArea } = Input;

interface NdcTargetFormValues {
  year: number;
  baselineEmissions: number;
  targetEmissions2030: number;
  achievedEmissions: number;
  notes?: string;
}

const NdcTargetSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [form] = Form.useForm<NdcTargetFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can record NDC target data.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleSubmit = async (values: NdcTargetFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        year: values.year,
        baselineEmissions: values.baselineEmissions,
        targetEmissions2030: values.targetEmissions2030,
        achievedEmissions: values.achievedEmissions,
        notes: values.notes,
      };
      await post(API_PATHS.NDC_TARGET_CREATE, payload);
      message.success("NDC target data recorded.");
      navigate("/");
    } catch (error) {
      let errorText = "Failed to record NDC target data.";
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
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <Card title="Record NDC Target Data">
        <Form<NdcTargetFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: "Year is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={2015} max={2035} />
          </Form.Item>
          <Form.Item
            name="baselineEmissions"
            label="Baseline Emissions (Million Tons CO2e)"
            rules={[
              { required: true, message: "Baseline emissions is required" },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="targetEmissions2030"
            label="2030 Target (Million Tons CO2e)"
            rules={[
              { required: true, message: "2030 target is required" },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="achievedEmissions"
            label="Achieved Emissions This Year (Million Tons CO2e)"
            rules={[
              { required: true, message: "Achieved emissions is required" },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
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

export default NdcTargetSubmit;

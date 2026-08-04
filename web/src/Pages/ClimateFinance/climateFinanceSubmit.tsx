import React, { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { Moment } from "moment";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../Config/apiConfig";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Sector } from "../../Definitions/Enums/sector.enum";

const { TextArea } = Input;

const CHANNEL_OPTIONS = [
  "Multilateral",
  "Bilateral",
  "Commercial Bank or Other Financial Institution",
  "Other",
];

const FINANCIAL_INSTRUMENT_OPTIONS = [
  "Grant",
  "Concessional Loan",
  "Loan",
  "Other",
];

const STATUS_OPTIONS = ["Ongoing", "Fully Disbursed", "Closed"];

const TYPE_OPTIONS = ["Mitigation", "Adaptation", "Cross Cutting"];

const SECTOR_OPTIONS = Object.values(Sector);

interface ClimateFinanceFormValues {
  title: string;
  description: string;
  channel?: string;
  recipientEntity: string;
  implementingEntity: string;
  dateSigned: Moment;
  dateClosing?: Moment;
  amountLAK?: number;
  amountUSD?: number;
  sector: string;
  financialInstrument?: string;
  status?: string;
  type: string;
}

const ClimateFinanceSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [form] = Form.useForm<ClimateFinanceFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can record climate finance entries.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleSubmit = async (values: ClimateFinanceFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        channel: values.channel,
        recipientEntity: values.recipientEntity,
        implementingEntity: values.implementingEntity,
        dateSigned: values.dateSigned.valueOf(),
        dateClosing: values.dateClosing
          ? values.dateClosing.valueOf()
          : undefined,
        amountLAK: values.amountLAK,
        amountUSD: values.amountUSD,
        sector: values.sector,
        financialInstrument: values.financialInstrument,
        status: values.status,
        type: values.type,
      };
      await post(API_PATHS.CLIMATE_FINANCE_CREATE, payload);
      message.success("Climate finance entry recorded.");
      navigate("/");
    } catch (error) {
      let errorText = "Failed to record climate finance entry.";
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
      <Card title="Record Climate Finance Entry">
        <Form<ClimateFinanceFormValues>
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
          <Form.Item name="channel" label="Channel">
            <Select allowClear placeholder="Select channel">
              {CHANNEL_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
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
            name="dateSigned"
            label="Date Signed"
            rules={[{ required: true, message: "Date signed is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="dateClosing" label="Date Closing">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="amountLAK" label="Amount (LAK)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="amountUSD" label="Amount (USD)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="sector"
            label="Sector"
            rules={[{ required: true, message: "Sector is required" }]}
          >
            <Select placeholder="Select sector">
              {SECTOR_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="financialInstrument" label="Financial Instrument">
            <Select allowClear placeholder="Select financial instrument">
              {FINANCIAL_INSTRUMENT_OPTIONS.map((option) => (
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

export default ClimateFinanceSubmit;

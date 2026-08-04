import React, { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  Typography,
  message,
} from "antd";
import { Link } from "react-router-dom";
import { Moment } from "moment";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../Config/apiConfig";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";

interface EmissionCeilingFormValues {
  companyId: number;
  year: number;
  units: number;
}

interface TradingTransactionFormValues {
  sellerCompanyId: number;
  buyerCompanyId: number;
  units: number;
  valueLAK?: number;
  tradeDate: Moment;
}

const EmissionTradingSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const [ceilingForm] = Form.useForm<EmissionCeilingFormValues>();
  const [tradingForm] = Form.useForm<TradingTransactionFormValues>();
  const [ceilingSubmitting, setCeilingSubmitting] = useState(false);
  const [tradingSubmitting, setTradingSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can record emission ceiling/trading entries.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleCeilingSubmit = async (values: EmissionCeilingFormValues) => {
    setCeilingSubmitting(true);
    try {
      await post(API_PATHS.EMISSION_CEILING_CREATE, {
        companyId: values.companyId,
        year: values.year,
        units: values.units,
      });
      message.success("Emission ceiling recorded.");
      ceilingForm.resetFields();
    } catch (error) {
      let errorText = "Failed to record emission ceiling.";
      if (error && typeof error === "object" && "message" in error) {
        const { message: errMessage } = error;
        if (typeof errMessage === "string" && errMessage.length > 0) {
          errorText = errMessage;
        }
      }
      message.error(errorText);
    } finally {
      setCeilingSubmitting(false);
    }
  };

  const handleTradingSubmit = async (
    values: TradingTransactionFormValues
  ) => {
    setTradingSubmitting(true);
    try {
      await post(API_PATHS.EMISSION_TRADING_CREATE, {
        sellerCompanyId: values.sellerCompanyId,
        buyerCompanyId: values.buyerCompanyId,
        units: values.units,
        valueLAK: values.valueLAK,
        tradeDate: values.tradeDate.valueOf(),
      });
      message.success("Trading transaction recorded.");
      tradingForm.resetFields();
    } catch (error) {
      let errorText = "Failed to record trading transaction.";
      if (error && typeof error === "object" && "message" in error) {
        const { message: errMessage } = error;
        if (typeof errMessage === "string" && errMessage.length > 0) {
          errorText = errMessage;
        }
      }
      message.error(errorText);
    } finally {
      setTradingSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto" }}>
      <Card title="Record Emission Ceiling" style={{ marginBottom: "1.5rem" }}>
        <Form<EmissionCeilingFormValues>
          form={ceilingForm}
          layout="vertical"
          onFinish={handleCeilingSubmit}
        >
          <Form.Item
            name="companyId"
            label="Company ID (numeric)"
            rules={[{ required: true, message: "Company ID is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Typography.Text
            type="secondary"
            style={{ display: "block", marginTop: "-0.75rem", marginBottom: "1rem" }}
          >
            Enter the numeric company ID as shown in Company Management.
          </Typography.Text>
          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: "Year is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={2020} max={2100} />
          </Form.Item>
          <Form.Item
            name="units"
            label="Units"
            rules={[{ required: true, message: "Units are required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={ceilingSubmitting}>
              Submit Ceiling
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Record Trading Transaction">
        <Form<TradingTransactionFormValues>
          form={tradingForm}
          layout="vertical"
          onFinish={handleTradingSubmit}
        >
          <Form.Item
            name="sellerCompanyId"
            label="Seller Company ID"
            rules={[
              { required: true, message: "Seller company ID is required" },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item
            name="buyerCompanyId"
            label="Buyer Company ID"
            rules={[
              { required: true, message: "Buyer company ID is required" },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item
            name="units"
            label="Units"
            rules={[{ required: true, message: "Units are required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="valueLAK" label="Value (LAK)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="tradeDate"
            label="Trade Date"
            rules={[{ required: true, message: "Trade date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={tradingSubmitting}>
              Submit Trading Transaction
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EmissionTradingSubmit;

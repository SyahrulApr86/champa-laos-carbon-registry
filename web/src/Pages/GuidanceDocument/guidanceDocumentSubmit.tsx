import React, { useState } from "react";
import { Button, Card, Form, Input, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { RcFile } from "antd/lib/upload";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../Config/apiConfig";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { getBase64 } from "../../Definitions/Definitions/programme.definitions";

const { TextArea } = Input;

const CATEGORY_OPTIONS = ["Guideline", "Standard", "Form Template", "Other"];

interface GuidanceDocumentFormValues {
  title: string;
  description?: string;
  category?: string;
  documentFile: { originFileObj: RcFile }[];
}

// Guarded upload form for downloadable guidance documents (Instruments >
// Module). Recorded by DNA/Ministry, mirrors reddPlusSubmit.tsx /
// communityProgramSubmit.tsx. The uploaded file is stored as a base64
// data-URI (data:<mimetype>;base64,<data>), matching the design-document
// upload convention used elsewhere in this codebase.
const GuidanceDocumentSubmit = () => {
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [form] = Form.useForm<GuidanceDocumentFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 700, margin: "3rem auto", textAlign: "center" }}>
        <p>Only DNA/Ministry can publish guidance documents.</p>
        <Link to="/">Return to homepage</Link>
      </div>
    );
  }

  const handleSubmit = async (values: GuidanceDocumentFormValues) => {
    setSubmitting(true);
    try {
      if (!values.documentFile || values.documentFile.length === 0) {
        message.error("A document file is required.");
        setSubmitting(false);
        return;
      }
      const documentUrl = await getBase64(
        values.documentFile[0].originFileObj as RcFile
      );
      const payload = {
        title: values.title,
        description: values.description,
        category: values.category,
        documentUrl,
      };
      await post(API_PATHS.GUIDANCE_DOCUMENT_CREATE, payload);
      message.success("Guidance document published.");
      navigate("/instruments#module");
    } catch (error) {
      let errorText = "Failed to publish guidance document.";
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
      <Card title="Publish Guidance Document">
        <Form<GuidanceDocumentFormValues>
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
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select allowClear placeholder="Select category">
              {CATEGORY_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="documentFile"
            label="Document File"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            rules={[{ required: true, message: "A document file is required" }]}
          >
            <Upload
              accept=".pdf,.doc,.docx"
              maxCount={1}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Publish
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default GuidanceDocumentSubmit;

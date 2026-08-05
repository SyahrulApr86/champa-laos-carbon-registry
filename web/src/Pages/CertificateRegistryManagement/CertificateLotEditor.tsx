import { useEffect } from "react";
import { Button, Card, Col, Form, Input, InputNumber, Row, Space } from "antd";
import { CertificateLotFormValues, ManagementLot } from "./certificateRegistryManagement.types";

interface CertificateLotEditorProps {
  lot?: ManagementLot;
  onSubmit: (values: CertificateLotFormValues) => Promise<void>;
  onCancel?: () => void;
}

const CertificateLotEditor = ({ lot, onSubmit, onCancel }: CertificateLotEditorProps) => {
  const [form] = Form.useForm<CertificateLotFormValues>();

  useEffect(() => {
    form.setFieldsValue(lot ? {
      programmeId: lot.programme_id,
      certificateId: lot.certificate_id,
      registryScheme: lot.registry_scheme,
      registryNumber: lot.registry_number ?? undefined,
      serialNumber: lot.serial_number ?? undefined,
      vintageStart: lot.vintage_start ?? undefined,
      vintageEnd: lot.vintage_end ?? undefined,
      issuedQuantity: lot.issued_quantity,
      unit: lot.unit,
    } : { registryScheme: "Champa Certificate Registry", unit: "tCO2e" });
  }, [form, lot]);

  return (
    <Card title={lot ? "Edit certificate lot" : "Create certificate lot"} size="small">
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="programmeId" label="Programme ID" rules={[{ required: true }]}>
              <Input disabled={Boolean(lot?.issued_at)} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="certificateId" label="Certificate ID" rules={[{ required: true }]}>
              <Input disabled={Boolean(lot)} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="registryScheme" label="Registry scheme">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="registryNumber" label="Registry number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="serialNumber" label="Serial number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="issuedQuantity" label="Issued quantity" rules={[{ required: true, type: "number", min: 0.000001 }]}>
              <InputNumber style={{ width: "100%" }} precision={6} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="vintageStart" label="Vintage start">
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="vintageEnd" label="Vintage end">
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" htmlType="submit">{lot ? "Save changes" : "Create lot"}</Button>
          {onCancel && <Button onClick={onCancel}>Clear</Button>}
        </Space>
      </Form>
    </Card>
  );
};

export default CertificateLotEditor;

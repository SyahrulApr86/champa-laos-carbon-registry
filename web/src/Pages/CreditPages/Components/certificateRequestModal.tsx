/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Button, Col, Form, Input, InputNumber, Modal, Row } from "antd";
import { CreditBalanceInterface } from "../Interfaces/creditBalance.interface";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { COLOR_CONFIGS } from "../../../Config/colorConfigs";

interface CertificateRequestModalProps {
  icon?: any;
  title?: string;
  onCancel: any;
  onFinish: any;
  loading: boolean;
  openModal: boolean;
  t: any;
  data?: CreditBalanceInterface;
}

export const CertificateRequestModal = (props: CertificateRequestModalProps) => {
  const { onFinish, onCancel, openModal, title, icon, loading, t, data } = props;
  const [form] = Form.useForm();
  const creditAmountRef = useRef<number | undefined>(undefined);
  const [actionDisable, setActionDisable] = useState<boolean>(false);

  const handleValuesChange = (_: any, allValues: any) => {
    creditAmountRef.current = allValues.certificateAmount;
    const amountNum = Number(creditAmountRef.current);
    let valid = true;
    if (!Number.isInteger(amountNum) || amountNum <= 0 || !data?.creditAmount) {
      valid = false;
    } else if (amountNum > data.creditAmount) {
      valid = false;
    }
    setActionDisable(!valid);
  };

  const handleSubmit = () => {
    onFinish(data?.id, creditAmountRef.current);
  };

  useEffect(() => {
    if (openModal) {
      form.resetFields();
      creditAmountRef.current = data?.creditAmount;
      form.setFieldsValue({
        project: data?.projectName,
        serialNo: data?.serialNumber,
        certificateAmount: data?.creditAmount,
      });
      setActionDisable(false);
    }
  }, [openModal]);

  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{icon}</div>
          <div>{title}</div>
        </div>
      }
      className="popup-certificate"
      open={openModal}
      width={Math.min(430, window.innerWidth)}
      centered
      footer={null}
      onCancel={onCancel}
      destroyOnClose
    >
      {data && (
        <div className="credit-action-model">
          <Form
            form={form}
            name="certificate-request-modal-form"
            layout="vertical"
            onValuesChange={handleValuesChange}
            onFinish={handleSubmit}
          >
            <Row>
              <Col span={24}>
                <Form.Item label={t("project")} name="project">
                  <Input placeholder={data.projectName} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item label={t("serialNo")} name="serialNo">
                  <Input placeholder={data.serialNumber} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8} justify="space-between">
              <Col>
                <label>
                  <span style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}>
                    {t("creditAmount")}
                    <span
                      style={{
                        color: `${COLOR_CONFIGS.PRIMARY_RED_COLOR}`,
                        position: "relative",
                        top: "2px",
                        marginLeft: 2,
                      }}
                    >
                      *
                    </span>
                  </span>
                </label>
              </Col>
              <Col lg={12} md={10}>
                <Row justify="end">
                  <Col span={24}>
                    <Form.Item
                      name="certificateAmount"
                      rules={[
                        {
                          // eslint-disable-next-line no-unused-vars
                          validator: (_, value) => {
                            if (
                              value === undefined ||
                              value === null ||
                              value.toString().trim() === ""
                            ) {
                              return Promise.reject(new Error(t("required")));
                            }
                            if (value <= 0 || isNaN(value)) {
                              return Promise.reject(new Error(t("wrongInput")));
                            }
                            if (!Number.isInteger(Number(value))) {
                              return Promise.reject(
                                new Error(t("shouldBeInterger"))
                              );
                            }
                            if (Number(value) > (data?.creditAmount || 0)) {
                              return Promise.reject(
                                new Error(t("insufficientBalance"))
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        placeholder={
                          data?.creditAmount ? addCommSep(data.creditAmount) : ""
                        }
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <p style={{ color: COLOR_CONFIGS.PRIMARY_FONT_COLOR, fontSize: "0.85rem" }}>
                  {t("requestCertificateBody")}
                </p>
              </Col>
            </Row>
            <Form.Item className="footer">
              <Button htmlType="button" onClick={onCancel}>
                {t("view:cancel")}
              </Button>
              <Button
                className="mg-left-2"
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={actionDisable}
              >
                {t("requestCertificate")}
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
};

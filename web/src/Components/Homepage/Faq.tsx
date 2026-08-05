import React, { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Input } from "antd";
import "./Dashboard.scss";
import { ChevronDown } from "react-bootstrap-icons";
import { Trans, useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";

interface FaqRecord {
  id: string;
  questionKey: string;
  answerKey: string;
  category?: string;
  publicationStatus?: string;
  contentVersion?: string;
}

const FALLBACK_FAQ_RECORDS: FaqRecord[] = Array.from({ length: 9 }, (_, index) => ({
  id: `faq-local-demo-${index + 1}`,
  questionKey: `faqQ${index + 1}`,
  answerKey: `faqA${index + 1}`,
  publicationStatus: "synthetic_demo",
  contentVersion: "champa-content-demo-v1",
}));

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [records, setRecords] = useState<FaqRecord[]>(FALLBACK_FAQ_RECORDS);
  const [apiFallback, setApiFallback] = useState(false);
  const { get } = useConnection();
  const { t } = useTranslation(["homepage", "instruments"]);

  useEffect(() => {
    get("national/faq/public")
      .then((response: any) => {
        const data = response?.data;
        if (Array.isArray(data) && data.length > 0) {
          setRecords(data);
          setApiFallback(false);
        } else {
          setApiFallback(true);
        }
      })
      .catch(() => setApiFallback(true));
  }, [get]);

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="faq-container" id="faq">
      <h2 className="header-title">{t("homepage:faqTitle")}</h2>
      {apiFallback && (
        <Alert
          type="info"
          showIcon
          message={t("instruments:faqFallbackTitle", { defaultValue: "Showing local demo FAQ content" })}
          description={t("instruments:faqFallbackBody", { defaultValue: "The public FAQ endpoint is not configured in this environment. The versioned local demonstration content is shown instead of an empty state." })}
          style={{ marginBottom: "1rem" }}
        />
      )}
      <div className="faq-list">
        {records.map((record, index) => (
          <div className="faq-item" key={record.id}>
            <button
              className={`faq-question ${openIndex === index ? "active" : ""}`}
              onClick={() => toggleItem(index)}
              aria-expanded={openIndex === index}
            >
              <span className={`chevron ${openIndex === index ? "rotated" : ""}`}>
                <ChevronDown />
              </span>
              <span className="question-text">{t(`homepage:${record.questionKey}`)}</span>
            </button>
            {openIndex === index && (
              <div className="faq-answer">
                <Trans
                  i18nKey={`homepage:${record.answerKey}`}
                  components={{
                    b: <strong />,
                    ol: <ol />,
                    ul: <ul className="faq-list" />,
                    li: <li />,
                    a: <a />,
                    a1: <a href="https://github.com/undp/carbon-registry" target="_blank" rel="noopener noreferrer" />,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <section className="faq-contact" aria-labelledby="faq-contact-title">
        <h3 id="faq-contact-title">{t("instruments:faqContactTitle")}</h3>
        <p>{t("instruments:faqContactBody")}</p>
        <form
          onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
          className="faq-contact-form"
        >
          <Input placeholder={t("instruments:contactName")} name="name" />
          <Input placeholder={t("instruments:contactEmail")} name="email" type="email" />
          <Input.TextArea placeholder={t("instruments:contactMessage")} name="message" required rows={4} />
          <Button disabled htmlType="submit">{t("instruments:contactSubmit")}</Button>
        </form>
        <p className="faq-contact-not-configured">{t("instruments:contactNotConfigured")}</p>
      </section>
    </div>
  );
};

export default FAQ;

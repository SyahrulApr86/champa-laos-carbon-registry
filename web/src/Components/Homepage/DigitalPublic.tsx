import React from "react";
import { Trans, useTranslation } from "react-i18next";
import "./Dashboard.scss";

// Compact open-source attribution line (AGPL-3.0 / Digital Public Goods
// Standard compliance requires crediting the upstream project, but it
// doesn't need a full-width, multi-paragraph, six-logo section on a
// national government registry's landing page — this is a small footer
// note, not a partnership announcement.
const DigitalPublicGood = () => {
  const { t } = useTranslation(["homepage"]);
  return (
    <div className="open-source-credit">
      <p>
        <Trans
          i18nKey="homepage:openSourceCredit"
          components={{
            a1: (
              <a
                href="https://digitalpublicgoods.net/digital-public-goods/"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            a2: (
              <a
                href="https://github.com/undp/carbon-registry"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            a3: (
              <a
                href="https://www.theclimatewarehouse.org/work/digital-4-climate"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
          }}
        />
      </p>
    </div>
  );
};

export default DigitalPublicGood;

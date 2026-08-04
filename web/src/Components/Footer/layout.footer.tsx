import { Col, Divider, Row } from "antd";
import { useTranslation } from "react-i18next";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import "./layout.footer.scss";
import { CcCircle } from "react-bootstrap-icons";

const LayoutFooter = () => {
  const { i18n, t } = useTranslation(["common", "homepage"]);
  const countryName = import.meta.env.VITE_APP_COUNTRY_NAME || "CountryX";

  return (
    <div className="homepage-footer-container">
      <Row>
        <Col md={24} lg={24}>
          <div className="logocontainer">
            <div className="logo">
              <img src={sliderLogo} alt="slider-logo" />
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <div className="title">{"CHAMPA - LAO PDR CARBON REGISTRY"}</div>
                {/* <div className="title-sub">{'REGISTRY'}</div> */}
              </div>
              <div className="footer-country-name">{countryName}</div>
            </div>
          </div>
        </Col>
      </Row>
      <Divider className="divider" style={{ backgroundColor: "#FFFF" }} />
      <Row>
        <Col md={24} lg={24}>
          <div className="footertext">{t("homepage:footertext1")}</div>
        </Col>
      </Row>
      <Divider className="divider" style={{ backgroundColor: "#FFFF" }} />
      <Row className="footer-org-row">
        <Col md={12} lg={12}>
          <h4 className="footer-dept-heading">
            Department of Environment (Climate Change &amp; GHG Inventory)
          </h4>
          <div className="footer-contact-line">
            <a href="mailto:admin@champa.la">admin@champa.la</a>
          </div>
          <div className="footer-contact-line">
            <a href="tel:+8562112345678">+856 21 123 456</a>
          </div>
        </Col>
        <Col md={12} lg={12}>
          <h4 className="footer-dept-heading">Department of Forestry</h4>
          <div className="footer-address-line">
            Ministry of Agriculture and Environment
          </div>
          <div className="footer-address-line">Vientiane Capital</div>
          <div className="footer-address-line">Lao People's Democratic Republic</div>
        </Col>
      </Row>
      <Divider className="divider" style={{ backgroundColor: "#FFFF" }} />
      <Row>
        <Col md={10} lg={10}>
          <div className="footertext-bottom">
            {import.meta.env.VITE_APP_COUNTRY_NAME || "CountryX"}
            <CcCircle className="cc" color="#FFFF" size="10px" />
            {" "}© Ministry of Agriculture and Environment {new Date().getFullYear()}
          </div>
        </Col>
        <Col md={14} lg={14}>
          <div className="footertext-link-container">
            <div>
              <a
                href="/help"
                className="footertext-links"
              >
                {t("homepage:Help")}
              </a>
              <a href="/cookie" target="_blank" className="footertext-links">
                {t("homepage:Cookie")}
              </a>
            </div>
            <div>
              <a href="codeconduct" target="_blank" className="footertext-links">
                {t("homepage:codeconduct")}
              </a>
              <a href="/terms#termuse" target="_blank" className="footertext-links">
                {t("homepage:terms")}
              </a>
              <a href="/privacy" target="_blank" className="footertext-links">
                {t("homepage:privacy")}
              </a>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LayoutFooter;

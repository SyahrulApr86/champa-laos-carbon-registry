import {
  Button,
  Divider,
  Form,
  Input,
  message,
  Select,
  Statistic,
} from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import LayoutFooter from "../../Components/Footer/layout.footer";
import AppHeader from "../../Components/AppHeader/appHeader";
import "./help.scss";
import { CcCircle } from "react-bootstrap-icons";
const CarbonHelp = () => {
  useEffect(() => {
    if (localStorage.getItem("i18nextLng")!.length > 2) {
      i18next.changeLanguage("en");
    }
  }, []);
  return (
    <div className="code-container">
      <AppHeader />
      <h1>Help Page</h1>
      <div className="footer-container">
        <LayoutFooter />
      </div>
    </div>
  );
};
export default CarbonHelp;

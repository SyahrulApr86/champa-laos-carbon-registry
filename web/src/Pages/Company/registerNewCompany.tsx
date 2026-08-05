import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import { AddNewCompanyComponent } from '@undp/carbon-library';
import "./registerNewCompany.scss";
import AppHeader from "../../Components/AppHeader/appHeader";
import { AddNewCompanyComponent } from "../../Components/Company/AddNewCompany/addNewCompanyComponent";

const RegisterNewCompany = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["addCompany"]);

  const maximumImageSize = import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE
    ? parseInt(import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE)
    : 1048576;

  const onNavigateToHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="register-company-container">
      <AppHeader />
      <AddNewCompanyComponent
        t={t}
        maximumImageSize={maximumImageSize}
        useLocation={useLocation}
        regionField
        isGuest={true}
        onNavigateToHome={onNavigateToHome}
      ></AddNewCompanyComponent>
    </div>
  );
};

export default RegisterNewCompany;

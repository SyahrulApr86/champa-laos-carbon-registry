import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      // translation file path
      loadPath: '/locales/i18n/{{ns}}/{{lng}}.json',
    },
    fallbackLng: 'en',
    // Only trust a language the user explicitly picked (cached by the
    // toggle in LanguageSelection). Without this, the detector falls
    // through to the browser's navigator/htmlTag locale on first visit,
    // so a Lao-locale browser would silently skip the English default.
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
    //NOTE - Disabled in production
    debug: true,
    //separate name spaces for each pages
    ns: [
      'common',
      'login',
      'dashboard',
      'nav',
      'company',
      'user',
      'programme',
      'view',
      'homepage',
      'ndcAction',
      'coBenifits',
      'environment',
      'genderParity',
      'safeguards',
      'social',
      'economic',
      'creditTransfer',
      'addProgramme',
      'socialEnvironmentalRisk',
      'unfcccSdTool',
    ],
  });
export default i18n;

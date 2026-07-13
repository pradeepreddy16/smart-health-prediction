import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import taTranslation from './locales/ta.json';
import teTranslation from './locales/te.json';
import knTranslation from './locales/kn.json';
import mlTranslation from './locales/ml.json';

const resources = {
  en: { translation: enTranslation },
  ta: { translation: taTranslation },
  te: { translation: teTranslation },
  kn: { translation: knTranslation },
  ml: { translation: mlTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import vi from './locales/vi.json';
import fa from './locales/fa.json';
import ko from './locales/ko.json';
import tr from './locales/tr.json';
import ur from './locales/ur.json';
import sv from './locales/sv.json';
import tl from './locales/tl.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
  ar: { translation: ar },
  hi: { translation: hi },
  pt: { translation: pt },
  ru: { translation: ru },
  ja: { translation: ja },
  vi: { translation: vi },
  fa: { translation: fa },
  ko: { translation: ko },
  tr: { translation: tr },
  ur: { translation: ur },
  sv: { translation: sv },
  tl: { translation: tl },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import es from "./locales/es.json";
import hi from "./locales/hi.json";

const STORAGE_KEY = "ck-lang";

export const SUPPORTED_LANGS = [
  { code: "en", label: "English", nativeLabel: "English", rtl: false },
  { code: "es", label: "Spanish", nativeLabel: "Español", rtl: false },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", rtl: false },
] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      hi: { translation: hi },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS.map((l) => l.code),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", (lng) => {
  const lang = SUPPORTED_LANGS.find((l) => l.code === lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lang?.rtl ? "rtl" : "ltr";
  localStorage.setItem(STORAGE_KEY, lng);

  // Persist to server if user is logged in
  persistLangToAPI(lng);
});

const initialLang = i18n.language || "en";
const initialLangCfg = SUPPORTED_LANGS.find((l) => l.code === initialLang);
document.documentElement.dir = initialLangCfg?.rtl ? "rtl" : "ltr";

/** Load language from server on login, falling back to local detection */
export async function loadSavedLang() {
  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";
    const res = await fetch(`${API_URL}/api/users/me/lang`, { credentials: "include" });
    if (res.ok) {
      const { lang } = await res.json();
      if (lang && lang !== i18n.language) {
        i18n.changeLanguage(lang);
      }
    }
  } catch {
    // Silently fall back to localStorage / browser detection
  }
}

async function persistLangToAPI(lang: string) {
  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";
    await fetch(`${API_URL}/api/users/me/lang`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });
  } catch {
    // Silently fail - language still works from localStorage
  }
}

export default i18n;

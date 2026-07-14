import { describe, expect, test } from "bun:test";
import {
  t,
  translations,
  formatPageXofY,
  formatAllRightsReserved,
  formatFallbackBanner,
  formatReadIn,
} from "./translations";

describe("translations", () => {
  const supportedLanguages = ["en", "ar", "es", "fr", "de", "pt", "hi"];

  test("supports all required languages", () => {
    for (const lang of supportedLanguages) {
      expect(translations[lang]).toBeDefined();
      expect(translations[lang].languageNames[lang]).toBeDefined();
    }
  });

  test("t() falls back to English for unknown languages", () => {
    const result = t("xx");
    expect(result.blog).toBe(translations.en.blog);
  });

  test("formatPageXofY interpolates current and total", () => {
    expect(formatPageXofY(translations.en, 2, 5)).toBe("Page 2 of 5");
    expect(formatPageXofY(translations.ar, 2, 5)).toBe("الصفحة 2 من 5");
  });

  test("formatAllRightsReserved interpolates year", () => {
    expect(formatAllRightsReserved(translations.en, 2026)).toContain("2026");
  });

  test("formatFallbackBanner interpolates language names", () => {
    const result = formatFallbackBanner(translations.en, "Spanish", "English");
    expect(result).toContain("Spanish");
    expect(result).toContain("English");
  });

  test("formatReadIn interpolates language name", () => {
    expect(formatReadIn(translations.en, "English")).toBe("Read in English →");
  });

  test("every supported language has required keys", () => {
    const requiredKeys: (keyof typeof translations.en)[] = [
      "postNotFound",
      "blog",
      "blogDescription",
      "backToSite",
      "backToBlog",
      "backToHome",
      "insights",
      "previous",
      "next",
      "pageXofY",
      "noArticles",
      "noArticlesFilter",
      "privacy",
      "terms",
      "home",
      "allRightsReserved",
      "share",
      "fallbackBanner",
      "readIn",
      "selectLanguage",
      "filterByLanguage",
      "all",
      "languageNames",
    ];

    for (const lang of supportedLanguages) {
      const dict = translations[lang];
      for (const key of requiredKeys) {
        expect(dict[key]).toBeDefined();
      }
    }
  });
});

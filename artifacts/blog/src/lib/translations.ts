import en from "../generated/translations/en.json";
import ar from "../generated/translations/ar.json";
import es from "../generated/translations/es.json";
import fr from "../generated/translations/fr.json";
import de from "../generated/translations/de.json";
import pt from "../generated/translations/pt.json";
import hi from "../generated/translations/hi.json";

export interface Translations {
  postNotFound: string;
  blog: string;
  blogDescription: string;
  backToSite: string;
  backToBlog: string;
  backToHome: string;
  insights: string;
  previous: string;
  next: string;
  pageXofY: string;
  noArticles: string;
  noArticlesFilter: string;
  privacy: string;
  terms: string;
  home: string;
  allRightsReserved: string;
  share: string;
  fallbackBanner: string;
  readIn: string;
  selectLanguage: string;
  filterByLanguage: string;
  all: string;
  justNow: string;
  oneMinuteAgo: string;
  minutesAgo: string;
  oneHourAgo: string;
  hoursAgo: string;
  yesterday: string;
  daysAgo: string;
  oneWeekAgo: string;
  weeksAgo: string;
  oneMonthAgo: string;
  monthsAgo: string;
  oneYearAgo: string;
  yearsAgo: string;
  languageNames: Record<string, string>;
}

function replacePlaceholders(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

export function formatPageXofY(
  t: Translations,
  current: number,
  total: number,
): string {
  return replacePlaceholders(t.pageXofY, {
    current: String(current),
    total: String(total),
  });
}

export function formatAllRightsReserved(
  t: Translations,
  year: number,
): string {
  return replacePlaceholders(t.allRightsReserved, { year: String(year) });
}

export function formatFallbackBanner(
  t: Translations,
  requested: string,
  fallback: string,
): string {
  return replacePlaceholders(t.fallbackBanner, { requested, fallback });
}

export function formatReadIn(t: Translations, lang: string): string {
  return replacePlaceholders(t.readIn, { lang });
}

export const translations: Record<string, Translations> = {
  en,
  ar,
  es,
  fr,
  de,
  pt,
  hi,
};

export function t(lang: string): Translations {
  return translations[lang] ?? translations.en;
}

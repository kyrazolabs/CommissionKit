import { t } from "@/lib/translations";

export function formatDate(date: string | Date, lang = "en"): string {
  return new Date(date).toLocaleDateString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeDate(date: string | Date, lang: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return label("justNow", lang);
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes === 1) {
    return tryIntl(1, "minute", lang) ?? label("oneMinuteAgo", lang);
  }
  if (diffMinutes < 60) {
    return tryIntl(diffMinutes, "minute", lang) ?? pluralLabel("minutesAgo", diffMinutes, lang);
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) {
    return label("oneHourAgo", lang);
  }
  if (diffHours < 24) {
    return tryIntl(diffHours, "hour", lang) ?? pluralLabel("hoursAgo", diffHours, lang);
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return label("yesterday", lang);
  }
  if (diffDays < 7) {
    return tryIntl(diffDays, "day", lang) ?? pluralLabel("daysAgo", diffDays, lang);
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) {
    return tryIntl(1, "week", lang) ?? label("oneWeekAgo", lang);
  }
  if (diffWeeks < 4) {
    return tryIntl(diffWeeks, "week", lang) ?? pluralLabel("weeksAgo", diffWeeks, lang);
  }

  const diffMonths = Math.max(1, Math.floor(diffDays / 30));
  if (diffMonths === 1) {
    return tryIntl(1, "month", lang) ?? label("oneMonthAgo", lang);
  }
  if (diffMonths < 12) {
    return tryIntl(diffMonths, "month", lang) ?? pluralLabel("monthsAgo", diffMonths, lang);
  }

  const diffYears = Math.max(1, Math.floor(diffDays / 365));
  if (diffYears === 1) {
    return tryIntl(1, "year", lang) ?? label("oneYearAgo", lang);
  }
  return tryIntl(diffYears, "year", lang) ?? pluralLabel("yearsAgo", diffYears, lang);
}

function tryIntl(value: number, unit: Intl.RelativeTimeFormatUnit, lang: string): string | null {
  if (typeof Intl === "undefined" || !("RelativeTimeFormat" in Intl)) {
    return null;
  }
  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "always" });
    return rtf.format(-value, unit);
  } catch {
    return null;
  }
}

function label(key: string, lang: string): string {
  const dict = t(lang);
  return dict[key as keyof ReturnType<typeof t>] as string;
}

function pluralLabel(key: string, count: number, lang: string): string {
  const dict = t(lang);
  return (dict[key as keyof ReturnType<typeof t>] as string).replace("{count}", String(count));
}

export function readingTime(text: string): string {
  const words = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

import { useEffect } from "react";
import { canonicalUrl, getRobotsDirective, getSeoRoute, SITE_URL } from "@/lib/seo";

interface PageMeta {
  title?: string;
  description?: string;
  /** Use an explicit directive only when the route is not represented in the shared registry. */
  robots?: string;
  /** SEO keywords, comma-separated. */
  keywords?: string;
  /** Canonical path override for a route that is not represented in the shared registry. */
  canonicalPath?: string;
}

const APP_NAME = "CommissionKit";
const DEFAULT_DESCRIPTION =
  "Manage sales commissions with plans, deal tracking, calculation runs, payout workflows, and a rep earnings portal.";

function upsertMeta(selector: string, attribute: "name" | "property", value: string) {
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  return element;
}

function upsertCanonical(href: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

/**
 * Keeps client-side metadata aligned with the prerendered page state. Public SEO
 * routes are defined centrally in `@/lib/seo`; unknown routes remain noindex.
 */
export function usePageMeta({
  title,
  description,
  robots,
  keywords,
  canonicalPath,
}: PageMeta = {}) {
  const location = typeof window === "undefined" ? "/" : window.location.pathname;
  const route = getSeoRoute(location);
  const resolvedTitle = title ?? route.title;
  const resolvedDescription = description ?? route.description ?? DEFAULT_DESCRIPTION;
  const resolvedKeywords = keywords ?? route.keywords;
  const resolvedCanonical = canonicalPath ? `${SITE_URL}${canonicalPath}` : canonicalUrl(location);
  const resolvedRobots = robots ?? getRobotsDirective(route.status);

  useEffect(() => {
    const fullTitle =
      resolvedTitle === APP_NAME || resolvedTitle.endsWith(` — ${APP_NAME}`)
        ? resolvedTitle
        : `${resolvedTitle} — ${APP_NAME}`;
    document.title = fullTitle;

    const descriptionElement = upsertMeta('meta[name="description"]', "name", "description");
    descriptionElement.setAttribute("content", resolvedDescription);

    const robotsElement = upsertMeta('meta[name="robots"]', "name", "robots");
    robotsElement.setAttribute("content", resolvedRobots);

    const ogTitleElement = upsertMeta('meta[property="og:title"]', "property", "og:title");
    ogTitleElement.setAttribute("content", fullTitle);

    const ogDescriptionElement = upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
    );
    ogDescriptionElement.setAttribute("content", resolvedDescription);

    const ogUrlElement = upsertMeta('meta[property="og:url"]', "property", "og:url");
    ogUrlElement.setAttribute("content", resolvedCanonical);

    const twitterTitleElement = upsertMeta('meta[name="twitter:title"]', "name", "twitter:title");
    twitterTitleElement.setAttribute("content", fullTitle);

    const twitterDescriptionElement = upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
    );
    twitterDescriptionElement.setAttribute("content", resolvedDescription);

    if (resolvedKeywords) {
      const keywordsElement = upsertMeta('meta[name="keywords"]', "name", "keywords");
      keywordsElement.setAttribute("content", resolvedKeywords);

      const twitterKeywordsElement = upsertMeta(
        'meta[name="twitter:keywords"]',
        "name",
        "twitter:keywords",
      );
      twitterKeywordsElement.setAttribute("content", resolvedKeywords);
    }

    upsertCanonical(resolvedCanonical);
  }, [resolvedCanonical, resolvedDescription, resolvedKeywords, resolvedRobots, resolvedTitle]);
}

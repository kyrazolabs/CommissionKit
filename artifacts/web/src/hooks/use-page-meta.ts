import { useEffect } from "react";

interface PageMeta {
  title: string;
  description?: string;
  /** Robots directive, defaults to "noindex, nofollow" for authenticated pages */
  robots?: string;
  /** SEO keywords, comma-separated */
  keywords?: string;
}

const APP_NAME = "CommissionKit";
const DEFAULT_DESCRIPTION = "Automate sales commissions for your team. Track reps, deals, and payouts — all in one place.";

/**
 * Imperatively updates <title>, meta description, and robots tag for
 * client-rendered pages. Use this in every page component.
 */
export function usePageMeta({ title, description, robots = "noindex, nofollow" }: PageMeta) {
  useEffect(() => {
    // Title
    const fullTitle = title === APP_NAME ? APP_NAME : `${title} — ${APP_NAME}`;
    document.title = fullTitle;

    // Meta description
    let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement("meta");
      descEl.setAttribute("name", "description");
      document.head.appendChild(descEl);
    }
    descEl.setAttribute("content", description ?? DEFAULT_DESCRIPTION);

    // Robots
    let robotsEl = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robotsEl) {
      robotsEl = document.createElement("meta");
      robotsEl.setAttribute("name", "robots");
      document.head.appendChild(robotsEl);
    }
    robotsEl.setAttribute("content", robots);

    // OG title
    let ogTitleEl = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (!ogTitleEl) {
      ogTitleEl = document.createElement("meta");
      ogTitleEl.setAttribute("property", "og:title");
      document.head.appendChild(ogTitleEl);
    }
    ogTitleEl.setAttribute("content", fullTitle);

    // OG description
    let ogDescEl = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (!ogDescEl) {
      ogDescEl = document.createElement("meta");
      ogDescEl.setAttribute("property", "og:description");
      document.head.appendChild(ogDescEl);
    }
    ogDescEl.setAttribute("content", description ?? DEFAULT_DESCRIPTION);

    // Keywords
    if (keywords !== undefined) {
      let kwEl = document.querySelector<HTMLMetaElement>('meta[name="keywords"]');
      if (!kwEl) {
        kwEl = document.createElement("meta");
        kwEl.setAttribute("name", "keywords");
        document.head.appendChild(kwEl);
      }
      kwEl.setAttribute("content", keywords);
    }

    // Twitter keywords
    if (keywords !== undefined) {
      let twKwEl = document.querySelector<HTMLMetaElement>('meta[name="twitter:keywords"]');
      if (!twKwEl) {
        twKwEl = document.createElement("meta");
        twKwEl.setAttribute("name", "twitter:keywords");
        document.head.appendChild(twKwEl);
      }
      twKwEl.setAttribute("content", keywords);
    }
  }, [title, description, robots, keywords]);
}

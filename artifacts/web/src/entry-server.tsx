import ReactDOMServer from "react-dom/server";
import { LandingPage } from "./pages/landing";
import { CommissionCalculator } from "./pages/commission-calculator";
import { PrivacyPage } from "./pages/legal/privacy";
import { TermsPage } from "./pages/legal/terms";
import { SecurityPage } from "./pages/legal/security";
import { ContactPage } from "./pages/contact";
import { FeaturesPage } from "./pages/features";
import { SolutionsPage } from "./pages/solutions";

interface PageMeta {
  title: string;
  description: string;
  robots?: string;
  canonical: string;
}

const APP_NAME = "CommissionKit — Sales Commission Platform";
const DEFAULT_DESCRIPTION = "Automate sales commissions for your team. Track reps, deals, and payouts — all in one place.";

const BASE_URL = "https://commissionk.it";

const routeMeta: Record<string, PageMeta> = {
  "/": {
    title: APP_NAME,
    description: DEFAULT_DESCRIPTION,
    robots: "index, follow",
    canonical: `${BASE_URL}/`,
  },
  "/home": {
    title: APP_NAME,
    description: DEFAULT_DESCRIPTION,
    robots: "index, follow",
    canonical: `${BASE_URL}/`,
  },
  "/commission-calculator": {
    title: "Commission Calculator — CommissionKit",
    description: "Calculate sales commissions instantly. Try flat, tiered, and accelerator commission structures for free. No login required.",
    robots: "index, follow",
    canonical: `${BASE_URL}/commission-calculator`,
  },
  "/privacy": {
    title: "Privacy Policy — CommissionKit",
    description: "Learn how CommissionKit collects and uses your data.",
    robots: "index, follow",
    canonical: `${BASE_URL}/privacy`,
  },
  "/terms": {
    title: "Terms of Service — CommissionKit",
    description: "CommissionKit terms of service and usage agreement.",
    robots: "index, follow",
    canonical: `${BASE_URL}/terms`,
  },
  "/security": {
    title: "Security — CommissionKit",
    description: "CommissionKit security practices and data protection information.",
    robots: "index, follow",
    canonical: `${BASE_URL}/security`,
  },
  "/contact": {
    title: "Contact — CommissionKit",
    description: "Get in touch with the CommissionKit team for sales, support, or general inquiries.",
    robots: "index, follow",
    canonical: `${BASE_URL}/contact`,
  },
  "/features": {
    title: "Features — CommissionKit",
    description: "Explore CommissionKit's full feature set — commission engine, rep portal, deal management, payout tracking, and platform capabilities.",
    robots: "index, follow",
    canonical: `${BASE_URL}/features`,
  },
  "/solutions": {
    title: "Solutions — CommissionKit",
    description: "Commission management solutions for finance teams, sales ops, startups, and enterprises. Automate commissions at any scale.",
    robots: "index, follow",
    canonical: `${BASE_URL}/solutions`,
  },
};

export function render(url?: string) {
  const path = url ?? "/";

  let element: React.ReactElement;
  if (path.startsWith("/commission-calculator")) {
    element = <CommissionCalculator />;
  } else if (path === "/privacy") {
    element = <PrivacyPage />;
  } else if (path === "/terms") {
    element = <TermsPage />;
  } else if (path === "/security") {
    element = <SecurityPage />;
  } else if (path === "/contact") {
    element = <ContactPage />;
  } else if (path === "/features") {
    element = <FeaturesPage />;
  } else if (path === "/solutions") {
    element = <SolutionsPage />;
  } else {
    element = <LandingPage />;
  }

  const html = ReactDOMServer.renderToString(element);
  const meta = routeMeta[path] ?? routeMeta["/"];
  console.log(`[SSR] render(${path}) → canonical: ${meta.canonical}`);

  return { html, meta };
}

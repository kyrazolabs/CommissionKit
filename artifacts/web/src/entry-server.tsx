import ReactDOMServer from "react-dom/server";
import { LandingPage } from "./pages/landing";
import { CommissionCalculator } from "./pages/commission-calculator";
import { PrivacyPage } from "./pages/legal/privacy";
import { TermsPage } from "./pages/legal/terms";
import { SecurityPage } from "./pages/legal/security";
import { ContactPage } from "./pages/contact";
import { FeaturesPage } from "./pages/features";
import { SolutionsPage } from "./pages/solutions";
import { PricingPage } from "./pages/pricing";

interface PageMeta {
  title: string;
  description: string;
  robots?: string;
  keywords?: string;
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
    keywords: "commissions systems, commission systems, commission software, commissions software, software for commission sales, commission sales software, sales rep commission software, sales commission management software",
    canonical: `${BASE_URL}/`,
  },
  "/home": {
    title: APP_NAME,
    description: DEFAULT_DESCRIPTION,
    robots: "index, follow",
    keywords: "commissions systems, commission systems, commission software, commissions software, software for commission sales, commission sales software, sales rep commission software, sales commission management software",
    canonical: `${BASE_URL}/`,
  },
  "/calculator": {
    title: "Commission Calculator — CommissionKit",
    description: "Calculate sales commissions instantly. Try flat, tiered, and accelerator commission structures for free. No login required.",
    robots: "index, follow",
    keywords: "commission pay calculator, calculating commissions, calculator commission, commissions calculator, payroll commission calculator, commission on sales calculator, sales commission calculator, sales and commission calculator",
    canonical: `${BASE_URL}/calculator`,
  },
  "/privacy": {
    title: "Privacy Policy — CommissionKit",
    description: "Learn how CommissionKit collects and uses your data.",
    robots: "index, follow",
    keywords: "CommissionKit privacy policy, data protection, GDPR compliance, CCPA, sales commission software privacy",
    canonical: `${BASE_URL}/privacy`,
  },
  "/terms": {
    title: "Terms of Service — CommissionKit",
    description: "CommissionKit terms of service and usage agreement.",
    robots: "index, follow",
    keywords: "CommissionKit terms of service, usage agreement, software terms, SaaS terms, commission platform terms",
    canonical: `${BASE_URL}/terms`,
  },
  "/security": {
    title: "Security — CommissionKit",
    description: "CommissionKit security practices and data protection information.",
    robots: "index, follow",
    keywords: "CommissionKit security, SOC 2, data encryption, secure commission software, cloud security, GDPR security",
    canonical: `${BASE_URL}/security`,
  },
  "/contact": {
    title: "Contact — CommissionKit",
    description: "Get in touch with the CommissionKit team for sales, support, or general inquiries.",
    robots: "index, follow",
    keywords: "contact sales commission software, commission management support, sales comp help, get commission software demo",
    canonical: `${BASE_URL}/contact`,
  },
  "/features": {
    title: "Features — CommissionKit",
    description: "Everything you need to manage sales commissions — from plan modeling to final payout.",
    robots: "index, follow",
    keywords: "commission calculation software, sales commission tracking, sales commission tracking software, commission sales software, commission software, sales rep commission software, commissions systems, software for commission sales",
    canonical: `${BASE_URL}/features`,
  },
  "/solutions": {
    title: "Solutions — CommissionKit",
    description: "Commission management solutions for finance teams, sales ops, startups, and enterprises. Automate commissions at any scale.",
    robots: "index, follow",
    keywords: "sales performance management software, manage sales performance, sales performance management, commission software, sales commission management software",
    canonical: `${BASE_URL}/solutions`,
  },
  "/pricing": {
    title: "Pricing — CommissionKit",
    description: "Simple, transparent pricing for teams of all sizes. Start free, scale as you grow.",
    robots: "index, follow",
    keywords: "commission software pricing, sales commission cost, commission management plans, team pricing, rep commission software",
    canonical: `${BASE_URL}/pricing`,
  },
};

export function render(url?: string) {
  const path = url ?? "/";

  let element: React.ReactElement;
  if (path === "/calculator") {
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
  } else if (path === "/pricing") {
    element = <PricingPage />;
  } else {
    element = <LandingPage />;
  }

  const html = ReactDOMServer.renderToString(element);
  const meta = routeMeta[path] ?? routeMeta["/"];
  console.log(`[SSR] render(${path}) → canonical: ${meta.canonical}`);

  return { html, meta };
}

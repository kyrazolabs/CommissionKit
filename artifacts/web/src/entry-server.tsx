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
import { OdooIntegrationPage } from "./pages/integrations/odoo";
import { HubspotIntegrationPage } from "./pages/integrations/hubspot";
import { SalesforceIntegrationPage } from "./pages/integrations/salesforce";
import { CustomIntegrationPage } from "./pages/integrations/custom";
import { RepPortalLanding } from "./pages/rep-portal-landing";

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

const ROBOTS_DIRECTIVE = import.meta.env.VITE_STAGING ? "noindex, nofollow" : "index, follow";

const routeMeta: Record<string, PageMeta> = {
  "/": {
    title: APP_NAME,
    description: DEFAULT_DESCRIPTION,
    robots: ROBOTS_DIRECTIVE,
    keywords: "commissions systems, commission systems, commission software, commissions software, software for commission sales, commission sales software, sales rep commission software, sales commission management software",
    canonical: `${BASE_URL}/`,
  },
  "/home": {
    title: APP_NAME,
    description: DEFAULT_DESCRIPTION,
    robots: ROBOTS_DIRECTIVE,
    keywords: "commissions systems, commission systems, commission software, commissions software, software for commission sales, commission sales software, sales rep commission software, sales commission management software",
    canonical: `${BASE_URL}/`,
  },
  "/calculator": {
    title: "Commission Calculator — CommissionKit",
    description: "Calculate sales commissions instantly. Try flat, tiered, and accelerator commission structures for free. No login required.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "commission pay calculator, calculating commissions, calculator commission, commissions calculator, payroll commission calculator, commission on sales calculator, sales commission calculator, sales and commission calculator",
    canonical: `${BASE_URL}/calculator`,
  },
  "/privacy": {
    title: "Privacy Policy — CommissionKit",
    description: "Learn how CommissionKit collects and uses your data.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "CommissionKit privacy policy, data protection, GDPR compliance, CCPA, sales commission software privacy",
    canonical: `${BASE_URL}/privacy`,
  },
  "/terms": {
    title: "Terms of Service — CommissionKit",
    description: "CommissionKit terms of service and usage agreement.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "CommissionKit terms of service, usage agreement, software terms, SaaS terms, commission platform terms",
    canonical: `${BASE_URL}/terms`,
  },
  "/security": {
    title: "Security — CommissionKit",
    description: "CommissionKit security practices and data protection information.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "CommissionKit security, SOC 2, data encryption, secure commission software, cloud security, GDPR security",
    canonical: `${BASE_URL}/security`,
  },
  "/contact": {
    title: "Contact — CommissionKit",
    description: "Get in touch with the CommissionKit team for sales, support, or general inquiries.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "contact sales commission software, commission management support, sales comp help, get commission software demo",
    canonical: `${BASE_URL}/contact`,
  },
  "/features": {
    title: "Features — CommissionKit",
    description: "Everything you need to manage sales commissions — from plan modeling to final payout.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "commission calculation software, sales commission tracking, sales commission tracking software, commission sales software, commission software, sales rep commission software, commissions systems, software for commission sales",
    canonical: `${BASE_URL}/features`,
  },
  "/solutions": {
    title: "Solutions — CommissionKit",
    description: "Commission management solutions for finance teams, sales ops, startups, and enterprises. Automate commissions at any scale.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "sales performance management software, manage sales performance, sales performance management, commission software, sales commission management software",
    canonical: `${BASE_URL}/solutions`,
  },
  "/pricing": {
    title: "Pricing — CommissionKit",
    description: "Simple, transparent pricing for teams of all sizes. Start free, scale as you grow.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "commission software pricing, sales commission cost, commission management plans, team pricing, rep commission software",
    canonical: `${BASE_URL}/pricing`,
  },
  "/integrations/odoo": {
    title: "Odoo Commission Tracking Integration — CommissionKit",
    description: "Connect Odoo ERP to CommissionKit and automate your sales commission tracking. Sync sales orders, reps, and invoices automatically. No more manual spreadsheets or commission disputes. Start your free trial.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "odoo commission integration, odoo sales commission tracking, connect odoo to commission software, odoo commission management, odoo erp commission, automate odoo commission calculation, odoo sales order commission sync",
    canonical: `${BASE_URL}/integrations/odoo`,
  },
  "/integrations/hubspot": {
    title: "HubSpot Commission Integration — CommissionKit",
    description: "Connect HubSpot CRM to CommissionKit and automate your sales commission tracking. Sync HubSpot deals, owners, and pipelines automatically. No more CSV exports or manual commission calculations. Start your free trial.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "hubspot commission integration, hubspot sales commission software, sync hubspot to commission tracking, hubspot CRM commission management, automate hubspot commission calculation, hubspot deal commission sync",
    canonical: `${BASE_URL}/integrations/hubspot`,
  },
  "/integrations/salesforce": {
    title: "Salesforce Commission Integration — CommissionKit",
    description: "Connect Salesforce Sales Cloud to CommissionKit and automate your commission tracking. Sync Salesforce opportunities, users, and pipeline stages automatically. Eliminate manual spreadsheets and commission disputes. Start your free trial.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "salesforce commission integration, salesforce sales commission tracking, connect salesforce to commission software, salesforce opportunity commission sync, salesforce commission management, automate salesforce commission calculation, salesforce sales cloud commission",
    canonical: `${BASE_URL}/integrations/salesforce`,
  },
  "/integrations/custom": {
    title: "Custom REST API Integration — CommissionKit",
    description: "Connect any ERP or CRM to CommissionKit via REST API. Configure field mappings with JSONPath, choose your auth method, and sync reps and deals automatically. No code needed. Start your free trial.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "custom commission integration, REST API commission tracking, connect any CRM to commission software, custom commission software integration, no-code commission connector, JSONPath commission mapping",
    canonical: `${BASE_URL}/integrations/custom`,
  },
  "/portal": {
    title: "Sales Rep Portal — CommissionKit",
    description: "Give your sales team real-time visibility into their commissions. Secure rep portal for tracking earnings, deal breakdowns, and payout history.",
    robots: ROBOTS_DIRECTIVE,
    keywords: "rep portal, sales rep portal, commission portal, rep commission tracking, sales rep earnings portal, commission transparency",
    canonical: `${BASE_URL}/portal`,
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
  } else if (path === "/integrations/odoo") {
    element = <OdooIntegrationPage />;
  } else if (path === "/integrations/hubspot") {
    element = <HubspotIntegrationPage />;
  } else if (path === "/integrations/salesforce") {
    element = <SalesforceIntegrationPage />;
  } else if (path === "/integrations/custom") {
    element = <CustomIntegrationPage />;
  } else if (path === "/portal") {
    element = <RepPortalLanding />;
  } else {
    element = <LandingPage />;
  }

  const html = ReactDOMServer.renderToString(element);
  const meta = routeMeta[path] ?? routeMeta["/"];
  console.log(`[SSR] render(${path}) → canonical: ${meta.canonical}`);

  return { html, meta };
}

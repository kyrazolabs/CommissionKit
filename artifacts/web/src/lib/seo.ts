export const SITE_URL = "https://commissionkit.co";

export type SeoRouteStatus = "published" | "preview";

export interface SeoRouteMeta {
  title: string;
  description: string;
  keywords: string;
  canonicalPath: string;
  status: SeoRouteStatus;
}

const published = (meta: Omit<SeoRouteMeta, "status">): SeoRouteMeta => ({
  ...meta,
  status: "published",
});

const preview = (meta: Omit<SeoRouteMeta, "status">): SeoRouteMeta => ({
  ...meta,
  status: "preview",
});

export const seoRouteMeta: Record<string, SeoRouteMeta> = {
  "/": published({
    title: "CommissionKit — Sales Commission Platform",
    description:
      "Manage sales commissions with plans, deal tracking, calculation runs, payout workflows, and a rep earnings portal.",
    keywords:
      "commission systems, commission software, sales commission management software, sales rep commission software",
    canonicalPath: "/",
  }),
  "/home": published({
    title: "CommissionKit — Sales Commission Platform",
    description:
      "Manage sales commissions with plans, deal tracking, calculation runs, payout workflows, and a rep earnings portal.",
    keywords:
      "commission systems, commission software, sales commission management software, sales rep commission software",
    canonicalPath: "/",
  }),
  "/calculator": published({
    title: "Commission Calculator — CommissionKit",
    description:
      "Calculate sales commissions using flat, tiered, and accelerator structures. Explore a free commission calculator from CommissionKit.",
    keywords:
      "commission pay calculator, calculating commissions, commission calculator, sales commission calculator, commission on sales calculator",
    canonicalPath: "/calculator",
  }),
  "/privacy": published({
    title: "Privacy Policy — CommissionKit",
    description: "Learn how CommissionKit collects and uses your data.",
    keywords:
      "CommissionKit privacy policy, data protection, GDPR compliance, sales commission software privacy",
    canonicalPath: "/privacy",
  }),
  "/terms": published({
    title: "Terms of Service — CommissionKit",
    description: "CommissionKit terms of service and usage agreement.",
    keywords: "CommissionKit terms of service, usage agreement, software terms, SaaS terms",
    canonicalPath: "/terms",
  }),
  "/security": published({
    title: "Security — CommissionKit",
    description: "CommissionKit security practices and data protection information.",
    keywords: "CommissionKit security, data encryption, secure commission software, cloud security",
    canonicalPath: "/security",
  }),
  "/contact": published({
    title: "Contact — CommissionKit",
    description:
      "Get in touch with the CommissionKit team for sales, support, or general inquiries.",
    keywords: "contact sales commission software, commission management support, sales comp help",
    canonicalPath: "/contact",
  }),
  "/features": published({
    title: "Features — CommissionKit",
    description:
      "Explore CommissionKit features for commission-plan modeling, deal tracking, calculation runs, payouts, and rep visibility.",
    keywords:
      "commission calculation software, sales commission tracking, commission software, sales rep commission software",
    canonicalPath: "/features",
  }),
  "/solutions": published({
    title: "Solutions — CommissionKit",
    description:
      "Explore CommissionKit workflows for finance teams, sales operations, startups, and teams that manage sales commissions.",
    keywords:
      "sales performance management software, sales performance management, commission software",
    canonicalPath: "/solutions",
  }),
  "/pricing": published({
    title: "Pricing — CommissionKit",
    description: "Compare CommissionKit pricing for teams that manage sales commissions.",
    keywords: "commission software pricing, sales commission cost, commission management plans",
    canonicalPath: "/pricing",
  }),
  "/integrations": published({
    title: "CommissionKit Integrations — CRM and ERP Connections",
    description:
      "Explore CommissionKit integrations for Odoo, HubSpot, Salesforce, and compatible custom REST API data sources, with links to setup documentation.",
    keywords:
      "commission integration, CRM commission integration, ERP commission integration, commission data integration",
    canonicalPath: "/integrations",
  }),
  "/integrations/odoo": published({
    title: "Odoo Commission Tracking Integration — CommissionKit",
    description:
      "Connect Odoo sales orders and reps to CommissionKit for commission tracking, plan calculations, payout workflows, and documented setup guidance.",
    keywords:
      "Odoo commission integration, Odoo commission automation, Odoo commission management, Odoo commission tracking, Odoo sales commission module",
    canonicalPath: "/integrations/odoo",
  }),
  "/integrations/hubspot": published({
    title: "HubSpot Commission Integration — CommissionKit",
    description:
      "Connect HubSpot owners and deals to CommissionKit for commission tracking. Review pipeline-stage mapping, payout workflows, and the setup guide.",
    keywords:
      "HubSpot commission integration, HubSpot commission software, HubSpot commission tracking, HubSpot sales compensation",
    canonicalPath: "/integrations/hubspot",
  }),
  "/integrations/salesforce": published({
    title: "Salesforce Commission Tracking Integration — CommissionKit",
    description:
      "Connect Salesforce users and opportunities to CommissionKit for commission tracking. Review stage mapping, calculation workflows, and the setup guide.",
    keywords:
      "Salesforce commission integration, Salesforce commission management, Salesforce commission software, Salesforce commission tracking",
    canonicalPath: "/integrations/salesforce",
  }),
  "/integrations/custom": published({
    title: "Custom REST API Integration — CommissionKit",
    description:
      "Connect a compatible ERP or CRM to CommissionKit using REST API authentication and configurable field mappings.",
    keywords:
      "custom commission integration, REST API commission tracking, custom commission software integration, JSONPath commission mapping",
    canonicalPath: "/integrations/custom",
  }),
  "/portal": published({
    title: "Sales Rep Portal — CommissionKit",
    description:
      "Give sales reps a secure portal for viewing commission earnings, deal breakdowns, and payout history.",
    keywords: "rep portal, sales rep portal, commission portal, rep commission tracking",
    canonicalPath: "/portal",
  }),
  "/careers": published({
    title: "Careers — CommissionKit",
    description: "Explore open positions at CommissionKit.",
    keywords: "CommissionKit careers, SaaS jobs, sales jobs, engineering jobs",
    canonicalPath: "/careers",
  }),
  "/calculators": preview({
    title: "Sales Commission Calculators — CommissionKit",
    description:
      "Preview collection of sales commission calculator guides for flat, tiered, accelerator, split, ARR, and MRR models.",
    keywords:
      "commission calculator, commission pay calculator, sales commission calculator, commission payout calculator",
    canonicalPath: "/calculators",
  }),
  "/calculators/tiered-commission": preview({
    title: "Tiered Commission Calculator — CommissionKit",
    description:
      "Preview explanation of tiered commission calculations with a worked example and a link to the CommissionKit calculator.",
    keywords:
      "tiered commission calculator, accelerator commission calculator, commission percentage calculator, commission rate calculator",
    canonicalPath: "/calculators/tiered-commission",
  }),
  "/templates": preview({
    title: "Sales Commission Plan Templates — CommissionKit",
    description:
      "Preview collection of sales commission plan and calculation templates. Editorial and legal review are required before publication.",
    keywords:
      "sales commission calculator template, sales commission plan template, sales compensation plan template",
    canonicalPath: "/templates",
  }),
  "/templates/sales-commission-plan": preview({
    title: "Sales Commission Plan Template — CommissionKit",
    description:
      "Preview sales commission plan template guidance covering plan elements, review questions, and implementation considerations.",
    keywords:
      "sales commission plan template, sales compensation plan template, sales commission policy template",
    canonicalPath: "/templates/sales-commission-plan",
  }),
  "/guides/sales-commission-structures": preview({
    title: "Sales Commission Structures Explained — CommissionKit",
    description:
      "Preview guide to common sales commission structures, including flat, tiered, and accelerator approaches, with planning considerations.",
    keywords:
      "sales commission structures, commission structures, sales commission plan, sales compensation plan",
    canonicalPath: "/guides/sales-commission-structures",
  }),
  "/guides/does-salesforce-calculate-commissions": preview({
    title: "Does Salesforce Calculate Commissions? — CommissionKit",
    description:
      "Preview guide to the commission-calculation workflow around Salesforce and CommissionKit. Pending Salesforce and product review before publication.",
    keywords:
      "does Salesforce calculate commissions, Salesforce commission calculator, Salesforce commission disputes",
    canonicalPath: "/guides/does-salesforce-calculate-commissions",
  }),
  "/guides/best-commission-management-software": preview({
    title: "How to Evaluate Commission Management Software — CommissionKit",
    description:
      "Preview buyer-guide framework for evaluating commission management software. Vendor comparisons require copy and legal approval before publication.",
    keywords:
      "best commission management software, best commission tracking software, commission software comparison",
    canonicalPath: "/guides/best-commission-management-software",
  }),
  "/glossary": preview({
    title: "Sales Commission Glossary — CommissionKit",
    description:
      "Preview glossary of sales commission and compensation terms. Definitions and examples require editorial review before publication.",
    keywords: "sales commission glossary, sales compensation glossary, commission terms",
    canonicalPath: "/glossary",
  }),
  "/glossary/ote": preview({
    title: "OTE Meaning in Sales — CommissionKit",
    description:
      "Preview definition of on-target earnings in a sales compensation plan, with a simple planning example.",
    keywords: "OTE meaning in sales, OTE calculator sales, on target earnings",
    canonicalPath: "/glossary/ote",
  }),
  "/finance/commissions-accounting": preview({
    title: "Sales Commission Accounting Considerations — CommissionKit",
    description:
      "Preview educational guide to commission-accounting controls, records, and review questions. It is not accounting, tax, or legal advice.",
    keywords:
      "ASC 606 commission accounting, IFRS 15 sales commissions, commission accounting integration",
    canonicalPath: "/finance/commissions-accounting",
  }),
  "/solutions/global-sales-commissions": preview({
    title: "Global Sales Commission Management — CommissionKit",
    description:
      "Preview overview of multi-currency sales commission operations and the questions global teams should evaluate.",
    keywords:
      "global commission management software, commission management software EU, commission management software Europe",
    canonicalPath: "/solutions/global-sales-commissions",
  }),
};

export const prerenderRoutes = Object.keys(seoRouteMeta);

export const indexableRoutes = Object.entries(seoRouteMeta)
  .filter(([, meta]) => meta.status === "published")
  .map(([route]) => route)
  .filter((route) => route !== "/home");

export function canonicalUrl(path: string): string {
  const route = seoRouteMeta[path];
  const canonicalPath = route?.canonicalPath ?? path;
  return canonicalPath === "/" ? `${SITE_URL}/` : `${SITE_URL}${canonicalPath}`;
}

export function getRobotsDirective(status: SeoRouteStatus): string {
  const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const isStaging = runtimeEnv?.VITE_STAGING === "true";
  if (isStaging || status === "preview") return "noindex, nofollow";
  return "index, follow, max-image-preview:large, max-snippet:-1";
}

export function getSeoRoute(path: string): SeoRouteMeta {
  const route = seoRouteMeta[path];
  if (route) return route;

  return {
    title: "CommissionKit",
    description: "CommissionKit application route.",
    keywords: "",
    canonicalPath: path,
    status: "preview",
  };
}

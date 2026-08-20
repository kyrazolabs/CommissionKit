import ReactDOMServer from "react-dom/server";
import { canonicalUrl, getRobotsDirective, getSeoRoute } from "./lib/seo";
import { CareersPage } from "./pages/careers";
import { CommissionCalculator } from "./pages/commission-calculator";
import { ContactPage } from "./pages/contact";
import { FeaturesPage } from "./pages/features";
import { IntegrationsHubPage } from "./pages/integrations";
import { CustomIntegrationPage } from "./pages/integrations/custom";
import { HubspotIntegrationPage } from "./pages/integrations/hubspot";
import { OdooIntegrationPage } from "./pages/integrations/odoo";
import { SalesforceIntegrationPage } from "./pages/integrations/salesforce";
import { LandingPage } from "./pages/landing";
import { PrivacyPage } from "./pages/legal/privacy";
import { SecurityPage } from "./pages/legal/security";
import { TermsPage } from "./pages/legal/terms";
import { PricingPage } from "./pages/pricing";
import { RepPortalLanding } from "./pages/rep-portal-landing";
import {
  CalculatorsHubPage,
  CommissionAccountingPage,
  CommissionSoftwareBuyerGuidePage,
  GlobalSalesCommissionsPage,
  GlossaryHubPage,
  OteGlossaryPage,
  SalesCommissionPlanTemplatePage,
  SalesCommissionStructuresPage,
  SalesforceCommissionAnswerPage,
  TemplatesHubPage,
  TieredCommissionCalculatorPage,
} from "./pages/resources/preview-pages";
import { SolutionsPage } from "./pages/solutions";

export function render(url?: string) {
  const path = url ?? "/";

  let element: React.ReactElement;
  if (path === "/calculator") {
    element = <CommissionCalculator />;
  } else if (path === "/calculators") {
    element = <CalculatorsHubPage />;
  } else if (path === "/calculators/tiered-commission") {
    element = <TieredCommissionCalculatorPage />;
  } else if (path === "/templates") {
    element = <TemplatesHubPage />;
  } else if (path === "/templates/sales-commission-plan") {
    element = <SalesCommissionPlanTemplatePage />;
  } else if (path === "/guides/sales-commission-structures") {
    element = <SalesCommissionStructuresPage />;
  } else if (path === "/guides/does-salesforce-calculate-commissions") {
    element = <SalesforceCommissionAnswerPage />;
  } else if (path === "/guides/best-commission-management-software") {
    element = <CommissionSoftwareBuyerGuidePage />;
  } else if (path === "/glossary") {
    element = <GlossaryHubPage />;
  } else if (path === "/glossary/ote") {
    element = <OteGlossaryPage />;
  } else if (path === "/finance/commissions-accounting") {
    element = <CommissionAccountingPage />;
  } else if (path === "/solutions/global-sales-commissions") {
    element = <GlobalSalesCommissionsPage />;
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
  } else if (path === "/integrations") {
    element = <IntegrationsHubPage />;
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
  } else if (path === "/careers") {
    element = <CareersPage />;
  } else {
    element = <LandingPage />;
  }

  const html = ReactDOMServer.renderToString(element);
  const route = getSeoRoute(path);
  const meta = {
    ...route,
    canonical: canonicalUrl(path),
    robots: getRobotsDirective(route.status),
  };

  console.info(`[SSR] render(${path}) → canonical: ${meta.canonical}`);
  return { html, meta };
}

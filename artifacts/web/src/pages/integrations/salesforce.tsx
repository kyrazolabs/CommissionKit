import {
  BadgeCheck,
  Cable,
  Calculator,
  Database,
  FileText,
  KeyRound,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { Analytics } from "@/lib/analytics";
import { IntegrationPage } from "./integration-page";

export function SalesforceIntegrationPage() {
  return (
    <IntegrationPage
      definition={{
        path: "/integrations/salesforce",
        name: "Salesforce",
        productType: "CRM",
        logoPath: "/plugins/salesforce.webp",
        answer:
          "Bring Salesforce users, opportunities, pipeline stages, and configured payment defaults into a CommissionKit workflow. Configure the source data and plan rules your team uses, then calculate and review commissions before payout.",
        implementationNote:
          "CommissionKit's Salesforce connector supports OAuth 2.0 Authorization Code authentication with PKCE, plus a documented manual client-credentials fallback through an External Client App. It syncs users as reps and opportunities as deals, supports pipeline-stage discovery and mapping, and documents configurable payment defaults because Salesforce does not directly track payments. Use the setup guide to confirm the current authentication and field configuration for your environment.",
        docsHref: "https://docs.commissionkit.co/integrations/salesforce",
        docsLabel: "Read the Salesforce setup guide",
        articleLinks: [
          {
            href: "/guides/does-salesforce-calculate-commissions",
            label: "Does Salesforce calculate commissions?",
          },
          { href: "/guides/sales-commission-structures", label: "Commission structures preview" },
          { href: "/calculator", label: "Commission calculator" },
          { href: "/features", label: "CommissionKit features" },
        ],
        features: [
          {
            title: "Users as reps",
            description:
              "The connector documentation maps Salesforce users into representatives for the commission workflow.",
            icon: Users,
          },
          {
            title: "Opportunities as deals",
            description:
              "The connector documentation maps Salesforce opportunities into deal records used in the commission workflow.",
            icon: FileText,
          },
          {
            title: "Stage discovery and mapping",
            description:
              "The documented connector can discover pipeline stages and supports stage mapping for the commission process.",
            icon: BadgeCheck,
          },
          {
            title: "Payment defaults",
            description:
              "Because Salesforce does not directly track payments, the documented workflow includes configurable payment defaults for closed-won opportunities.",
            icon: Database,
          },
          {
            title: "OAuth 2.0 connection",
            description:
              "Connect with OAuth 2.0 Authorization Code and PKCE, or use the documented External Client App client-credentials fallback when appropriate.",
            icon: KeyRound,
          },
          {
            title: "Scheduled synchronization",
            description:
              "CommissionKit documents scheduled connector syncs; confirm the cadence and operating controls that fit your process.",
            icon: RefreshCw,
          },
        ],
        steps: [
          {
            title: "Connect",
            Icon: Cable,
            description:
              "Connect with OAuth 2.0 or configure the documented External Client App client-credentials fallback, then confirm the Salesforce instance URL.",
          },
          {
            title: "Configure",
            Icon: Settings,
            description:
              "Review users, opportunity stage behavior, payment defaults, and the data included in the workflow.",
          },
          {
            title: "Sync",
            Icon: RefreshCw,
            description:
              "Run the documented sync process and confirm that the expected reps and opportunities are present.",
          },
          {
            title: "Calculate and review",
            Icon: Calculator,
            description:
              "Configure the written plan, run calculations, and review results before payout approval.",
          },
        ],
        faqs: [
          {
            question: "How does Salesforce authentication work?",
            answer:
              "CommissionKit supports OAuth 2.0 Authorization Code authentication with PKCE and documents a manual External Client App client-credentials fallback. Confirm the current setup steps, scopes, and instance URL in the linked guide.",
          },
          {
            question: "Which Salesforce records are used in the workflow?",
            answer:
              "The documented connector maps Salesforce users as reps and opportunities as deals. Review the setup guide for the current field and mapping details.",
          },
          {
            question: "How are pipeline stages handled?",
            answer:
              "The connector documentation describes pipeline-stage discovery and mapping. Confirm the stages used in your own commission process during configuration.",
          },
          {
            question: "Does Salesforce provide payment status?",
            answer:
              "Salesforce does not directly track payments. CommissionKit documents configurable payment defaults for closed-won opportunities.",
          },
          {
            question: "Can the integration replace a written commission plan?",
            answer:
              "No. The connector provides source data for the workflow. The written plan still needs to define eligibility, crediting, calculation rules, review, and approval.",
          },
          {
            question: "Where can I find implementation instructions?",
            answer:
              "Use the linked Salesforce setup guide for current OAuth, client-credentials fallback, stage-mapping, payment-default, and troubleshooting instructions.",
          },
        ],
        onTrialClick: (placement) =>
          Analytics.integrationSalesforceTrialClick(placement === "hero" ? "hero" : "bottom"),
      }}
    />
  );
}

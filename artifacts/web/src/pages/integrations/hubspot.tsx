import { BadgeCheck, Database, FileText, KeyRound, RefreshCw, Users } from "lucide-react";
import { Analytics } from "@/lib/analytics";
import { IntegrationPage } from "./integration-page";

export function HubspotIntegrationPage() {
  return (
    <IntegrationPage
      definition={{
        path: "/integrations/hubspot",
        name: "HubSpot",
        productType: "CRM",
        logoPath: "/plugins/hubspot.webp",
        answer:
          "CommissionKit connects to HubSpot so teams can use documented owner, deal, pipeline-stage, and payment-default information in a commission workflow. Configure the plan and source-data rules before using calculation results for payout decisions.",
        implementationNote:
          "The HubSpot connector documentation describes owners as reps and deals as commission workflow records, with pipeline-stage discovery and mapping. HubSpot is a CRM and does not directly track payments, so CommissionKit documents a configurable default payment status for closed-won deals. The connector uses token-based authentication with a Service Key or Legacy App access token; use the setup guide to confirm the currently required scopes and configuration.",
        docsHref: "https://docs.commissionkit.co/integrations/hubspot",
        docsLabel: "Read the HubSpot setup guide",
        articleLinks: [
          { href: "/blog/en/hubspot-integration", label: "HubSpot integration article" },
          {
            href: "/guides/does-salesforce-calculate-commissions",
            label: "Salesforce answer preview",
          },
          { href: "/calculator", label: "Commission calculator" },
          { href: "/features", label: "CommissionKit features" },
        ],
        features: [
          {
            title: "Owners as reps",
            description:
              "The connector documentation maps HubSpot owners into representatives for the commission workflow.",
            icon: Users,
          },
          {
            title: "Deals and pipeline stages",
            description:
              "HubSpot deals and their pipeline-stage information can be mapped into the commission process described in the setup guide.",
            icon: FileText,
          },
          {
            title: "Stage discovery and mapping",
            description:
              "The documented setup includes pipeline-stage discovery and configuration for the stages used in a commission workflow.",
            icon: BadgeCheck,
          },
          {
            title: "Payment defaults",
            description:
              "Because HubSpot does not directly track payments, the documented workflow uses a configurable default payment status for closed-won deals.",
            icon: Database,
          },
          {
            title: "Token-based authentication",
            description:
              "The product documentation describes Service Key and Legacy App access-token setup options.",
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
            description:
              "Create a Service Key or Legacy App access token, then confirm the required HubSpot scopes.",
          },
          {
            title: "Configure",
            description:
              "Review owners, pipeline-stage behavior, payment defaults, and the data included in the workflow.",
          },
          {
            title: "Sync",
            description:
              "Run the documented sync process and confirm that the expected reps and deals are present.",
          },
          {
            title: "Calculate and review",
            description:
              "Configure the written plan, run calculations, and review results before payout approval.",
          },
        ],
        faqs: [
          {
            question: "How does HubSpot authentication work?",
            answer:
              "CommissionKit documents token-based authentication using a Service Key or Legacy App access token. Confirm the current scopes and setup steps in the linked guide.",
          },
          {
            question: "Which HubSpot records are used in the workflow?",
            answer:
              "The documented connector maps HubSpot owners as reps and uses deals and pipeline-stage information in the commission workflow.",
          },
          {
            question: "How are pipeline stages handled?",
            answer:
              "The setup documentation describes pipeline-stage discovery and mapping. Confirm the stages used in your own commission process during configuration.",
          },
          {
            question: "Does HubSpot provide payment status?",
            answer:
              "HubSpot is a CRM and does not directly track payments. CommissionKit documents a configurable default payment status for closed-won deals.",
          },
          {
            question: "Can the integration replace a written commission plan?",
            answer:
              "No. The connector provides source data for the workflow. The written plan still needs to define eligibility, crediting, calculation rules, review, and approval.",
          },
          {
            question: "Where can I find implementation instructions?",
            answer:
              "Use the linked HubSpot setup guide for current Service Key or Legacy App authentication, scopes, stage mapping, payment-default, and troubleshooting instructions.",
          },
        ],
        onTrialClick: (placement) =>
          Analytics.integrationHubspotTrialClick(placement === "hero" ? "hero" : "bottom"),
      }}
    />
  );
}

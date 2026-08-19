import { Database, FileCheck2, FileText, RefreshCw, Users, WalletCards } from "lucide-react";
import { Analytics } from "@/lib/analytics";
import { IntegrationPage } from "./integration-page";

export function OdooIntegrationPage() {
  return (
    <IntegrationPage
      definition={{
        path: "/integrations/odoo",
        name: "Odoo",
        productType: "ERP",
        logoPath: "/plugins/odoo.webp",
        answer:
          "CommissionKit connects to Odoo so teams can use documented Odoo users, sales orders, and invoice-payment information in a commission workflow. Configure the source-data and plan rules before using calculation results for payout decisions.",
        implementationNote:
          "The Odoo connector documentation describes Odoo Community and Enterprise support for version 15 and above. It syncs users as reps and sales orders as deals. Payment status is derived from invoice payment information rather than the sales order's invoice-status field, so teams should review their Odoo data and mapping configuration before calculating commissions.",
        docsHref: "https://docs.commissionkit.co/integrations/odoo",
        docsLabel: "Read the Odoo setup guide",
        articleLinks: [
          {
            href: "/blog/en/odoo-commission-tracking-gap",
            label: "Odoo commission-tracking guide",
          },
          { href: "/blog/en/odoo-commission-options-compared", label: "Odoo options guide" },
          { href: "/blog/en/odoo-commission-automation", label: "Odoo automation guide" },
          { href: "/calculator", label: "Commission calculator" },
        ],
        features: [
          {
            title: "Users as reps",
            description:
              "The connector documents an Odoo user-to-representative sync for the commission workflow.",
            icon: Users,
          },
          {
            title: "Sales orders as deals",
            description:
              "The connector documents a sales-order sync so configured source data can be used in CommissionKit calculations.",
            icon: FileText,
          },
          {
            title: "Invoice-based payment status",
            description:
              "Payment status is derived from invoice payment states instead of relying on a sales order's invoice-status field.",
            icon: WalletCards,
          },
          {
            title: "Configurable workflow",
            description:
              "Review the setup guide to configure mappings, payment defaults, and the sync workflow for your Odoo environment.",
            icon: FileCheck2,
          },
          {
            title: "Scheduled synchronization",
            description:
              "CommissionKit documents scheduled connector syncs; choose and verify the appropriate cadence for the operating process.",
            icon: RefreshCw,
          },
          {
            title: "Odoo data model context",
            description:
              "The setup documentation explains how Odoo users, sales orders, and invoice information are handled in the connector flow.",
            icon: Database,
          },
        ],
        steps: [
          {
            title: "Connect",
            description:
              "Provide the Odoo connection details required by the documented setup flow.",
          },
          {
            title: "Configure",
            description:
              "Review source fields, stage behavior, payment defaults, and the users included in the workflow.",
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
            question: "Which Odoo editions and versions are documented?",
            answer:
              "CommissionKit's Odoo setup documentation states support for Odoo Community and Enterprise editions, version 15 and above.",
          },
          {
            question: "Which Odoo records are used in the workflow?",
            answer:
              "The documented connector maps Odoo users into representatives and sales orders into deals. Review the setup guide for the current field and mapping details.",
          },
          {
            question: "How is payment status determined?",
            answer:
              "The Odoo documentation states that payment status is determined from invoice payment states rather than the sales order's invoice-status field.",
          },
          {
            question: "Can the integration replace a written commission plan?",
            answer:
              "No. The connector provides source data for the workflow. The written plan still needs to define eligibility, crediting, calculation rules, review, and approval.",
          },
          {
            question: "Where can I find implementation instructions?",
            answer:
              "Use the linked Odoo setup guide for current connection, mapping, payment-default, and troubleshooting instructions.",
          },
          {
            question: "How should teams validate a new workflow?",
            answer:
              "Confirm that the expected source records, mappings, plan settings, and review process are in place before relying on calculation results for payout decisions.",
          },
        ],
        onTrialClick: (placement) =>
          Analytics.integrationOdooTrialClick(placement === "hero" ? "hero" : "bottom"),
      }}
    />
  );
}

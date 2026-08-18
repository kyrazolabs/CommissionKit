import { List, Scale } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Footer } from "../landing/Footer";
import { Navbar } from "../landing/Navbar";

type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const SECTIONS: LegalSection[] = [
  {
    id: "agreement-and-acceptance",
    title: "Agreement and Acceptance",
    paragraphs: [
      "These Terms of Service (\"Terms\") are a binding agreement between you and KYRAZO LLC (\"CommissionKit,\" \"we,\" \"us,\" or \"our\"). By accessing or using the Service, you agree to be bound by these Terms. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.",
    ],
  },
  {
    id: "definitions",
    title: "Definitions",
    paragraphs: ["The following terms have the meanings set out below:"],
    bullets: [
      "\"Service\" means the CommissionKit commission management platform and all related features, including commission plans, deals, runs, payouts, disputes, the rep portal, and integrations.",
      "\"Customer\" means the individual or organization that subscribes to the Service.",
      "\"Customer Data\" means the data you and your users submit to the Service, including commission, rep, deal, and payout records.",
      "\"User\" means an individual authorized to access the Service under a Customer's account.",
      "\"Order\" means the subscription plan and any add-ons you purchase.",
    ],
  },
  {
    id: "the-service",
    title: "The Service",
    paragraphs: [
      "CommissionKit is a commission management platform for sales teams. The Service lets you model commission plans, import and manage deals, run commission calculations, generate payouts, manage disputes, and give reps a self-service portal. It also includes optional connectors to HubSpot, Salesforce, Odoo, and a custom REST connector.",
    ],
  },
  {
    id: "accounts-and-registration",
    title: "Accounts and Registration",
    paragraphs: [
      "You must provide accurate and complete information when creating an account and keep it up to date. You are responsible for keeping your credentials secure and for all activity that occurs under your account. Each user must use their own account; sharing credentials is not permitted. Notify us immediately if you believe your account has been compromised.",
    ],
  },
  {
    id: "subscriptions-and-plans",
    title: "Subscriptions and Plans",
    paragraphs: [
      "The Service is offered in tiers: Free/Trial, Starter, Growth, and Pro. Each tier includes limits on the number of reps and workspace members, as described on our pricing page at the time of purchase. You can add extra reps for an additional fee on top of your base plan. We enforce these limits within the Service.",
    ],
  },
  {
    id: "fees-billing-and-payment",
    title: "Fees, Billing, and Payment",
    paragraphs: [
      "Fees are charged through Stripe, our payment processor. You agree to pay the fees shown at the time of purchase, plus any applicable taxes. Subscriptions renew automatically on a recurring basis until you cancel. Stripe's processing of your payment is subject to Stripe's own terms.",
    ],
  },
  {
    id: "free-trial",
    title: "Free Trial",
    paragraphs: [
      "New workspaces may be eligible for a 14-day free trial. The trial is available once per workspace. At the end of the trial, your workspace converts to a paid plan unless you cancel before the trial ends.",
    ],
  },
  {
    id: "cancellation-and-refunds",
    title: "Cancellation and Refunds",
    paragraphs: [
      "You can cancel your subscription at any time from your account settings. After cancellation, you keep access to the Service until the end of the current billing period. Refunds are provided at our discretion and as required by applicable law.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    paragraphs: ["You may not:"],
    bullets: [
      "Use the Service for any illegal or unauthorized purpose.",
      "Reverse engineer, decompile, or attempt to extract the source code of the Service.",
      "Resell, sublicense, or provide the Service to third parties without our permission.",
      "Exceed the limits of your subscription plan.",
      "Scrape or otherwise extract data from the Service through automated means not offered as part of the Service.",
      "Misuse connected integrations or access third-party systems through the Service without authorization.",
      "Upload malware, malicious code, or content that violates the rights of others.",
    ],
  },
  {
    id: "customer-data",
    title: "Customer Data and Data Processing",
    paragraphs: [
      "You retain ownership of your Customer Data. We process Customer Data only to provide the Service, as described in our Privacy Policy. Where required, a Data Processing Addendum is available on request. We handle personal data in accordance with applicable data protection law, including GDPR and CCPA, as described in our Privacy Policy.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-Party Services and Integrations",
    paragraphs: [
      "Connectors to HubSpot, Salesforce, and Odoo are optional. Third-party services are governed by their own terms and privacy policies. We are not responsible for the availability, performance, or practices of third-party services, and we are not liable for any loss arising from their use.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "The Service and its software, documentation, and design remain our property, and nothing in these Terms transfers ownership to you. You retain all rights to your Customer Data. You grant us a limited, non-exclusive license to host, process, and store Customer Data as needed to provide the Service. Any feedback you provide may be used to improve the Service.",
    ],
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    paragraphs: [
      "Each party agrees to protect the confidential information of the other party using reasonable care. Confidential information does not include information that is public, independently developed, or rightfully received from a third party.",
    ],
  },
  {
    id: "disclaimers-and-warranties",
    title: "Disclaimers and Warranties",
    paragraphs: [
      "The Service is provided on an \"as is\" and \"as available\" basis. To the maximum extent permitted by law, we disclaim all implied warranties, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the Service will be uninterrupted or error-free.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, our total liability arising out of or relating to these Terms or the Service is limited to the fees you paid us in the 12 months preceding the claim. We are not liable for indirect, incidental, special, or consequential damages, including lost profits, lost data, or business interruption.",
    ],
  },
  {
    id: "indemnification",
    title: "Indemnification",
    paragraphs: [
      "You agree to indemnify and hold harmless KYRAZO LLC and its officers, employees, and agents from any claims, damages, or expenses arising from your use of the Service, your Customer Data, or your breach of these Terms.",
    ],
  },
  {
    id: "term-and-termination",
    title: "Term and Termination",
    paragraphs: [
      "These Terms apply for as long as you use the Service. We may suspend or terminate your access if you materially breach these Terms and do not cure the breach after notice. On termination, your Customer Data may be deleted in accordance with our retention policy.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law and Dispute Resolution",
    paragraphs: [
      "These Terms are governed by the laws of the State of Montana, USA, without regard to its conflict of laws rules. Before bringing any formal action, each party agrees to attempt to resolve the dispute through good-faith negotiation.",
    ],
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice on this page. Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      "If you have questions about these Terms, contact us at support@commissionkit.co.",
    ],
  },
];

export function TermsPage() {
  usePageMeta({
    title: "Terms of Service",
    description: "CommissionKit (KYRAZO LLC) terms of service for the commission management platform.",
    robots: "index, follow",
  });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-card-border text-xs font-medium text-muted-foreground mb-6">
              <Scale className="size-3.5 text-primary" />
              Legal
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground mt-3">
              The terms that govern your use of the CommissionKit commission management platform.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Effective date: August 17, 2026</p>
          </header>

          <nav
            aria-label="On this page"
            className="mb-12 rounded-xl border border-card-border bg-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <List className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">On this page</h2>
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {SECTIONS.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span className="text-primary tabular-nums">{i + 1}.</span> {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10">
            {SECTIONS.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {i + 1}. {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="space-y-2 mb-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
                      >
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

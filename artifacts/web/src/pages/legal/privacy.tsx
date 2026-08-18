import { List, Shield } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Footer } from "../landing/Footer";
import { Navbar } from "../landing/Navbar";

type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  closing?: string;
};

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who We Are",
    paragraphs: [
      "CommissionKit is a commission management platform operated by KYRAZO LLC, a company registered in the United States of America. Throughout this policy, \"CommissionKit,\" \"we,\" \"us,\" and \"our\" refer to KYRAZO LLC.",
      "KYRAZO LLC acts as the data controller for the personal information collected and processed through the Service. If you have questions about this policy or how we handle your data, contact us at privacy@commissionkit.co.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    paragraphs: [
      "We collect the information described below when you create an account, use the Service, or otherwise interact with us.",
    ],
    bullets: [
      "Account information: your name, email address, company name, role, and a hashed password. Passwords are never stored in plain text.",
      "Commission data: the sales representatives, commission plans and tiers, deals, commission runs and results, payouts, and disputes that you or your workspace enter into the Service.",
      "Integration data: data synced from third-party services you connect, such as HubSpot, Salesforce, or Odoo, limited to the permissions you grant during the connection flow.",
      "Billing information: payment details processed by Stripe. We do not store full card numbers on our own systems.",
      "Usage and technical data: IP address, browser type, device information, and server logs used to operate and secure the Service.",
      "Communications: support tickets, emails, and other messages you send to us.",
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    paragraphs: ["We use the information we collect to operate, maintain, and improve the Service."],
    bullets: [
      "Provide and operate the Service, including running commission calculations and generating payouts.",
      "Sync data from connected integrations such as HubSpot, Salesforce, and Odoo.",
      "Process payments and manage your subscription.",
      "Provide customer support and respond to your requests.",
      "Send transactional emails such as run completions, payout updates, and billing notices.",
      "Improve and secure the Service, including monitoring for misuse and errors.",
      "Comply with legal obligations and enforce our Terms of Service.",
    ],
  },
  {
    id: "legal-bases",
    title: "Legal Bases for Processing (GDPR)",
    paragraphs: [
      "Where the General Data Protection Regulation (GDPR) applies, we rely on the following legal bases to process personal information:",
    ],
    bullets: [
      "Performance of a contract: to provide the Service you signed up for.",
      "Legitimate interests: to improve, secure, and operate the Service in a way that does not override your rights.",
      "Consent: where you have given consent for a specific purpose, which you can withdraw at any time.",
      "Legal obligation: to comply with applicable law.",
    ],
  },
  {
    id: "how-we-share",
    title: "How We Share Your Information",
    paragraphs: [
      "We do not sell or rent personal information to third parties. We share information only as described below.",
    ],
    bullets: [
      "Subprocessors: we share data with service providers that help us operate the Service, including Hetzner (infrastructure hosting), Stripe (payments), Spacemail by Spaceship (transactional email), S3-compatible object storage (logs), and Sentry (error monitoring). Our database (MongoDB) and job queue (Redis) are self-hosted and are not shared with third parties.",
      "Connected integrations: when you connect a third-party service such as HubSpot, Salesforce, or Odoo, we exchange data with that service through its API as needed to sync your records.",
      "Legal disclosure: we may disclose information when required by law, regulation, or a valid legal request.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-Party Services and Integrations",
    paragraphs: [
      "Connecting third-party services such as HubSpot, Salesforce, or Odoo to CommissionKit is entirely optional. When you connect an integration, we access and process data through their APIs based on the permissions you grant during the connection flow.",
      "Third-party services are governed by their own privacy policies and terms. We are not responsible for the privacy practices of those services, and we encourage you to review their policies before connecting them.",
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    paragraphs: [
      "We retain your information for as long as your account is active and as needed to provide the Service.",
      "After you close your account or request deletion, we delete your data within 30 days, except where we are required by law or a legitimate business need, such as fraud prevention or dispute resolution, to retain it for longer.",
      "Audit log events are retained on a defined retention schedule and then archived or deleted.",
    ],
  },
  {
    id: "international-transfers",
    title: "International Data Transfers",
    paragraphs: [
      "CommissionKit stores data on managed cloud infrastructure. This means your information may be transferred to and processed in countries outside your own.",
      "Where we transfer personal information to subprocessors in other jurisdictions, we rely on appropriate safeguards such as standard contractual clauses where applicable.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Privacy Rights",
    paragraphs: ["Depending on where you live, you may have the right to:"],
    bullets: [
      "Access the personal information we hold about you.",
      "Correct inaccurate information.",
      "Delete your information.",
      "Receive a copy of your information in a portable format.",
      "Restrict or object to certain processing.",
      "Withdraw consent where processing is based on consent.",
    ],
    closing:
      "If you are a California resident, the California Consumer Privacy Act (CCPA) grants you similar rights. We do not sell personal information as defined by the CCPA. To exercise any of these rights, contact us at privacy@commissionkit.co.",
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "We use reasonable technical and organizational measures to protect your information, including encryption in transit (TLS 1.3), encryption at rest where supported by our infrastructure, and role-based access controls. No method of transmission or storage is completely secure, but we work to protect your data appropriately. For details, see our Security page at /security.",
    ],
  },
  {
    id: "cookies-analytics",
    title: "Cookies and Analytics",
    paragraphs: [
      "We use essential cookies that are required for the Service to function, such as keeping you signed in. We use privacy-respecting analytics to understand how the Service is used in aggregate. We do not use third-party advertising trackers.",
    ],
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    paragraphs: [
      "The Service is not directed at individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, contact us so we can remove it.",
    ],
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this policy from time to time. When we make material changes, we will notify you by email or by posting a notice on this page. The effective date at the top of this page reflects the most recent update.",
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    paragraphs: [
      "If you have questions about this policy or wish to exercise your rights, contact us at privacy@commissionkit.co.",
    ],
  },
];

export function PrivacyPage() {
  usePageMeta({
    title: "Privacy Policy",
    description: "CommissionKit (KYRAZO LLC) privacy policy — how we collect, use, and protect your data.",
    robots: "index, follow",
  });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-card-border text-xs font-medium text-muted-foreground mb-6">
              <Shield className="size-3.5 text-primary" />
              Legal
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground mt-3">
              How KYRAZO LLC (CommissionKit) collects, uses, and protects your personal information.
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
                {section.closing && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {section.closing}
                  </p>
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

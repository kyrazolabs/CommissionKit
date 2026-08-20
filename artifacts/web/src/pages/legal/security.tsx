import { Shield } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Footer } from "../landing/Footer";
import { Navbar } from "../landing/Navbar";

type SecuritySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  subprocessors?: { name: string; purpose: string }[];
};

const SECTIONS: SecuritySection[] = [
  {
    id: "overview",
    title: "Security Overview",
    paragraphs: [
      "CommissionKit protects your commission and team data using encryption, access controls, and data isolation. This page describes the security controls we apply and the providers we rely on to deliver the Service.",
    ],
  },
  {
    id: "encryption",
    title: "Encryption",
    paragraphs: [
      "All data is encrypted in transit using TLS 1.3. We apply encryption at rest for stored data where supported by our self-hosted infrastructure.",
    ],
  },
  {
    id: "infrastructure-and-hosting",
    title: "Infrastructure and Hosting",
    paragraphs: [
      "CommissionKit runs on self-hosted infrastructure at Hetzner. Our application, database (MongoDB), and job queue (Redis) are self-hosted alongside the platform. Hetzner operates certified data centers (ISO 27001); these certifications belong to Hetzner, not to CommissionKit itself.",
    ],
  },
  {
    id: "data-isolation",
    title: "Data Isolation",
    paragraphs: [
      "The Service uses a multi-tenant architecture with strict workspace scoping. Every request resolves the workspace context before data is read or written, so one workspace cannot access another workspace's data.",
    ],
  },
  {
    id: "authentication",
    title: "Authentication and Access Control",
    paragraphs: ["Access to the Service is controlled through the following mechanisms:"],
    bullets: [
      "Session authentication through Better Auth, supporting email and Google OAuth sign-in.",
      "Role-based access control with owner, admin, and member roles, plus custom roles that grant resource:action permissions.",
      "A JWT-based rep portal that is separate from admin credentials, so reps never hold corporate account access.",
      "Workspace-scoped API keys stored as SHA-256 hashes; the plaintext key is shown only once at creation.",
      "MCP tools are guarded by per-tool permissions, so an API key can only perform the actions it is granted.",
    ],
  },
  {
    id: "subprocessors",
    title: "Subprocessors",
    paragraphs: [
      "We use the following subprocessors to provide the Service. Our database (MongoDB) and job queue (Redis) are self-hosted and are not shared with third parties.",
    ],
    subprocessors: [
      { name: "Hetzner", purpose: "Infrastructure hosting" },
      { name: "Stripe", purpose: "Payment processing" },
      { name: "Spacemail (Spaceship)", purpose: "Transactional email" },
      { name: "S3-compatible object storage", purpose: "Log storage" },
      { name: "Sentry", purpose: "Error monitoring" },
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention and Deletion",
    paragraphs: [
      "Customer data is retained while the workspace is active and deleted after account closure. Audit log events are retained on a defined retention schedule and then archived or deleted. For details, see our Privacy Policy.",
    ],
  },
  {
    id: "backups-and-availability",
    title: "Backups and Availability",
    paragraphs: [
      "We take automated database backups to protect against data loss. We monitor service availability and respond to outages through alerting and incident response procedures.",
    ],
  },
  {
    id: "incident-response",
    title: "Incident Response",
    paragraphs: [
      "We maintain monitoring and alerting for security and availability events. If we confirm a breach that affects your data, we will notify affected customers in accordance with applicable law.",
    ],
  },
  {
    id: "responsible-disclosure",
    title: "Responsible Disclosure",
    paragraphs: [
      "If you find a security vulnerability, report it to security@commissionkit.co. We will respond promptly and, where appropriate, credit the researcher. Please do not exploit the vulnerability or access data beyond what is needed to demonstrate it.",
    ],
  },
  {
    id: "compliance",
    title: "Compliance",
    paragraphs: [
      "We apply security practices aligned with SOC 2 and GDPR requirements. ISO 27001 certification is held by our hosting provider, Hetzner, not by CommissionKit. Contact us at security@commissionkit.co for more information.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      "For security questions or to report a vulnerability, contact security@commissionkit.co.",
    ],
  },
];

export function SecurityPage() {
  usePageMeta({
    title: "Security",
    description: "CommissionKit security practices, subprocessors, and data protection controls.",
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
              Security
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Security</h1>
            <p className="text-muted-foreground mt-3">
              The security controls and subprocessors behind CommissionKit.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Effective date: August 17, 2026</p>
          </header>

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
                {section.subprocessors && (
                  <ul className="rounded-xl border border-card-border bg-card overflow-hidden mb-3">
                    {section.subprocessors.map((subprocessor) => (
                      <li
                        key={subprocessor.name}
                        className="flex items-center justify-between px-4 py-3 border-b border-card-border last:border-0"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {subprocessor.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {subprocessor.purpose}
                        </span>
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

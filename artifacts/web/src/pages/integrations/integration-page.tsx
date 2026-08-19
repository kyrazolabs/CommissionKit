import { ArrowRight, BookOpenCheck, Cable, CheckCircle2, type LucideIcon } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";
import { canonicalUrl, getSeoRoute, SITE_URL } from "@/lib/seo";
import { Footer } from "@/pages/landing/Footer";
import { Navbar } from "@/pages/landing/Navbar";

interface IntegrationFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface IntegrationStep {
  title: string;
  description: string;
}

interface IntegrationFaq {
  question: string;
  answer: string;
}

export interface IntegrationPageDefinition {
  path: "/integrations/odoo" | "/integrations/hubspot" | "/integrations/salesforce";
  name: string;
  productType: "CRM" | "ERP";
  logoPath: string;
  answer: string;
  implementationNote: string;
  docsHref: string;
  docsLabel: string;
  articleLinks: Array<{ href: string; label: string }>;
  features: IntegrationFeature[];
  steps: IntegrationStep[];
  faqs: IntegrationFaq[];
  onTrialClick: (placement: "hero" | "footer") => void;
}

function integrationSchema(definition: IntegrationPageDefinition) {
  const route = getSeoRoute(definition.path);
  const pageUrl = canonicalUrl(definition.path);

  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `CommissionKit ${definition.name} integration`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: route.description,
      url: pageUrl,
      applicationSubCategory: `${definition.productType} commission workflow`,
      publisher: {
        "@type": "Organization",
        name: "CommissionKit",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-full.svg` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "CommissionKit", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Integrations",
          item: `${SITE_URL}/integrations`,
        },
        { "@type": "ListItem", position: 3, name: definition.name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: definition.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];
}

export function IntegrationPage({ definition }: { definition: IntegrationPageDefinition }) {
  const route = getSeoRoute(definition.path);
  usePageMeta({ title: route.title, description: route.description, keywords: route.keywords });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="border-b border-card-border bg-muted/30 px-4 py-20 md:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Cable className="size-3.5" />
              {definition.name} {definition.productType} integration
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {definition.name} commission tracking with CommissionKit
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-foreground">
              {definition.answer}
            </p>
            <div className="mx-auto mt-8 flex w-fit items-center gap-5 rounded-2xl border border-card-border bg-card px-7 py-5">
              <div className="flex flex-col items-center gap-2">
                <img
                  src={definition.logoPath}
                  alt={definition.name}
                  className="size-12 object-contain"
                />
                <span className="text-xs font-medium text-muted-foreground">{definition.name}</span>
              </div>
              <Cable className="size-6 text-primary" aria-hidden="true" />
              <div className="flex flex-col items-center gap-2">
                <img src="/brand/logo-symbol.svg" alt="CommissionKit" className="size-12" />
                <span className="text-xs font-medium text-muted-foreground">CommissionKit</span>
              </div>
            </div>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <a href="/register" onClick={() => definition.onTrialClick("hero")}>
                  Start free trial
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={definition.docsHref} target="_blank" rel="noreferrer">
                  {definition.docsLabel}
                  <BookOpenCheck className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                What this integration supports
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                The capabilities below are based on CommissionKit's current connector and setup
                documentation. Confirm the mappings in your environment before using a workflow for
                payment decisions.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {definition.features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="rounded-xl border border-card-border bg-card p-6"
                  >
                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-card-border bg-muted/30 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                A reviewable setup path
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Use the detailed setup guide for the connector-specific configuration. This page
                describes the workflow at a high level.
              </p>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-2xl border border-card-border bg-card md:grid-cols-4">
              {definition.steps.map((step, index) => (
                <li key={step.title} className="p-7">
                  <span className="text-sm font-bold tabular-nums text-primary">0{index + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Implementation considerations
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {definition.implementationNote}
              </p>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                CommissionKit's calculation and payout workflow should be configured against a
                reviewed plan. Validate source data, mappings, eligibility, approval steps, and any
                change or exception process before relying on results.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {definition.articleLinks.map((article) => (
                  <Button key={article.href} asChild variant="outline" size="sm">
                    <a href={article.href}>{article.label}</a>
                  </Button>
                ))}
              </div>
            </div>
            <aside className="rounded-xl border border-card-border bg-card p-6">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Read the setup documentation
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The documentation contains the current setup, authentication, mapping, and
                troubleshooting information for this connector.
              </p>
              <Button asChild className="mt-6 w-full justify-between">
                <a href={definition.docsHref} target="_blank" rel="noreferrer">
                  {definition.docsLabel}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </aside>
          </div>
        </section>

        <section className="border-y border-card-border bg-muted/30 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <Accordion
              type="single"
              collapsible
              className="mt-8 rounded-xl border border-card-border bg-card px-5"
            >
              {definition.faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-4 py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <CheckCircle2 className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
              Review your commission workflow with the right source data
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Start a trial to configure your plan and data workflow, or read the connector guide
              before connecting an account.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <a href="/register" onClick={() => definition.onTrialClick("footer")}>
                  Start free trial
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/integrations">Explore integrations</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <JsonLd data={integrationSchema(definition)} />
      <Footer />
    </>
  );
}

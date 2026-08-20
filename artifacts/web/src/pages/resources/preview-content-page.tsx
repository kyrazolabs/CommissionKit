import { ArrowRight, BookOpenCheck, ChevronRight, FileWarning, ListChecks } from "lucide-react";
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

export interface PreviewLink {
  href: string;
  label: string;
  description: string;
}

export interface PreviewSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface PreviewFaq {
  question: string;
  answer: string;
}

export interface PreviewContentDefinition {
  path: string;
  eyebrow: string;
  title: string;
  answer: string;
  description: string;
  schemaType: "Article" | "CollectionPage" | "DefinedTerm" | "WebPage";
  parent?: PreviewLink;
  sections: PreviewSection[];
  related: PreviewLink[];
  faqs?: PreviewFaq[];
  disclaimer?: string;
}

function buildStructuredData(definition: PreviewContentDefinition) {
  const url = canonicalUrl(definition.path);
  const base = {
    "@context": "https://schema.org",
    "@type": definition.schemaType,
    name: definition.title,
    headline: definition.title,
    description: definition.description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "CommissionKit",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "CommissionKit",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/logo-full.svg`,
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "CommissionKit", item: SITE_URL },
        ...(definition.parent
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: definition.parent.label,
                item: `${SITE_URL}${definition.parent.href}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: definition.parent ? 3 : 2,
          name: definition.title,
          item: url,
        },
      ],
    },
  };

  const schemas: Record<string, unknown>[] = [base];

  if (definition.schemaType === "CollectionPage") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${definition.title} preview pages`,
      itemListElement: definition.related.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        url: `${SITE_URL}${item.href}`,
      })),
    });
  }

  if (definition.schemaType === "DefinedTerm") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: definition.title.replace(" — CommissionKit", ""),
      description: definition.answer,
      url,
      inDefinedTermSet: `${SITE_URL}/glossary`,
    });
  }

  if (definition.faqs?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: definition.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return schemas;
}

export function PreviewContentPage({ definition }: { definition: PreviewContentDefinition }) {
  const route = getSeoRoute(definition.path);
  usePageMeta({
    title: route.title,
    description: route.description,
    keywords: route.keywords,
  });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="border-b border-card-border bg-muted/30 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
            >
              <a href="/" className="hover:text-primary">
                CommissionKit
              </a>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              {definition.parent && (
                <>
                  <a href={definition.parent.href} className="hover:text-primary">
                    {definition.parent.label}
                  </a>
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </>
              )}
              <span aria-current="page" className="text-foreground">
                {definition.title}
              </span>
            </nav>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <FileWarning className="size-3.5" />
              Editorial preview — not indexed or published
            </div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
              {definition.eyebrow}
            </p>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {definition.title}
            </h1>
            <p className="max-w-3xl text-xl leading-relaxed text-foreground">{definition.answer}</p>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">
              {definition.description}
            </p>
            {definition.disclaimer && (
              <p className="mt-6 rounded-lg border border-card-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Review note: </span>
                {definition.disclaimer}
              </p>
            )}
          </div>
        </section>

        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-12">
              {definition.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
                    {section.heading}
                  </h2>
                  <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 space-y-3 rounded-xl border border-card-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <ListChecks
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              {definition.faqs?.length ? (
                <section>
                  <h2 className="mb-5 text-2xl font-bold tracking-tight text-foreground">
                    Preview questions and answers
                  </h2>
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full rounded-xl border border-card-border bg-card px-5"
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
                </section>
              ) : null}
            </div>

            <aside className="h-fit rounded-xl border border-card-border bg-card p-5 lg:sticky lg:top-24">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpenCheck className="size-4 text-primary" />
                Related preview routes
              </div>
              <div className="space-y-4">
                {definition.related.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                      {item.label}
                      <ArrowRight className="size-3.5 shrink-0 text-primary" />
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </span>
                  </a>
                ))}
              </div>
              <Button asChild variant="outline" className="mt-6 w-full justify-between">
                <a href="/contact">
                  Request publication review
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </aside>
          </div>
        </section>
      </main>
      <JsonLd data={buildStructuredData(definition)} />
      <Footer />
    </>
  );
}

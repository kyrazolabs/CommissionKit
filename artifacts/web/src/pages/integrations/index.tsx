import { ArrowRight, Cable, Code2, Database, Landmark, Plug, Plug2, Workflow } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";
import { canonicalUrl, getSeoRoute, SITE_URL } from "@/lib/seo";
import { Footer } from "@/pages/landing/Footer";
import { Navbar } from "@/pages/landing/Navbar";

const integrations = [
  {
    name: "Odoo",
    type: "ERP",
    description:
      "Sync Odoo users and sales orders into a commission workflow with invoice-based payment status handling.",
    href: "/integrations/odoo",
    docsHref: "https://docs.commissionkit.co/integrations/odoo",
    icon: "/plugins/odoo.webp",
  },
  {
    name: "HubSpot",
    type: "CRM",
    description:
      "Sync HubSpot owners and deals, then map the pipeline stages used in your commission workflow.",
    href: "/integrations/hubspot",
    docsHref: "https://docs.commissionkit.co/integrations/hubspot",
    icon: "/plugins/hubspot.webp",
  },
  {
    name: "Salesforce",
    type: "CRM",
    description:
      "Sync Salesforce users and opportunities, then configure the stage behavior and commission-plan workflow.",
    href: "/integrations/salesforce",
    docsHref: "https://docs.commissionkit.co/integrations/salesforce",
    icon: "/plugins/salesforce.webp",
  },
  {
    name: "Custom REST API",
    type: "API",
    description:
      "Connect a compatible REST source using supported authentication methods and configurable field mappings.",
    href: "/integrations/custom",
    docsHref: "https://docs.commissionkit.co/integrations/custom",
    icon: Cable,
  },
];

export function IntegrationsHubPage() {
  const route = getSeoRoute("/integrations");
  usePageMeta({ title: route.title, description: route.description, keywords: route.keywords });

  const pageUrl = canonicalUrl("/integrations");
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: route.title,
      description: route.description,
      url: pageUrl,
      isPartOf: { "@type": "WebSite", name: "CommissionKit", url: SITE_URL },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "CommissionKit", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Integrations", item: pageUrl },
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "CommissionKit integrations",
      itemListElement: integrations.map((integration, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: integration.name,
        url: `${SITE_URL}${integration.href}`,
      })),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="border-b border-card-border bg-muted/30 px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Cable className="size-3.5" />
              Commission data connections
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              CommissionKit integrations
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Connect supported CRM and ERP sources to bring rep and deal data into your commission
              workflow. Each integration page explains the workflow and links to the current setup
              guide.
            </p>
          </div>
        </section>

        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-2">
              {integrations.map((integration) => {
                return (
                  <article
                    key={integration.href}
                    className="rounded-xl border border-card-border bg-card p-5"
                  >
                    <div className="mb-2 flex flex-row items-start justify-between gap-4">
                      <div className="flex flex-row items-center gap-2">
                        <div className="flex size-11 items-center justify-center rounded-lg text-primary">
                          {typeof integration.icon === "string" ? (
                            <img src={integration.icon} className="size-6 object-contain" />
                          ) : (
                            (() => {
                              const Icon = integration.icon;
                              return <Icon className="size-6 object-contain" />;
                            })()
                          )}
                        </div>
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">
                          {integration.name}
                        </h2>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        {integration.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {integration.description}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button asChild size="sm">
                        <a href={integration.href}>
                          View integration
                          <ArrowRight className="size-4" />
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href={integration.docsHref} target="_blank" rel="noreferrer">
                          Read setup guide
                        </a>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-card-border bg-muted/30 px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Need a different data source?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Review the Custom REST API integration to see the supported connection and mapping
              approach, or contact CommissionKit to discuss your workflow.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <a href="/integrations/custom">Explore Custom REST API</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/contact">Contact the team</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <JsonLd data={schema} />
      <Footer />
    </>
  );
}

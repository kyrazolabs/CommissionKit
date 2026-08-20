import {
  ArrowLeftRight,
  ArrowRight,
  Cable,
  Calculator,
  FileText,
  Filter,
  Layers,
  Plug,
  RefreshCw,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Analytics } from "@/lib/analytics";
import { Footer } from "@/pages/landing/Footer";
import { Navbar } from "@/pages/landing/Navbar";

const FEATURES = [
  {
    icon: FileText,
    title: "JSONPath Field Mapping",
    desc: "Map supported JSON response fields to CommissionKit's standard format using JSONPath, including nested objects, arrays, and keys containing dots.",
  },
  {
    icon: Shield,
    title: "Supported Auth Methods",
    desc: "Configure API Key, Bearer Token, HTTP Basic Auth, or OAuth 2.0 Client Credentials. Confirm that your API supports the selected authentication method.",
  },
  {
    icon: ArrowLeftRight,
    title: "Three Pagination Strategies",
    desc: "Configure offset, cursor, or page-based pagination, including limit parameters, cursor paths, and page sizes.",
  },
  {
    icon: Calculator,
    title: "Compute Fields ($div)",
    desc: "Transform values on the fly. Convert micros to dollars ($div:1000000), cents to dollars ($div:100), or any other divisor. Applies to any mapped field.",
  },
  {
    icon: Zap,
    title: "Smart Response Detection",
    desc: "The connector checks common response wrappers such as data, results, items, and records. Configure a response path when your API uses a different structure.",
  },
  {
    icon: Filter,
    title: "Stage + Payment Status Mapping",
    desc: "Map your API's custom status strings to CommissionKit stages (pending, closed_won, closed_lost) and payment statuses (paid, unpaid, partial, on_hold). Full control over normalization.",
  },
];

const STEPS = [
  {
    num: "01",
    Icon: Settings,
    title: "Configure",
    desc: "Set your API base URL, pick an auth method, configure pagination. Paste your endpoint paths.",
  },
  {
    num: "02",
    Icon: FileText,
    title: "Map",
    desc: "Write JSONPath expressions to map your fields. Use $div to convert units like micros to dollars.",
  },
  {
    num: "03",
    Icon: RefreshCw,
    title: "Sync",
    desc: "We call your API, page through results, normalize the data. Your status strings get mapped automatically.",
  },
  {
    num: "04",
    Icon: Calculator,
    title: "Calculate",
    desc: "Run plans against synced data, then review results before payout approval. Update mappings as your API evolves.",
  },
];

const FAQ = [
  {
    q: "Which REST APIs are compatible?",
    a: "The connector is designed for JSON REST APIs that fit its supported GET or POST methods, authentication options, field mappings, and pagination strategies. Validate your endpoint and response structure during setup.",
  },
  {
    q: "Do I need to know JSONPath?",
    a: "JSONPath is simpler than it sounds. `name` gets the name field. `user.email` gets a nested email. `items[0].amount` gets the first array item's amount. You can test your mappings inline during setup.",
  },
  {
    q: "What if my API returns values in micros or cents?",
    a: "Use the $div compute field. Prefix any field mapping with `$div:1000000:` to convert micros or `$div:100:` for cents. For example, `$div:1000000:amountMicros` converts micro-dollars to dollars.",
  },
  {
    q: "How does incremental sync work?",
    a: "If your API supports a modified-since parameter, configure `modifiedAfterParam` and the connector appends an ISO timestamp to every request. Only records changed since the last sync are processed.",
  },
  {
    q: "Can I sync both reps and deals?",
    a: "Yes. Configure separate endpoints, field mappings, and sync schedules for each entity type. Enable or disable either entity independently — sync only deals if you manage reps manually.",
  },
  {
    q: "How is API access configured?",
    a: "Choose a supported authentication method and use credentials with only the permissions your API workflow requires. Review the current setup and security documentation before connecting a production source.",
  },
  {
    q: "What happens if a sync fails?",
    a: "Review the integration log and connector configuration, correct the issue, and retry the sync. Validate the records returned after a successful sync before using them in calculations.",
  },
];

export function CustomIntegrationPage() {
  usePageMeta({
    title: "Custom REST API Integration — CommissionKit",
    description:
      "Connect a compatible JSON REST source to CommissionKit. Configure supported authentication, JSONPath field mappings, pagination, and rep or deal synchronization. Start a 14-day free trial.",
    keywords:
      "custom commission integration, REST API commission tracking, connect any CRM to commission software, custom commission software integration, no-code commission connector, JSONPath commission mapping",
    robots: "index, follow",
  });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative py-24 md:py-32 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-card/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-8">
              <Cable className="size-3.5 text-primary" />
              Custom REST API
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
              Connect a compatible REST API to CommissionKit
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-primary mb-4">
              Configurable commission data integration
            </p>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Use CommissionKit's custom connector to configure authentication, map fields with
              JSONPath, and set up pagination for a compatible JSON REST API.
            </p>
            <p className="text-sm mx-auto text-muted-foreground max-w-xl mb-4">
              Use this route when a pre-built connector is not available. Confirm that your API
              endpoints, authentication method, and response format fit the connector's supported
              configuration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="font-semibold shadow-sm">
                <a href="/register" onClick={() => Analytics.integrationCustomTrialClick("hero")}>
                  Start free trial
                  <ArrowRight className="size-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild className="font-semibold">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            {/* Connector visual */}
            <div className="mt-16 flex justify-center">
              <div className="relative inline-flex items-center gap-6 px-8 py-6 rounded-2xl border border-card-border bg-card">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                    <Plug className="size-6 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Your REST API</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Cable className="size-6 text-primary" />
                  <span className="text-[10px] font-medium text-primary">Sync</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <img src="/brand/logo-symbol.svg" alt="CommissionKit" className="w-12 h-12" />
                  <span className="text-xs font-medium text-muted-foreground">CommissionKit</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                Need to use a data source without a pre-built connector?
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                A configurable REST connection can help when a pre-built connector is unavailable.
                Review the supported options before choosing an implementation path.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "No pre-built connector available",
                  desc: "Use a configurable REST connection when your source is not covered by a CommissionKit connector.",
                },
                {
                  icon: Shield,
                  title: "Avoid a one-off build where possible",
                  desc: "A custom build can require development and ongoing maintenance. The connector provides supported configuration options for eligible APIs.",
                },
                {
                  icon: Layers,
                  title: "Map your data model",
                  desc: "Configure source fields, nested values, status mappings, and supported value conversions for your workflow.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-6 rounded-xl border border-card-border bg-card"
                  >
                    <div className="size-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-2 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                Supported connector configuration
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Configure supported authentication, field-mapping, status, and pagination options
                for your API.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="p-6 rounded-xl border border-card-border bg-card"
                  >
                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                Set up your custom REST connection
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Configure the connection and mapping, then validate returned records before using
                them in your commission workflow.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              {STEPS.map((step) => {
                const Icon = step.Icon;
                return (
                  <div key={step.num} className="p-8 lg:p-10 bg-card">
                    <div className="text-[11px] font-bold tracking-widest text-primary mb-6 opacity-80">
                      STEP {step.num}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-6">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ROI */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                Compare configuration with a custom build
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                The right approach depends on your API, data model, security requirements, and
                internal operating process.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {[
                {
                  stat: "No code",
                  label: "for supported configuration",
                  note: "Configuration is still required",
                },
                {
                  stat: "JSON REST",
                  label: "source format",
                  note: "Validate endpoint compatibility",
                },
                {
                  stat: "4 auth",
                  label: "methods supported",
                  note: "API Key through OAuth 2.0",
                },
                {
                  stat: "3 pagination",
                  label: "strategies built in",
                  note: "Offset, cursor, page",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-6 rounded-xl border border-card-border bg-card text-center"
                >
                  <p className="text-3xl font-bold text-primary tracking-tight tabular-nums">
                    {item.stat}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              The custom connector is suited to teams whose API fits these supported configuration
              options. Validate the connection and source data before using results in your
              commission workflow.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Implementation effort varies by API design, mapping requirements, security controls,
              and the operating process around commission approvals.
            </p>
          </div>
        </section>

        {/* Technical Credibility */}
        <section className="py-4 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  Works with supported JSON REST API patterns.
                </span>{" "}
                Configure Bearer tokens, API keys, Basic Auth, or OAuth 2.0 Client Credentials; map
                supported response fields with JSONPath; and choose offset, cursor, or page-based
                pagination. Use $div fields when a mapped numeric value needs division.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full mt-8">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Built by */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">CommissionKit</span> is built by a
              small, self-funded team focused exclusively on commission management. No venture
              capital, no growth-at-all-costs pressure. We build what customers need and we answer
              support messages ourselves.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Ready to configure a custom REST connection?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Start a free trial to configure and validate a compatible source before using it in
              your commission workflow.
            </p>
            <Button asChild className="font-semibold shadow-sm">
              <a href="/register" onClick={() => Analytics.integrationCustomTrialClick("bottom")}>
                Start free trial
                <ArrowRight className="size-4 ml-2" />
              </a>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              14-day trial. Configure your connection when you are ready.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

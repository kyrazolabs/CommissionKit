import { Navbar } from "@/pages/landing/Navbar";
import { Footer } from "@/pages/landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Cable,
  ArrowRight,
  Plug,
  FileText,
  Shield,
  Layers,
  ArrowLeftRight,
  Calculator,
  Zap,
  Filter,
  Settings,
  RefreshCw,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "JSONPath Field Mapping",
    desc: "Map any API response shape to CommissionKit's standard format using JSONPath. Support for nested objects, arrays, and keys containing dots. No code required.",
  },
  {
    icon: Shield,
    title: "Four Auth Methods",
    desc: "Choose API Key (custom header), Bearer Token, HTTP Basic Auth, or OAuth 2.0 Client Credentials with automatic token refresh. Works with virtually any authentication scheme.",
  },
  {
    icon: ArrowLeftRight,
    title: "Three Pagination Strategies",
    desc: "Support for offset, cursor, and page-based pagination. Configurable limit parameters, cursor paths, and page sizes. Handles APIs of any scale.",
  },
  {
    icon: Calculator,
    title: "Compute Fields ($div)",
    desc: "Transform values on the fly. Convert micros to dollars ($div:1000000), cents to dollars ($div:100), or any other divisor. Applies to any mapped field.",
  },
  {
    icon: Zap,
    title: "Smart Response Detection",
    desc: "The connector auto-detects paginated response arrays. Checks common wrapper patterns (data, results, items, records) automatically. Most APIs work without any responsePath configuration.",
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
    desc: "Plans run against synced data. Reps see earnings update in real time. Change mappings as your API evolves.",
  },
];

const FAQ = [
  {
    q: "What kind of APIs does this work with?",
    a: "Any REST API that returns JSON responses. The connector supports GET and POST methods, all major auth types, and three pagination strategies (offset, cursor, page).",
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
];

export function CustomIntegrationPage() {
  usePageMeta({
    title: "Custom REST API Integration — CommissionKit",
    description:
      "Connect any ERP or CRM to CommissionKit via REST API. Configure field mappings with JSONPath, choose your auth method, and sync reps and deals automatically. No code needed. Start your free trial.",
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
              Connect Any REST API to CommissionKit
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-primary mb-4">
              No-Code Commission Integration
            </p>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              CommissionKit's custom connector connects to any ERP or CRM that exposes a REST API. Configure authentication, map fields with JSONPath, set up pagination — all without writing a line of code.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="font-semibold shadow-sm">
                <a href="/register">
                  Start Free Trial
                  <ArrowRight className="size-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild className="font-semibold">
                <a href="#how-it-works">
                  See How It Works
                </a>
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
                  <img
                    src="/brand/logo-symbol.svg"
                    alt="CommissionKit"
                    className="w-12 h-12"
                  />
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
                Your ERP or CRM Does Not Have a Pre-Built Connector
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Generic integrations break on real data. Building a custom integration costs thousands and requires ongoing maintenance. There is a better way.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "No Native Connector Available",
                  desc: "Your ERP or CRM does not have a pre-built CommissionKit connector. You are stuck with manual CSV exports and spreadsheet formulas every month.",
                },
                {
                  icon: Shield,
                  title: "Custom Integrations Cost Thousands",
                  desc: "Building a custom integration from scratch means hiring developers, managing API auth, handling pagination edge cases, and maintaining it as your API changes.",
                },
                {
                  icon: Layers,
                  title: "One-Size-Fits-All Does Not Fit",
                  desc: "Your sales data is structured differently from everyone else's. Custom fields, nested objects, micros-format amounts — generic connectors break on your real data.",
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
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
                What the Custom REST Connector Does
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Six capabilities that make any REST API work with CommissionKit.
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
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
                Start in Under 30 Minutes
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Four steps from zero to live commission data from any REST API.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              {STEPS.map((step) => {
                const Icon = step.Icon;
                return (
                  <div
                    key={step.num}
                    className="p-8 lg:p-10 bg-card"
                  >
                    <div className="text-[11px] font-bold tracking-widest text-primary mb-6 opacity-80">
                      STEP {step.num}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-6">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
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
                Skip the Custom Development Project
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                The math on the custom REST connector versus a developer-built integration.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {[
                {
                  stat: "Zero",
                  label: "custom code required",
                  note: "Configure and go",
                },
                {
                  stat: "Any API",
                  label: "REST endpoint supported",
                  note: "JSON responses",
                },
                {
                  stat: "4 auth",
                  label: "methods supported",
                  note: "API Key to OAuth 2.0",
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
                  <p className="text-sm font-medium text-foreground mt-1">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Skip the{" "}
              <span className="font-semibold text-foreground">$10,000+</span>{" "}
              custom integration project. Configure your connector in under 30 minutes with no developers required.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
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

        {/* Final CTA */}
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Ready to Connect Your API?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Configure your custom REST connector in under 30 minutes. Your first 14 days are free.
            </p>
            <Button asChild className="font-semibold shadow-sm">
              <a href="/register">
                Start Free Trial
                <ArrowRight className="size-4 ml-2" />
              </a>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required. 3 reps, unlimited deals.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import {
  ArrowRight,
  Cable,
  Clock,
  FileText,
  Filter,
  Globe,
  RefreshCw,
  Shield,
  Users,
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
    icon: Users,
    title: "Sync Owners as Reps",
    desc: "Every HubSpot owner automatically becomes a CommissionKit rep. New hires appear on the next sync cycle. No manual rep entry.",
  },
  {
    icon: FileText,
    title: "Import Deals from Pipelines",
    desc: "HubSpot deals sync with amount, close date, pipeline stage, and assigned owner. All normalized into CommissionKit's standard format automatically.",
  },
  {
    icon: Zap,
    title: "Auto-Discover Pipeline Stages",
    desc: "The connector reads your HubSpot pipeline configuration and auto-detects which stages count as closed-won. No manual stage mapping needed for standard setups. Custom stages are fully configurable.",
  },
  {
    icon: RefreshCw,
    title: "Scheduled Auto-Sync",
    desc: "Set hourly or daily sync schedules. The connector uses hash-based change detection — only syncs what changed since last run. No duplicate data.",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    desc: "HubSpot deals in any currency sync with their original amounts. CommissionKit handles conversion at calculation time using exchange-rate snapshots from the deal close date.",
  },
  {
    icon: Zap,
    title: "Webhook Real-Time Updates",
    desc: "When a deal closes in HubSpot, a webhook fires and CommissionKit processes the change immediately. No waiting for the next scheduled sync.",
  },
];

const STEPS = [
  {
    num: "01",
    Icon: Cable,
    title: "Connect",
    desc: "Paste your HubSpot Private App token or Service Key. The connection test is instant.",
  },
  {
    num: "02",
    Icon: Users,
    title: "Map Owners",
    desc: "Choose which HubSpot owners earn commissions. Uncheck managers and support. Done.",
  },
  {
    num: "03",
    Icon: Filter,
    title: "Configure Stages",
    desc: "The connector finds your stages. Mark which ones trigger commissions. Skip test pipelines.",
  },
  {
    num: "04",
    Icon: Zap,
    title: "Enable Auto-Calc",
    desc: "New deals hit your commission plan right away. Reps see earnings update, no button clicking needed.",
  },
];

const FAQ = [
  {
    q: "How does HubSpot authentication work?",
    a: "Use a HubSpot Private App access token (recommended) or a Legacy API key. The connector authenticates via Bearer token. No OAuth redirect URLs to configure.",
  },
  {
    q: "Do I need to manually map pipeline stages?",
    a: "No. The connector auto-discovers your pipeline stages and identifies which ones are marked as closed in HubSpot. You can override the defaults for any custom stage.",
  },
  {
    q: "How often does data sync?",
    a: "You choose — every 15 minutes, hourly, or daily. Webhooks also fire on deal close events for real-time updates between scheduled syncs.",
  },
  {
    q: "What happens when deals are reassigned?",
    a: "If a deal changes owners in HubSpot, the connector catches that on the next sync and updates the CommissionKit record. Historical deals stay with the original rep.",
  },
  {
    q: "Which HubSpot plans are supported?",
    a: "All HubSpot plans that include the CRM API. The connector works with Sales Hub Professional, Enterprise, and Starter editions.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit (TLS 1.3) and at rest. We never store your CRM credentials — only encrypted API tokens. You can revoke access from your CRM settings at any time.",
  },
  {
    q: "What happens if the sync fails?",
    a: "Failed syncs are retried automatically with exponential backoff. You get an email notification if a sync fails three times in a row. No data is lost — the next successful sync picks up where it left off.",
  },
];

export function HubspotIntegrationPage() {
  usePageMeta({
    title: "HubSpot Commission Integration — CommissionKit",
    description:
      "Connect HubSpot CRM to CommissionKit and automate your sales commission tracking. Sync HubSpot deals, owners, and pipelines automatically. No more CSV exports or manual commission calculations. Start your free trial.",
    robots: "index, follow",
    keywords:
      "hubspot commission integration, hubspot sales commission software, sync hubspot to commission tracking, hubspot CRM commission management, automate hubspot commission calculation, hubspot deal commission sync",
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
              HubSpot Integration
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
              Connect HubSpot to CommissionKit
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-primary mb-4">
              Automate Your Sales Commission Tracking
            </p>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Sync your HubSpot deals, owners, and pipelines automatically. Eliminate manual CSV
              exports and give your reps real-time commission visibility. Deals close in HubSpot —
              commissions update in CommissionKit.
            </p>
            <p className="text-sm mx-auto text-muted-foreground max-w-xl mb-4">
              Unlike generic commission tools, CommissionKit reads your actual HubSpot pipeline.
              deal stages, owner assignments, and close dates, without requiring you to remap your
              CRM to fit a commission model.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="font-semibold shadow-sm">
                <a href="/register" onClick={() => Analytics.integrationHubspotTrialClick("hero")}>
                  Start Free Trial
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
                  <img
                    src="/plugins/hubspot.webp"
                    alt="HubSpot"
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-xs font-medium text-muted-foreground">HubSpot CRM</span>
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
                Stop Calculating HubSpot Commissions in Spreadsheets
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                If you are exporting deals from HubSpot to CSV, cleaning them up in Excel, and
                manually calculating commissions — you are losing hours every month and your reps
                are questioning every number.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Clock,
                  title: "Hours Lost Every Month",
                  desc: "Sales ops teams spend 4-6 hours per cycle exporting HubSpot deals, cleaning data, mapping owner IDs to rep names, and calculating commissions in spreadsheets.",
                },
                {
                  icon: Shield,
                  title: "Commission Disputes",
                  desc: "Reps can't see how commissions were derived. HubSpot shows the deal amount but not the commission. Shadow accounting creates distrust.",
                },
                {
                  icon: Users,
                  title: "Pipeline Blindness",
                  desc: "Deals move through HubSpot pipelines but commission visibility lags by weeks. Reps discover comp issues after month-end when it's too late to fix.",
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
                What the HubSpot Integration Does
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Six ways the connector eliminates manual work and keeps commissions accurate.
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
                Start in Under 15 Minutes
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Four steps from zero to automated commission tracking.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              {STEPS.map((step) => {
                const Icon = step.Icon;
                return (
                  <div key={step.num} className="p-8 lg:p-10 bg-card relative overflow-hidden">
                    <div className="absolute top-4 right-6 text-[72px] font-black text-primary/5 tabular-nums leading-none select-none pointer-events-none">
                      {step.num}
                    </div>
                    <div className="flex items-center gap-3 mb-3 relative">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground tracking-tight">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed relative">
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
                The Math on Time Saved
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Compare the manual path versus what the HubSpot integration delivers.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {[
                {
                  stat: "4-6 hrs",
                  label: "saved per month",
                  note: "For a 20-rep team",
                },
                {
                  stat: "100%",
                  label: "calculation accuracy",
                  note: "No formula errors",
                },
                {
                  stat: "Real-time",
                  label: "rep visibility",
                  note: "No more waiting",
                },
                {
                  stat: "Zero",
                  label: "CSV exports",
                  note: "Fully automated",
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
              A typical 20-rep team can save{" "}
              <span className="font-semibold text-foreground">$1,500–$3,000/month</span> in
              recovered ops labor alone. Plus eliminated errors and dispute time.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Savings are estimated based on typical finance ops labor costs and time studies from
              spreadsheet-based commission processes. Actual results vary by team size and process
              complexity.
            </p>
          </div>
        </section>

        {/* Technical Credibility */}
        <section className="py-4 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Built on HubSpot standards.</span>{" "}
                Auth via Private App tokens with no OAuth redirect complexity. Uses HubSpot's CRM v3
                API (current generation). Pipeline stage auto-discovery reads your actual pipelines
                configuration — no hardcoded stage names.
              </p>
            </div>
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
              Ready to Automate Your HubSpot Commissions?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Connect your HubSpot account in minutes. Your first 14 days are free.
            </p>
            <Button asChild className="font-semibold shadow-sm">
              <a href="/register" onClick={() => Analytics.integrationHubspotTrialClick("bottom")}>
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

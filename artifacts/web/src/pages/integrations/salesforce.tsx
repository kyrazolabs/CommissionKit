import {
  ArrowRight,
  Cable,
  Calculator,
  Clock,
  FileText,
  Globe,
  Layers,
  RefreshCw,
  Settings,
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
    title: "Sync Salesforce Users as Reps",
    desc: "Active standard Salesforce users automatically become CommissionKit reps. User roles map to rep roles — new hires appear on the next sync.",
  },
  {
    icon: FileText,
    title: "Import Opportunities as Deals",
    desc: "Every Salesforce opportunity syncs with amount, close date, stage, and owner. Configure which stages count as closed-won for commission. All data normalized automatically.",
  },
  {
    icon: Shield,
    title: "OAuth 2.0 Authentication",
    desc: "Connect via OAuth 2.0 Client Credentials for machine-to-machine access or Username-Password flow. Enterprise-grade security with Connected App credentials.",
  },
  {
    icon: Layers,
    title: "Sandbox + Production Support",
    desc: "The connector auto-detects sandbox vs. production instances. Test commission configurations against sandbox data before deploying to production.",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    desc: "Salesforce opportunities in any currency sync with their original amounts. CommissionKit converts at calculation time using exchange-rate snapshots for full auditability.",
  },
  {
    icon: Zap,
    title: "Scheduled + Real-Time Sync",
    desc: "SOQL-driven queries with cursor pagination handle high-volume orgs. Scheduled syncs keep data fresh, webhooks handle real-time deal closures.",
  },
];

const STEPS = [
  {
    num: "01",
    Icon: Cable,
    title: "Connect",
    desc: "Enter your Salesforce URL, authenticate with OAuth 2.0. Works with sandbox and production orgs.",
  },
  {
    num: "02",
    Icon: Settings,
    title: "Configure",
    desc: "Map Salesforce stages to commission statuses. Pick your reps. Set the sync schedule.",
  },
  {
    num: "03",
    Icon: RefreshCw,
    title: "Sync",
    desc: "Opportunities and users flow in via SOQL. Only changed records process. Pagination is automatic.",
  },
  {
    num: "04",
    Icon: Calculator,
    title: "Calculate",
    desc: "Plans run against synced ops. Reps see earnings in real time. Test changes in sandbox first.",
  },
];

const FAQ = [
  {
    q: "How does authentication work?",
    a: "The connector supports OAuth 2.0 Client Credentials (recommended for automated syncs) and Username-Password flows. You'll need a Connected App in your Salesforce org with API access enabled.",
  },
  {
    q: "Does it work with Salesforce sandboxes?",
    a: "Yes. The connector automatically detects sandbox instances (test.salesforce.com, sandbox domains) and routes auth to the correct endpoint. Test commission configs in sandbox before deploying.",
  },
  {
    q: "Which Salesforce objects sync?",
    a: "Users (IsActive=true, UserType=Standard) sync as reps. Opportunities sync as deals with amount, close date, stage, owner, currency, and description fields.",
  },
  {
    q: "How does it handle large opportunity volumes?",
    a: "The connector uses SOQL queries with cursor-based pagination via nextRecordsUrl. It processes all opportunity pages automatically and uses modified-after filtering for incremental syncs.",
  },
  {
    q: "Can I map custom opportunity stages?",
    a: "Yes. Configure stage mapping in the connection settings. Any Salesforce StageName can map to pending, closed_won, or closed_lost. You can also filter which stages sync at all.",
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

export function SalesforceIntegrationPage() {
  usePageMeta({
    title: "Salesforce Commission Integration — CommissionKit",
    description:
      "Connect Salesforce Sales Cloud to CommissionKit and automate your commission tracking. Sync Salesforce opportunities, users, and pipeline stages automatically. Eliminate manual spreadsheets and commission disputes. Start your free trial.",
    robots: "index, follow",
    keywords:
      "salesforce commission integration, salesforce sales commission tracking, connect salesforce to commission software, salesforce opportunity commission sync, salesforce commission management, automate salesforce commission calculation, salesforce sales cloud commission",
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
              Salesforce Integration
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
              Connect Salesforce to CommissionKit
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-primary mb-4">
              Automate Your Sales Commission Tracking
            </p>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Sync your Salesforce opportunities, users, and pipeline stages automatically.
              Eliminate manual commission spreadsheets and give your reps real-time earnings
              visibility.
            </p>
            <p className="text-sm mx-auto text-muted-foreground max-w-xl mb-4">
              Unlike tools that bolt on a generic Salesforce connector, CommissionKit reads
              Opportunities, custom fields, and sandbox environments natively. your Salesforce
              configuration drives the commission engine, not the other way around.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="font-semibold shadow-sm">
                <a
                  href="/register"
                  onClick={() => Analytics.integrationSalesforceTrialClick("hero")}
                >
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
                    src="/plugins/salesforce.webp"
                    alt="Salesforce"
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-xs font-medium text-muted-foreground">Salesforce</span>
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
                Stop Calculating Salesforce Commissions in Spreadsheets
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                If you are exporting opportunities from Salesforce to CSV, cleaning them up in
                Excel, and manually calculating commissions — you are losing hours every month and
                your reps are questioning every number.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Clock,
                  title: "Hours Lost Every Month",
                  desc: "Finance teams spend hours exporting Salesforce opportunities, cleaning data, mapping user IDs, and running commission calculations in spreadsheets. Every. Single. Month.",
                },
                {
                  icon: Shield,
                  title: "Reps in the Dark",
                  desc: "Salesforce shows the opportunity amount but not the commission. Reps wait weeks for comp statements, calculate their own shadow spreadsheets, and dispute numbers after month-end when corrections are painful.",
                },
                {
                  icon: Layers,
                  title: "Sandbox Drift",
                  desc: "Testing commission changes against Salesforce sandbox data is nearly impossible with manual workflows. Configuration errors only surface in production when real money is at stake.",
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
                What the Salesforce Integration Does
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
                Compare the manual path versus what the Salesforce integration delivers.
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
                  stat: "Sandbox",
                  label: "test before production",
                  note: "Zero risk config",
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
              <span className="font-semibold text-foreground">$1,500–$3,000/month</span> in finance
              team labor. Plus the cost of errors caught too late.
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
                <span className="font-medium text-foreground">Built on Salesforce standards.</span>{" "}
                OAuth 2.0 Client Credentials flow with no user login prompts during sync. Reads
                Opportunities, Users, and custom fields via SOQL. Works with any Salesforce edition
                that includes API access. Sandbox support included.
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
              Ready to Automate Your Salesforce Commissions?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Connect your Salesforce org in minutes. Your first 14 days are free.
            </p>
            <Button asChild className="font-semibold shadow-sm">
              <a
                href="/register"
                onClick={() => Analytics.integrationSalesforceTrialClick("bottom")}
              >
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

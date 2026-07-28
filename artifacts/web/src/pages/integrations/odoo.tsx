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
  Check,
  Users,
  FileText,
  RefreshCw,
  Globe,
  Zap,
  Clock,
  Shield,
  ChevronDown,
  ArrowUpRight,
  Settings,
  Calculator,
} from "lucide-react";
import { Analytics } from "@/lib/analytics";

const FEATURES = [
  {
    icon: Users,
    title: "Sync Sales Reps Automatically",
    desc: "All active Odoo users become CommissionKit reps. New hires appear on the next sync. No manual entry.",
  },
  {
    icon: FileText,
    title: "Import Sales Orders as Deals",
    desc: "Every confirmed sale.order syncs to CommissionKit with amount, close date, stage, and the assigned rep. Configure which Odoo stages count as closed-won.",
  },
  {
    icon: Zap,
    title: "Invoice-Based Payment Tracking",
    desc: "The connector reads actual invoice payment states from account.move. Deals are marked paid, partial, or on hold based on real Odoo data — not guesswork.",
  },
  {
    icon: RefreshCw,
    title: "Scheduled Auto-Sync",
    desc: "Set hourly, daily, or real-time sync schedules. The connector detects changes using comparison and only processes what's new — no duplicate data.",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    desc: "Odoo deals in any currency sync with their original amounts. CommissionKit handles conversion automatically using live exchange rates.",
  },
  {
    icon: Zap,
    title: "Webhook Real-Time Updates",
    desc: "When a deal closes in Odoo, a webhook fires and CommissionKit processes the change immediately. No waiting for the next scheduled sync.",
  },
];

const STEPS = [
  {
    num: "01",
    Icon: Cable,
    title: "Connect",
    desc: "Enter your Odoo URL, database, and API key. Connection test runs instantly.",
  },
  {
    num: "02",
    Icon: Settings,
    title: "Configure",
    desc: "Pick which Odoo stages mean closed. Map your users to reps. Set the sync cadence.",
  },
  {
    num: "03",
    Icon: RefreshCw,
    title: "Sync",
    desc: "Orders and reps sync on schedule. Invoices are checked so payouts reflect what's actually paid.",
  },
  {
    num: "04",
    Icon: Calculator,
    title: "Calculate",
    desc: "Commission plans run against synced deals automatically. Reps see their earnings update in real time.",
  },
];

const FAQ = [
  {
    q: "Which Odoo versions are supported?",
    a: "Odoo 15+ Community and Enterprise editions. The connector uses Odoo's JSON-RPC API, which is available across all modern versions.",
  },
  {
    q: "What if my Odoo uses custom sales stages?",
    a: "You can map any Odoo stage to a CommissionKit status. The connector auto-discovers your stages and lets you decide which ones trigger commission calculations.",
  },
  {
    q: "How often does the data sync?",
    a: "You choose. Options range from every 15 minutes to once daily. You can also enable webhooks for real-time updates when deals close.",
  },
  {
    q: "Does it work with multi-currency Odoo instances?",
    a: "Yes. The connector preserves the original Odoo currency on each deal. CommissionKit handles conversion at calculation time using exchange-rate snapshots for auditability.",
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

export function OdooIntegrationPage() {
  usePageMeta({
    title: "Odoo Commission Tracking Integration — CommissionKit",
    description:
      "Connect Odoo ERP to CommissionKit and automate your sales commission tracking. Sync sales orders, reps, and invoices automatically. No more manual spreadsheets or commission disputes. Start your free trial.",
    keywords:
      "odoo commission integration, odoo sales commission tracking, connect odoo to commission software, odoo commission management, odoo erp commission, automate odoo commission calculation, odoo sales order commission sync",
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
              Odoo Integration
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
              Connect Odoo to CommissionKit
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-primary mb-4">
              Automate Your Sales Commission Tracking
            </p>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Sync your Odoo sales orders, reps, and invoices automatically. Eliminate manual spreadsheets, calculation errors, and commission disputes. Your reps see their earnings update in real time.
            </p>
            <p className="text-sm mx-auto text-muted-foreground max-w-xl mb-4">
              Unlike generic commission tools that treat Odoo like any other CRM, CommissionKit understands Odoo-specific concepts. sales orders, invoice payment states, and multi-currency that maps to your Odoo configuration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="font-semibold shadow-sm">
                <a href="/register" onClick={() => Analytics.integrationOdooTrialClick("hero")}>
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
                  <img
                    src="/plugins/odoo.webp"
                    alt="Odoo"
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-xs font-medium text-muted-foreground">Odoo ERP</span>
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
                Stop Calculating Odoo Commissions in Spreadsheets
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                If you are exporting sales orders from Odoo to CSV, cleaning them up in Excel, and manually calculating commissions — you are losing hours every month and your reps are questioning every number.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Clock,
                  title: "Hours Lost Every Month",
                  desc: "Finance teams spend 4-6 hours per cycle exporting, cleaning, and reconciling Odoo data in spreadsheets. That is a full work week every quarter.",
                },
                {
                  icon: Shield,
                  title: "Commission Disputes",
                  desc: "Reps question calculations because they cannot see how commissions were derived. Shadow accounting creates distrust and wastes management time.",
                },
                {
                  icon: Users,
                  title: "Delayed Visibility",
                  desc: "Sales reps wait weeks after month-end to see what they earned. That lag kills motivation and makes it harder to course-correct mid-quarter.",
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
                What the Odoo Integration Does
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
                  <div
                    key={step.num}
                    className="p-8 lg:p-10 bg-card relative overflow-hidden"
                  >
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
                Compare the manual path versus what the Odoo integration delivers.
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
              A typical 20-rep team can save{" "}
              <span className="font-semibold text-foreground">$1,500–$3,000/month</span>{" "}
              in finance team labor alone.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Savings are estimated based on typical finance ops labor costs and time studies from spreadsheet-based commission processes. Actual results vary by team size and process complexity.
            </p>
          </div>
        </section>

        {/* Technical Credibility */}
        <section className="py-4 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Built on Odoo standards.</span> The connector reads <code className="text-xs bg-muted px-1 py-0.5 rounded">sale.order</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">res.users</code>, and <code className="text-xs bg-muted px-1 py-0.5 rounded">account.move</code> via Odoo's JSON-RPC API (stable across v15–v18). No custom Odoo modules required. Invoice payment states are derived from actual accounting records, not order status guesses.
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
              <span className="font-medium text-foreground">CommissionKit</span> is built by a small, self-funded team focused exclusively on commission management. No venture capital, no growth-at-all-costs pressure. We build what customers need and we answer support messages ourselves.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Ready to Automate Your Odoo Commissions?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Connect your Odoo instance in minutes. Your first 14 days are free.
            </p>
            <Button asChild className="font-semibold shadow-sm">
              <a href="/register" onClick={() => Analytics.integrationOdooTrialClick("bottom")}>
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

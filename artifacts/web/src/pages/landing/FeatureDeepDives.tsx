import { Settings, User, Database, ShieldCheck, Check, Cable } from "lucide-react";
import { useInView, fadeIn } from "./hooks";
import { LazyVideo } from "@/components/lazy-video";

export function FeatureDeepDives() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto space-y-32" id="features" ref={ref}>

      {/* Feature 1: Automated Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1" style={fadeIn(inView, 100)}>
          <LazyVideo src="/videos/commission-runs-zoom.webm" />
        </div>
        <div className="order-1 lg:order-2 space-y-6" style={fadeIn(inView, 0)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
            <Settings className="size-4 text-primary" />
            Automation
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Automated Commission Runs</h2>
          <p className="text-base text-muted-foreground">
            Say goodbye to end-of-month panic. Process complex commission plans across your entire organization with a single click. Our engine handles tiered structures, quotas, and accelerators effortlessly.
          </p>
          <ul className="space-y-4 pt-4">
            {[
              "One-click processing for active reps and plans.",
              "Detailed calculation audit trail for ultimate transparency.",
              "Historical run tracking and easy reconciliations."
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <Check className="size-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Feature 2: Rep Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6" style={fadeIn(inView, 200)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
            <User className="size-4 text-primary" />
            Visibility
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Dedicated Representative Portal</h2>
          <p className="text-base text-muted-foreground">
            Empower your sales team with a self-serve portal that provides clear, real-time insights into their performance, estimated commissions, and deal breakdowns. Stop answering "how much did I make on that deal?"
          </p>
          <ul className="space-y-4 pt-4">
            {[
              "Real-time visibility into estimated and finalized earnings.",
              "Interactive earnings history charts.",
              "Granular deal-level commission breakdown."
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <Check className="size-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={fadeIn(inView, 300)}>
          <LazyVideo src="/videos/rep-portal-zoom.webm" />
        </div>
      </div>

      {/* Feature 3: Deal Import */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1" style={fadeIn(inView, 500)}>
          <LazyVideo src="/videos/deals-zoom.webm" />
        </div>
        <div className="order-1 lg:order-2 space-y-6" style={fadeIn(inView, 400)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
            <Database className="size-4 text-primary" />
            Data Management
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Enterprise Deal Management</h2>
          <p className="text-base text-muted-foreground">
            A centralized hub for tracking and assignments. Ingest data seamlessly with our robust import tools, supporting complex datasets and multiple formats to get your data ready for processing fast.
          </p>
          <ul className="space-y-4 pt-4">
            {[
              "Bulk data management with XLSX/CSV import/export.",
              "Smart column mapping and error detection.",
              "Centralized hub for all revenue events."
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <Check className="size-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Feature 4: Payouts & Disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6" style={fadeIn(inView, 600)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Trust & Compliance
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Payouts Tracker & Dispute Resolution</h2>
          <p className="text-base text-muted-foreground">
            Manage the final stage of the commission lifecycle with total accountability. Monitor payouts and resolve discrepancies before they become problems.
          </p>
          <ul className="space-y-4 pt-4">
            {[
              "Monitor statuses from 'Pending' to 'Paid'.",
              "Built-in dispute workflow for sales reps.",
              "Centralized dashboard for reviewing and resolving issues."
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <Check className="size-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={fadeIn(inView, 700)}>
          <LazyVideo src="/videos/payouts-disputes-zoom.webm" />
        </div>
      </div>

      {/* Feature 5: Integrations & Connectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1" style={fadeIn(inView, 900)}>
          <div className="rounded-xl border border-border/60 bg-card/30 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/odoo/odoo.png" alt="Odoo" className="size-8 rounded-lg" />
              <div>
                <p className="text-sm font-semibold text-foreground">Odoo ERP</p>
                <p className="text-xs text-muted-foreground">Sync repos and deals automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <Cable className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Custom REST API</p>
                <p className="text-xs text-muted-foreground">Connect any ERP or CRM — no code needed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <Cable className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">HubSpot</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2 space-y-6" style={fadeIn(inView, 800)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
            <Cable className="size-4 text-primary" />
            Integrations
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Connect Your Existing Tools</h2>
          <p className="text-base text-muted-foreground">
            CommissionKit plugs directly into the tools you already use. Sync your sales reps and deals automatically — no manual data entry, no spreadsheets, no errors.
          </p>
          <ul className="space-y-4 pt-4">
            {[
              "Native Odoo connector — sync reps and deals in one click.",
              "Custom REST API connector — connect any ERP or CRM with configurable field mapping, authentication, and pagination.",
              "Automatic sync scheduling — keep data fresh with hourly, daily, or real-time polling.",
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <Check className="size-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

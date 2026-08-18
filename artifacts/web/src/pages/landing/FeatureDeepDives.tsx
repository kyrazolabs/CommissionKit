import { Check, Database, Settings, ShieldCheck, User } from "lucide-react";
import { fadeIn, useInView } from "./hooks";
import { InteractiveCommissionRuns } from "./InteractiveCommissionRuns";
import { InteractiveDealManagement } from "./InteractiveDealManagement";
import { InteractivePayouts } from "./InteractivePayouts";
import { InteractiveRepPortal } from "./InteractiveRepPortal";

export function FeatureDeepDives() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24" id="features" ref={ref}>
      <div className="max-w-6xl mx-auto px-6 space-y-32">
        {/* Feature 1: Automated Runs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1" style={fadeIn(inView, 100)}>
            <InteractiveCommissionRuns />
          </div>
          <div className="order-1 lg:order-2 space-y-6" style={fadeIn(inView, 0)}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
              <Settings className="size-4 text-primary" />
              Automation
            </div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Automated commission runs
            </h2>
            <p className="text-base text-muted-foreground">
              Process every rep's commissions across the whole org with one click. The engine
              handles tiered structures, quotas, and accelerators, so month-end stops being a fire
              drill.
            </p>
            <ul className="space-y-4 pt-4">
              {[
                "One-click processing for every active rep and plan.",
                "A full audit trail on every calculation, so any question has an answer.",
                "Past runs stay saved for reconciliation.",
              ].map((item) => (
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
              <User className="size-4 text-primary" />
              Visibility
            </div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
              A portal for every rep
            </h2>
            <p className="text-base text-muted-foreground">
              Reps get a self-serve portal with live earnings, estimated commissions, and per-deal
              breakdowns. You stop answering "how much did I make on that deal?"
            </p>
            <ul className="space-y-4 pt-4">
              {[
                "Live view of estimated and finalized earnings.",
                "Earnings history charts.",
                "Per-deal commission breakdowns.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="size-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={fadeIn(inView, 300)}>
            <InteractiveRepPortal />
          </div>
        </div>

        {/* Feature 3: Deal Import */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1" style={fadeIn(inView, 500)}>
            <InteractiveDealManagement />
          </div>
          <div className="order-1 lg:order-2 space-y-6" style={fadeIn(inView, 400)}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
              <Database className="size-4 text-primary" />
              Data Management
            </div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
              All your deals in one place
            </h2>
            <p className="text-base text-muted-foreground">
              Import CSV or XLSX files with automatic column mapping, fix errors inline, and keep
              every deal ready for the next run.
            </p>
            <ul className="space-y-4 pt-4">
              {[
                "Bulk import and export with CSV and XLSX.",
                "Automatic column mapping and error detection.",
                "Every revenue event tracked and ready for a run.",
              ].map((item) => (
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Trust & Compliance
            </div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
              Payouts and dispute resolution
            </h2>
            <p className="text-base text-muted-foreground">
              Track every payout from pending to paid, and give reps a built-in way to flag a
              dispute when something looks off. Issues get resolved inside the system, not over
              email threads.
            </p>
            <ul className="space-y-4 pt-4">
              {[
                "Payout statuses from pending to paid.",
                "Built-in dispute workflow for reps.",
                "One dashboard for reviewing and resolving issues.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="size-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={fadeIn(inView, 700)}>
            <InteractivePayouts />
          </div>
        </div>
      </div>
    </section>
  );
}

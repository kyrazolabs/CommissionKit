import { Navbar } from "./landing/Navbar";
import { Footer } from "./landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import {
  Calculator,
  Users,
  FileSpreadsheet,
  Receipt,
  ShieldCheck,
  Settings,
  Globe,
  Zap,
  Bell,
} from "lucide-react";

const FEATURES = [
  {
    category: "Commission Engine",
    icon: Calculator,
    items: [
      {
        title: "Flat Rate Plans",
        desc: "Simple percentage-based commission structures with configurable caps and minimums.",
      },
      {
        title: "Tiered Commission",
        desc: "Progressive tier structures that reward top performers with higher rates at higher volumes.",
      },
      {
        title: "Accelerators",
        desc: "Performance multipliers that kick in when reps exceed quota thresholds.",
      },
      {
        title: "Multi-Currency",
        desc: "Process deals in any currency with automatic conversion using live exchange rates.",
      },
    ],
  },
  {
    category: "Rep Management",
    icon: Users,
    items: [
      {
        title: "Rep Profiles",
        desc: "Centralized profiles with commission plan assignments, targets, and earnings history.",
      },
      {
        title: "Self-Serve Portal",
        desc: "Each rep gets their own dashboard to track earnings, deal breakdowns, and payout status in real time.",
      },
      {
        title: "Bulk Import",
        desc: "Onboard your entire sales team with CSV imports for reps, plans, and assignments.",
      },
      {
        title: "Performance Analytics",
        desc: "Track rep performance against quotas with visual charts and leaderboards.",
      },
    ],
  },
  {
    category: "Deal Management",
    icon: FileSpreadsheet,
    items: [
      {
        title: "CSV & XLSX Import",
        desc: "Import deals in bulk with smart column mapping and automatic error detection.",
      },
      {
        title: "Deal Assignment",
        desc: "Assign deals to reps individually or in bulk with flexible attribution rules.",
      },
      {
        title: "Audit Trail",
        desc: "Every calculation step is logged for full transparency and easy reconciliation.",
      },
      {
        title: "Export & Reporting",
        desc: "Export deal data and commission breakdowns in multiple formats for accounting systems.",
      },
    ],
  },
  {
    category: "Payouts & Finance",
    icon: Receipt,
    items: [
      {
        title: "Payout Tracking",
        desc: "Track every payout from pending through approved to paid with full lifecycle visibility.",
      },
      {
        title: "Dispute Resolution",
        desc: "Built-in workflow for reps to flag discrepancies and for managers to review and resolve.",
      },
      {
        title: "Batch Processing",
        desc: "Process commission runs for your entire organization in a single operation.",
      },
      {
        title: "Historical Records",
        desc: "Archive and search every commission run, payout, and adjustment indefinitely.",
      },
    ],
  },
  {
    category: "Platform",
    icon: Settings,
    items: [
      {
        title: "Role-Based Access",
        desc: "Granular permissions for owners, admins, managers, and reps with customizable roles.",
      },
      {
        title: "Workspace Isolation",
        desc: "Multi-tenant architecture ensures complete data isolation between organizations.",
      },
      {
        title: "Integrations",
        desc: "Connect with your CRM, accounting software, and data pipelines via API and webhooks.",
      },
      {
        title: "Custom Engines",
        desc: "Enterprise customers can deploy custom commission calculation engines for unique requirements.",
      },
    ],
  },
];

export function FeaturesPage() {
  usePageMeta({
    title: "Features — CommissionKit",
    description:
      "Explore CommissionKit's full feature set — commission engine, rep portal, deal management, payout tracking, and platform capabilities.",
    robots: "index, follow",
  });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-6">
              <Zap className="size-3.5 text-primary" />
              Platform Capabilities
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              Everything You Need to Run Commissions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From plan design to payout — CommissionKit covers the entire commission lifecycle
              with powerful automation and real-time visibility.
            </p>
          </div>

          <div className="space-y-16">
            {FEATURES.map((category) => {
              const CatIcon = category.icon;
              return (
                <section key={category.category}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CatIcon className="size-4" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">{category.category}</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {category.items.map((item) => (
                      <div
                        key={item.title}
                        className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
                      >
                        <h3 className="font-semibold text-foreground mb-1.5">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-20 border-t border-border pt-12">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Enterprise Security", desc: "AES-256 encryption at rest, TLS 1.3 in transit. SOC2-compliant cloud infrastructure." },
                { icon: Globe, title: "Global Ready", desc: "Multi-currency support with live exchange rates. Works for teams in any region." },
                { icon: Bell, title: "Real-Time Alerts", desc: "Email notifications for completed runs, payout status changes, and dispute updates." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="text-center p-6">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto mb-4">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </main>
      <Footer />
    </>
  );
}

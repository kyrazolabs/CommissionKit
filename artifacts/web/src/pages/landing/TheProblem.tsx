import { useInView, fadeIn } from "./hooks";
import { FileSpreadsheet, Clock, FileWarning, MessageSquareWarning, Database, Zap, Eye, ScrollText } from "lucide-react";

const PAIN_ITEMS = [
  {
    icon: FileSpreadsheet,
    title: "Spreadsheets everywhere",
    desc: 'Multiple files, version conflicts, "who has the latest?"',
  },
  {
    icon: Clock,
    title: "End-of-month panic",
    desc: "3-5 day turnaround to calculate commissions",
  },
  {
    icon: FileWarning,
    title: "Shadow accounting",
    desc: "Reps keep their own spreadsheets because they don't trust yours",
  },
  {
    icon: MessageSquareWarning,
    title: "Disputes and distrust",
    desc: '"I think this deal should be $2,400, not $1,800"',
  },
];

const SOLUTION_ITEMS = [
  {
    icon: Database,
    title: "One source of truth",
    desc: "Every deal, every rep, every plan in one place",
  },
  {
    icon: Zap,
    title: "One click, minutes",
    desc: "Run the whole org's commissions at once",
  },
  {
    icon: Eye,
    title: "Real-time rep portal",
    desc: "Reps see their earnings live. No more shadow spreadsheets",
  },
  {
    icon: ScrollText,
    title: "Audit trail built in",
    desc: "Every calculation traceable, disputes resolved in minutes",
  },
];

export function TheProblem() {
  const left = useInView();
  const right = useInView();

  return (
    <section className="py-24 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
            The problem
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-foreground tracking-tight font-display mb-4">
            Commission tracking shouldn't feel like tax season every month
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            If your month-end looks like version_7_final_FINAL.xlsx, you know the feeling.
          </p>
        </div>

        {/* Pain point stats */}
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-12" style={fadeIn(left.inView, 0)}>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-destructive tracking-tight font-display tabular-nums">62%</div>
            <div className="text-xs text-muted-foreground mt-1">of reps keep their own spreadsheets to verify payouts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-destructive tracking-tight font-display tabular-nums">23 hrs</div>
            <div className="text-xs text-muted-foreground mt-1">spent per month on manual commission admin</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-destructive tracking-tight font-display tabular-nums">4.2%</div>
            <div className="text-xs text-muted-foreground mt-1">of commission payouts contain errors</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
        {/* Left — Pain */}
        <div
          ref={left.ref}
          className="rounded-2xl border p-8 lg:p-10 bg-destructive/5 border-destructive/10"
          style={fadeIn(left.inView, 0)}
        >
          <h3 className="text-lg font-semibold mb-6 text-destructive">
            The way it is now
          </h3>
          <div className="space-y-5">
            {PAIN_ITEMS.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="size-9 rounded-lg bg-background border flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="size-4 text-destructive/70" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Solution */}
        <div
          ref={right.ref}
          className="rounded-2xl border p-8 lg:p-10 bg-primary/5 border-primary/10"
          style={fadeIn(right.inView, 200)}
        >
          <h3 className="text-lg font-semibold mb-6 text-primary">
            With CommissionKit
          </h3>
          <div className="space-y-5">
            {SOLUTION_ITEMS.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="size-9 rounded-lg bg-background border flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

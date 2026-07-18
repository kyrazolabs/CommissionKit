import { CheckCircle2, Zap, TrendingUp } from "lucide-react";
import { useInView, fadeIn } from "./hooks";
import { Card, CardContent } from "@/components/ui/card";

const PROPS = [
  {
    title: "Flawless accuracy",
    desc: "Eliminate manual errors and shadow accounting. Our rule engine calculates every payout with absolute precision — cutting disputes to near zero.",
    icon: CheckCircle2,
    stat: "99%",
    statLabel: "fewer disputes",
  },
  {
    title: "Unmatched efficiency",
    desc: "Reclaim hundreds of hours lost to spreadsheet gymnastics. Automate deal ingestion, validation, and complex tier calculations in minutes, not days.",
    icon: Zap,
    stat: "14 hrs",
    statLabel: "saved per month",
  },
  {
    title: "Drive motivation",
    desc: "Give reps real-time transparency into their earnings. Clear visibility into how deals become commissions drives performance, trust, and retention.",
    icon: TrendingUp,
    stat: "24/7",
    statLabel: "rep self-service",
  },
];

export function ValueProps() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 border-b border-border/60 bg-background" id="solutions">
      <div ref={ref} className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
            Why teams switch
          </p>
          <h2 className="text-3xl lg:text-[40px] font-bold text-foreground mb-4 tracking-tight font-display">
            Built for scale, designed for clarity
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We solve the three problems that make commission season a nightmare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROPS.map((prop, i) => {
            const Icon = prop.icon;
            return (
              <div key={prop.title} style={fadeIn(inView, i * 100)}>
                <Card className="bg-card hover-elevate transition-transform hover:scale-[1.02] duration-300 h-full border-card-border">
                  <CardContent className="p-8 flex flex-col items-start">
                    <div className="flex items-center justify-between w-full mb-6">
                      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="size-6" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground tabular-nums font-display">{prop.stat}</div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{prop.statLabel}</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">
                      {prop.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {prop.desc}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

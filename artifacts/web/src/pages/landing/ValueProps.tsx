import { CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fadeIn, useInView } from "./hooks";

const PROPS = [
  {
    title: "Every calculation checks out",
    desc: "Plans, deals, and payouts live in one system, so there is exactly one number per deal. Every run writes a full audit trail, and when a rep asks why a payout looks the way it does, you can show them.",
    icon: CheckCircle2,
  },
  {
    title: "Runs take minutes, not days",
    desc: "Import deals from a CSV or sync them straight from your CRM, then process the whole org in one click. Month-end stops being a week of spreadsheet work.",
    icon: Zap,
  },
  {
    title: "Reps see their numbers live",
    desc: "Every rep gets a portal with live earnings and per-deal breakdowns. When the numbers are out in the open, the side spreadsheets go away.",
    icon: TrendingUp,
  },
];

export function ValueProps() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-muted/30 border-b border-border/60" id="solutions">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
            Why teams switch
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-foreground mb-4 tracking-tight font-display">
            Get commissions right, every month
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            What changes when the whole commission process lives in one system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROPS.map((prop, i) => {
            const Icon = prop.icon;
            return (
              <div key={prop.title} style={fadeIn(inView, i * 100)}>
                <Card className="bg-card hover-elevate transition-transform hover:scale-[1.02] duration-300 h-full border-card-border">
                  <CardContent className="p-8 flex flex-col items-start">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">
                      {prop.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{prop.desc}</p>
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

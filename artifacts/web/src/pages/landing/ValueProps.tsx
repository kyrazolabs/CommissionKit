import { CheckCircle2, Zap, TrendingUp } from "lucide-react";
import { useInView, fadeIn } from "./hooks";
import { Card, CardContent } from "@/components/ui/card";

const PROPS = [
  {
    title: "Flawless Accuracy",
    desc: "Eliminate manual errors and shadow accounting. Our rule engine ensures every payout is calculated with absolute precision, reducing disputes to zero.",
    icon: CheckCircle2,
  },
  {
    title: "Unmatched Efficiency",
    desc: "Save hundreds of hours previously spent on spreadsheet gymnastics. Automate deal ingestion, validations, and complex tier calculations in minutes.",
    icon: Zap,
  },
  {
    title: "Drive Motivation",
    desc: "Provide reps with real-time transparency into their earnings. Clear visibility into how deals translate to commissions drives performance and trust.",
    icon: TrendingUp,
  },
];

export function ValueProps() {
  const { ref, inView } = useInView();

  return (
    <section className="py-20 border-y border-border/60 bg-white/30 backdrop-blur-sm" id="solutions">
      <div ref={ref} className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <h2 className="text-3xl lg:text-[32px] font-bold text-foreground mb-4 tracking-tight">
            Why Finance & Sales Teams Trust Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for scale, designed for clarity. We solve the core challenges of complex commission structures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROPS.map((prop, i) => {
            const Icon = prop.icon;
            return (
              <div key={prop.title} style={fadeIn(inView, i * 100)}>
                <Card 
                  className="bg-white/70 backdrop-blur-md hover-elevate transition-transform hover:scale-[1.02] duration-300 h-full"
                >
                  <CardContent className="p-8 flex flex-col items-start">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                      <Icon className="size-6" />
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

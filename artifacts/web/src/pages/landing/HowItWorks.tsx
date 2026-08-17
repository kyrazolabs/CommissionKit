import { ClipboardList, Link2, Zap } from "lucide-react";
import { fadeIn, useInView } from "./hooks";

const STEPS = [
  {
    n: "01",
    Icon: ClipboardList,
    title: "Set up your commission plans",
    desc: "Set rates per rep or role. Flat, tiered, accelerators, clawbacks. Your comp plan, however complex, runs automatically.",
  },
  {
    n: "02",
    Icon: Link2,
    title: "Import deals and assign reps",
    desc: "Upload CSV or XLSX files in seconds. Column names are auto-matched. Assign reps, set amounts, done.",
  },
  {
    n: "03",
    Icon: Zap,
    title: "Run, approve, and pay",
    desc: "One click processes every deal. Reps see exact payouts instantly. Review, approve, close the month.",
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-background py-24 px-6 border-b border-border/60" id="how-it-works">
      <div ref={ref} className="max-w-6xl mx-auto">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold leading-tight text-foreground tracking-tight font-display">
            Up and running in 3 steps
          </h2>
          <p className="text-base text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
            No consultants. No onboarding calls. No implementation sprints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          {STEPS.map((step, i) => {
            const Icon = step.Icon;
            return (
              <div key={step.n} className="p-8 lg:p-10 bg-card relative overflow-hidden">
                <div
                  className="absolute top-4 right-6 text-[72px] font-black text-primary/10 tabular-nums leading-none select-none pointer-events-none"
                  style={fadeIn(inView, i * 500)}
                >
                  {step.n}
                </div>

                <div
                  className="flex items-center gap-3 mb-3 relative"
                  style={fadeIn(inView, i * 650)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {step.title}
                  </h3>
                </div>

                <p
                  className="text-sm text-muted-foreground leading-relaxed relative"
                  style={fadeIn(inView, i * 700)}
                >
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

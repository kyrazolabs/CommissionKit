import { ClipboardList, Link2, Zap } from "lucide-react";
import { useInView, fadeIn } from "./hooks";

const STEPS = [
  {
    n: "01",
    Icon: ClipboardList,
    title: "Set up your commission plans",
    desc: "Define rates per rep or role. Flat, tiered, accelerators, clawbacks — CommissionKit handles every structure your comp team can invent.",
  },
  {
    n: "02",
    Icon: Link2,
    title: "Import deals and assign reps",
    desc: "Upload via CSV or XLSX in seconds. Our mapping engine handles messy column names. Assign reps, set amounts, and you're done.",
  },
  {
    n: "03",
    Icon: Zap,
    title: "Run, approve, and pay",
    desc: "One click processes every deal. Your reps see their exact payout instantly. You review, approve, and close the month — no back-and-forth.",
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-background py-24 px-6 border-b border-border/60" id="how-it-works">
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight text-foreground tracking-tight font-display">
            Up and running in 3 steps
          </h2>
          <p className="text-base text-muted-foreground mt-4 max-w-[420px] mx-auto leading-relaxed">
            No consultants. No onboarding calls. No implementation sprints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          {STEPS.map((step, i) => {
            const Icon = step.Icon;
            return (
              <div
                key={step.n}
                className="p-8 lg:p-10 bg-card relative"
                style={fadeIn(inView, i * 100)}
              >
                <div className="text-[11px] font-bold tracking-widest text-primary mb-6 opacity-80">
                  STEP {step.n}
                </div>

                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-6">
                  <Icon className="size-5 text-primary" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed m-0">
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

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
    <section className="bg-white py-28 px-6 border-b border-slate-200" id="how-it-works">
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <p className="text-[11px] font-bold tracking-widest uppercase text-teal-600 mb-4">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight text-slate-900 tracking-tight">
            Up and running in 3 steps
          </h2>
          <p className="text-[16px] text-slate-600 mt-4 max-w-[400px] mx-auto leading-relaxed">
            No consultants. No onboarding calls. No implementation sprints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {STEPS.map((step, i) => {
            const Icon = step.Icon;
            return (
              <div
                key={step.n}
                className="p-8 lg:p-10 bg-white relative"
                style={fadeIn(inView, i * 100)}
              >
                {/* Step number */}
                <div className="text-[11px] font-bold tracking-widest text-teal-600 mb-6 opacity-80">
                  STEP {step.n}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-6">
                  <Icon className="size-5 text-teal-600" />
                </div>

                <h3 className="text-[17px] font-semibold text-slate-900 mb-3 leading-snug tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[14px] text-slate-600 leading-relaxed m-0">
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

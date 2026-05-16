import { useState } from "react";
import { useInView, fadeIn } from "./hooks";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How long does setup take?",
    a: "Most teams are fully set up in under 30 minutes. Import your reps, create your first commission plan, upload your deals, and run. No onboarding call required.",
  },
  {
    q: "Do my reps need to be trained?",
    a: "No. Reps get a personal, secure portal link — no logins, no corporate credentials. They open it and see their earnings. That's it. The portal is designed to require zero training.",
  },
  {
    q: "What happens if I go over my rep limit?",
    a: "You'll see a clear warning before you hit your limit. You can add extra rep seats any time for $4 per rep/month — no plan upgrade required.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Each workspace is strictly isolated — your data is never shared with or visible to any other workspace. We're built on modern, high-availability infrastructure designed for business-grade security.",
  },
  {
    q: "Can I change plans later?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time through the billing portal. Changes apply at the start of your next billing cycle.",
  },
  {
    q: "Do you support complex commission structures?",
    a: "Yes. CommissionKit supports tiered plans, flat rates, per-rep custom percentages, accelerators, and clawback rules. If your team has custom structures, the Growth plan has everything you need.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-6 flex items-center justify-between gap-4 focus:outline-none"
      >
        <span className="text-[16px] font-semibold text-slate-900 leading-snug">
          {q}
        </span>
        <ChevronDown
          className={`size-5 text-slate-400 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? 300 : 0, opacity: open ? 1 : 0 }}
      >
        <p className="text-[15px] text-slate-600 leading-relaxed pb-6">
          {a}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-white py-28 px-6 border-b border-slate-200" id="faq">
      <div ref={ref} className="max-w-[760px] mx-auto" style={fadeIn(inView)}>
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-widest uppercase text-teal-600 mb-4">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold leading-tight text-slate-900 tracking-tight">
            Questions we get asked a lot
          </h2>
        </div>

        <div className="border-y border-slate-200">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-[15px] text-slate-600 font-medium">
            Still have questions?{" "}
            <a href="mailto:hello@commissionkit.com" className="text-teal-600 hover:text-teal-700 underline underline-offset-4">
              We're here to help.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

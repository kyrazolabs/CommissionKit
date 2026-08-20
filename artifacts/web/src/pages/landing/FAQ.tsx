import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { fadeIn, useInView } from "./hooks";

const FAQS = [
  {
    q: "How long does setup take?",
    a: "Setup time depends on your data, commission-plan complexity, and review process. Start by adding reps, creating a plan, and importing or connecting your deal data. A demo is available if you would like guidance.",
  },
  {
    q: "How does the 14-day trial work?",
    a: "Full access, no restrictions. Add your reps, create your plans, import your deals, run calculations. Everything works. No credit card required. If it's not for you, your data is automatically deleted after the trial ends. If it is, pick a plan and keep going.",
  },
  {
    q: "Do my reps need to be trained?",
    a: "No. Reps get a personal, secure portal link. No logins, no corporate credentials. They open it and see their earnings. That's it. The portal is designed to require zero training.",
  },
  {
    q: "What happens if I go over my rep limit?",
    a: "You'll see a clear warning before you hit your limit. You can add extra rep seats any time, no plan upgrade required.",
  },
  {
    q: "Can I change plans later?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time through the billing portal. Changes apply at the start of your next billing cycle.",
  },
  {
    q: "Do you support complex commission structures?",
    a: "Yes. CommissionKit supports tiered plans, flat rates, per-rep custom percentages, accelerators, and clawback rules. If your team has custom structures, the Growth plan has everything you need.",
  },
  {
    q: "What if my commission structure doesn't fit any standard engine?",
    a: "We build custom commission engines tailored to your exact calculation rules. From project-based matrices to multi-currency tiered splits: our team implements your logic as a dedicated engine, isolated from standard features so nothing else is affected. Reach out to sales to discuss your needs.",
  },
  {
    q: "What CRMs do you integrate with?",
    a: "CommissionKit has connectors for Odoo, Salesforce, and HubSpot. A custom REST API connector is available for compatible JSON REST sources. If your CRM is not listed, contact us to discuss whether its API fits the supported connection and mapping options.",
  },
  {
    q: "How is this different from Xactly or CaptivateIQ?",
    a: "CommissionKit is designed for teams that want to configure commission plans, calculate results, manage payouts, and connect supported source data in one workflow. Compare the product fit, configuration needs, and review process against your team's requirements before choosing a platform.",
  },
  {
    q: "Why not just keep using Excel?",
    a: "If you have 3 reps and a simple flat-rate plan, Excel works fine. But once you hit 5+ reps with tiered rates, accelerators, or multi-currency deals, spreadsheets become a full-time job. One wrong formula and someone gets underpaid. CommissionKit costs less than the time you spend fixing formula errors.",
  },
  {
    q: "Is my data secure? Do you have SOC 2?",
    a: "Every workspace is strictly isolated. Your data is never shared or visible to anyone else. We're built on modern infrastructure with encryption at rest and in transit. SOC 2 certification is on our roadmap. If your procurement team needs specifics, book a demo and we'll walk through our security practices.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-6 flex items-center justify-between gap-4 focus:outline-none"
      >
        <span className="text-base font-semibold text-foreground leading-snug">{q}</span>
        <ChevronDown
          className={`size-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? 300 : 0, opacity: open ? 1 : 0 }}
      >
        <p className="text-sm text-muted-foreground leading-relaxed pb-6">{a}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-muted/30 py-24 px-6 border-y border-border/60" id="faq">
      <div ref={ref} className="max-w-3xl mx-auto" style={fadeIn(inView)}>
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">FAQ</p>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold leading-tight text-foreground tracking-tight font-display">
            Questions we get asked a lot
          </h2>
        </div>

        <div className="border-y border-border/60 rounded-xl bg-card/40 px-6">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground font-medium">
            Still have questions?{" "}
            <a
              href="mailto:hello@commissionkit.co"
              className="text-primary hover:text-primary/80 underline underline-offset-4"
            >
              We're here to help.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

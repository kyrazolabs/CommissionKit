import { Cable, Cpu, Globe, Infinity as InfinityIcon } from "lucide-react";
import { fadeIn, useInView } from "./hooks";

const STATS = [
  { icon: Cpu, value: "3", label: "Commission Engines", sub: "Flat, tiered, accelerator" },
  { icon: Globe, value: "170+", label: "Currencies", sub: "Exchange rate snapshots" },
  { icon: Cable, value: "4", label: "CRM Connectors", sub: "Odoo, Salesforce, HubSpot, Custom" },
  {
    icon: InfinityIcon,
    value: "Unlimited",
    label: "Calculation Runs",
    sub: "Process anytime, no limits",
  },
];

const LOGOS = [
  { id: "odoo", label: "Odoo", src: "/plugins/odoo.webp" },
  { id: "salesforce", label: "Salesforce", src: "/plugins/salesforce.webp" },
  { id: "hubspot", label: "HubSpot", src: "/plugins/hubspot.webp" },
];

export function SocialProof() {
  const { ref, inView } = useInView(0.15);

  return (
    <section className="border-y border-card-border bg-card">
      <div ref={ref} className="max-w-6xl mx-auto px-6 py-10">
        {/* Trust badge */}
        <div className="flex justify-center mb-8" style={fadeIn(inView)}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-border/60 text-xs font-medium text-foreground">
            <span className="text-primary font-semibold">No demo. No sales call. No waiting.</span>
          </div>
        </div>

        {/* Capability stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6" style={fadeIn(inView)}>
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <s.icon className="size-5 text-primary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-display tabular-nums">
                {s.value}
              </div>
              <div className="text-sm font-semibold text-foreground mt-1">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Integrations strip */}
        <div
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
          style={fadeIn(inView, 120)}
        >
          <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
            Works with your stack
          </p>
          <div className="flex items-center gap-6 opacity-70">
            {LOGOS.map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-muted-foreground">
                <img src={l.src} alt={l.label} className="size-5 object-contain" />
                <span className="text-sm font-semibold tracking-tight">{l.label}</span>
              </div>
            ))}
            <span className="text-sm font-semibold text-muted-foreground/70">
              + custom REST API
            </span>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Set up in 30 minutes. Cancel anytime. No procurement required.
        </p>
      </div>
    </section>
  );
}

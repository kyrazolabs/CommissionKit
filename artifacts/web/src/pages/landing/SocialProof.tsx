import { useInView, fadeIn } from "./hooks";

const STATS = [
  { value: "8 days", label: "→ 4 hours", desc: "Commission cycle time" },
  { value: "99%", label: "accuracy", desc: "Disputes eliminated" },
  { value: "14 hrs", label: "saved", desc: "Per month, per team" },
  { value: "<30 min", label: "setup", desc: "No consultants needed" },
];

const LOGOS = [
  { id: "odoo", label: "Odoo", src: "/plugins/odoo.webp" },
  { id: "salesforce", label: "Salesforce", src: "/plugins/salesforce.webp" },
  { id: "hubspot", label: "HubSpot", src: "/plugins/hubspot.webp" },
];

export function SocialProof() {
  const { ref, inView } = useInView(0.15);

  return (
    <section className="border-t border-border/60">
      <div ref={ref} className="max-w-[1200px] mx-auto px-6 py-8">
        {/* What the product does */}
        <div className="text-center" style={fadeIn(inView)}>
          <p className="text-sm text-muted-foreground font-medium">
            Designed to replace manual spreadsheet workflows with automated commission runs, real-time rep visibility, and one-click processing across every plan.
          </p>
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
            <span className="text-sm font-semibold text-muted-foreground/70">+ custom REST API</span>
          </div>
        </div>
      </div>
    </section>
  );
}

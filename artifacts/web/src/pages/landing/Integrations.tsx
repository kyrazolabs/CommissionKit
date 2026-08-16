import { ArrowRight, Cable } from "lucide-react";
import { useInView, fadeIn } from "./hooks";

type Integration = {
  name: string;
  badge: string;
  desc: string;
  href: string;
  img?: string;
};

const INTEGRATIONS: Integration[] = [
  { name: "Odoo", badge: "ERP", desc: "Sync reps, sales orders, and invoices.", href: "/integrations/odoo", img: "/plugins/odoo.webp" },
  { name: "Salesforce", badge: "CRM", desc: "Sync users and opportunities via OAuth.", href: "/integrations/salesforce", img: "/plugins/salesforce.webp" },
  { name: "HubSpot", badge: "CRM", desc: "Sync owners and deals via token.", href: "/integrations/hubspot", img: "/plugins/hubspot.webp" },
  { name: "Custom REST API", badge: "API", desc: "Connect any ERP or CRM without code.", href: "/integrations/custom" },
];

export function Integrations() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-muted/30 border-y border-border/60" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Centered header */}
        <div className="text-center mb-14" style={fadeIn(inView)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-4">
            <Cable className="size-4 text-primary" />
            Integrations
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-foreground tracking-tight font-display">
            Plugs into the stack you already run
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
            Reps and deals sync automatically from your CRM or ERP. No manual exports, no copy-paste, no version conflicts.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {INTEGRATIONS.map((item, i) => (
            <a
              key={item.name}
              href={item.href}
              className="group flex flex-col rounded-xl border border-card-border bg-card p-4 hover-elevate transition-all duration-300 hover:border-primary/30"
              style={fadeIn(inView, i * 80)}
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted overflow-hidden">
                  {item.img ? (
                    <img src={item.img} alt={item.name} className="size-5 object-contain" />
                  ) : (
                    <Cable className="size-4 text-primary" />
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
                  {item.badge}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{item.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-grow">{item.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:gap-2 transition-all">
                Learn more
                <ArrowRight className="size-3" />
              </span>
            </a>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-10 text-center" style={fadeIn(inView, 400)}>
          <p className="text-sm text-muted-foreground">
            Scheduled syncs keep data fresh between runs. Don't see your tool?{" "}
            <a href="/integrations/custom" className="text-primary font-semibold hover:underline underline-offset-4">
              The custom REST API connects anything
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

import { Check, Cable } from "lucide-react";
import { useInView, fadeIn } from "./hooks";

export function Integrations() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto" ref={ref}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Connector cards */}
        <div className="order-2 lg:order-1" style={fadeIn(inView, 100)}>
          <div className="rounded-xl border border-border/60 bg-card/30 p-6 space-y-4">
            <ConnectorRow img="/plugins/odoo.webp" name="Odoo ERP" desc="Sync repos and deals automatically" />
            <ConnectorRow name="HubSpot CRM" desc="Sync owners and deals via token" src="/plugins/hubspot.webp" />
            <ConnectorRow name="Custom REST API" desc="Connect any ERP or CRM — no code needed" icon />
          </div>
        </div>

        {/* Text */}
        <div className="order-1 lg:order-2 space-y-6" style={fadeIn(inView, 0)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
            <Cable className="size-4 text-primary" />
            Integrations
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Connect Your Existing Tools</h2>
          <p className="text-base text-muted-foreground">
            CommissionKit plugs directly into the tools you already use. Sync your sales reps and deals automatically — no manual data entry, no spreadsheets, no errors.
          </p>
          <ul className="space-y-4 pt-4">
            {[
              "Native Odoo connector — sync reps and deals in one click.",
              "Custom REST API connector — connect any ERP or CRM with configurable field mapping, authentication, and pagination.",
              "Automatic sync scheduling — keep data fresh with hourly, daily, or real-time polling.",
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <Check className="size-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ConnectorRow({ name, desc, img, src, icon }: { name: string; desc: string; img?: string; src?: string; icon?: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-2 first:pt-0">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0 overflow-hidden">
        {img ? <img src={img} alt={name} className="size-5 object-contain" />
          : src ? <img src={src} alt={name} className="size-5 object-contain" />
          : icon ? <Cable className="size-4 text-primary" />
          : null}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

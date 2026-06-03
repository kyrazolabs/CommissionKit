import { Settings, Check } from "lucide-react";
import { useInView, fadeIn } from "./hooks";
import { Button } from "@/components/ui/button";

export function CustomEngine() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto border-b border-border/60">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12" style={fadeIn(inView)}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-6">
            <Settings className="size-4 text-primary" />
            Custom Engines
          </div>
          <h2 className="text-3xl lg:text-[32px] font-bold text-foreground mb-4 tracking-tight">
            Your rules. Your engine.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Standard plans don't fit every commission model. We build custom engines
            that match your exact business logic — isolated, fast, and production-ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" style={fadeIn(inView, 100)}>
          {[
            { title: "Bespoke Logic", desc: "Project-based matrices, margin slabs, tiered splits — whatever your reps earn by, we encode it." },
            { title: "Fully Isolated", desc: "Your engine runs independently. Zero impact on standard plans, deals, or other workspaces." },
            { title: "Your Data Model", desc: "Invoices, projects, custom fields — we model your data exactly as your business needs it." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/60 p-6 bg-white/80 backdrop-blur-sm">
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8" style={fadeIn(inView, 200)}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Need a custom engine?</h3>
              <p className="text-sm text-muted-foreground max-w-lg">
                Tell us how you calculate commissions. Our team designs, builds, and deploys a dedicated engine for your workspace. One-time setup fee, zero ongoing maintenance.
              </p>
            </div>
            <Button size="md" className="font-bold shadow-sm shrink-0" asChild>
              <a href="mailto:sales@commissionk.it">Talk to Sales</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Banknote, BarChart3, Users, Check, Plus, User } from "lucide-react";
import { useInView, fadeIn } from "./hooks";
import { Button } from "@/components/ui/button";

export function GlobalSupport() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-muted/30 border-y border-border/60">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
            Global support
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-foreground mb-4 tracking-tight font-display">Built for global teams</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Run commissions in 170+ currencies with exchange rates captured at run time. Regional teams stay on one system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2" style={fadeIn(inView, 100)}>
            <div
              className="bg-card rounded-2xl p-8 border border-card-border shadow-sm hover:shadow-md transition-all duration-300 h-full"
            >
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Banknote className="size-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Native multi-currency support</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Deal in USD, EUR, SAR, and over 160 other currencies. Conversions use your custom rates or synced market rates, captured as a snapshot when the run happens, so the math stays auditable later.
            </p>
            <div className="mt-6 flex gap-2">
              {['USD $', 'EUR €', 'SAR'].map(currency => (
                <span key={currency} className="px-3 py-1 bg-muted rounded-lg border border-border text-xs font-medium text-foreground shadow-sm">
                  {currency}
                </span>
              ))}
            </div>
            </div>
          </div>

          <div style={fadeIn(inView, 200)}>
            <div
              className="bg-card rounded-2xl p-8 border border-card-border shadow-sm hover:shadow-md transition-all duration-300 h-full"
            >
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <BarChart3 className="size-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Advanced analytics</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track performance trends and spot your top earners across regions with built-in reports.
            </p>
            </div>
          </div>

          <div className="lg:col-span-3" style={fadeIn(inView, 300)}>
            <div
              className="bg-card rounded-2xl p-8 border border-card-border shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full"
            >
            <div>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Users className="size-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Team workspaces with RBAC</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Run multiple workspaces with strict data isolation between them. Create custom roles like Sales Manager or Auditor and control exactly who can see and do what.
              </p>
              <ul className="space-y-2">
                {[
                  "Strict data isolation",
                  "Custom roles (Sales Manager, Auditor, and more)",
                  "Invite members by email"
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Check className="size-4 text-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-muted/40 rounded-xl p-6 border border-border/60 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="size-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Acme Sales</span>
                </div>
                <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider rounded">Owner</span>
              </div>

              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Mike Johnson</span>
                </div>
                <span className="px-2 py-1 bg-muted text-muted-foreground text-[10px] uppercase font-bold tracking-wider rounded">Auditor</span>
              </div>

              <Button variant="outline" className="w-full border-dashed text-muted-foreground hover:text-foreground">
                <Plus className="size-4 mr-2" /> Invite Member
              </Button>
            </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

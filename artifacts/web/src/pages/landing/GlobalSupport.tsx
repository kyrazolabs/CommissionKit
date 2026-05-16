import { Banknote, BarChart3, Users, Check, Plus } from "lucide-react";
import { useInView, fadeIn } from "./hooks";
import { Button } from "@/components/ui/button";

export function GlobalSupport() {
  const { ref, inView } = useInView();

  return (
    <section className="py-20 bg-white/40 backdrop-blur-md border-y border-border/60">
      <div ref={ref} className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="text-center mb-12" style={fadeIn(inView)}>
          <h2 className="text-3xl lg:text-[32px] font-bold text-foreground mb-4 tracking-tight">Built for Global Teams</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Scale internationally without worrying about currency conversions or regional complexities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div key="currency" className="lg:col-span-2" style={fadeIn(inView, 100)}>
            <div 
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border shadow-sm hover:shadow-md transition-all duration-300 h-full"
            >
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Banknote className="size-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Native Multi-Currency Support</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Handle deals in USD, EUR, SAR, and more. Our system automatically manages conversions based on custom or dynamic exchange rates, ensuring payouts are accurate regardless of where the deal was closed.
            </p>
            <div className="mt-6 flex gap-2">
              {['USD $', 'EUR €', 'SAR ⃁'].map(currency => (
                <span key={currency} className="px-3 py-1 bg-white/80 rounded-lg border text-xs font-medium text-foreground shadow-sm">
                  {currency}
                </span>
              ))}
            </div>
            </div>
          </div>

          <div key="analytics" style={fadeIn(inView, 200)}>
            <div 
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border shadow-sm hover:shadow-md transition-all duration-300 h-full"
            >
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <BarChart3 className="size-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Uncover performance trends, identify top earners, and generate leaderboards to foster healthy competition across regions.
            </p>
            </div>
          </div>

          <div key="rbac" className="lg:col-span-3" style={fadeIn(inView, 300)}>
            <div 
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full"
            >
            <div>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Users className="size-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Professional Team Workspaces & RBAC</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Securely manage multiple independent workspaces with our multi-tenant architecture. Define granular permissions and custom roles to match your exact organizational structure.
              </p>
              <ul className="space-y-2">
                {[
                  "Strict data isolation",
                  "Custom Role Management (Sales Manager, Auditor, etc.)",
                  "Single-click onboarding"
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Check className="size-4 text-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/80 rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">AS</div>
                  <span className="text-sm font-medium text-foreground">Acme Sales</span>
                </div>
                <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider rounded">Owner</span>
              </div>
              
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">MJ</div>
                  <span className="text-sm font-medium text-foreground">Mike Johnson</span>
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider rounded">Auditor</span>
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

import { Button } from "@/components/ui/button";
import { fadeIn, useInView } from "./hooks";

export function CustomEngine() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-24 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12" style={fadeIn(inView)}>
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
              Custom engines
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-foreground mb-4 tracking-tight font-display">
              Your rules. Your engine.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Standard plans don't fit every commission model. We build custom engines that match
              your exact business logic, isolated from the rest of the platform and ready for
              production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" style={fadeIn(inView, 100)}>
            {[
              {
                title: "Your exact rules",
                desc: "Project-based matrices, margin slabs, tiered splits. If you can write the rule down, we can encode it.",
              },
              {
                title: "Fully isolated",
                desc: "Your engine runs independently. Zero impact on standard plans, deals, or other workspaces.",
              },
              {
                title: "Your data model",
                desc: "Invoices, projects, custom fields: we model the data your business actually runs on.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-card-border p-6 bg-card">
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl border border-primary/20 bg-primary/5 p-8"
            style={fadeIn(inView, 200)}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Need a custom engine?</h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Tell us how you calculate commissions. We build a dedicated engine for your
                  workspace and deploy it isolated from standard features. One-time setup fee, no
                  ongoing maintenance on your side.
                </p>
              </div>
              <Button size="md" className="font-bold shadow-sm shrink-0" asChild>
                <a href="mailto:sales@commissionkit.co">Talk to Sales</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

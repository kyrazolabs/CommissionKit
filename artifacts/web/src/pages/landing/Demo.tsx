import { Button } from "@/components/ui/button";
import { useCalendly } from "@/hooks/use-calendly";
import { Analytics } from "@/lib/analytics";
import { fadeIn, useInView } from "./hooks";

export function Demo() {
  const { ref, inView } = useInView();
  const openCalendly = useCalendly();

  return (
    <section className="py-24" id="demo">
      <div className="max-w-6xl mx-auto px-6">
        <div ref={ref} className="max-w-2xl mx-auto text-center" style={fadeIn(inView)}>
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-4">
            Product demo
          </p>

          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-foreground tracking-tight font-display mb-4">
            See CommissionKit in action
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Book a 20-minute walkthrough. We'll show you how it works with your actual commission
            structure, not a canned demo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              variant="default"
              size="md"
              className="font-bold shadow-lg px-8 text-base h-9"
              onClick={() => {
                Analytics.landingCTAClick("demo_calendly");
                openCalendly();
              }}
            >
              Book a demo
            </Button>
            <Button
              variant="outline"
              size="md"
              className="font-bold bg-background/60 backdrop-blur-sm shadow-sm px-8 text-base h-9"
              asChild
            >
              <a href="/register" onClick={() => Analytics.landingCTAClick("demo_trial")}>
                Start free trial
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground/70">
            No credit card. No sales pitch. Just a real walkthrough.
          </p>
        </div>
      </div>
    </section>
  );
}

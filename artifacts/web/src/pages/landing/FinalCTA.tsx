import { useInView, fadeIn } from "./hooks";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { Analytics } from "@/lib/analytics";

export function FinalCTA() {
  const { ref, inView } = useInView(0.15);

  return (
    <section className="py-28 px-6 md:px-12 relative overflow-hidden bg-background">
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[480px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.14), transparent 62%)" }}
      />

      <div ref={ref} className="max-w-3xl mx-auto relative z-10 text-center" style={fadeIn(inView)}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-8">
          <Clock className="size-3.5" />
          Limited-time launch offer — 60% off forever
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-foreground mb-6 tracking-tight leading-[1.05] font-display">
          Stop running commissions in spreadsheets.
        </h2>

        <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl mx-auto">
          Join the finance teams who replaced 8-day commission cycles with 4-hour
          automated runs — and never looked back. Set up in minutes, free for 14 days.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="font-bold shadow-lg px-8 text-base group h-9" size="md">
            <a href="/register" onClick={() => Analytics.landingCTAClick("final_cta_start")}>
              Start Free Trial
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
          <Button variant="outline" asChild className="font-bold bg-background/60 backdrop-blur-sm shadow-sm px-8 text-base h-9" size="md">
            <a href="mailto:sales@commissionkit.co" onClick={() => Analytics.landingCTAClick("final_cta_sales")}>
              Talk to Sales
            </a>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground/70">
          No credit card required · Set up in under 10 minutes · Cancel anytime
        </p>
      </div>
    </section>
  );
}

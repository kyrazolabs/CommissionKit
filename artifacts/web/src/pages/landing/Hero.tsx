import { useInView, fadeIn } from "./hooks";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const { ref: inViewRef, inView } = useInView();

  return (
    <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" id="hero">
      {/* Decorative accent image */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-0">
        <img
          src="/decorative/style.webp"
          alt=""
          className="w-full h-full object-contain opacity-[0.12] dark:opacity-[0.06]"
        />
      </div>

      <div ref={inViewRef} className="max-w-5xl mx-auto text-center relative z-10 py-32">
        <div style={fadeIn(inView, 100)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-primary mb-8">
          8 days &rarr; 4 hours
        </div>

        <h1
          style={fadeIn(inView, 200)}
          className="text-6xl md:text-8xl lg:text-[96px] font-bold tracking-[-0.04em] text-foreground leading-[0.9] font-display"
        >
          Run commissions in minutes. Not days.
        </h1>

        <p
          style={fadeIn(inView, 300)}
          className="text-lg md:text-xl text-muted-foreground mt-8 mb-12 leading-relaxed max-w-2xl mx-auto"
        >
          One click. Every rep. Every deal. Commission runs that used to take 8 days now take 4 hours.
        </p>

        <div style={fadeIn(inView, 400)} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="w-full sm:w-auto font-bold shadow-lg rounded-xl px-10 h-12 text-base">
            <a href="/register">
              Start Free Trial
              <ArrowRight className="ml-2 size-4" />
            </a>
          </Button>
          <Button variant="outline" asChild size="lg" className="w-full sm:w-auto font-semibold rounded-xl px-8 h-12">
            <a href="#features">See How It Works</a>
          </Button>
        </div>

        <p style={fadeIn(inView, 500)} className="mt-6 text-sm text-muted-foreground/60">
          No credit card required &middot; 14-day free trial &middot; Set up in under 10 minutes
        </p>

        <div style={fadeIn(inView, 600)} className="mt-12 flex justify-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
            Join teams replacing 8-day spreadsheet cycles with 4-hour automated runs
          </div>
        </div>
      </div>
    </section>
  );
}

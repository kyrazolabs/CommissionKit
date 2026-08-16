import { useState } from "react";
import { useInView } from "./hooks";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { Analytics } from "@/lib/analytics";
import { AnimatedWords, AnimatedBlock } from "./AnimatedText";

export function Hero() {
  const { ref: inViewRef, inView } = useInView();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Analytics.landingCTAClick("hero_start");

    // Fire-and-forget lead capture before redirect
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";
    const leadEmail = email.trim();
    if (leadEmail) {
      fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: leadEmail, source: "hero" }),
        keepalive: true,
      }).catch(() => {});
    }

    const params = new URLSearchParams();
    if (leadEmail) params.set("email", leadEmail);
    window.location.href = `/register${params.toString() ? `?${params}` : ""}`;
  };

  return (
    <section className="min-h-[90vh] flex items-center justify-center px-6 relative overflow-hidden" id="hero">
      {/* Ambient gradient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[460px] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.16), transparent 62%)",
        }}
      />
      {/* Subtle curves */}
      <img
        src="/decorative/left-curves.svg"
        alt=""
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[30%] max-w-[360px] opacity-[0.10] dark:opacity-[0.06] pointer-events-none z-0"
      />
      <img
        src="/decorative/right-curves.svg"
        alt=""
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[30%] max-w-[360px] opacity-[0.10] dark:opacity-[0.06] pointer-events-none z-0"
      />

      <div ref={inViewRef} className="max-w-3xl mx-auto relative z-10 py-16 lg:py-20 w-full text-center">
        {/* Positioning pill */}
        <AnimatedBlock inView={inView} delay={0} className="inline-flex">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-border/60 text-xs font-medium text-foreground mb-6">
            <span className="text-muted-foreground">Self-serve commission platform</span>
            <span className="h-3 w-px bg-border" />
            <span className="text-primary font-semibold">No demo required</span>
          </div>
        </AnimatedBlock>

        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.07em] text-foreground leading-[0.95] font-display">
          <AnimatedWords text="Start running commissions 30 minutes from now." inView={inView} delay={0.15} />
        </h1>

        <AnimatedBlock inView={inView} delay={1.1} y={20}>
          <p className="text-base md:text-lg text-muted-foreground mt-6 mb-8 leading-relaxed max-w-xl mx-auto">
            One click processes every rep, deal, and plan. Try it during your lunch break. No credit card, no consultants, no waiting.
          </p>
        </AnimatedBlock>

        {/* What CommissionKit replaces */}
        <AnimatedBlock inView={inView} delay={1.7} y={20}>
          <div className="inline-block rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-border/60 px-6 py-4">
            <p className="text-base md:text-lg font-semibold text-foreground tracking-tight">
              Spreadsheets. Broken formulas. Angry reps. Replace all of it.
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              No more manual spreadsheets, shadow accounting, or end-of-month panic.
            </p>
          </div>
        </AnimatedBlock>

        {/* Email capture form */}
        <AnimatedBlock inView={inView} delay={1.3} y={20} className="mt-12">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto"
          >
            <div className="focus relative w-full sm:flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="w-full h-10 pl-10 pr-3 rounded-lg bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                aria-label="Email address"
              />
            </div>
            <Button type="submit" size="md" className="w-full h-9 sm:w-auto font-bold shadow-lg shrink-0 group">
              Start Now — Free
              <ArrowRight className="ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </form>
        </AnimatedBlock>

        <AnimatedBlock inView={inView} delay={1.5} y={12}>
          <p className="mt-5 text-xs text-muted-foreground/70 flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> No credit card required</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Set up in under 30 minutes</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Cancel anytime</span>
          </p>
        </AnimatedBlock>
      </div>
    </section>
  );
}

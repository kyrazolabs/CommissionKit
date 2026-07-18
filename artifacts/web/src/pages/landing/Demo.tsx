import { Play } from "lucide-react";
import { useInView, fadeIn } from "./hooks";
import { Analytics } from "@/lib/analytics";

export function Demo() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-muted/30 py-24 px-6 border-b border-border/60" id="demo">
      <div ref={ref} className="max-w-[1000px] mx-auto">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold leading-tight text-foreground tracking-tight font-display mb-4">
            See CommissionKit in action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how a RevOps manager runs a full quarter's commission in under 3 minutes.
          </p>
        </div>

        {/* Video Placeholder Container */}
        <a
          href="/register"
          onClick={() => Analytics.landingCTAClick("demo_video")}
          className="relative block rounded-2xl overflow-hidden bg-card border border-border shadow-xl group cursor-pointer"
          style={{ aspectRatio: "16/9", ...fadeIn(inView, 200) }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-card to-muted" />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.4)] group-hover:scale-110 transition-all duration-300">
              <Play className="size-6 text-white ml-1" fill="currentColor" />
            </div>
            <p className="text-foreground/80 font-medium mt-4 text-sm tracking-wide">
              Watch the 3-minute demo
            </p>
          </div>
        </a>

        {/* Quick stats under video */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 border-t border-border/60 pt-16">
          {[
            { label: "Average setup time", value: "< 30 mins" },
            { label: "Time saved per month", value: "14 hours" },
            { label: "Dispute reduction", value: "99%" },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center" style={fadeIn(inView, 300 + i * 100)}>
              <div className="text-3xl font-bold text-foreground mb-2 tracking-tight font-display tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

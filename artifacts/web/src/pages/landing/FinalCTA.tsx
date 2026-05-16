import { useInView, fadeIn } from "./hooks";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  const { ref, inView } = useInView(0.15);

  return (
    <section className="py-24 px-6 md:px-12 text-center relative overflow-hidden bg-background">
      <div ref={ref} className="max-w-2xl mx-auto relative z-10" style={fadeIn(inView)}>
        <h2 className="text-4xl md:text-[40px] font-bold text-foreground mb-6 tracking-tight leading-tight">
          Ready to scale with confidence?
        </h2>

        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          Join enterprise finance teams who have eliminated commission errors and reclaimed their end-of-month sanity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="font-bold shadow-lg">
            <a href="/register">Request a Demo</a>
          </Button>
          <Button variant="outline" asChild className="font-bold bg-background/60 backdrop-blur-sm shadow-sm">
            <a href="mailto:sales@commissionkit.com">Contact Sales</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

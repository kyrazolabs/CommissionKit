import { useScroll, useTransform, motion } from "framer-motion";
import { useInView, fadeIn } from "./hooks";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

function DashboardMockup() {
  return (
    <div className="w-full bg-sidebar rounded-xl overflow-hidden flex flex-col pointer-events-none select-none">
      {/* Image Content */}
      <div className="w-full aspect-video bg-sidebar relative">
        <img 
          src="/imgs/demo.jpg" 
          alt="Platform Demo" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

const LineSVG = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="353" 
    height="374" 
    viewBox="0 0 353 374" 
    fill="none" 
    className={`absolute xl:block hidden [&_stop]:[stop-color:hsl(var(--border))] pointer-events-none ${className}`}
  >
    <path 
      d="M352.667 3C352.667 1.52722 351.473 0.333313 350 0.333313C348.527 0.333313 347.333 1.52722 347.333 3C347.333 4.47275 348.527 5.66666 350 5.66666C351.473 5.66666 352.667 4.47275 352.667 3ZM-164.353 372.646C-164.549 372.841 -164.549 373.158 -164.354 373.353C-164.159 373.549 -163.842 373.549 -163.647 373.354L-164.353 372.646ZM199.473 10.018L199.119 9.66418L199.473 10.018ZM350 2.5H216.432V3.5H350V2.5ZM199.119 9.66418L-164.353 372.646L-163.647 373.354L199.826 10.3718L199.119 9.66418ZM216.432 2.5C209.94 2.5 203.713 5.07669 199.119 9.66418L199.826 10.3718C204.232 5.97153 210.205 3.5 216.432 3.5V2.5Z" 
      fill="url(#paint0_linear)"
    />
    <defs>
      <linearGradient id="paint0_linear" x1="-164" y1="188" x2="350" y2="188" gradientUnits="userSpaceOnUse">
        <stop stopOpacity="0" />
        <stop offset="0.095" />
      </linearGradient>
    </defs>
  </svg>
);

function AnimatedBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      {/* Pulse Rings */}
      <div className="absolute inset-0 rounded-3xl border border-primary/20 animate-pulse-border opacity-0 pointer-events-none" style={{ animationDelay: "0s" }} />
      <div className="absolute inset-0 rounded-3xl border border-primary/20 animate-pulse-border opacity-0 pointer-events-none" style={{ animationDelay: "0.4s" }} />
      <div className="absolute inset-0 rounded-3xl border border-primary/20 animate-pulse-border opacity-0 pointer-events-none" style={{ animationDelay: "0.8s" }} />
      <div className="absolute inset-0 rounded-3xl border border-primary/20 animate-pulse-border opacity-0 pointer-events-none" style={{ animationDelay: "1.2s" }} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function Hero({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { ref: inViewRef, inView } = useInView();
  const mockupRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: mockupRef,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const translateZ = useTransform(scrollYProgress, [0, 0.5], [-100, 0]);

  return (
    <section className="pt-32 pb-48 px-6 relative overflow-hidden" id="hero">
      {/* Lines Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <LineSVG className="top-16 -left-36 2xl:left-0 md:w-[36vw]" />
        <LineSVG className="top-16 -right-36 2xl:right-0 md:w-[36vw] scale-x-[-1]" />
        <LineSVG className="-top-14 -left-20 2xl:left-0 md:w-[44vw] scale-y-[-1]" />
        <LineSVG className="-top-14 -right-20 2xl:right-0 md:w-[44vw] scale-x-[-1] scale-y-[-1]" />
        <LineSVG className="top-[410px] -left-36 2xl:left-0 md:w-[48vw] scale-y-[0.5]" />
        <LineSVG className="top-[410px] -right-36 2xl:right-0 md:w-[48vw] scale-y-[0.5] scale-x-[-1]" />
      </div>

      <div ref={inViewRef} className="max-w-[1440px] mx-auto text-center relative z-10">
        
        <div className="max-w-3xl mx-auto mb-12">
          <h1
            style={fadeIn(inView, 100)}
            className="text-4xl md:text-5xl lg:text-[64px] font-bold tracking-tight text-foreground mb-6 leading-[1.1] mt-8"
          >
            Your reps close deals. <br />
            <span className="text-primary">CK handles the rest.</span>
          </h1>

          <p
            style={fadeIn(inView, 200)}
            className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            Automate commissions, track payouts, and give every rep real-time visibility into their earnings — so your team stops disputing and starts performing.
          </p>

          <div style={fadeIn(inView, 300)} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild className="w-full sm:w-auto font-bold shadow-md rounded-lg px-8">
              <a href="/register">Get Started</a>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto font-bold bg-background/50 backdrop-blur-sm rounded-lg px-8">
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </div>

        {/* Dashboard Mockup Container with 3D Effect & Pulse Border */}
        <div 
          ref={mockupRef}
          className="perspective-1000 mt-16 max-w-5xl mx-auto"
        >
          <motion.div 
            style={{ 
              rotateX, 
              scale,
              translateZ,
              transformStyle: "preserve-3d"
            }}
            className="relative"
          >
            <AnimatedBorder>
              <div className="relative rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] bg-sidebar border border-border/50 overflow-hidden">
                <DashboardMockup />
              </div>
            </AnimatedBorder>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { SocialProof } from "./SocialProof";
import { ValueProps } from "./ValueProps";
import { FeatureDeepDives } from "./FeatureDeepDives";
import { GlobalSupport } from "./GlobalSupport";
import { Pricing } from "./Pricing";
import { FAQ } from "./FAQ";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import { useIsMobile } from "./hooks";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// Mobile sticky CTA bar
// function MobileStickyCTA() {
//   return (
//     <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-md border-t border-border sm:hidden shadow-[0_-4px_14px_rgba(0,0,0,0.05)]">
//       <Button asChild className="w-full font-semibold shadow-sm" size="lg">
//         <a href="/register">Request a Demo</a>
//       </Button>
//     </div>
//   );
// }

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll inside the specific container instead of the window
  const { scrollY } = useScroll({ container: containerRef });

  const isMobile = useIsMobile();
  
  // Map scroll position (0px to 400px) to padding and border radius
  const paddingLeft = useTransform(scrollY, [0, 400], ["0px", isMobile ? "12px" : "56px"]);
  const paddingRight = useTransform(scrollY, [0, 400], ["0px", isMobile ? "12px" : "56px"]);
  const paddingTop = useTransform(scrollY, [0, 400], ["0px", isMobile ? "56px" : "56px"]);
  const paddingBottom = useTransform(scrollY, [0, 400], ["0px", isMobile ? "90px" : "50px"]);
  const borderRadius = useTransform(scrollY, [0, 400], ["0px", "16px"]);
  const borderWidth = useTransform(scrollY, [0, 400], ["0px", "1px"]);
  const maxWidth = useTransform(scrollY, [0, 800], ["2560px", isMobile ? "100%" : "1400px"]);

  // Force smooth scroll behaviour
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = "smooth"; };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar selection:bg-primary/20 selection:text-primary">
      <Navbar containerRef={containerRef} />
      <motion.div style={{ paddingLeft, paddingRight, paddingTop, paddingBottom }} className="flex flex-1 overflow-hidden justify-center items-start w-full">
        <motion.div 
          ref={containerRef}
          style={{ borderRadius, borderWidth, maxWidth }}
          className="w-full mx-auto h-full bg-background overflow-y-auto overflow-x-hidden border-card-border relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <Hero containerRef={containerRef} />
          <SocialProof />
          <ValueProps />
          <FeatureDeepDives />
          <GlobalSupport />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </motion.div>
      </motion.div>
      <Footer scrollY={scrollY} />
    </div>
  );
}

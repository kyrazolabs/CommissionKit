import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { SocialProof } from "./SocialProof";
import { HowItWorks } from "./HowItWorks";
import { ValueProps } from "./ValueProps";
import { FeatureDeepDives } from "./FeatureDeepDives";
import { Integrations } from "./Integrations";
import { GlobalSupport } from "./GlobalSupport";
import { Demo } from "./Demo";
import { Pricing } from "./Pricing";
import { CustomEngine } from "./CustomEngine";
import { FAQ } from "./FAQ";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import { useIsMobile } from "./hooks";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Analytics } from "@/lib/analytics";

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll({ container: containerRef });

  const isMobile = useIsMobile();
  
  const paddingLeft = useTransform(scrollY, [0, 400], ["0px", isMobile ? "12px" : "56px"]);
  const paddingRight = useTransform(scrollY, [0, 400], ["0px", isMobile ? "12px" : "56px"]);
  const paddingTop = useTransform(scrollY, [0, 400], ["0px", isMobile ? "56px" : "56px"]);
  const paddingBottom = useTransform(scrollY, [0, 400], ["0px", isMobile ? "90px" : "50px"]);
  const borderRadius = useTransform(scrollY, [0, 400], ["0px", "16px"]);
  const borderWidth = useTransform(scrollY, [0, 400], ["0px", "1px"]);
  const maxWidth = useTransform(scrollY, [0, 800], ["2560px", isMobile ? "100%" : "1400px"]);

  useEffect(() => {
    Analytics.landingView();
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
          <Hero />
          <SocialProof />
          <HowItWorks />
          <ValueProps />
          <FeatureDeepDives />
          <Integrations />
          <GlobalSupport />
          <Demo />
          <Pricing />
          <CustomEngine />
          <FAQ />
          <FinalCTA />
        </motion.div>
      </motion.div>
      <Footer scrollY={scrollY} />
    </div>
  );
}

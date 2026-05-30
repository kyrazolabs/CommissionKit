import { lazy, Suspense, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { SocialProof } from "./SocialProof";
import { ValueProps } from "./ValueProps";
import { useIsMobile } from "./hooks";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Footer } from "./Footer";

const FeatureDeepDives = lazy(() => import("./FeatureDeepDives").then(m => ({ default: m.FeatureDeepDives })));
const GlobalSupport = lazy(() => import("./GlobalSupport").then(m => ({ default: m.GlobalSupport })));
const Pricing = lazy(() => import("./Pricing").then(m => ({ default: m.Pricing })));
const FAQ = lazy(() => import("./FAQ").then(m => ({ default: m.FAQ })));
const FinalCTA = lazy(() => import("./FinalCTA").then(m => ({ default: m.FinalCTA })));

function LazySection({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-64" />}>
      {children}
    </Suspense>
  );
}

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
          <LazySection><FeatureDeepDives /></LazySection>
          <LazySection><GlobalSupport /></LazySection>
          <LazySection><Pricing /></LazySection>
          <LazySection><FAQ /></LazySection>
          <LazySection><FinalCTA /></LazySection>
        </motion.div>
      </motion.div>
      <Footer scrollY={scrollY} />
    </div>
  );
}

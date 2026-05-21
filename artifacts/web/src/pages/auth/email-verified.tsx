import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";

// Import decorative SVGs from public/decorative as raw strings
import leftCurves from "@/decorative/left-curves.svg?raw";
import rightCurves from "@/decorative/right-curves.svg?raw";
import bleftCurves from "@/decorative/bleft.curves.svg?raw";
import trightCurves from "@/decorative/tright-curves.svg?raw";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

export function EmailVerifiedPage() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();

  // Get the error from query params
  const error = new URLSearchParams(window.location.search).get("error");
  const isSuccess = !error;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar selection:bg-primary/20 selection:text-primary select-none">
      <div
        className={`flex flex-1 overflow-hidden justify-center items-stretch w-full ${
          isMobile ? "px-3 pt-14 pb-[90px]" : "px-14 pt-14 pb-12"
        }`}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full mx-auto h-full bg-background overflow-y-auto overflow-x-hidden border border-card-border rounded-2xl relative flex flex-col justify-between py-6 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* STATIC BACKGROUND DECORATIVE LAYER */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
            {/* Top Curve Frame */}
            <div className="absolute -top-1 left-0 right-0 flex items-end gap-16 px-6 w-full max-w-[1440px] mx-auto">
              <div
                className="flex-1 relative hidden md:block h-[132px] [&_stop]:[stop-color:hsl(var(--border))]"
                dangerouslySetInnerHTML={{ __html: leftCurves }}
              />
              <div className="w-20 flex-shrink-0" />
              <div
                className="flex-1 relative hidden md:block h-[130px] [&_stop]:[stop-color:hsl(var(--border))]"
                dangerouslySetInnerHTML={{ __html: rightCurves }}
              />
            </div>

            {/* Bottom Curve Frame */}
            <div className="absolute -bottom-1 left-0 right-0 flex items-end gap-12 px-6 w-full max-w-[1440px] mx-auto">
              <div
                className="flex-1 relative hidden md:block h-[137px] [&_stop]:[stop-color:hsl(var(--border))]"
                dangerouslySetInnerHTML={{ __html: bleftCurves }}
              />
              <div className="w-56 flex-shrink-0" />
              <div
                className="flex-1 relative hidden md:block h-[137px] [&_stop]:[stop-color:hsl(var(--border))]"
                dangerouslySetInnerHTML={{ __html: trightCurves }}
              />
            </div>
          </div>

          {/* TOP ROW: Branding logo */}
          <div className="w-full flex justify-center z-10 pt-4">
            <Link to="/" className="pointer-events-auto">
              <div className="hover:scale-105 active:scale-95 transition-all duration-300">
                <img src="/brand/logo-symbol.svg" alt="CommissionKit Logo" className="w-14 h-14" />
              </div>
            </Link>
          </div>

          {/* MIDDLE CONTENT: CENTERED FORM CARD */}
          <div className="flex-1 flex items-center justify-center z-10 py-6">
            <div className="w-full max-w-sm space-y-6">
              <motion.div
                layout
                className="overflow-hidden rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md shadow-xl shadow-black/[0.03] dark:shadow-white/[0.01]"
              >
                <Card className="border-none shadow-none bg-transparent">
                  <AnimatePresence mode="wait" initial={false}>
                    {!isSuccess ? (
                      <motion.div
                        key="error-state"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg text-destructive">Verification Failed</CardTitle>
                          <CardDescription className="mt-1">
                            The verification link is invalid or has expired.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-4 text-center">
                          <div className="rounded-full bg-destructive/10 p-3 text-destructive mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground max-w-[280px]">
                            Try signing in to your account. If your email is unverified, a fresh verification link will be sent automatically.
                          </p>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                          <Button
                            type="button"
                            className="w-full font-bold shadow-sm"
                            size="sm"
                            onClick={() => setLocation("/login")}
                          >
                            Go to login
                          </Button>
                        </CardFooter>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg">Email Verified</CardTitle>
                          <CardDescription className="mt-1">
                            Your email address has been successfully verified.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                          <div className="rounded-full bg-primary/10 p-3 text-primary animate-bounce">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground max-w-[280px]">
                            Thank you for verifying your email. You can now access your workspace and get started.
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button
                            type="button"
                            className="w-full font-bold shadow-sm"
                            size="sm"
                            onClick={() => setLocation("/login")}
                          >
                            Go to dashboard
                          </Button>
                        </CardFooter>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* BOTTOM ROW: Footer */}
          <div className="w-full flex justify-center pb-4 z-10">
            <div className="mx-auto flex flex-col items-center gap-3 pb-2 pointer-events-auto">
              <p className="text-[10px] tracking-widest text-muted-foreground/50 font-bold uppercase mt-1">
                © {new Date().getFullYear()} COMMISSIONKIT. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

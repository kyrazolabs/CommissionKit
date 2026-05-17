import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// Import decorative SVGs from public/decorative as raw strings
import leftCurves from "../../public/decorative/left-curves.svg?raw";
import rightCurves from "../../public/decorative/right-curves.svg?raw";
import bleftCurves from "../../public/decorative/bleft.curves.svg?raw";
import trightCurves from "../../public/decorative/tright-curves.svg?raw";

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

export function LoginPage({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const redirect = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await authClient.signIn.email({ 
          email, 
          password,
          callbackURL: redirect,
        });
        if (error) throw error;
      } else {
        const { error } = await authClient.signUp.email({ 
          email, 
          password,
          name: name || email.split("@")[0],
          callbackURL: redirect,
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Your account has been created successfully.",
        });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      toast({
        title: "Authentication error",
        description: err.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar selection:bg-primary/20 selection:text-primary select-none">
      <motion.div 
        initial={{ 
          paddingLeft: "0px", 
          paddingRight: "0px", 
          paddingTop: "0px", 
          paddingBottom: "0px" 
        }}
        animate={{ 
          paddingLeft: isMobile ? "12px" : "56px", 
          paddingRight: isMobile ? "12px" : "56px", 
          paddingTop: "56px", 
          paddingBottom: isMobile ? "90px" : "50px" 
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 overflow-hidden justify-center items-stretch w-full"
      >
        <motion.div 
          initial={{ borderRadius: "0px", borderWidth: "0px", opacity: 0, scale: 0.99 }}
          animate={{ borderRadius: "16px", borderWidth: "1px", opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mx-auto h-full bg-background overflow-y-auto overflow-x-hidden border border-card-border relative flex flex-col justify-between py-6 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* STATIC BACKGROUND DECORATIVE LAYER (Always locked at edges) */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
            {/* Top Curve Frame */}
            <div className="absolute top-0 left-0 right-0 flex items-end gap-16 px-6 w-full max-w-[1440px] mx-auto">
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
            <div className="absolute bottom-0 left-0 right-0 flex items-end gap-12 px-6 w-full max-w-[1440px] mx-auto">
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

          {/* TOP ROW: Branding logo (Static in z-10 interactive layer) */}
          <div className="w-full flex justify-center z-10 pt-4">
            <a href="/" className="pointer-events-auto">
              <div className="p-2 rounded-full bg-sidebar border border-border">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-card shadow-[0px_12px_24px_rgba(0,0,0,0.03)] hover:scale-105 hover:border-primary/30 transition-all duration-300">
                  <img src="/brand/logo-symbol.svg" alt="CommissionKit Logo" className="w-10 h-10" />
                </div>
              </div>
            </a>
          </div>

          {/* MIDDLE CONTENT: CENTERED FORM CARD */}
          <div className="flex-1 flex items-center justify-center z-10 py-6">
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center">
                <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                  Commission<span className="text-primary">Kit</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Sales Commission Platform
                </p>
              </div>

              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="pb-4">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <CardTitle className="text-lg">
                        {mode === "login" ? "Sign in" : "Create account"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {mode === "login"
                          ? "Enter your credentials to access your workspace."
                          : "Start tracking commissions for your team."}
                      </CardDescription>
                    </motion.div>
                  </AnimatePresence>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <motion.div layout className="space-y-4">
                    <CardContent className="space-y-4">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {mode === "signup" && (
                          <motion.div
                            key="signup-field"
                            initial={{ opacity: 0, y: -15, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 16 }}
                            exit={{ opacity: 0, y: -15, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-2 overflow-hidden"
                          >
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              type="text"
                              placeholder="John Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required={mode === "signup"}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div layout className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </motion.div>
                      <motion.div layout className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete={
                            mode === "login" ? "current-password" : "new-password"
                          }
                          minLength={8}
                        />
                      </motion.div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 mt-2">
                      <Button
                        type="submit"
                        className="w-full font-bold shadow-sm relative overflow-hidden"
                        disabled={loading}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={mode + (loading ? "-loading" : "")}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            {loading
                              ? "Please wait…"
                              : mode === "login"
                                ? "Sign in"
                                : "Create account"}
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        {mode === "login"
                          ? "Don't have an account?"
                          : "Already have an account?"}{" "}
                        <button
                          type="button"
                          className="text-primary font-medium hover:underline focus:outline-none"
                          onClick={() =>
                            setMode(mode === "login" ? "signup" : "login")
                          }
                        >
                          {mode === "login" ? "Sign up" : "Sign in"}
                        </button>
                      </p>
                    </CardFooter>
                  </motion.div>
                </form>
              </Card>
            </div>
          </div>

          {/* BOTTOM ROW: Centered social footer (Static in z-10 interactive layer) */}
          <div className="w-full flex justify-center pb-4 z-10">
            <div className="mx-auto flex flex-col items-center gap-4 pb-4 pointer-events-auto">
              <div className="rounded-full border border-border p-2 bg-sidebar">
                <div className="rounded-full flex items-center gap-2 p-1.5 bg-card shadow-[0px_4px_12px_rgba(0,0,0,0.03)] border border-border/45">
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.youtube.com"
                    className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4.5"
                    >
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                      <path d="m10 15 5-3-5-3z" />
                    </svg>
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.twitter.com"
                    className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4.5"
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://discord.com"
                    className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 127.14 96.36"
                      fill="currentColor"
                      className="size-4.5"
                    >
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.88,6.83,77.19,77.19,0,0,0,49.58,0,105.15,105.15,0,0,0,19.14,8.07C-3.41,41.76-3.41,75,19.14,96.36a107,107,0,0,0,32.22,16.3,82.49,82.49,0,0,0,6.83-11.12,68.86,68.86,0,0,1-10.74-5.18c.9-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,73.66,0c.86.71,1.76,1.39,2.66,2a68.86,68.86,0,0,1-10.74,5.18,82.49,82.49,0,0,0,6.83,11.12,107,107,0,0,0,32.22-16.3C130.55,75,130.55,41.76,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.23,60,73.23,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
                    </svg>
                  </a>
                </div>
              </div>
              <p className="text-[10px] tracking-wide text-muted-foreground/80 font-medium">
                © {new Date().getFullYear()} COMMISSIONKIT. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

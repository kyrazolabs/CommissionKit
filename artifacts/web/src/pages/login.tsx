import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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

export function LoginPage({ initialMode = "login" }: { initialMode?: "login" | "signup" | "forgot" }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
        window.location.href = redirect;
      } else if (mode === "signup") {
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
        window.location.href = redirect;
      } else if (mode === "forgot") {
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setEmailSent(true);
        toast({
          title: "Reset email sent",
          description: "If an account with that email exists, you will receive a password reset link.",
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

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirect || "/",
      });
    } catch (err: any) {
      toast({
        title: "Google sign-in failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
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

          {/* TOP ROW: Branding logo (Clean, transparent, no card background) */}
          <div className="w-full flex justify-center z-10 pt-4">
            <a href="/" className="pointer-events-auto">
              <div className="hover:scale-105 active:scale-95 transition-all duration-300">
                <img src="/brand/logo-symbol.svg" alt="CommissionKit Logo" className="w-14 h-14" />
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
              </div>

              <motion.div layout className="overflow-hidden rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md shadow-xl shadow-black/[0.03] dark:shadow-white/[0.01]">
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
                        {mode === "login"
                          ? "Welcome back"
                          : mode === "signup"
                          ? "Start your 14-day free trial"
                          : "Reset your password"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {mode === "login"
                          ? "Your team's commissions are waiting."
                          : mode === "signup"
                          ? "No credit card required · Setup in 30 minutes"
                          : "Enter your email to receive a password reset link."}
                      </CardDescription>
                    </motion.div>
                  </AnimatePresence>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <motion.div layout className="space-y-4">
                    <CardContent className="space-y-4">
                      <AnimatePresence mode="wait" initial={false}>
                        {mode === "forgot" && emailSent ? (
                          <motion.div
                            key="email-sent-success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center text-center py-4 space-y-4"
                          >
                            <div className="rounded-full bg-primary/10 p-3 text-primary">
                              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-semibold text-foreground">Check your inbox</h3>
                              <p className="text-sm text-muted-foreground max-w-[280px]">
                                We have sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div key="form-fields" className="space-y-4">
                            <AnimatePresence initial={false}>
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

                            <AnimatePresence initial={false}>
                              {mode !== "forgot" && (
                                <motion.div
                                  key="password-field"
                                  initial={{ opacity: 0, y: -15, height: 0, marginBottom: 0 }}
                                  animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 0 }}
                                  exit={{ opacity: 0, y: -15, height: 0, marginBottom: 0 }}
                                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                  className="space-y-2 overflow-hidden"
                                >
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {mode === "login" && (
                                      <button
                                        type="button"
                                        className="text-[12px] text-primary hover:underline font-medium focus:outline-none cursor-pointer"
                                        onClick={() => {
                                          setMode("forgot");
                                          setEmailSent(false);
                                        }}
                                      >
                                        Forgot password?
                                      </button>
                                    )}
                                  </div>
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
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Google Sign In Divider & Button (Only on login mode) */}
                      <AnimatePresence>
                        {mode === "login" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="space-y-4 overflow-hidden pt-1"
                          >
                            <div className="relative flex items-center">
                              <div className="flex-grow border-t border-border/40"></div>
                              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/45">Or continue with</span>
                              <div className="flex-grow border-t border-border/40"></div>
                            </div>
                            
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full font-bold flex items-center justify-center gap-2 bg-background/30 hover:bg-muted/40 border-border/50 text-foreground transition-all duration-200"
                              onClick={handleGoogleSignIn}
                            >
                              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                                <path
                                  fill="currentColor"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                              </svg>
                              Google
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 mt-2">
                      {mode === "forgot" && emailSent ? (
                        <Button
                          type="button"
                          className="w-full font-bold shadow-sm relative overflow-hidden"
                          size={'sm'}
                          onClick={() => {
                            setMode("login");
                            setEmailSent(false);
                          }}
                        >
                          Back to sign in
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="w-full font-bold shadow-sm relative overflow-hidden"
                          disabled={loading} size={'sm'}
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
                                  : mode === "signup"
                                    ? "Create account"
                                    : "Send reset link"}
                            </motion.span>
                          </AnimatePresence>
                        </Button>
                      )}

                      {/* Trust Signals (Only on register mode) */}
                      <AnimatePresence>
                        {mode === "signup" && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground/80 font-medium tracking-wide mt-1"
                          >
                            <span>🔒 No credit card required</span>
                            <span className="text-muted-foreground/30">•</span>
                            <span>14-day free trial</span>
                            <span className="text-muted-foreground/30">•</span>
                            <span>Cancel anytime</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!emailSent && (
                        <p className="text-sm text-muted-foreground text-center">
                          {mode === "login" ? (
                            <>
                              Don't have an account?{" "}
                              <button
                                type="button"
                                className="text-primary font-medium hover:underline focus:outline-none cursor-pointer"
                                onClick={() => setMode("signup")}
                              >
                                Sign up
                              </button>
                            </>
                          ) : mode === "signup" ? (
                            <>
                              Already have an account?{" "}
                              <button
                                type="button"
                                className="text-primary font-medium hover:underline focus:outline-none cursor-pointer"
                                onClick={() => setMode("login")}
                              >
                                Sign in
                              </button>
                            </>
                          ) : (
                            <>
                              Remembered your password?{" "}
                              <button
                                type="button"
                                className="text-primary font-medium hover:underline focus:outline-none cursor-pointer"
                                onClick={() => {
                                  setMode("login");
                                  setEmailSent(false);
                                }}
                              >
                                Sign in
                              </button>
                            </>
                          )}
                        </p>
                      )}
                    </CardFooter>
                  </motion.div>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>

          {/* BOTTOM ROW: Centered social footer (Clean, flat, transparent, no background badges) */}
          <div className="w-full flex justify-center pb-4 z-10">
            <div className="mx-auto flex flex-col items-center gap-3 pb-2 pointer-events-auto">
              {/* Clean social icons row
              <div className="flex items-center gap-4">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://youtube.com"
                  className="text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-200"
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
                  href="https://twitter.com"
                  className="text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-200"
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
                  className="text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-200"
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
              </div> */}
              <p className="text-[10px] tracking-widest text-muted-foreground/50 font-bold uppercase mt-1">
                © {new Date().getFullYear()} COMMISSIONKIT. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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

export function ResetPasswordPage() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // Get the token from query params
  const token = new URLSearchParams(window.location.search).get("token");

  // Validations
  const isLengthValid = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const doPasswordsMatch = password === confirmPassword && password.length > 0;
  const isFormValid = isLengthValid && hasNumber && hasSpecial && doPasswordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: "Error",
        description: "Password reset token is missing.",
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid) {
      toast({
        title: "Validation error",
        description: "Please ensure all password requirements are met.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
    } catch (err: any) {
      console.error("Password reset error:", err);
      toast({
        title: "Password reset failed",
        description: err.message ?? "An error occurred while resetting your password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
                    {!token ? (
                      <motion.div
                        key="missing-token"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg text-destructive">Invalid or Expired Link</CardTitle>
                          <CardDescription className="mt-1">
                            This password reset link is invalid, has expired, or is missing the verification token.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-4 text-center">
                          <div className="rounded-full bg-destructive/10 p-3 text-destructive mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground max-w-[280px]">
                            Please request a new password reset link to securely reset your credentials.
                          </p>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                          <Button
                            type="button"
                            className="w-full font-bold shadow-sm"
                            onClick={() => setLocation("/forgot-password")}
                          >
                            Request new reset link
                          </Button>
                          <Link to="/login" className="text-sm text-primary font-medium hover:underline text-center">
                            Back to sign in
                          </Link>
                        </CardFooter>
                      </motion.div>
                    ) : success ? (
                      <motion.div
                        key="success-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg">Password Reset Success</CardTitle>
                          <CardDescription className="mt-1">
                            Your password has been successfully updated.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                          <div className="rounded-full bg-primary/10 p-3 text-primary">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground max-w-[280px]">
                            You can now proceed to log in with your brand new credentials.
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button
                            type="button"
                            className="w-full font-bold shadow-sm"
                            onClick={() => setLocation("/login")}
                          >
                            Go to login page
                          </Button>
                        </CardFooter>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="reset-form"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25 }}
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg">Create New Password</CardTitle>
                          <CardDescription className="mt-1">
                            Please choose a strong password that you do not use elsewhere.
                          </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="password">New Password</Label>
                              <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="confirm-password">Confirm Password</Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                              />
                            </div>

                            {/* Requirements indicators with premium transitions */}
                            <div className="space-y-2 pt-2 border-t border-border/20">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Password Requirements</p>
                              
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${isLengthValid ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`} />
                                <span className={isLengthValid ? 'text-foreground font-medium' : 'text-muted-foreground'}>At least 8 characters</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${hasNumber ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`} />
                                <span className={hasNumber ? 'text-foreground font-medium' : 'text-muted-foreground'}>At least 1 number</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${hasSpecial ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`} />
                                <span className={hasSpecial ? 'text-foreground font-medium' : 'text-muted-foreground'}>At least 1 special character</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${doPasswordsMatch ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`} />
                                <span className={doPasswordsMatch ? 'text-foreground font-medium' : 'text-muted-foreground'}>Passwords match</span>
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="flex flex-col gap-3 mt-2">
                            <Button
                              type="submit"
                              className="w-full font-bold shadow-sm relative overflow-hidden"
                              disabled={loading || !isFormValid}
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                  key={loading ? "loading" : "idle"}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  {loading ? "Updating password…" : "Reset password"}
                                </motion.span>
                              </AnimatePresence>
                            </Button>

                            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground text-center">
                              Back to sign in
                            </Link>
                          </CardFooter>
                        </form>
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

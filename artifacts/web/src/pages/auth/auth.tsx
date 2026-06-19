import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Analytics } from "@/lib/analytics";

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

export function AuthPage({ initialMode = "login" }: { initialMode?: "login" | "signup" | "forgot" }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const modeInitialized = useRef(false);

  useEffect(() => {
    if (!modeInitialized.current) {
      modeInitialized.current = true;
      return;
    }
    const prevMode = document.body.getAttribute("data-auth-prev-mode");
    if (prevMode && prevMode !== mode) {
      Analytics.authModeSwitch(prevMode, mode);
    }
    document.body.setAttribute("data-auth-prev-mode", mode);
  }, [mode]);

  useEffect(() => {
    if (initialMode === "login") Analytics.authLoginView();
    else if (initialMode === "signup") Analytics.authSignupView();
    else if (initialMode === "forgot") Analytics.authForgotView();
  }, []);

  // Count down the resend cooldown every second
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const searchParams = new URLSearchParams(window.location.search);
  const redirect = searchParams.get("redirect") || "/dash";

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendLoading || !email) return;
    Analytics.authResendVerification();
    setResendLoading(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: window.location.origin + "/email-verified",
      });
      if (error) throw error;
      setResendCooldown(60);
      toast({
        title: t("auth.verificationEmailSent"),
        description: t("auth.verificationEmailSentDescription"),
      });
    } catch (err: any) {
      toast({
        title: t("auth.failedToResend"),
        description: err.message ?? t("common.somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        Analytics.authLoginAttempt("email");
        const { error } = await authClient.signIn.email({
          email,
          password,
          callbackURL: redirect,
        });
        if (error) throw error;
        Analytics.authLoginSuccess("email");
        window.location.href = redirect;
      } else if (mode === "signup") {
        Analytics.authSignupAttempt();
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
          callbackURL: redirect,
        });
        if (error) throw error;
        Analytics.authSignupSuccess();
        toast({
          title: t("auth.verificationEmailSent"),
          description: t("auth.verificationEmailSentDescription"),
        });
        setVerificationSent(true);
      } else if (mode === "forgot") {
        Analytics.authForgotRequest();
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setEmailSent(true);
        toast({
          title: t("auth.resetEmailSent"),
          description: t("auth.resetEmailSentDescription"),
        });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const isUnverified = err.code === "EMAIL_NOT_VERIFIED";

      if (mode === "login") {
        Analytics.authLoginFailed("email", isUnverified ? "email_not_verified" : (err.message ?? "unknown"));
      }

      if (isUnverified) {
        setVerificationSent(true);
        // Automatically dispatch a fresh verification link so the user
        // doesn't have to click anything extra — failures are silent here
        // because the resend button lets them retry manually.
        authClient
          .sendVerificationEmail({
            email,
            callbackURL: window.location.origin + "/email-verified",
          })
          .then(({ error: sendErr }) => {
            if (sendErr) console.warn("Auto-resend failed:", sendErr);
          });
        setResendCooldown(60);
        toast({
          title: t("auth.verificationRequired"),
          description: t("auth.verificationRequiredDescription"),
        });
      } else {
        toast({
          title: t("auth.authenticationError"),
          description: err.message ?? t("common.somethingWentWrong"),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Analytics.authLoginAttempt("google");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirect || "/",
      });
    } catch (err: any) {
      Analytics.authLoginFailed("google", err.message ?? "unknown");
      toast({
        title: t("auth.googleSignInFailed"),
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
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
              <motion.div layout className="overflow-hidden rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md shadow-xl shadow-black/[0.03] dark:shadow-white/[0.01]">
                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="pb-4">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={verificationSent ? "verification" : mode}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <CardTitle className="text-lg">
                          {verificationSent
                            ? t("auth.verifyYourEmail")
                            : mode === "login"
                              ? t("auth.welcomeBack")
                              : mode === "signup"
                                ? t("auth.startFreeTrial")
                                : t("auth.resetYourPassword")}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {verificationSent
                            ? t("auth.weSentActivationLink")
                            : mode === "login"
                              ? t("auth.yourTeamCommissionsAreWaiting")
                              : mode === "signup"
                                ? t("auth.noCreditCardSetup")
                                : t("auth.enterEmailForReset")}
                        </CardDescription>
                      </motion.div>
                    </AnimatePresence>
                  </CardHeader>
                  <form onSubmit={handleSubmit}>
                    <motion.div layout className="space-y-4">
                      <CardContent className="space-y-4">
                        <AnimatePresence mode="wait" initial={false}>
                          {verificationSent ? (
                            <motion.div
                              key="verification-sent-success"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="flex flex-col items-center justify-center text-center py-4 space-y-4"
                            >
                              <div className="rounded-full bg-primary/10 p-3 text-primary">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="space-y-2">
                                <h3 className="font-semibold text-foreground">{t("auth.checkYourInbox")}</h3>
                                <p className="text-sm text-muted-foreground max-w-[280px]">
                                  {t("auth.verificationLinkSentTo", { email })}
                                </p>
                              </div>
                            </motion.div>
                          ) : mode === "forgot" && emailSent ? (
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
                                <h3 className="font-semibold text-foreground">{t("auth.checkYourInbox")}</h3>
                                <p className="text-sm text-muted-foreground max-w-[280px]">
                                  {t("auth.passwordResetLinkSentTo", { email })}
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
                                    <Label htmlFor="name">{t("auth.fullName")}</Label>
                                    <Input
                                      id="name"
                                      type="text"
                                      placeholder={t("auth.defaultNamePlaceholder")}
                                      value={name}
                                      onChange={(e) => setName(e.target.value)}
                                      required={mode === "signup"}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <motion.div layout className="space-y-2">
                                <Label htmlFor="email">{t("auth.email")}</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder={t("auth.emailPlaceholder")}
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
                                      <Label htmlFor="password">{t("auth.password")}</Label>
                                      {mode === "login" && (
                                        <button
                                          type="button"
                                          className="text-[12px] text-primary hover:underline font-medium focus:outline-none cursor-pointer"
                                          onClick={() => {
                                            setMode("forgot");
                                            setEmailSent(false);
                                          }}
                                        >
                                          {t("auth.forgotPassword")}
                                        </button>
                                      )}
                                    </div>
                                    <Input
                                      id="password"
                                      type="password"
                                      placeholder=""
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
                          {mode === "login" && !verificationSent && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="space-y-4 overflow-hidden pt-1"
                            >
                              <div className="relative flex items-center">
                                <div className="flex-grow border-t border-border/40"></div>
                                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/45">{t("auth.orContinueWith")}</span>
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
                        {verificationSent ? (
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              type="button"
                              className="w-full font-bold shadow-sm relative overflow-hidden"
                              
                              disabled={resendLoading || resendCooldown > 0}
                              onClick={handleResendVerification}
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                  key={resendLoading ? "resending" : resendCooldown > 0 ? "cooldown" : "idle"}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  {resendLoading
                                    ? t("auth.sending")
                                    : resendCooldown > 0
                                      ? t("auth.resendIn", { seconds: resendCooldown })
                                      : t("auth.resendVerificationEmail")}
                                </motion.span>
                              </AnimatePresence>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full font-medium text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setVerificationSent(false);
                                setResendCooldown(0);
                                setMode("login");
                              }}
                            >
                              {t("common.backToSignIn")}
                            </Button>
                          </div>
                        ) : mode === "forgot" && emailSent ? (
                          <Button
                            type="button"
                            className="w-full font-bold shadow-sm relative overflow-hidden"
                            
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
                                  ? t("common.pleaseWait")
                                  : mode === "login"
                                    ? t("auth.signIn")
                                    : mode === "signup"
                                      ? t("auth.createAccount")
                                      : t("auth.sendResetLink")}
                              </motion.span>
                            </AnimatePresence>
                          </Button>
                        )}

                        {/* Trust Signals (Only on register mode, and when not verified sent) */}
                        <AnimatePresence>
                          {mode === "signup" && !verificationSent && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground/80 font-medium tracking-wide mt-1"
                            >
                              <span>{t("auth.noCreditCardRequired")}</span>
                              <span className="text-muted-foreground/30">•</span>
                              <span>{t("auth.fourteenDayFreeTrial")}</span>
                              <span className="text-muted-foreground/30">•</span>
                              <span>{t("auth.cancelAnytime")}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!emailSent && !verificationSent && (
                          <p className="text-sm text-muted-foreground text-center">
                            {mode === "login" ? (
                              <>
                                {t("auth.dontHaveAccount")}{" "}
                                <button
                                  type="button"
                                  className="text-primary font-medium hover:underline focus:outline-none cursor-pointer"
                                  onClick={() => {
                                    setMode("signup");
                                    setVerificationSent(false);
                                  }}
                                >
                                  {t("auth.signUp")}
                                </button>
                              </>
                            ) : mode === "signup" ? (
                              <>
                                {t("auth.alreadyHaveAccount")}{" "}
                                <button
                                  type="button"
                                  className="text-primary font-medium hover:underline focus:outline-none cursor-pointer"
                                  onClick={() => {
                                    setMode("login");
                                    setVerificationSent(false);
                                  }}
                                >
                                  {t("auth.signIn")}
                                </button>
                              </>
                            ) : (
                              <>
                                {t("auth.rememberedYourPassword")}{" "}
                                <button
                                  type="button"
                                  className="text-primary font-medium hover:underline focus:outline-none cursor-pointer"
                                  onClick={() => {
                                    setMode("login");
                                    setEmailSent(false);
                                    setVerificationSent(false);
                                  }}
                                >
                                  {t("auth.signIn")}
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
              <p className="text-[10px] tracking-widest text-muted-foreground/50 font-bold uppercase mt-1">
                {t("auth.commissionKitAllRightsReserved", { year: new Date().getFullYear() })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

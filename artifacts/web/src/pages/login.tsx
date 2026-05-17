import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Import decorative SVGs from public/decorative as raw strings
import leftCurves from "../../public/decorative/left-curves.svg?raw";
import rightCurves from "../../public/decorative/right-curves.svg?raw";
import bleftCurves from "../../public/decorative/bleft.curves.svg?raw";
import trightCurves from "../../public/decorative/tright-curves.svg?raw";

export function LoginPage({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
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
    <div className="overflow-hidden bg-sidebar w-full min-h-screen relative flex flex-col justify-between py-6 px-6 select-none">
      <div className="flex items-end gap-16 mb-4 w-full max-w-[1440px] mx-auto select-none pointer-events-none">
        {/* Left curves */}
        <div 
          className="flex-1 relative hidden md:block h-[132px] [&_stop]:[stop-color:hsl(var(--border))]"
          dangerouslySetInnerHTML={{ __html: leftCurves }}
        />

        {/* Logo circle button */}
        <a href="/" className="mx-auto md:mx-0 pointer-events-auto">
          <div className="translate-y-4 p-2 rounded-full bg-sidebar border border-border">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-card shadow-[0px_12px_24px_rgba(0,0,0,0.03)] hover:scale-105 hover:border-primary/30 transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="27"
                height="30"
                viewBox="0 0 27 30"
                fill="none"
                className="fill-foreground"
              >
                <g filter="url(#filter0_dddddddd_6308_225712)">
                  <path d="M13.0843 4.83144C11.76 4.83144 10.4487 5.09227 9.22519 5.59906C8.00171 6.10584 6.89003 6.84864 5.95362 7.78505C5.0172 8.72147 4.2744 9.83315 3.76762 11.0566C3.26084 12.2801 3 13.5914 3 14.9157C3 16.24 3.26084 17.5513 3.76762 18.7748C4.2744 19.9983 5.01721 21.11 5.95362 22.0464C6.89003 22.9828 8.00171 23.7256 9.22519 24.2324C10.4487 24.7392 11.76 25 13.0843 25L13.0843 4.83144Z"></path>
                </g>
                <g filter="url(#filter1_dddddddd_6308_225712)">
                  <path d="M13.3572 21.1686C14.6815 21.1686 15.9928 20.9077 17.2163 20.4009C18.4398 19.8942 19.5514 19.1514 20.4878 18.2149C21.4243 17.2785 22.1671 16.1669 22.6738 14.9434C23.1806 13.7199 23.4415 12.4086 23.4415 11.0843C23.4415 9.76 23.1806 8.44868 22.6738 7.22519C22.1671 6.00171 21.4243 4.89003 20.4878 3.95362C19.5514 3.01721 18.4398 2.2744 17.2163 1.76762C15.9928 1.26084 14.6815 0.999999 13.3572 1L13.3572 21.1686Z"></path>
                </g>
                <defs>
                  <filter
                    id="filter0_dddddddd_6308_225712"
                    x="0.0040288"
                    y="3.83276"
                    width="16.0762"
                    height="26.1605"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood
                      floodOpacity="0"
                      result="BackgroundImageFix"
                    ></feFlood>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.0249664"></feOffset>
                    <feGaussianBlur stdDeviation="0.0249664"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.0499329"></feOffset>
                    <feGaussianBlur stdDeviation="0.0374496"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect1_dropShadow_6308_225712"
                      result="effect2_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.0998657"></feOffset>
                    <feGaussianBlur stdDeviation="0.0998657"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect2_dropShadow_6308_225712"
                      result="effect3_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.199731"></feOffset>
                    <feGaussianBlur stdDeviation="0.149799"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect3_dropShadow_6308_225712"
                      result="effect4_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.399463"></feOffset>
                    <feGaussianBlur stdDeviation="0.299597"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect4_dropShadow_6308_225712"
                      result="effect5_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.599194"></feOffset>
                    <feGaussianBlur stdDeviation="0.399463"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect5_dropShadow_6308_225712"
                      result="effect6_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dx="-0.399463" dy="1.39812"></feOffset>
                    <feGaussianBlur stdDeviation="0.798926"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="plus-darker"
                      in2="effect6_dropShadow_6308_225712"
                      result="effect7_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="1.99731"></feOffset>
                    <feGaussianBlur stdDeviation="1.49799"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="plus-darker"
                      in2="effect7_dropShadow_6308_225712"
                      result="effect8_dropShadow_6308_225712"
                    ></feBlend>
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect8_dropShadow_6308_225712"
                      result="shape"
                    ></feBlend>
                  </filter>
                  <filter
                    id="filter1_dddddddd_6308_225712"
                    x="10.3612"
                    y="0.00134289"
                    width="16.0762"
                    height="26.1605"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood
                      floodOpacity="0"
                      result="BackgroundImageFix"
                    ></feFlood>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.0249664"></feOffset>
                    <feGaussianBlur stdDeviation="0.0249664"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.0499329"></feOffset>
                    <feGaussianBlur stdDeviation="0.0374496"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect1_dropShadow_6308_225712"
                      result="effect2_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.0998657"></feOffset>
                    <feGaussianBlur stdDeviation="0.0998657"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect2_dropShadow_6308_225712"
                      result="effect3_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.199731"></feOffset>
                    <feGaussianBlur stdDeviation="0.149799"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect3_dropShadow_6308_225712"
                      result="effect4_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.399463"></feOffset>
                    <feGaussianBlur stdDeviation="0.299597"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect4_dropShadow_6308_225712"
                      result="effect5_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="0.599194"></feOffset>
                    <feGaussianBlur stdDeviation="0.399463"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="color-burn"
                      in2="effect5_dropShadow_6308_225712"
                      result="effect6_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dx="-0.399463" dy="1.39812"></feOffset>
                    <feGaussianBlur stdDeviation="0.798926"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="plus-darker"
                      in2="effect6_dropShadow_6308_225712"
                      result="effect7_dropShadow_6308_225712"
                    ></feBlend>
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    ></feColorMatrix>
                    <feOffset dy="1.99731"></feOffset>
                    <feGaussianBlur stdDeviation="1.49799"></feGaussianBlur>
                    <feComposite in2="hardAlpha" operator="out"></feComposite>
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0"
                    ></feColorMatrix>
                    <feBlend
                      mode="plus-darker"
                      in2="effect7_dropShadow_6308_225712"
                      result="effect8_dropShadow_6308_225712"
                    ></feBlend>
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect8_dropShadow_6308_225712"
                      result="shape"
                    ></feBlend>
                  </filter>
                </defs>
              </svg>
            </div>
          </div>
        </a>

        {/* Right curves */}
        <div 
          className="flex-1 relative hidden md:block h-[130px] [&_stop]:[stop-color:hsl(var(--border))]"
          dangerouslySetInnerHTML={{ __html: rightCurves }}
        />
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

          <Card className="border border-card-border/80 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {mode === "login" ? "Sign in" : "Create account"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Enter your credentials to access your workspace."
                  : "Start tracking commissions for your team."}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={mode === "signup"}
                    />
                  </div>
                )}
                <div className="space-y-2">
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
                </div>
                <div className="space-y-2">
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
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full font-bold shadow-sm"
                  disabled={loading}
                >
                  {loading
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign in"
                      : "Create account"}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  {mode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={() =>
                      setMode(mode === "login" ? "signup" : "login")
                    }
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* BOTTOM ROW: Accent curves and centered social footer */}
      <div className="flex items-end gap-12 w-full max-w-[1440px] mx-auto mt-4 pointer-events-none select-none">
        {/* Bottom Left curves */}
        <div 
          className="flex-1 relative hidden md:block h-[137px] [&_stop]:[stop-color:hsl(var(--border))]"
          dangerouslySetInnerHTML={{ __html: bleftCurves }}
        />

        {/* Center content (Social links & copyright) */}
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

        {/* Bottom Right curves */}
        <div 
          className="flex-1 relative hidden md:block h-[137px] [&_stop]:[stop-color:hsl(var(--border))]"
          dangerouslySetInnerHTML={{ __html: trightCurves }}
        />
      </div>
    </div>
  );
}

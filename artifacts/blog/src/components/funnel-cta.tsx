"use client";

import { ArrowRight, BookOpen, Check, ExternalLink, LoaderCircle, Mail, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trackCtaClick, trackCtaView, trackSubscribe } from "@/lib/analytics";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://commissionkit.co";

// ─── Funnel stage configs ───────────────────────────────────────────────────

interface FunnelStage {
  funnel: string;
  stage: string;
  heading: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  primaryExternal?: boolean;
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryExternal?: boolean;
  icon: "Zap" | "BookOpen" | "Mail";
  action: string;
}

const STAGE_CONFIGS: Record<
  string,
  Record<
    string,
    Omit<FunnelStage, "primaryHref" | "secondaryHref"> & {
      primaryHrefTemplate: string;
      secondaryHrefTemplate?: string;
    }
  >
> = {
  odoo: {
    tofu: {
      funnel: "odoo",
      stage: "tofu",
      heading:
        "See exactly how spreadsheets, custom modules, and dedicated software compare for Odoo commissions",
      description:
        "Real numbers, honest tradeoffs, no marketing fluff. Find out what actually works for teams your size.",
      primaryLabel: "Compare Your Options",
      primaryHrefTemplate: "/blog/{lang}/odoo-commission-options-compared",
      icon: "BookOpen",
      action: "compare",
    },
    mofu2: {
      funnel: "odoo",
      stage: "mofu2",
      heading: "Ready to automate your Odoo commission workflow?",
      description:
        "Learn how to connect Odoo to CommissionKit in under 15 minutes — no spreadsheets, no custom modules, no manual exports.",
      primaryLabel: "See the Step-by-Step Guide",
      primaryHrefTemplate: "/blog/{lang}/odoo-commission-automation",
      icon: "BookOpen",
      action: "guide",
    },
    mofu1: {
      funnel: "odoo",
      stage: "mofu1",
      heading: "Start automating your Odoo commissions today",
      description:
        "Connect your Odoo instance, sync your sales orders, and run your first commission calculation — all in under 15 minutes. 3 reps free, no credit card required.",
      primaryLabel: "Start Free Trial",
      primaryHrefTemplate: "/register",
      primaryExternal: true,
      secondaryLabel: "See How It Works",
      secondaryHrefTemplate: "/integrations/odoo",
      secondaryExternal: true,
      icon: "Zap",
      action: "trial",
    },
  },
};

// ─── Determine funnel stage from tags ────────────────────────────────────────

function detectStage(tags: string[], lang: string): FunnelStage | null {
  const lower = tags.map((t) => t.toLowerCase());

  // ── Odoo funnel ──────────────────────────────────────────────────────
  if (lower.includes("odoo")) {
    const configs = STAGE_CONFIGS.odoo;
    let raw: typeof configs.tofu;
    if (lower.includes("integrations") || lower.includes("automation")) {
      raw = configs.mofu1;
    } else if (lower.includes("comparison")) {
      raw = configs.mofu2;
    } else {
      raw = configs.tofu;
    }
    return {
      ...raw,
      primaryHref: raw.primaryHrefTemplate.replace("{lang}", lang),
      secondaryHref: raw.secondaryHrefTemplate?.replace("{lang}", lang),
    };
  }

  return null;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function StageIcon({ icon }: { icon: FunnelStage["icon"] }) {
  if (icon === "Zap") {
    return <Zap className="size-5 text-primary" />;
  }
  if (icon === "BookOpen") {
    return <BookOpen className="size-5 text-primary" />;
  }
  return <Mail className="size-5 text-primary" />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface FunnelCTAProps {
  slug: string;
  tags: string[];
  lang: string;
}

export function FunnelCTA({ slug, tags, lang }: FunnelCTAProps) {
  const stage = detectStage(tags, lang);
  const hasTrackedView = useRef(false);

  // ── Track CTA view impression (once) ─────────────────────────────────
  useEffect(() => {
    if (stage && !hasTrackedView.current) {
      hasTrackedView.current = true;
      trackCtaView({
        funnel: stage.funnel,
        stage: stage.stage,
        slug,
      });
    }
  }, [stage, slug]);

  // ── Handle CTA click ─────────────────────────────────────────────────
  function handleClick() {
    if (!stage) return;
    trackCtaClick({
      funnel: stage.funnel,
      stage: stage.stage,
      action: stage.action,
      slug,
    });
  }

  // ── Funnel Stage CTA ─────────────────────────────────────────────────
  if (stage) {
    const primaryIsExternal = stage.primaryExternal || stage.primaryHref.startsWith("http");

    return (
      <div className="mt-16 pt-8">
        <div className="rounded-xl border border-card-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="flex size-12 rounded-lg bg-primary/10 text-primary items-center justify-center mb-4">
              <StageIcon icon={stage.icon} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
              {stage.heading}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">{stage.description}</p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              {primaryIsExternal ? (
                <Button className="w-full font-semibold" asChild onClick={handleClick}>
                  <a
                    href={stage.primaryHref}
                    target={stage.primaryHref.startsWith("http") ? "_blank" : undefined}
                    rel={stage.primaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {stage.primaryLabel}
                    <ArrowRight className="size-4 ml-1" />
                  </a>
                </Button>
              ) : (
                <Button className="w-full font-semibold" asChild onClick={handleClick}>
                  <Link href={stage.primaryHref}>
                    {stage.primaryLabel}
                    <ArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>
              )}

              {stage.secondaryLabel && stage.secondaryHref && (
                <Button
                  variant="outline"
                  className="w-full font-medium"
                  asChild
                  onClick={handleClick}
                >
                  <a
                    href={stage.secondaryHref}
                    target={
                      stage.secondaryExternal || stage.secondaryHref?.startsWith("http")
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      stage.secondaryExternal || stage.secondaryHref?.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {stage.secondaryLabel}
                    <ExternalLink className="size-4 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Generic Email Capture CTA (non-funnel articles) ──────────────────
  return <EmailCaptureCTA slug={slug} />;
}

// ─── Email Capture CTA (for non-funnel articles) ─────────────────────────────

function EmailCaptureCTA({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setErrorMsg("Please enter your email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "blog",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      trackSubscribe(slug);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="mt-16 pt-8">
      <div className="rounded-xl border border-card-border bg-card p-6 sm:p-8">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto">
          {status === "success" ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="flex size-12 rounded-lg bg-primary/10 text-primary items-center justify-center">
                  <Check className="size-5" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Thanks! Check your inbox.</h3>
              <p className="text-sm text-muted-foreground">
                We'll send you practical commission insights every couple of weeks. No spam —
                unsubscribe anytime.
              </p>
            </div>
          ) : (
            <>
              <div className="flex size-12 rounded-lg bg-primary/10 text-primary items-center justify-center mb-4">
                <Mail className="size-5" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                Get practical commission insights
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Join finance and RevOps leaders getting actionable tips on commission plan design,
                rep motivation, and automation — once or twice a month, no fluff.
              </p>

              <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your work email"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Your work email"
                  />
                </div>
                <Button
                  type="submit"
                  size="md"
                  className="font-semibold shrink-0"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>

              {status === "error" && errorMsg && (
                <p className="text-xs text-destructive mt-2">{errorMsg}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

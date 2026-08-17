"use client";

import { Check, LoaderCircle, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/translations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://commissionkit.co";

interface Props {
  lang: string;
}

export function BlogLeadCapture({ lang }: Props) {
  const dict = t(lang);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMsg(dict.leadEmailRequired);
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
          email: trimmedEmail,
          name: name.trim() || undefined,
          source: "blog",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setErrorMsg(dict.leadFormError);
      setStatus("error");
    }
  }

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent p-6 sm:p-8 text-center max-w-md mx-auto">
        {status === "success" ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex size-12 rounded-full bg-primary/10 items-center justify-center">
                <Check className="size-5 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground">{dict.leadSuccess}</h3>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="flex size-12 rounded-full bg-primary/10 items-center justify-center">
                <Mail className="size-5 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
              {dict.leadHeading}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {dict.leadDescription}
            </p>
            <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.leadEmailPlaceholder}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={dict.leadEmailPlaceholder}
                />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={dict.leadNamePlaceholder}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={dict.leadNamePlaceholder}
              />
              {status === "error" && errorMsg && (
                <p className="text-xs text-destructive text-left">{errorMsg}</p>
              )}
              <Button
                type="submit"
                className="w-full font-bold shadow-sm"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <LoaderCircle className="size-4 mr-2 animate-spin" />
                    {dict.leadSubmitting}
                  </>
                ) : (
                  dict.leadSubmit
                )}
              </Button>
              <p className="text-xs text-muted-foreground">{dict.leadNoSpam}</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { Languages } from "lucide-react";
import type { Translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface LanguagePillsProps {
  slug: string;
  currentLang: string;
  availableLanguages: string[];
  t: Translations;
}

export function LanguagePills({ slug, currentLang, availableLanguages, t }: LanguagePillsProps) {
  if (!availableLanguages || availableLanguages.length < 2) return null;

  return (
    <details className="relative inline-flex">
      <summary
        className="flex h-8 min-w-[32px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors touch-manipulation list-none cursor-pointer click"
        aria-label={t.selectLanguage}
        aria-haspopup="listbox"
      >
        <Languages className="size-4" />
      </summary>
      <div
        className="absolute ltr:right-0 rtl:left-0 top-full mt-1 z-50 min-w-[180px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        role="listbox"
        aria-label={t.selectLanguage}
      >
        {availableLanguages.map((lang) => {
          const isActive = lang === currentLang;
          const label = t.languageNames[lang] ?? lang;
          return (
            <a
              key={lang}
              role="option"
              aria-selected={isActive}
              href={`/blog/${lang}/${slug}`}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                isActive && "font-semibold text-primary",
              )}
            >
              <span>{label}</span>
              {isActive && (
                <span className="text-[10px] font-semibold text-primary bg-secondary border border-primary/20 rounded px-1.5 py-px ml-2">
                  {lang.toUpperCase()}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </details>
  );
}

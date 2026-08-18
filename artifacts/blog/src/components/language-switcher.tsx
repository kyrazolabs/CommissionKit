"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  currentLang: string;
  currentPath: string;
  availableLanguages: string[];
  t: Translations;
}

export function LanguageSwitcher({
  currentLang,
  currentPath,
  availableLanguages,
  t,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const currentLanguageLabel = t.languageNames[currentLang] ?? currentLang;

  const handleSelect = (langCode: string) => {
    setIsOpen(false);

    // Replace current lang prefix in path, or append lang
    const pathWithoutLang = currentPath.replace(/^\/blog\/[a-z]{2}/, "");
    const newPath =
      pathWithoutLang === currentPath ? `/blog/${langCode}` : `/blog/${langCode}${pathWithoutLang}`;

    router.push(newPath);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Languages className="size-4" />
        <span className="hidden sm:inline">{currentLanguageLabel}</span>
        <ChevronDown className={cn("size-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            className="absolute inset-e-0 mt-1 z-50 w-48 rounded-lg border border-border bg-popover shadow-md py-1 animate-in fade-in-0 zoom-in-95"
            role="listbox"
            aria-label={t.selectLanguage}
          >
            {availableLanguages.map((lang) => {
              const isSelected = lang === currentLang;
              return (
                <button
                  key={lang}
                  onClick={() => handleSelect(lang)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors",
                    isSelected && "bg-accent",
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{t.languageNames[lang] ?? lang}</span>
                  {isSelected && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

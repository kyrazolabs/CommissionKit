"use client";

import { useState } from "react";
import type { Translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface LanguageFilterProps {
  availableLanguages: string[];
  t: Translations;
  onFilterChange?: (filter: string) => void;
  className?: string;
}

export function LanguageFilter({ availableLanguages, t, onFilterChange, className }: LanguageFilterProps) {
  const [active, setActive] = useState<string>("all");

  const tabs = [
    { value: "all", label: t.all },
    ...availableLanguages.map((lang) => ({ value: lang, label: t.languageNames[lang] ?? lang })),
  ];

  const handleSelect = (value: string) => {
    setActive(value);
    onFilterChange?.(value);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50",
        "overflow-x-auto scrollbar-thin",
        className
      )}
      role="tablist"
      aria-label={t.filterByLanguage}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => handleSelect(tab.value)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

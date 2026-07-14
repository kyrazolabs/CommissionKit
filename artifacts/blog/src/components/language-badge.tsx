import { cn } from "@/lib/utils";

interface LanguageBadgeProps {
  lang: string;
  languageLabels?: Record<string, string>;
  className?: string;
}

export function LanguageBadge({ lang, languageLabels, className }: LanguageBadgeProps) {
  const label = languageLabels?.[lang] ?? lang.toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        "bg-muted/80 text-muted-foreground border border-border/50",
        className
      )}
    >
      {label}
    </span>
  );
}

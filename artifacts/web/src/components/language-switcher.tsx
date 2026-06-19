import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Analytics } from "@/lib/analytics";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChangeLang = (code: string) => {
    i18n.changeLanguage(code);
    Analytics.languageChanged(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {SUPPORTED_LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChangeLang(lang.code)}
            className={cn(
              "flex items-center justify-between",
              i18n.language === lang.code && "font-semibold text-primary",
            )}
          >
            <span>{lang.nativeLabel}</span>
            {i18n.language === lang.code && (
              <span className="text-[10px] font-semibold text-primary bg-secondary border border-primary/20 rounded px-1.5 py-px ml-2">
                {lang.code.toUpperCase()}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

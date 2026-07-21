import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "@/hooks/use-page-meta";


export default function NotFound() {
  const { t } = useTranslation();
  usePageMeta({ title: t("notFound.heading"), description: t("notFound.description"), keywords: "page not found, 404 error", robots: "noindex, nofollow" });
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("notFound.heading")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("notFound.description")}
        </p>
      </div>
      <Link href="/dash">
        <Button variant="outline">{t("notFound.goToDashboard")}</Button>
      </Link>
    </div>
  );
}

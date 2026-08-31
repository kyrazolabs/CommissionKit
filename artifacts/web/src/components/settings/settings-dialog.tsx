import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsDialog } from "@/hooks/use-settings-dialog";
import { SettingsPage } from "@/pages/settings/settings";

export function SettingsDialog() {
  const { t } = useTranslation();
  const { isOpen, open, close } = useSettingsDialog();

  return (
    <Dialog open={isOpen} onOpenChange={(next) => (next ? open() : close())}>
      <DialogContent className="flex h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[min(85vh,900px)] sm:max-w-5xl sm:rounded-lg">
        <DialogHeader className="px-6 pt-6 pb-3 text-left">
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("settings.description")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <SettingsPage />
        </div>
      </DialogContent>
    </Dialog>
  );
}

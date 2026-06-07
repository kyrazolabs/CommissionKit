import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, X, ExternalLink, Inbox } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  commission_run_completed: "bg-primary/10 text-primary",
  new_rep_added:            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  deal_imported:            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  clawback_triggered:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  member_invited:           "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  member_role_changed:      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  plan_created:             "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  plan_updated:             "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const TYPE_LABELS: Record<string, string> = {
  commission_run_completed: "notificationBell.run",
  new_rep_added:            "notificationBell.rep",
  deal_imported:            "notificationBell.deal",
  clawback_triggered:       "notificationBell.clawback",
  member_invited:           "notificationBell.invite",
  member_role_changed:      "notificationBell.role",
  plan_created:             "notificationBell.plan",
  plan_updated:             "notificationBell.plan",
};

export function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        aria-label={t("notificationBell.notifications")}
      >
        <Bell className="size-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="size-3.5 text-primary" />
              <span className="text-sm font-semibold">{t("notificationBell.notifications")}</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold bg-primary/10 text-primary p-1.5 rounded-full">
                  {unreadCount}{t("notificationBell.newNotification")}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                <CheckCheck className="size-3" /> {t("notificationBell.markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <Inbox className="size-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">{t("notificationBell.noNotifications")}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{t('notificationBell.allCaughtUp')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "relative flex gap-3 p-4 hover:bg-muted/40 transition-colors group",
                    !n.read && "bg-primary/[0.03]",
                  )}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary" />
                  )}

                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn(
                        "inline-block text-[10px] font-semibold p-1.5 rounded-full",
                        TYPE_COLORS[n.type] ?? "bg-muted text-muted-foreground",
                      )}>
                        {t(TYPE_LABELS[n.type]) ?? n.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-foreground leading-tight">{n.title}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      onClick={() => dismiss(n.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                    {n.href && (
                      <Link
                        href={n.href}
                        onClick={() => { markRead(n.id); setOpen(false); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    )}
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        title={t("notificationBell.markAsRead")}
                      >
                        <CheckCheck className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border p-4">
              <p className="text-center text-[11px] text-muted-foreground">
                {t("notificationBell.showingLast", { count: notifications.length })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

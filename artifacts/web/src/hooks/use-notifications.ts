import { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspace } from "./use-workspace";
import { useAuth } from "./use-auth";

import { apiFetch } from "@/lib/api";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  href?: string;
  createdAt: string;
}

export function useNotifications() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (!activeWorkspace?.id || !user) return;
    try {
      const data = await apiFetch(`/api/notifications?limit=30`);
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent — polling should not surface errors to UI
    }
  }, [activeWorkspace?.id, user]);

  // Initial load + poll every 60s (only when tab is visible)
  useEffect(() => {
    setLoading(true);
    fetch().finally(() => setLoading(false));

    function startPolling() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") fetch();
      }, 60_000);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        // Tab became visible — fetch immediately then restart timer
        fetch();
        startPolling();
      } else {
        // Tab hidden — clear interval to stop firing
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetch]);

  const markRead = useCallback(async (id: string) => {
    if (!activeWorkspace?.id) return;
    await apiFetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, [activeWorkspace?.id]);

  const markAllRead = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    await apiFetch(`/api/notifications/read-all`, {
      method: "PATCH",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [activeWorkspace?.id]);

  const dismiss = useCallback(async (id: string) => {
    if (!activeWorkspace?.id) return;
    await apiFetch(`/api/notifications/${id}`, {
      method: "DELETE",
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => {
      const was = notifications.find((n) => n.id === id);
      return was && !was.read ? Math.max(0, c - 1) : c;
    });
  }, [activeWorkspace?.id, notifications]);

  return { notifications, unreadCount, loading, markRead, markAllRead, dismiss, refresh: fetch };
}

import { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspace } from "./use-workspace";
import { useAuth } from "./use-auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:8088";

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
      const res = await window.fetch(
        `${API}/api/notifications?limit=30`,
        {
          credentials: "include",
          headers: { "x-workspace-id": activeWorkspace.id },
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent — polling should not surface errors to UI
    }
  }, [activeWorkspace?.id, user]);

  // Initial load + poll every 30s
  useEffect(() => {
    setLoading(true);
    fetch().finally(() => setLoading(false));

    intervalRef.current = setInterval(fetch, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  const markRead = useCallback(async (id: string) => {
    if (!activeWorkspace?.id) return;
    await window.fetch(`${API}/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
      headers: { "x-workspace-id": activeWorkspace.id },
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, [activeWorkspace?.id]);

  const markAllRead = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    await window.fetch(`${API}/api/notifications/read-all`, {
      method: "PATCH",
      credentials: "include",
      headers: { "x-workspace-id": activeWorkspace.id },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [activeWorkspace?.id]);

  const dismiss = useCallback(async (id: string) => {
    if (!activeWorkspace?.id) return;
    await window.fetch(`${API}/api/notifications/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "x-workspace-id": activeWorkspace.id },
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => {
      const was = notifications.find((n) => n.id === id);
      return was && !was.read ? Math.max(0, c - 1) : c;
    });
  }, [activeWorkspace?.id, notifications]);

  return { notifications, unreadCount, loading, markRead, markAllRead, dismiss, refresh: fetch };
}

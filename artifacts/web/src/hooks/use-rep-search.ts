import { useState, useCallback, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function useRepSearch(workspaceId?: string) {
  const [reps, setReps] = useState<{ id: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Initial load — fetch first 200 reps on mount
  useEffect(() => {
    if (!workspaceId || initialLoaded) return;
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const res = await apiFetch(`/api/reps?limit=200`);
        const data = (res as any)?.data ?? (Array.isArray(res) ? res : []);
        if (!cancelled) {
          setReps(data.map((r: any) => ({ id: String(r.id || r._id), name: r.name })));
          setInitialLoaded(true);
        }
      } catch { /* ignore */ }
      if (!cancelled) setSearching(false);
    })();
    return () => { cancelled = true; };
  }, [workspaceId, initialLoaded]);

  // Server-side search via API
  const onSearch = useCallback((query: string) => {
    if (!workspaceId) return;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const queryParam = query ? `search=${encodeURIComponent(query)}&limit=50` : "limit=200";
        const res = await apiFetch(`/api/reps?${queryParam}`);
        const data = (res as any)?.data ?? (Array.isArray(res) ? res : []);
        setReps(data.map((r: any) => ({ id: String(r.id || r._id), name: r.name })));
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
  }, [workspaceId]);

  return { reps, searching, onSearch };
}

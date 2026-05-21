import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { setWorkspaceId } from "@workspace/api-client-react";
import { useAuth } from "./use-auth";

// Get the API URL from env, similar to auth-client
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  currency: string;
  fiscalYearStart: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  createWorkspace: (name: string, currency?: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  loading: true,
  setActiveWorkspace: () => {},
  createWorkspace: async () => { throw new Error("Not ready"); },
  refreshWorkspaces: async () => {},
});

const STORAGE_KEY = "ck_active_workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!session) return;
    try {
      // Better Auth uses cookies, so we don't need the Authorization header
      // if the request is same-origin or includes credentials.
      const res = await fetch(`${API_URL}/api/workspaces`, {
        headers: { 
          // We include credentials (cookies) for Better Auth
        },
        // In case of cross-origin (e.g. dev server vs api server)
        credentials: "include",
      });
      if (!res.ok) return;
      const data: Workspace[] = await res.json();
      setWorkspaces(data);

      const savedId = localStorage.getItem(STORAGE_KEY);
      const saved = savedId ? data.find((w) => String(w.id) === savedId) : null;
      const active = saved ?? data[0] ?? null;
      setActiveWorkspaceState(active);
      setWorkspaceId(active ? active.id : null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      setLoading(true);
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setWorkspaceId(null);
      setLoading(false);
    }
  }, [session, fetchWorkspaces]);

  const setActiveWorkspace = useCallback((ws: Workspace) => {
    setActiveWorkspaceState(ws);
    setWorkspaceId(ws.id);
    localStorage.setItem(STORAGE_KEY, ws.id);
  }, []);

  const createWorkspace = useCallback(
    async (name: string, currency?: string): Promise<Workspace> => {
      if (!session) throw new Error("Not authenticated");
      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, currency }),
      });
      if (!res.ok) throw new Error(await res.text());
      const ws: Workspace = await res.json();
      setWorkspaces((prev) => [...prev, ws]);
      setActiveWorkspace(ws);
      return ws;
    },
    [session, setActiveWorkspace]
  );

  const contextValue = useMemo(() => ({
    workspaces,
    activeWorkspace,
    loading,
    setActiveWorkspace,
    createWorkspace,
    refreshWorkspaces: fetchWorkspaces,
  }), [workspaces, activeWorkspace, loading, setActiveWorkspace, createWorkspace, fetchWorkspaces]);

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

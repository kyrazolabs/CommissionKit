import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setWorkspaceId } from "@workspace/api-client-react";
import { useAuth } from "./use-auth";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface Workspace {
  id: number;
  slug: string;
  name: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
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
      const res = await fetch(`${BASE_URL}/api/workspaces`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data: Workspace[] = await res.json();
      setWorkspaces(data);

      const savedId = localStorage.getItem(STORAGE_KEY);
      const saved = savedId ? data.find((w) => String(w.id) === savedId) : null;
      const active = saved ?? data[0] ?? null;
      setActiveWorkspaceState(active);
      setWorkspaceId(active ? String(active.id) : null);
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
    setWorkspaceId(String(ws.id));
    localStorage.setItem(STORAGE_KEY, String(ws.id));
  }, []);

  const createWorkspace = useCallback(
    async (name: string): Promise<Workspace> => {
      if (!session) throw new Error("Not authenticated");
      const res = await fetch(`${BASE_URL}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await res.text());
      const ws: Workspace = await res.json();
      setWorkspaces((prev) => [...prev, ws]);
      setActiveWorkspace(ws);
      return ws;
    },
    [session, setActiveWorkspace]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        loading,
        setActiveWorkspace,
        createWorkspace,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { setWorkspaceId } from "@workspace/api-client-react";
import { useAuth } from "./use-auth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8088";

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  currency: string;
  fiscalYearStart: string;
  commissionEngine: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  createWorkspace: (
    name: string,
    currency?: string
  ) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  loading: true,
  setActiveWorkspace: () => {},
  createWorkspace: async () => {
    throw new Error("Not ready");
  },
  refreshWorkspaces: async () => {},
});

const STORAGE_KEY = "ck_active_workspace";

export function WorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] =
    useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Track previous user
  const previousUserId = useRef<string | null>(null);

  const persistWorkspace = useCallback((ws: Workspace | null) => {
    if (ws) {
      localStorage.setItem(STORAGE_KEY, ws.id);
      setWorkspaceId(ws.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setWorkspaceId(null);
    }
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    if (!session) return;

    try {
      const res = await fetch(`${API_URL}/api/workspaces`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch workspaces");
      }

      const data: Workspace[] = await res.json();

      setWorkspaces(data);

      const savedId = localStorage.getItem(STORAGE_KEY);

      // Validate stored workspace belongs to current account
      const savedWorkspace =
        savedId &&
        data.find((w) => String(w.id) === String(savedId));

      const nextWorkspace = savedWorkspace ?? data[0] ?? null;

      setActiveWorkspaceState(nextWorkspace as any);

      // IMPORTANT:
      // Re-persist validated workspace only
      persistWorkspace(nextWorkspace as any);
    } catch (err) {
      console.error(err);

      setWorkspaces([]);
      setActiveWorkspaceState(null);

      persistWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [session, persistWorkspace]);

  useEffect(() => {
    const currentUserId = session?.user?.id ?? null;

    // User/account changed
    if (previousUserId.current !== currentUserId) {
      localStorage.removeItem(STORAGE_KEY);
      setWorkspaceId(null);

      setWorkspaces([]);
      setActiveWorkspaceState(null);
    }

    previousUserId.current = currentUserId;

    if (session) {
      setLoading(true);
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspaceState(null);

      persistWorkspace(null);

      setLoading(false);
    }
  }, [session, fetchWorkspaces, persistWorkspace]);

  const setActiveWorkspace = useCallback(
    (ws: Workspace) => {
      setActiveWorkspaceState(ws);
      persistWorkspace(ws);
    },
    [persistWorkspace]
  );

  const createWorkspace = useCallback(
    async (
      name: string,
      currency?: string
    ): Promise<Workspace> => {
      if (!session) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, currency }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const ws: Workspace = await res.json();

      setWorkspaces((prev) => [...prev, ws]);

      setActiveWorkspace(ws);

      return ws;
    },
    [session, setActiveWorkspace]
  );

  const contextValue = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      loading,
      setActiveWorkspace,
      createWorkspace,
      refreshWorkspaces: fetchWorkspaces,
    }),
    [
      workspaces,
      activeWorkspace,
      loading,
      setActiveWorkspace,
      createWorkspace,
      fetchWorkspaces,
    ]
  );

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
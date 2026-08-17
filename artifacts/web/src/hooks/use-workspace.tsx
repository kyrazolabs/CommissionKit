import { setWorkspaceId } from "@workspace/api-client-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Analytics } from "@/lib/analytics";
import { useAuth } from "./use-auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

export interface WorkspaceOnboarding {
  checklistDismissed: boolean;
  checklistCompletedAt: string | null;
  checklistShownAt: string | null;
}

export interface WorkspaceMember {
  id: string;
  userId?: string;
  email: string;
  role: string;
  roleIds?: string[];
  status: "active" | "pending";
  createdAt: string;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  currency: string;
  fiscalYearStart: string;
  commissionEngine: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  onboarding?: WorkspaceOnboarding;
  members?: WorkspaceMember[];
}

interface EngineNavItem {
  name: string;
  href: string;
  icon: string;
  replaces: string;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  engineNavItems: EngineNavItem[];
  setActiveWorkspace: (ws: Workspace) => void;
  createWorkspace: (name: string, currency?: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  loading: true,
  engineNavItems: [],
  setActiveWorkspace: () => {},
  createWorkspace: async () => {
    throw new Error("Not ready");
  },
  refreshWorkspaces: async () => {},
});

const STORAGE_KEY = "ck_active_workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [engineNavItems, setEngineNavItems] = useState<EngineNavItem[]>([]);

  // Track previous user
  const previousUserId = useRef<string | null>(null);
  const initialized = useRef(false);

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
      const res = await fetch(`${API_URL}/api/workspaces`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      const data: Workspace[] = await res.json();

      setWorkspaces(data);

      const savedId = localStorage.getItem(STORAGE_KEY);

      // Validate stored workspace belongs to current account
      const savedWorkspace = savedId && data.find((w) => String(w.id) === String(savedId));

      const nextWorkspace = savedWorkspace ?? data[0] ?? null;

      setActiveWorkspaceState(nextWorkspace as any);

      // IMPORTANT:
      // Re-persist validated workspace only
      persistWorkspace(nextWorkspace as any);

      // Fetch engine features for the active workspace
      if (nextWorkspace) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const fRes = await fetch(
            `${API_URL}/api/workspaces/${(nextWorkspace as any).id}/features`,
            {
              credentials: "include",
              signal: controller.signal,
            },
          );
          if (fRes.ok) {
            const fData = await fRes.json();
            setEngineNavItems(fData?.navItems ?? []);
          }
        } catch {
          setEngineNavItems([]);
        } finally {
          clearTimeout(timeout);
        }
      }
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

    if (!initialized.current) {
      initialized.current = true;
      previousUserId.current = currentUserId;
      if (session) {
        setLoading(true);
        fetchWorkspaces();
      }
      return;
    }

    // Clear saved workspace only on actual user/account change
    if (previousUserId.current !== null && previousUserId.current !== currentUserId) {
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

  const setActiveWorkspace = useCallback((ws: Workspace) => {
    localStorage.setItem(STORAGE_KEY, ws.id);
    setWorkspaceId(ws.id);
    Analytics.workspaceSwitched(ws.commissionEngine);
    window.location.assign("/dash");
  }, []);

  const createWorkspace = useCallback(
    async (name: string, currency?: string): Promise<Workspace> => {
      if (!session) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, currency }),
      });
      if (!res.ok) throw new Error(await res.text());
      const ws: Workspace = await res.json();

      setWorkspaces((prev) => [...prev, ws]);

      setActiveWorkspace(ws);

      return ws;
    },
    [session, setActiveWorkspace],
  );

  const contextValue = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      loading,
      engineNavItems,
      setActiveWorkspace,
      createWorkspace,
      refreshWorkspaces: fetchWorkspaces,
    }),
    [
      workspaces,
      activeWorkspace,
      loading,
      engineNavItems,
      setActiveWorkspace,
      createWorkspace,
      fetchWorkspaces,
    ],
  );

  return <WorkspaceContext.Provider value={contextValue}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

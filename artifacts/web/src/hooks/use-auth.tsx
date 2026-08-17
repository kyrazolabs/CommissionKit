import { setAuthTokenGetter, setBaseUrl, setWorkspaceId } from "@workspace/api-client-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadSavedLang } from "@/i18n";
import { authClient, useSession } from "@/lib/auth-client";

interface AuthContextValue {
  session: any | null;
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: loading } = useSession();

  useEffect(() => {
    // Set the base URL for the generated API client
    setBaseUrl(import.meta.env.VITE_API_URL || "http://localhost:8088");

    setAuthTokenGetter(async () => {
      return null; // Better Auth uses cookies
    });

    // Load saved language preference from server when user logs in
    if (session?.user) {
      loadSavedLang();
    }

    return () => setAuthTokenGetter(null);
  }, [session?.user]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setAuthTokenGetter(null);
    setWorkspaceId(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut,
    }),
    [session, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

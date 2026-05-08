import { createContext, useContext, useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { setAuthTokenGetter, setWorkspaceId, setBaseUrl } from "@workspace/api-client-react";

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

    // Better Auth handles sessions via cookies, but we might still need 
    // to pass tokens if the API client expects them. 
    // For now, we'll keep the token getter logic if needed, 
    // but Better Auth usually doesn't need explicit token passing for same-origin.
    setAuthTokenGetter(async () => {
      return null; // Better Auth uses cookies
    });
    return () => setAuthTokenGetter(null);
  }, []);

  const signOut = async () => {
    await authClient.signOut();
    setAuthTokenGetter(null);
    setWorkspaceId(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

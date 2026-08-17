import { dashClient } from "@better-auth/infra/client";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    import.meta.env.VITE_BETTER_AUTH_URL ||
    (import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/auth`
      : "http://localhost:8088/api/auth"),
  plugins: [dashClient(), organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { dashClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8088",
  plugins: [dashClient(), organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
